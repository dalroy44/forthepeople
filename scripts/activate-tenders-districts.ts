// One-shot activator for the Tenders module. Run AFTER Vercel's build
// has applied the schema (adds District.tendersActive). Idempotent —
// re-running is safe (upsert-style where clause + setMany).
//
// Usage (from project root, with DATABASE_URL set to production pooled URL):
//   npx tsx scripts/activate-tenders-districts.ts
//
// Adds new slugs here as coverage expands — see docs/TENDERS-ACTIVATION.md.

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const ACTIVE_SLUGS = ["bengaluru-urban", "mandya", "mysuru"] as const;

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    const before = await prisma.district.count({ where: { tendersActive: true } });
    console.log(`[activate-tenders] currently active: ${before} district(s)`);

    const res = await prisma.district.updateMany({
      where: { slug: { in: [...ACTIVE_SLUGS] } },
      data: { tendersActive: true },
    });
    console.log(`[activate-tenders] flipped ${res.count} district(s) to tendersActive=true`);

    const final = await prisma.district.findMany({
      where: { tendersActive: true },
      select: { slug: true, name: true, state: { select: { slug: true } } },
      orderBy: { name: "asc" },
    });
    console.log("[activate-tenders] active now:");
    for (const d of final) {
      console.log(`  • ${d.name} (${d.state.slug}/${d.slug})`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
