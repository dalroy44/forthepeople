/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Backfills `expiresAt` for pre-existing one-time contributors who predated
 * the expiry system. Sets expiresAt based on amount + createdAt. If the
 * calculated expiry has already passed, grants a 30-day grace period from today.
 *
 * Also clears expiresAt for active subscriptions (they should not have one).
 *
 * Run:  npx tsx -r dotenv/config scripts/migrate-existing-contributor-expiry.ts
 */

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { calculateOneTimeExpiry, calculateStandardGrace } from "../src/lib/contribution-expiry";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const now = new Date();

  // ── 1. Backfill one-time contributors ─────────────────────
  const oneTimers = await prisma.supporter.findMany({
    where: { isRecurring: false, expiresAt: null, status: "success" },
    select: { id: true, name: true, amount: true, createdAt: true },
  });

  console.log(`\nFound ${oneTimers.length} one-time contributors missing expiresAt.\n`);

  let grantedGrace = 0;
  let backdatedOK = 0;

  for (const s of oneTimers) {
    const naturalExpiry = calculateOneTimeExpiry(s.amount, s.createdAt);
    let finalExpiry: Date;
    if (naturalExpiry > now) {
      finalExpiry = naturalExpiry;
      backdatedOK++;
    } else {
      finalExpiry = calculateStandardGrace(now);
      grantedGrace++;
    }
    await prisma.supporter.update({
      where: { id: s.id },
      data: { expiresAt: finalExpiry },
    });
    console.log(
      `  ${s.name.padEnd(30)} ₹${String(s.amount).padStart(6)} → ${finalExpiry.toISOString().slice(0, 10)}${finalExpiry === naturalExpiry ? "" : " (grace)"}`
    );
  }

  // ── 2. Clear expiresAt on active subscriptions ────────────
  // Active subscriptions should have expiresAt=null (Razorpay manages renewals)
  const cleared = await prisma.supporter.updateMany({
    where: {
      isRecurring: true,
      subscriptionStatus: "active",
      expiresAt: { not: null },
    },
    data: { expiresAt: null },
  });

  console.log(`\n✅ Backfilled ${oneTimers.length} one-time contributors`);
  console.log(`   · ${backdatedOK} got natural expiry (still within window)`);
  console.log(`   · ${grantedGrace} got 30-day grace (window already passed)`);
  console.log(`✅ Cleared expiresAt on ${cleared.count} active subscriptions\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
