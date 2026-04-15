/**
 * ForThePeople.in — Fill missing InfraProject metadata via AI
 * Run:  npx tsx scripts/fill-infra-missing-data.ts [--limit 100] [--dry-run]
 *
 * Finds rows with null announcedBy / executingAgency / description /
 * category and asks the AI (routed through Anthropic via the proxy key
 * the user configured) to fill what it can. Never overwrites existing
 * non-null fields. Every fill creates an InfraUpdate row of
 * updateType="AI_ENRICHMENT" so the timeline records where the value
 * came from.
 *
 * Forces FTP_AI_PROVIDER=anthropic at the top — this script is the
 * intended opt-in for the premium key. purpose="insight" routes to
 * Claude Haiku 4.5 via the Claude Code proxy URL.
 */

// MUST be first: loads .env + .env.local
import "./_env";
// Route AI through the user's own Claude key to avoid OpenRouter quota.
// Runs BEFORE any import that calls callAI so the env flag is read.
process.env.FTP_AI_PROVIDER = "anthropic";

import { PrismaClient, Prisma } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { callAI } from "../src/lib/ai-provider";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// ── CLI ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flagValue(flag: string, fallback: number): number {
  const i = args.indexOf(flag);
  if (i < 0) return fallback;
  const n = Number(args[i + 1]);
  return Number.isFinite(n) ? n : fallback;
}
const LIMIT = Math.max(1, Math.min(300, flagValue("--limit", 100)));
const DRY_RUN = args.includes("--dry-run");
const DELAY_MS = 1000; // rate limit between AI calls

// ── AI prompt ──────────────────────────────────────────────
const SYSTEM_PROMPT =
  "You are a researcher for Indian infrastructure projects. You answer " +
  "with strict factual accuracy, NEVER guessing. If you are not confident, " +
  "return null for that field. Return ONLY JSON — no markdown, no commentary. " +
  "Never use 'scam', 'loot', 'corrupt', or 'waste'.";

interface AIFill {
  announcedBy: string | null;
  announcedByRole: string | null;
  party: string | null;
  executingAgency: string | null;
  description: string | null;
  category: string | null;
}

function buildPrompt(project: {
  name: string;
  district: string;
  state: string;
  category: string | null;
  existing: Record<string, string | number | null>;
}): string {
  return `Project: "${project.name}"
Located in: ${project.district} district, ${project.state}
Existing category: ${project.category ?? "unknown"}
Existing known data (do NOT contradict, only supplement):
${JSON.stringify(project.existing, null, 2)}

Return JSON:
{
  "announcedBy":     "The person (name + current/former title) who publicly announced or proposed this project, or null",
  "announcedByRole": "Their role, e.g. 'Prime Minister', 'Chief Minister Maharashtra', 'Union Minister for Road Transport', or null",
  "party":           "Their party affiliation ONLY if well-established (BJP | INC | SP | BSP | DMK | AIADMK | TMC | BRS | Shiv Sena | JDS | AAP | NCP | CPI(M) | Independent ...), or null",
  "executingAgency": "The government agency or PSU executing this project (e.g. NHAI, MMRDA, BMRCL, KMRC, NHSRCL, DMRC, L&T Metro Rail, PWD ...), or null",
  "description":     "One factual sentence (<= 200 characters) explaining what the project IS and what problem it solves for citizens. Focus on concrete numbers where known (length, stations, population served, time saved). Or null if unsure.",
  "category":        "ROAD | METRO | RAIL | BRIDGE | FLYOVER | WATER | SEWAGE | HOUSING | PORT | AIRPORT | POWER | TELECOM | HOSPITAL | SCHOOL | TOURISM | OTHER"
}

Rules:
- NEVER invent a person, party, or budget figure.
- If the project name is ambiguous or unknown, return all fields null.
- Category must be one of the enum values above.`;
}

async function enrichProject(
  project: {
    id: string;
    name: string;
    district: string;
    state: string;
    category: string | null;
    announcedBy: string | null;
    announcedByRole: string | null;
    party: string | null;
    executingAgency: string | null;
    description: string | null;
  }
): Promise<AIFill | null> {
  const existing: Record<string, string | number | null> = {
    announcedBy: project.announcedBy,
    announcedByRole: project.announcedByRole,
    party: project.party,
    executingAgency: project.executingAgency,
    description: project.description,
  };
  try {
    const response = await callAI({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildPrompt({
        name: project.name,
        district: project.district,
        state: project.state,
        category: project.category,
        existing,
      }),
      purpose: "insight",
      jsonMode: true,
      maxTokens: 500,
      temperature: 0,
    });
    const cleaned = response.text.trim().replace(/```(?:json)?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<AIFill>;
    return {
      announcedBy: parsed.announcedBy ?? null,
      announcedByRole: parsed.announcedByRole ?? null,
      party: parsed.party ?? null,
      executingAgency: parsed.executingAgency ?? null,
      description: typeof parsed.description === "string" && parsed.description.length >= 20
        ? parsed.description.slice(0, 220).trim()
        : null,
      category: parsed.category ?? null,
    };
  } catch (err) {
    console.error(`  ⚠  AI failed for "${project.name.slice(0, 60)}":`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function main() {
  console.log(`🧠 Infra AI enrichment ${DRY_RUN ? "(DRY-RUN)" : ""} — provider=anthropic, limit=${LIMIT}\n`);

  // Rank candidates by how many fields are null (most null → highest priority)
  const rows = await prisma.infraProject.findMany({
    where: {
      OR: [
        { announcedBy: null },
        { executingAgency: null },
        { description: null },
      ],
    },
    select: {
      id: true, name: true,
      category: true, announcedBy: true, announcedByRole: true, party: true,
      executingAgency: true, description: true,
      district: { select: { name: true, state: { select: { name: true } } } },
    },
    take: LIMIT * 3, // over-select then rank by null-count
  });

  const ranked = rows
    .map((r) => {
      const nullCount = [r.announcedBy, r.executingAgency, r.description, r.party, r.announcedByRole]
        .filter((v) => v == null).length;
      return { row: r, nullCount };
    })
    .sort((a, b) => b.nullCount - a.nullCount)
    .slice(0, LIMIT)
    .map((x) => x.row);

  console.log(`  ${rows.length} candidates, picking top ${ranked.length} by missing-field count\n`);

  let enriched = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of ranked) {
    const districtName = r.district.name;
    const stateName = r.district.state.name;
    const label = `[${districtName.slice(0, 12).padEnd(12)}] ${r.name.slice(0, 60)}`;

    const ai = await enrichProject({
      id: r.id,
      name: r.name,
      district: districtName,
      state: stateName,
      category: r.category,
      announcedBy: r.announcedBy,
      announcedByRole: r.announcedByRole,
      party: r.party,
      executingAgency: r.executingAgency,
      description: r.description,
    });

    if (!ai) { failed++; continue; }

    // Fill-only: only set fields that are currently null AND AI has a value.
    const patch: Prisma.InfraProjectUpdateInput = {};
    const filledFields: string[] = [];
    if (r.announcedBy == null && ai.announcedBy) { patch.announcedBy = ai.announcedBy; filledFields.push("announcedBy"); }
    if (r.announcedByRole == null && ai.announcedByRole) { patch.announcedByRole = ai.announcedByRole; filledFields.push("announcedByRole"); }
    if (r.party == null && ai.party) { patch.party = ai.party; filledFields.push("party"); }
    if (r.executingAgency == null && ai.executingAgency) { patch.executingAgency = ai.executingAgency; filledFields.push("executingAgency"); }
    if (r.description == null && ai.description) { patch.description = ai.description; filledFields.push("description"); }
    if (r.category == null && ai.category) { patch.category = ai.category; filledFields.push("category"); }

    if (filledFields.length === 0) {
      console.log(`  ⏭  ${label} — AI returned no new values`);
      skipped++;
    } else {
      if (!DRY_RUN) {
        await prisma.infraProject.update({ where: { id: r.id }, data: patch });
        await prisma.infraUpdate.create({
          data: {
            projectId: r.id,
            date: new Date(),
            headline: `AI enriched ${filledFields.length} missing fields`,
            summary: `Auto-filled via Claude Haiku 4.5 (Anthropic): ${filledFields.join(", ")}.`,
            updateType: "AI_ENRICHMENT",
            newsUrl: "ai-enrichment",
            newsSource: "ForThePeople.in AI research",
            newsDate: new Date(),
            verified: false,
          },
        });
      }
      console.log(`  ✅ ${label} — filled: ${filledFields.join(", ")}`);
      enriched++;
    }

    // Simple rate-limit pacing between calls
    if (DELAY_MS > 0) await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`\n📊 Result ${DRY_RUN ? "(DRY-RUN — no writes)" : ""}`);
  console.log(`   enriched: ${enriched}   skipped: ${skipped}   failed: ${failed}`);
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
