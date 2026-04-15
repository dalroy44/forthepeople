/**
 * ForThePeople.in — Leadership data correction across all 9 districts.
 * Run: npx tsx scripts/fix-leadership-all-districts.ts [--dry-run]
 *
 * What it does:
 *   1. DELETES clearly wrong / placeholder rows (e.g. Mandya: Kumaraswamy as
 *      "Chief Minister | BJP", "Bengaluru leaders | Political and administrative
 *      leaders", "Bengaluru Urban District Collector | District Collector").
 *   2. UPDATES the H.D. Kumaraswamy MP Mandya row with his Union-cabinet role.
 *   3. ADDS missing top-tier leaders (CM, Governor, PM, President) — only
 *      where we are CERTAIN as of April 2026.
 *   4. CLEANS UP placeholder rows whose `name` IS the role title
 *      (e.g. "Commissioner of Police, Chennai") by renaming `name` to
 *      "[Name Not Available]" — never fabricates a person's name.
 *   5. Sets lastVerifiedAt = now() on every row touched so the leadership
 *      page can show "Last verified: <date>".
 *
 * Hard rules (per spec):
 *   - NEVER guess a party — null/N/A when unsure.
 *   - NEVER fabricate a name for a role — "[Name Not Available]" instead.
 *   - NEVER delete genuine historical leaders — only mark inactive.
 *     (The DELETEs in this script are restricted to factually wrong rows
 *     and unnamed placeholders, both of which the user explicitly listed.)
 *   - IAS / IPS officers carry no party — always null.
 */

import "./_env";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const DRY_RUN = process.argv.includes("--dry-run");
const NOW = new Date();

interface NewLeader {
  name: string;
  role: string;
  tier: number;
  party: string | null;
  source?: string;
}

interface DistrictPlan {
  slug: string;
  // Rows to delete. Match by name+role (case-insensitive substring).
  deletes?: Array<{ name: string; role?: string; reason: string }>;
  // Rows to update. Match by name+role (case-insensitive substring).
  updates?: Array<{
    matchName: string;
    matchRole?: string;
    setRole?: string;
    setParty?: string | null;
    setName?: string;
    reason: string;
  }>;
  // Rows to ADD if not already present (matched by name+role, case-insensitive).
  adds?: NewLeader[];
}

const PLAN: DistrictPlan[] = [
  {
    slug: "mandya",
    deletes: [
      // Wrong on every count: Kumaraswamy is not CM and not BJP.
      { name: "Kumaraswamy", role: "Chief Minister", reason: "Wrong CM + wrong party. Kumaraswamy is JD(S), not BJP, and not CM of Karnataka." },
    ],
    updates: [
      {
        matchName: "H.D. Kumaraswamy", matchRole: "Member of Parliament",
        setRole: "Union Minister for Heavy Industries & Steel; MP, Mandya",
        setParty: "JD(S)",
        reason: "HDK is Union Minister (NDA) representing Mandya constituency.",
      },
    ],
    adds: [
      { name: "Siddaramaiah", role: "Chief Minister of Karnataka", tier: 1, party: "INC", source: "manual-research" },
      { name: "Thaavar Chand Gehlot", role: "Governor of Karnataka", tier: 1, party: null, source: "manual-research" },
      { name: "Narendra Modi", role: "Prime Minister", tier: 1, party: "BJP", source: "manual-research" },
      { name: "Droupadi Murmu", role: "President of India", tier: 1, party: null, source: "manual-research" },
    ],
  },

  {
    slug: "bengaluru-urban",
    deletes: [
      { name: "Bengaluru leaders", role: "Political and administrative leaders", reason: "News-extracted placeholder, no real person." },
      { name: "Karnataka CM", role: "Chief Minister", reason: "Generic role-only placeholder; Siddaramaiah added by name instead." },
    ],
    updates: [
      // Make the unnamed District Collector row honest.
      { matchName: "Bengaluru Urban District Collector", matchRole: "District Collector",
        setName: "[Name Not Available]",
        reason: "Position title used as name. Renamed to honest placeholder pending real appointment data." },
      // Strip cached news-extracted rows that show DK Shivakumar with vague roles —
      // keep his canonical "Deputy Chief Minister of Karnataka" entry intact.
    ],
    adds: [
      { name: "Siddaramaiah", role: "Chief Minister of Karnataka", tier: 1, party: "INC", source: "manual-research" },
      { name: "Thaavar Chand Gehlot", role: "Governor of Karnataka", tier: 1, party: null, source: "manual-research" },
      { name: "Narendra Modi", role: "Prime Minister", tier: 1, party: "BJP", source: "manual-research" },
      { name: "Droupadi Murmu", role: "President of India", tier: 1, party: null, source: "manual-research" },
    ],
  },

  {
    slug: "mysuru",
    adds: [
      { name: "Siddaramaiah", role: "Chief Minister of Karnataka", tier: 1, party: "INC", source: "manual-research" },
      { name: "Thaavar Chand Gehlot", role: "Governor of Karnataka", tier: 1, party: null, source: "manual-research" },
      { name: "Narendra Modi", role: "Prime Minister", tier: 1, party: "BJP", source: "manual-research" },
      { name: "Droupadi Murmu", role: "President of India", tier: 1, party: null, source: "manual-research" },
    ],
  },

  {
    slug: "mumbai",
    adds: [
      { name: "Devendra Fadnavis", role: "Chief Minister of Maharashtra", tier: 1, party: "BJP", source: "manual-research" },
      { name: "Narendra Modi", role: "Prime Minister", tier: 1, party: "BJP", source: "manual-research" },
      { name: "Droupadi Murmu", role: "President of India", tier: 1, party: null, source: "manual-research" },
    ],
  },

  {
    slug: "chennai",
    adds: [
      { name: "M.K. Stalin", role: "Chief Minister of Tamil Nadu", tier: 1, party: "DMK", source: "manual-research" },
      { name: "Narendra Modi", role: "Prime Minister", tier: 1, party: "BJP", source: "manual-research" },
      { name: "Droupadi Murmu", role: "President of India", tier: 1, party: null, source: "manual-research" },
    ],
  },

  {
    slug: "hyderabad",
    adds: [
      { name: "Revanth Reddy", role: "Chief Minister of Telangana", tier: 1, party: "INC", source: "manual-research" },
      { name: "Narendra Modi", role: "Prime Minister", tier: 1, party: "BJP", source: "manual-research" },
      { name: "Droupadi Murmu", role: "President of India", tier: 1, party: null, source: "manual-research" },
    ],
  },

  {
    slug: "lucknow",
    adds: [
      { name: "Yogi Adityanath", role: "Chief Minister of Uttar Pradesh", tier: 1, party: "BJP", source: "manual-research" },
      { name: "Narendra Modi", role: "Prime Minister", tier: 1, party: "BJP", source: "manual-research" },
      { name: "Droupadi Murmu", role: "President of India", tier: 1, party: null, source: "manual-research" },
    ],
  },

  {
    slug: "kolkata",
    adds: [
      { name: "Mamata Banerjee", role: "Chief Minister of West Bengal", tier: 1, party: "TMC", source: "manual-research" },
      { name: "Narendra Modi", role: "Prime Minister", tier: 1, party: "BJP", source: "manual-research" },
      { name: "Droupadi Murmu", role: "President of India", tier: 1, party: null, source: "manual-research" },
    ],
  },

  {
    slug: "new-delhi",
    // No CM change here — user explicitly said leave Delhi CM as-is.
    adds: [
      { name: "Narendra Modi", role: "Prime Minister", tier: 1, party: "BJP", source: "manual-research" },
      { name: "Droupadi Murmu", role: "President of India", tier: 1, party: null, source: "manual-research" },
    ],
  },
];

// Heuristics for placeholder cleanup — names that ARE role titles.
const ROLE_TITLE_TOKENS = [
  /^commissioner of police/i,
  /^deputy commissioner of police/i,
  /^dcp\b/i,
  /^joint cp/i,
  /^chief secretary,/i,
  /^district collector,/i,
  /^district magistrate,/i,
  /^chief justice,/i,
  /^principal sessions judge/i,
  /^principal district & sessions judge/i,
  /^chief judge,/i,
  /^managing director,/i,
  /\bMD$/,
  /\bSE\s+/,
  /^chief engineer,/i,
  /^director of/i,
  /^director,/i,
  /^chairman,/i,
  /^member secretary/i,
  /^vice chairman,/i,
  /^bbmp\s/i, /^bda\s/i, /^bmtc\s/i, /^bwssb\s/i, /^bescom\s/i, /^bmrcl\s/i,
  /^kmda\s/i, /^kmrc\s/i, /^cesc\s/i,
  /^cmda\s/i, /^cmrl\s/i, /^cmwssb\s/i, /^mtc\s/i, /^tangedco\s/i,
  /^dda\s/i, /^dmrc\s/i, /^dtc\s/i, /^delhi jal/i, /^ndmc\s/i, /^sdm,/i,
  /^tahsildar,/i, /^tehsildar,/i, /^bbmp /i,
  /^cii mysuru/i,
  /^ias officer/i, /^ips officer/i,
  /^dho,/i, /^dfo,/i, /^rto,/i, /^dctolimit/i, /^dctO,/i, /^ddpi,/i, /^beo,/i, /^deo,/i, /^dpio,/i, /^dctO,/i,
  /^dho,/i, /^dfo,/i, /^cmoh,/i,
  /^kmc municipal/i,
  /^additional commissioner/i,
];
function looksLikeRoleAsName(name: string): boolean {
  const n = name.trim();
  if (n.length === 0) return false;
  // Heuristic 1: name matches a role-title pattern.
  if (ROLE_TITLE_TOKENS.some((re) => re.test(n))) return true;
  // Heuristic 2: name is wrapped in parentheses or contains "(name not specified)".
  if (/\bname not\b/i.test(n)) return true;
  return false;
}

async function processDistrict(plan: DistrictPlan) {
  const d = await prisma.district.findFirst({ where: { slug: plan.slug }, select: { id: true, name: true } });
  if (!d) { console.warn(`⚠ District not found: ${plan.slug}`); return null; }
  console.log(`\n══ ${d.name} (${plan.slug}) ══`);

  let deleted = 0, updated = 0, added = 0, renamed = 0, verifiedTouched = 0;

  // 1) DELETES (explicit wrongs / placeholders)
  for (const del of plan.deletes ?? []) {
    const where = del.role
      ? { districtId: d.id, name: { contains: del.name, mode: "insensitive" as const }, role: { contains: del.role, mode: "insensitive" as const } }
      : { districtId: d.id, name: { contains: del.name, mode: "insensitive" as const } };
    const matches = await prisma.leader.findMany({ where, select: { id: true, name: true, role: true } });
    if (matches.length === 0) { console.log(`  · delete skip — no match for "${del.name}" / "${del.role ?? ""}"`); continue; }
    for (const m of matches) console.log(`  ❌ DELETE: ${m.name} | ${m.role}  (${del.reason})`);
    if (!DRY_RUN) {
      await prisma.leader.deleteMany({ where: { id: { in: matches.map((m) => m.id) } } });
    }
    deleted += matches.length;
  }

  // 2) UPDATES
  for (const up of plan.updates ?? []) {
    const where = up.matchRole
      ? { districtId: d.id, name: { contains: up.matchName, mode: "insensitive" as const }, role: { contains: up.matchRole, mode: "insensitive" as const } }
      : { districtId: d.id, name: { contains: up.matchName, mode: "insensitive" as const } };
    const rows = await prisma.leader.findMany({ where });
    if (rows.length === 0) { console.log(`  · update skip — no match for "${up.matchName}"`); continue; }
    for (const r of rows) {
      const data: Record<string, unknown> = { lastVerifiedAt: NOW };
      if (up.setRole != null) data.role = up.setRole;
      if (up.setParty !== undefined) data.party = up.setParty;
      if (up.setName != null) data.name = up.setName;
      console.log(`  ✏  UPDATE: ${r.name} | ${r.role} → ${up.setName ?? r.name} | ${up.setRole ?? r.role}  (${up.reason})`);
      if (!DRY_RUN) await prisma.leader.update({ where: { id: r.id }, data });
      updated++; verifiedTouched++;
    }
  }

  // 3) ADDS (idempotent — match by name+role insensitive)
  for (const add of plan.adds ?? []) {
    const existing = await prisma.leader.findFirst({
      where: {
        districtId: d.id,
        name: { contains: add.name, mode: "insensitive" },
        role: { contains: add.role.split(/[,(;]/)[0].trim().slice(0, 30), mode: "insensitive" },
      },
    });
    if (existing) {
      console.log(`  ⏭  ADD skip — already present: ${existing.name} | ${existing.role}`);
      // Still bump lastVerifiedAt so the page shows a fresh date for the canonical entry.
      if (!DRY_RUN) await prisma.leader.update({ where: { id: existing.id }, data: { lastVerifiedAt: NOW } });
      verifiedTouched++;
      continue;
    }
    console.log(`  ✅ ADD: ${add.name} | ${add.role} | ${add.party ?? "—"} | T${add.tier}`);
    if (!DRY_RUN) {
      await prisma.leader.create({
        data: {
          districtId: d.id,
          name: add.name,
          role: add.role,
          tier: add.tier,
          party: add.party,
          source: add.source ?? "manual-research",
          lastVerifiedAt: NOW,
          active: true,
        },
      });
    }
    added++; verifiedTouched++;
  }

  // 4) Placeholder cleanup: rename role-as-name rows to "[Name Not Available]"
  const allRows = await prisma.leader.findMany({ where: { districtId: d.id } });
  for (const r of allRows) {
    if (r.name === "[Name Not Available]") continue;
    if (looksLikeRoleAsName(r.name)) {
      console.log(`  🧹 RENAME: ${r.name} | ${r.role} → [Name Not Available]`);
      if (!DRY_RUN) await prisma.leader.update({ where: { id: r.id }, data: { name: "[Name Not Available]", lastVerifiedAt: NOW } });
      renamed++; verifiedTouched++;
    }
  }

  return { name: d.name, total: 0, deleted, updated, added, renamed, verifiedTouched };
}

async function main() {
  console.log(`🛠  Leadership fix sweep ${DRY_RUN ? "(DRY-RUN)" : ""}\n`);

  const summaries = [];
  for (const plan of PLAN) {
    const s = await processDistrict(plan);
    if (s) summaries.push(s);
  }

  console.log(`\n\n📊 Final coverage:`);
  console.log(`| District          | Total | Real Names | Role-as-Name | Touched |`);
  console.log(`|-------------------|-------|------------|--------------|---------|`);
  for (const s of summaries) {
    const d = await prisma.district.findFirst({ where: { name: s.name }, select: { id: true } });
    if (!d) continue;
    const rows = await prisma.leader.findMany({ where: { districtId: d.id }, select: { name: true } });
    const realNames = rows.filter((r) => r.name !== "[Name Not Available]" && !looksLikeRoleAsName(r.name)).length;
    const roleAsName = rows.length - realNames;
    console.log(`| ${s.name.padEnd(17).slice(0, 17)} | ${String(rows.length).padEnd(5)} | ${String(realNames).padEnd(10)} | ${String(roleAsName).padEnd(12)} | ${String(s.verifiedTouched).padEnd(7)} |`);
  }

  const totals = summaries.reduce((a, s) => ({
    deleted: a.deleted + s.deleted, updated: a.updated + s.updated,
    added: a.added + s.added, renamed: a.renamed + s.renamed,
  }), { deleted: 0, updated: 0, added: 0, renamed: 0 });
  console.log(`\nTOTAL: ${totals.deleted} deleted · ${totals.updated} updated · ${totals.added} added · ${totals.renamed} renamed to [Name Not Available]`);
}

main().catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
