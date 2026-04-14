/**
 * ForThePeople.in — Remove cross-contaminated InfraProject rows
 * Run: npx tsx scripts/fix-infra-cross-contamination.ts [--dry-run]
 *
 * Symptom: Mandya/Mysuru pages were showing "Bengaluru Metro Phase 2",
 * "Bengaluru Airport Line", etc. — projects that obviously belong to
 * Bengaluru. This happens when the news pipeline classifies a Bengaluru
 * article as STATE scope and fans out to every Karnataka district.
 *
 * Rule:
 *   • Project name contains a SPECIFIC city marker
 *     (e.g. "Bengaluru Metro" / "Mumbai Coastal Road" / "Hyderabad Depot")
 *   • That city is NOT this district
 *   • AND the project name doesn't list TWO cities (e.g.
 *     "Mumbai-Ahmedabad Bullet Train" — those stay in BOTH).
 *   → DELETE the row from this district. InfraUpdate rows cascade.
 *
 * Always dry-run first — irreversible deletes.
 */

import "./_env";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DRY_RUN = process.argv.includes("--dry-run");

// ── City → owning district slug ────────────────────────────
// Aliases included so "Bangalore" matches the Bengaluru district.
const CITY_DISTRICT: Array<{ pattern: RegExp; districtSlug: string; canon: string }> = [
  { pattern: /\b(bengaluru|bangalore|namma)\b/i, districtSlug: "bengaluru-urban", canon: "Bengaluru" },
  { pattern: /\bmumbai\b/i,                       districtSlug: "mumbai",          canon: "Mumbai" },
  { pattern: /\bhyderabad\b/i,                    districtSlug: "hyderabad",       canon: "Hyderabad" },
  { pattern: /\bchennai\b/i,                      districtSlug: "chennai",         canon: "Chennai" },
  { pattern: /\b(delhi|new[- ]?delhi)\b/i,        districtSlug: "new-delhi",       canon: "Delhi" },
  { pattern: /\bkolkata\b/i,                      districtSlug: "kolkata",         canon: "Kolkata" },
  { pattern: /\blucknow\b/i,                      districtSlug: "lucknow",         canon: "Lucknow" },
  { pattern: /\b(mysuru|mysore)\b/i,              districtSlug: "mysuru",          canon: "Mysuru" },
  { pattern: /\bmandya\b/i,                       districtSlug: "mandya",          canon: "Mandya" },
];

// City words that, when ALONE in a name, anchor the project to that city.
// Combined with one of these markers (Metro, Airport, Flyover, Depot, etc.)
// the project is unambiguously a city project, not a state one.
const CITY_MARKER = /\b(metro|airport|flyover|depot|station|municipal|bmc|ndmc|mcd|smart\s*city|outer\s*ring\s*road|peripheral\s*ring\s*road|inner\s*ring\s*road|orbital)\b/i;

// "City1-City2" or "City1 to City2" patterns — these projects belong to BOTH
// (a connecting route). Don't delete from either.
function namesTwoCities(name: string): boolean {
  const cities = CITY_DISTRICT.filter((c) => c.pattern.test(name));
  if (cities.length >= 2) return true;
  // Generic two-city detector for non-mapped cities (e.g. "Pune-Mumbai")
  if (/\b[A-Z][a-z]+(?:[- ]to[- ]| ?[-–] ?)[A-Z][a-z]+\b/.test(name)) return true;
  return false;
}

function isCityProject(name: string, citySlug: string): boolean {
  const city = CITY_DISTRICT.find((c) => c.districtSlug === citySlug);
  if (!city) return false;
  return city.pattern.test(name) && CITY_MARKER.test(name);
}

async function main() {
  console.log(`🧹 Cross-contamination cleanup ${DRY_RUN ? "(DRY-RUN)" : ""}\n`);

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });

  const perDistrict: Record<string, { scanned: number; removed: number; kept: number }> = {};
  let totalRemoved = 0;

  for (const d of districts) {
    perDistrict[d.slug] = { scanned: 0, removed: 0, kept: 0 };

    const projects = await prisma.infraProject.findMany({
      where: { districtId: d.id },
      select: { id: true, name: true, scope: true },
    });
    perDistrict[d.slug].scanned = projects.length;

    for (const p of projects) {
      // Match each city marker in the name; if any city is NOT this district
      // AND the name doesn't span two cities, remove this row.
      let removeReason: string | null = null;
      for (const city of CITY_DISTRICT) {
        if (!city.pattern.test(p.name)) continue;
        if (city.districtSlug === d.slug) continue;
        if (namesTwoCities(p.name)) continue;
        // Confirm it's actually a city-anchored project (Metro/Airport/etc.)
        if (!isCityProject(p.name, city.districtSlug)) continue;
        removeReason = `mentions "${city.canon}" (owned by ${city.districtSlug})`;
        break;
      }

      if (removeReason) {
        console.log(`  [${d.slug}] DELETE  "${p.name.slice(0, 60)}"  — ${removeReason}`);
        if (!DRY_RUN) {
          // Cascade: InfraUpdate rows have onDelete: Cascade
          await prisma.infraProject.delete({ where: { id: p.id } });
        }
        perDistrict[d.slug].removed++;
        totalRemoved++;
      } else {
        perDistrict[d.slug].kept++;
      }
    }
  }

  console.log(`\n📊 Result ${DRY_RUN ? "(DRY-RUN — no deletes)" : ""}`);
  console.log(`| District         | Scanned | Removed | Kept |`);
  console.log(`|------------------|---------|---------|------|`);
  for (const d of districts) {
    const r = perDistrict[d.slug] ?? { scanned: 0, removed: 0, kept: 0 };
    console.log(`| ${d.slug.padEnd(16)} | ${String(r.scanned).padStart(7)} | ${String(r.removed).padStart(7)} | ${String(r.kept).padStart(4)} |`);
  }
  console.log(`\nTotal removed: ${totalRemoved}`);
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
