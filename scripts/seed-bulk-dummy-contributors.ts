/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Seeds a LARGE set of dummy contributors (default 1000) for load/visual testing.
 * All records are prefixed "[TEST]" so they can be wiped with:
 *   npx tsx -r dotenv/config scripts/cleanup-test-contributors.ts
 *
 * Run:  npx tsx -r dotenv/config scripts/seed-bulk-dummy-contributors.ts
 *       npx tsx -r dotenv/config scripts/seed-bulk-dummy-contributors.ts 500   # custom count
 */

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { calculateOneTimeExpiry } from "../src/lib/contribution-expiry";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const COUNT = Number(process.argv[2]) || 1000;

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
  "Rohan", "Rahul", "Ananya", "Saanvi", "Aadhya", "Aaradhya", "Priya", "Kavya", "Diya", "Pari",
  "Karthik", "Manoj", "Suresh", "Ramesh", "Lokesh", "Deepa", "Anita", "Meera", "Sita", "Gita",
  "Farhan", "Zara", "Aisha", "Fatima", "Rizwan", "Tanvi", "Neha", "Shreya", "Pooja", "Swati",
  "Vikram", "Nikhil", "Pranav", "Ashish", "Amit", "Sanjay", "Vijay", "Mahesh", "Ravi", "Kiran",
  "Lakshmi", "Padma", "Revathi", "Sarita", "Kamala", "Mallika", "Deepika", "Parvati", "Durga", "Uma",
  "Arun", "Arjun", "Karan", "Varun", "Tarun", "Dev", "Aryan", "Yash", "Dhruv", "Kabir",
  "Riya", "Siya", "Tara", "Mira", "Kiara", "Nysa", "Ira", "Anika", "Avani", "Mahi",
];
const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Shah", "Mehta", "Agarwal", "Jain",
  "Iyer", "Nair", "Menon", "Pillai", "Reddy", "Rao", "Naidu", "Chatterjee", "Banerjee", "Mukherjee",
  "Das", "Ghosh", "Bose", "Sen", "Roy", "Khan", "Ali", "Ahmed", "Hussain", "Siddiqui",
  "Joshi", "Desai", "Bhatt", "Trivedi", "Pandey", "Mishra", "Tiwari", "Tripathi", "Dubey", "Chauhan",
];
const CITIES = ["Mandya", "Bengaluru", "Mysuru", "Hyderabad", "Mumbai", "Chennai", "Delhi", "Kolkata", "Pune", "Ahmedabad"];
const MESSAGES = [
  "Keep up the great work!",
  "For a transparent India 🇮🇳",
  "Open data for every citizen",
  "Building the future, one district at a time",
  "Love what you're doing",
  null, null, null, null, null, // most are null
];
const SOCIAL_TEMPLATES = [
  (h: string) => `https://instagram.com/${h}`,
  (h: string) => `https://linkedin.com/in/${h}`,
  (h: string) => `https://github.com/${h}`,
  (h: string) => `https://x.com/${h}`,
  () => null,
  () => null,
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

function detectPlatform(url: string | null): string | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("linkedin.com")) return "linkedin";
  if (lower.includes("github.com")) return "github";
  if (lower.includes("twitter.com") || lower.includes("x.com")) return "twitter";
  return "website";
}

function calcBadge(activatedAt: Date): string | null {
  const months = Math.floor((Date.now() - activatedAt.getTime()) / (30 * 24 * 60 * 60 * 1000));
  if (months >= 24) return "platinum";
  if (months >= 12) return "gold";
  if (months >= 6) return "silver";
  if (months >= 3) return "bronze";
  return null;
}

// Tier distribution — weighted to be realistic
// 1 founder, 5 patrons, ~20 state, ~200 district, ~300 chai, ~474 custom one-time
function pickTier(i: number, total: number): "founder" | "patron" | "state" | "district" | "chai" | "custom" {
  const pct = i / total;
  if (i === 0) return "founder";
  if (i < 6) return "patron";
  if (pct < 0.03) return "state";
  if (pct < 0.25) return "district";
  if (pct < 0.55) return "chai";
  return "custom";
}

async function main() {
  console.log(`\nSeeding ${COUNT} dummy contributors (prefixed [TEST])...\n`);

  // Load real state/district IDs
  const states = await prisma.state.findMany({ select: { id: true, slug: true, name: true } });
  const districts = await prisma.district.findMany({ select: { id: true, stateId: true, slug: true, name: true, active: true } });
  const activeDistricts = districts.filter((d) => d.active);

  if (states.length === 0 || activeDistricts.length === 0) {
    console.error("No states/districts found in DB — seed those first.");
    process.exit(1);
  }

  console.log(`  → ${states.length} states, ${activeDistricts.length} active districts available.\n`);

  // Wipe any prior [TEST] records so reruns are idempotent
  const existing = await prisma.supporter.deleteMany({
    where: {
      OR: [
        { name: { startsWith: "[TEST]" } },
        { email: { endsWith: "@test.forthepeople.in" } },
      ],
    },
  });
  if (existing.count > 0) console.log(`  → Cleaned ${existing.count} existing test records.\n`);

  const batch: Array<Parameters<typeof prisma.supporter.create>[0]["data"]> = [];
  const tierCounts: Record<string, number> = {};

  for (let i = 0; i < COUNT; i++) {
    const tier = pickTier(i, COUNT);
    tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;

    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const name = `[TEST] ${firstName} ${lastName}`;
    const handle = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${i}`;
    const socialLink = pick(SOCIAL_TEMPLATES)(handle);
    const socialPlatform = detectPlatform(socialLink);
    const message = pick(MESSAGES);
    const isPublic = Math.random() > 0.05; // 5% anonymous

    const isRecurring = tier === "founder" || tier === "patron" || tier === "state" || tier === "district";

    let amount: number;
    let stateId: string | null = null;
    let districtId: string | null = null;
    let activatedAt: Date | null = null;
    let expiresAt: Date | null = null;
    let subscriptionStatus: string | null = null;

    if (tier === "founder") {
      amount = 50000 + randInt(0, 9) * 5000;
      activatedAt = new Date(Date.now() - randInt(1, 24) * 30 * 24 * 60 * 60 * 1000);
      subscriptionStatus = "active";
    } else if (tier === "patron") {
      amount = 9999 + randInt(0, 4) * 1000;
      activatedAt = new Date(Date.now() - randInt(1, 18) * 30 * 24 * 60 * 60 * 1000);
      subscriptionStatus = "active";
    } else if (tier === "state") {
      amount = 1999 + randInt(0, 4) * 500;
      const s = pick(states);
      stateId = s.id;
      activatedAt = new Date(Date.now() - randInt(1, 14) * 30 * 24 * 60 * 60 * 1000);
      subscriptionStatus = "active";
    } else if (tier === "district") {
      amount = 99 + randInt(0, 20) * 50;
      const d = pick(activeDistricts);
      districtId = d.id;
      stateId = d.stateId;
      activatedAt = new Date(Date.now() - randInt(1, 12) * 30 * 24 * 60 * 60 * 1000);
      subscriptionStatus = "active";
    } else if (tier === "chai") {
      amount = 50 * randInt(1, 20);
      // 40% of chai associated with a district
      if (Math.random() < 0.4) {
        const d = pick(activeDistricts);
        districtId = d.id;
        stateId = d.stateId;
      }
      expiresAt = calculateOneTimeExpiry(amount, new Date(Date.now() - randInt(0, 20) * 24 * 60 * 60 * 1000));
    } else {
      amount = 10 * randInt(1, 500);
      if (Math.random() < 0.3) {
        const d = pick(activeDistricts);
        districtId = d.id;
        stateId = d.stateId;
      }
      expiresAt = calculateOneTimeExpiry(amount, new Date(Date.now() - randInt(0, 20) * 24 * 60 * 60 * 1000));
    }

    const badgeLevel = activatedAt ? calcBadge(activatedAt) : null;
    const badgeType = tier === "founder" ? "founder" : tier === "patron" ? "patron" : tier === "state" ? "state" : tier === "district" ? "champion" : null;

    batch.push({
      name,
      email: `test_${i}_${handle}@test.forthepeople.in`,
      amount,
      tier,
      isRecurring,
      subscriptionStatus,
      activatedAt,
      expiresAt,
      stateId,
      districtId,
      socialLink,
      socialPlatform,
      isPublic,
      badgeType,
      badgeLevel,
      message,
      status: "success",
      paymentId: `pay_test_${i}_${Math.random().toString(36).slice(2, 10)}`,
      razorpaySubscriptionId: isRecurring ? `sub_test_${i}_${Math.random().toString(36).slice(2, 10)}` : null,
    });
  }

  // Insert in batches of 100 to avoid Prisma overload
  let inserted = 0;
  const BATCH_SIZE = 100;
  for (let i = 0; i < batch.length; i += BATCH_SIZE) {
    const slice = batch.slice(i, i + BATCH_SIZE);
    await Promise.all(slice.map((d) => prisma.supporter.create({ data: d })));
    inserted += slice.length;
    process.stdout.write(`\r  Inserted ${inserted}/${COUNT}...`);
  }

  console.log(`\n\n✅ Seeded ${inserted} dummy contributors.\n`);
  console.log("Distribution by tier:");
  for (const [tier, count] of Object.entries(tierCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tier.padEnd(10)} ${count}`);
  }
  console.log("\nTest pages now populated:");
  console.log("  /en                                   — top-tier showcase");
  console.log("  /en/karnataka/mandya                  — 3-line ticker");
  console.log("  /en/karnataka/mandya/contributors     — full sections");
  console.log("  /en/contributors                      — global leaderboard");
  console.log("  /en/admin/supporters                  — admin view\n");
  console.log("Cleanup: npx tsx -r dotenv/config scripts/cleanup-test-contributors.ts\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
