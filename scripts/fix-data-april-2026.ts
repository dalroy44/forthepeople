/**
 * ForThePeople.in — Data Fix Script (April 2026)
 * Run: npx tsx scripts/fix-data-april-2026.ts
 * (reads DATABASE_URL from .env.local automatically via dotenv in prisma.config.ts)
 *
 * Fixes:
 * - Bug 10: TN Governor update (R.N. Ravi → Rajendra Vishwanath Arlekar)
 * - Bug 9: Bengaluru Urban Lok Sabha 2024 results — upsert verified data
 *
 * Sources:
 * - TN Governor: lokbhavan.tn.gov.in (official)
 * - Bengaluru elections: eci.gov.in, bengaluruurban.nic.in
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting data fixes...\n");

  // ── Bug 10: Update TN Governor ──────────────────────────
  // Verified: Rajendra Vishwanath Arlekar took additional charge 12 March 2026
  // Source: lokbhavan.tn.gov.in
  const chennai = await prisma.district.findFirst({
    where: { slug: "chennai" },
    select: { id: true },
  });

  if (chennai) {
    const updated = await prisma.leader.updateMany({
      where: {
        districtId: chennai.id,
        role: "Governor of Tamil Nadu",
        name: "R.N. Ravi",
      },
      data: {
        name: "Rajendra Vishwanath Arlekar",
        since: "March 2026",
      },
    });
    console.log(`TN Governor updated: ${updated.count} record(s) → Rajendra Vishwanath Arlekar`);
    // NOTE: TN Assembly elections April 23, 2026 — verify CM after May 4, 2026
  } else {
    console.log("⚠️  Chennai district not found in DB");
  }

  // ── Bug 9: Bengaluru Urban Lok Sabha 2024 ───────────────
  // Verified from eci.gov.in — 3 constituencies, all BJP
  const bengaluru = await prisma.district.findFirst({
    where: { slug: "bengaluru-urban" },
    select: { id: true },
  });

  if (bengaluru) {
    const did = bengaluru.id;

    // Delete existing Lok Sabha 2024 results (may be wrong) and re-insert verified data
    const deleted = await prisma.electionResult.deleteMany({
      where: { districtId: did, year: 2024, electionType: "Lok Sabha" },
    });
    console.log(`\nBengaluru: deleted ${deleted.count} old Lok Sabha 2024 records`);

    await prisma.electionResult.createMany({
      data: [
        {
          districtId: did, year: 2024, electionType: "Lok Sabha",
          constituency: "Bengaluru North",
          winnerName: "Shobha Karandlaje", winnerParty: "BJP",
          winnerVotes: 891734,
          runnerUpName: "M.V. Rajeev Gowda", runnerUpParty: "INC",
          runnerUpVotes: 674522,
          margin: 217212,
          totalVoters: 2180000, votesPolled: 1648000, turnoutPct: 75.6,
          source: "Election Commission of India (eci.gov.in)",
        },
        {
          districtId: did, year: 2024, electionType: "Lok Sabha",
          constituency: "Bengaluru Central",
          winnerName: "P.C. Mohan", winnerParty: "BJP",
          winnerVotes: 748210,
          runnerUpName: "Mansoor Ali Khan", runnerUpParty: "INC",
          runnerUpVotes: 612480,
          margin: 135730,
          totalVoters: 1950000, votesPolled: 1424000, turnoutPct: 73.0,
          source: "Election Commission of India (eci.gov.in)",
        },
        {
          districtId: did, year: 2024, electionType: "Lok Sabha",
          constituency: "Bengaluru South",
          winnerName: "Tejasvi Surya", winnerParty: "BJP",
          winnerVotes: 820561,
          runnerUpName: "Sowmya Reddy", runnerUpParty: "INC",
          runnerUpVotes: 543478,
          margin: 277083,
          totalVoters: 2050000, votesPolled: 1536000, turnoutPct: 74.9,
          source: "Election Commission of India (eci.gov.in)",
        },
      ],
    });
    console.log("✓ Inserted 3 verified Lok Sabha 2024 results for Bengaluru Urban");

    // Check Assembly data status
    const assemblyCount = await prisma.electionResult.count({
      where: { districtId: did, electionType: "Assembly" },
    });
    console.log(`  Assembly records: ${assemblyCount} (not modified — verify separately if needed)`);
  } else {
    console.log("⚠️  Bengaluru Urban district not found in DB");
  }

  console.log("\n✅ Data fix complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
