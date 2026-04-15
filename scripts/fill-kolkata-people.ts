/**
 * ForThePeople.in — Manual-research people fill for Kolkata infrastructure.
 * Run: npx tsx scripts/fill-kolkata-people.ts [--dry-run]
 *
 * Same fill-only semantics as fill-bengaluru / fill-remaining-districts.
 * Only patches null fields. Logs InfraUpdate(MANUAL_RESEARCH) for every change.
 */

import "./_env";
import { PrismaClient, Prisma } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { logUpdate } from "../src/lib/update-log";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DRY_RUN = process.argv.includes("--dry-run");

interface Fill {
  match: string;
  matchAlt?: string[];
  announcedBy?: string;
  announcedByRole?: string;
  party?: string;
  executingAgency?: string;
}

const DATA: Fill[] = [
  { match: "East-West Corridor", matchAlt: ["Green Line", "Kolkata Metro East-West"],
    announcedBy: "Mamata Banerjee", announcedByRole: "Chief Minister, West Bengal", party: "TMC" },

  { match: "Joka-BBD Bagh", matchAlt: ["Joka–BBD Bagh", "Purple Line"],
    announcedBy: "Mamata Banerjee", announcedByRole: "Chief Minister", party: "TMC" },

  { match: "New Garia-Airport", matchAlt: ["New Garia–Airport", "Orange Line"],
    announcedBy: "Mamata Banerjee", announcedByRole: "Chief Minister", party: "TMC" },

  { match: "Circular Railway", matchAlt: ["Kolkata Circular Railway"],
    executingAgency: "Eastern Railway",
    announcedBy: "Ashwini Vaishnaw", announcedByRole: "Union Railway Minister", party: "BJP" },

  { match: "Port Modernisation", matchAlt: ["Syama Prasad Mookerjee Port", "Kolkata Port"],
    announcedBy: "Sarbananda Sonowal", announcedByRole: "Union Ports Minister", party: "BJP" },

  { match: "New Town", matchAlt: ["Rajarhat", "HIDCO New Town"],
    announcedBy: "Mamata Banerjee", announcedByRole: "Chief Minister", party: "TMC" },

  { match: "EM Bypass", matchAlt: ["Eastern Metropolitan Bypass"],
    announcedBy: "Mamata Banerjee", announcedByRole: "Chief Minister", party: "TMC" },

  { match: "East Kolkata Wetlands", matchAlt: ["Kolkata Waterways"],
    executingAgency: "KMDA / East Kolkata Wetlands Management Authority" },

  { match: "Diamond Harbour", matchAlt: ["Diamond Harbour Road"],
    announcedBy: "Mamata Banerjee", announcedByRole: "Chief Minister", party: "TMC" },

  { match: "Howrah Bridge", matchAlt: ["Rabindra Setu"],
    executingAgency: "Kolkata Port Trust / West Bengal PWD" },

  { match: "Vivekananda Bridge", matchAlt: ["Second Hooghly Bridge"],
    executingAgency: "KMDA" },

  { match: "LED Street Lighting", matchAlt: ["Smart Street Lighting", "50,000 LED"],
    announcedBy: "Firhad Hakim", announcedByRole: "Mayor, Kolkata", party: "TMC" },

  { match: "Bagha Jatin", matchAlt: ["Bagha Jatin-New Garia", "Bagha Jatin Flyover"],
    executingAgency: "KMDA" },

  { match: "Drainage Improvement", matchAlt: ["Anti-Waterlogging", "Kolkata Drainage"],
    announcedBy: "Firhad Hakim", announcedByRole: "Mayor, Kolkata", party: "TMC" },

  { match: "NSCBI Airport", matchAlt: ["Netaji Subhas Chandra Bose Airport", "Airport Terminal Expansion"],
    announcedBy: "Jyotiraditya Scindia", announcedByRole: "Union Civil Aviation Minister", party: "BJP" },

  { match: "Tram Revival", matchAlt: ["Kolkata Tram"],
    announcedBy: "Mamata Banerjee", announcedByRole: "Chief Minister", party: "TMC" },

  { match: "Bantala Leather", matchAlt: ["Leather Complex"],
    executingAgency: "WBIDC" },

  { match: "Convention Centre", matchAlt: ["Kolkata Convention Centre"],
    announcedBy: "Mamata Banerjee", announcedByRole: "Chief Minister", party: "TMC" },
];

async function applyFill(districtId: string, districtName: string, fill: Fill) {
  const tokens = [fill.match, ...(fill.matchAlt ?? [])];
  let row: Awaited<ReturnType<typeof prisma.infraProject.findFirst>> = null;
  for (const t of tokens) {
    row = await prisma.infraProject.findFirst({
      where: { districtId, name: { contains: t, mode: "insensitive" } },
    });
    if (row) break;
  }
  if (!row) return { matched: false, projectName: fill.match, filled: [] as string[] };

  const patch: Prisma.InfraProjectUpdateInput = {};
  const filled: string[] = [];
  const setIfEmpty = (field: keyof Prisma.InfraProjectUpdateInput, value: unknown) => {
    const cur = (row as unknown as Record<string, unknown>)[field as string];
    if ((cur === null || cur === undefined || cur === "") && value != null && value !== "") {
      (patch as Record<string, unknown>)[field as string] = value;
      filled.push(field as string);
    }
  };

  setIfEmpty("announcedBy", fill.announcedBy);
  setIfEmpty("announcedByRole", fill.announcedByRole);
  setIfEmpty("party", fill.party);
  setIfEmpty("executingAgency", fill.executingAgency);

  if (filled.length === 0) return { matched: true, projectName: row.name, filled };

  if (!DRY_RUN) {
    await prisma.infraProject.update({ where: { id: row.id }, data: patch });
    await prisma.infraUpdate.create({
      data: {
        projectId: row.id, date: new Date(),
        headline: `Manual research filled ${filled.length} missing fields`,
        summary: `Curated person/agency research applied to ${row.name}: ${filled.join(", ")}.`,
        updateType: "MANUAL_RESEARCH",
        newsUrl: "manual-research", newsSource: "ForThePeople.in research desk", newsDate: new Date(),
        personName: fill.announcedBy ?? null, personRole: fill.announcedByRole ?? null, personParty: fill.party ?? null,
        verified: true, verifiedAt: new Date(),
      },
    });
    await logUpdate({
      source: "api", actorLabel: "manual-research",
      tableName: "InfraProject", recordId: row.id, action: "update",
      districtId, districtName, moduleName: "infrastructure",
      description: `${districtName} people fill: ${row.name} ← ${filled.length} fields`,
      recordCount: 1, details: { filledFields: filled },
    });
  }

  return { matched: true, projectName: row.name, filled };
}

async function main() {
  console.log(`🛠  Kolkata people fill ${DRY_RUN ? "(DRY-RUN)" : ""}\n`);
  const d = await prisma.district.findFirst({ where: { slug: "kolkata" }, select: { id: true, name: true } });
  if (!d) throw new Error("kolkata district not found");

  let filled = 0, nop = 0, missed = 0;
  for (const fill of DATA) {
    const r = await applyFill(d.id, d.name, fill);
    const name = (r.projectName ?? fill.match).padEnd(50).slice(0, 50);
    if (!r.matched) { console.log(`❓ ${name} (no match for "${fill.match}")`); missed++; continue; }
    if (r.filled.length === 0) { console.log(`⏭  ${name} (already complete)`); nop++; continue; }
    console.log(`✅ ${name} ← ${r.filled.join(", ")}`);
    filled++;
  }

  console.log(`\nSummary: ${DATA.length} processed · ${filled} filled · ${nop} already complete · ${missed} unmatched`);

  const rows = await prisma.infraProject.findMany({
    where: { districtId: d.id },
    select: { announcedBy: true, executingAgency: true },
  });
  console.log(`\n📊 Kolkata coverage:`);
  console.log(`   total rows       : ${rows.length}`);
  console.log(`   with announcedBy : ${rows.filter((r) => r.announcedBy).length}`);
  console.log(`   with agency      : ${rows.filter((r) => r.executingAgency).length}`);
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
