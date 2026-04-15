/**
 * ForThePeople.in — Deep cross-contamination cleanup
 * Run: npx tsx scripts/fix-infra-deep-cleanup.ts [--dry-run]
 *
 * Three cleanup strategies:
 *   STRATEGY 1 — Area / neighborhood mismatch
 *     Project name contains a neighborhood (Whitefield, Kengeri,
 *     Challaghatta, etc.) that maps to a different district.
 *
 *   STRATEGY 2 — Agency mismatch
 *     Project executingAgency is a city-locked agency (BMRCL, CMRL,
 *     DMRC, MMRDA …) but the project is on a different district's page.
 *
 *   STRATEGY 3 — Noise (unverified, no data, national-scope stub)
 *     Project has scope=NATIONAL AND no budget AND no progress AND
 *     no news verification. These are usually policy-announcement
 *     stubs (e.g. "Metro light for Tier-2 cities") that pollute every
 *     district page without offering anything.
 *
 * All three strategies honour the two-city exception — a project name
 * like "Mumbai-Ahmedabad Bullet Train" stays in Mumbai, "Bengaluru-
 * Mysuru Expressway" stays in BOTH Bengaluru and Mysuru.
 *
 * InfraUpdate rows cascade automatically (onDelete: Cascade).
 * ALWAYS run --dry-run first. Deletes are irreversible.
 */

import "./_env";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  detectDistrictFromName,
  detectDistrictFromAgency,
  allDistrictsMentionedInName,
  AGENCY_TO_DISTRICT,
} from "../src/lib/constants/infra-locations";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DRY_RUN = process.argv.includes("--dry-run");

// Projects whose name names MULTIPLE cities/neighborhoods from our
// active set → connecting route, keep in all of them.
function isConnectingRoute(name: string): boolean {
  return allDistrictsMentionedInName(name).length >= 2;
}

interface Reason { strategy: 1 | 2 | 3; detail: string }

function classify(p: {
  name: string;
  scope: string | null;
  executingAgency: string | null;
  originalBudget: number | null;
  budget: number | null;
  progressPct: number | null;
  verificationCount: number | null;
  districtSlug: string;
}): Reason | null {
  // Strategy 1: name mentions an area owned by another district
  const connecting = isConnectingRoute(p.name);
  const detected = detectDistrictFromName(p.name);
  if (detected === null) {
    // City not in our system (Nagpur, Pune, Ahmedabad, ...)
    return { strategy: 1, detail: `name references a city not served by ForThePeople.in` };
  }
  if (detected && detected !== p.districtSlug && !connecting) {
    return { strategy: 1, detail: `area in name → ${detected}, not ${p.districtSlug}` };
  }

  // Strategy 2: agency scoped to a single city
  if (!connecting && p.executingAgency) {
    const agencyDistrict = detectDistrictFromAgency(p.executingAgency);
    if (agencyDistrict && agencyDistrict !== p.districtSlug) {
      return { strategy: 2, detail: `agency "${p.executingAgency}" → ${agencyDistrict}, not ${p.districtSlug}` };
    }
  }

  // Strategy 3: NATIONAL scope + zero data = policy-announcement noise
  const hasBudget = (p.originalBudget ?? 0) > 0 || (p.budget ?? 0) > 0;
  const hasProgress = (p.progressPct ?? 0) > 0;
  const hasVerification = (p.verificationCount ?? 0) > 0;
  if (p.scope === "NATIONAL" && !hasBudget && !hasProgress && !hasVerification) {
    return { strategy: 3, detail: `NATIONAL stub with no budget/progress/verification` };
  }

  return null;
}

async function main() {
  console.log(`🧹 Deep cross-contamination cleanup ${DRY_RUN ? "(DRY-RUN)" : ""}\n`);
  console.log(`   agency patterns loaded: ${AGENCY_TO_DISTRICT.length}\n`);

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });

  const perDistrict: Record<string, { scanned: number; s1: number; s2: number; s3: number; kept: number }> = {};
  let totalRemoved = 0;

  for (const d of districts) {
    perDistrict[d.slug] = { scanned: 0, s1: 0, s2: 0, s3: 0, kept: 0 };

    const projects = await prisma.infraProject.findMany({
      where: { districtId: d.id },
      select: {
        id: true, name: true, scope: true, executingAgency: true,
        originalBudget: true, budget: true, progressPct: true,
        verificationCount: true,
      },
    });
    perDistrict[d.slug].scanned = projects.length;

    for (const p of projects) {
      const reason = classify({ ...p, districtSlug: d.slug });
      if (!reason) {
        perDistrict[d.slug].kept++;
        continue;
      }
      console.log(`  [S${reason.strategy}] [${d.slug}] DELETE  "${p.name.slice(0, 70)}"  — ${reason.detail}`);
      if (!DRY_RUN) {
        await prisma.infraProject.delete({ where: { id: p.id } });
      }
      if (reason.strategy === 1) perDistrict[d.slug].s1++;
      if (reason.strategy === 2) perDistrict[d.slug].s2++;
      if (reason.strategy === 3) perDistrict[d.slug].s3++;
      totalRemoved++;
    }
  }

  console.log(`\n📊 Deep-cleanup result ${DRY_RUN ? "(DRY-RUN — no deletes)" : ""}`);
  console.log(`| District         | Scanned | S1 area | S2 agency | S3 noise | Kept |`);
  console.log(`|------------------|---------|---------|-----------|----------|------|`);
  for (const d of districts) {
    const r = perDistrict[d.slug];
    console.log(
      `| ${d.slug.padEnd(16)} | ${String(r.scanned).padStart(7)} | ${String(r.s1).padStart(7)} | ${String(r.s2).padStart(9)} | ${String(r.s3).padStart(8)} | ${String(r.kept).padStart(4)} |`
    );
  }
  console.log(`\nTotal removed: ${totalRemoved}`);
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
