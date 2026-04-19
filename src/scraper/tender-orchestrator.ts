// Tender orchestrator — reads TenderScraperConfig, dispatches by engineType,
// persists results into Tender + related rows, records TenderScraperRun.
// Run on cron or manually:
//   npx tsx src/scraper/tender-orchestrator.ts --portal KPPP --dry-run --limit 10
//   npx tsx src/scraper/tender-orchestrator.ts --all
// All engines honour 1-req-per-3s pacing and robots.txt via tenderFetch().

import "dotenv/config";
import { prisma } from "@/lib/db";
import { createHash } from "node:crypto";
import type { EnginePortalConfig, RawTender, ScraperEngine } from "./engines/types";
import { kpppSeamEngine } from "./engines/kppp-seam-engine";
import { nicgepEngine } from "./engines/nicgep-engine";
import { irepsEngine } from "./engines/ireps-engine";
import { tenderWizardEngine } from "./engines/tenderwizard-engine";

const ENGINES: Record<string, ScraperEngine> = {
  "kppp-seam": kpppSeamEngine,
  "nicgep": nicgepEngine,
  "ireps": irepsEngine,
  "tenderwizard": tenderWizardEngine,
};

interface RunOptions {
  portalCodes?: string[]; // undefined = all active
  dryRun?: boolean;
  limit?: number;
  all?: boolean;
}

interface RunSummary {
  portalCode: string;
  engineType: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL" | "SKIPPED";
  tendersIngested: number;
  tendersUpdated: number;
  errorsCount: number;
  errorMsg?: string;
  durationMs: number;
  dryRun: boolean;
}

function canonicalTenderHash(t: RawTender): string {
  const canonical = JSON.stringify({
    p: t.sourcePortal,
    i: t.sourceTenderId,
    t: t.title,
    v: t.estimatedValueInr?.toString() ?? null,
    d: t.bidSubmissionEnd?.toISOString() ?? null,
    s: t.status ?? null,
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

async function resolveAuthorityId(name: string | undefined | null): Promise<string | null> {
  if (!name) return null;
  // Try an exact shortCode or name match first, fall back to case-insensitive contains.
  const exact = await prisma.tenderAuthority.findFirst({
    where: { OR: [{ shortCode: name }, { name }] },
    select: { id: true },
  });
  if (exact) return exact.id;
  const fuzzy = await prisma.tenderAuthority.findFirst({
    where: { name: { contains: name, mode: "insensitive" } },
    select: { id: true },
  });
  return fuzzy?.id ?? null;
}

async function upsertFromRaw(raw: RawTender, fallbackAuthorityId: string | null): Promise<"ingested" | "updated" | "skipped"> {
  const authorityId = (await resolveAuthorityId(raw.authorityName)) ?? fallbackAuthorityId;
  if (!authorityId) return "skipped"; // no authority → we can't associate; drop until Phase 4 can add a "Pending" bucket

  const hash = canonicalTenderHash(raw);
  const existing = await prisma.tender.findUnique({
    where: { sourcePortal_sourceTenderId: { sourcePortal: raw.sourcePortal, sourceTenderId: raw.sourceTenderId } },
    select: { id: true, contentHash: true },
  });

  const data = {
    sourcePortal: raw.sourcePortal,
    sourceTenderId: raw.sourceTenderId,
    sourceUrl: raw.sourceUrl,
    nitRefNumber: raw.nitRefNumber ?? null,
    title: raw.title,
    workType: raw.workType ?? "WORKS",
    procurementType: raw.procurementType ?? "OPEN",
    authorityId,
    estimatedValueInr: raw.estimatedValueInr ?? null,
    tenderFeeInr: raw.tenderFeeInr ?? null,
    emdAmountInr: raw.emdAmountInr ?? null,
    publishedAt: raw.publishedAt ?? new Date(),
    bidSubmissionStart: raw.bidSubmissionStart ?? null,
    bidSubmissionEnd: raw.bidSubmissionEnd ?? new Date(Date.now() + 14 * 86400_000),
    numberOfCovers: raw.numberOfCovers ?? null,
    status: raw.status ?? "PUBLISHED",
    locationState: raw.locationState ?? "Karnataka",
    locationDistrict: raw.locationDistrict ?? "Unknown",
    locationTaluk: raw.locationTaluk ?? null,
    rawHtmlSnapshot: raw.rawHtmlSnapshot ?? null,
    contentHash: hash,
    lastCheckedAt: new Date(),
  };

  if (!existing) {
    await prisma.tender.create({ data });
    return "ingested";
  }
  if (existing.contentHash === hash) return "skipped";
  await prisma.tender.update({ where: { id: existing.id }, data });
  return "updated";
}

async function runPortal(cfgRow: {
  id: string;
  portalCode: string;
  baseUrl: string;
  engineType: string;
  rateLimitSeconds: number;
  maxRequestsPerDay: number;
  appliesToStates: string[];
}, opts: RunOptions): Promise<RunSummary> {
  const startedAt = Date.now();
  const engine = ENGINES[cfgRow.engineType];
  const dryRun = !!opts.dryRun;

  if (!engine) {
    return { portalCode: cfgRow.portalCode, engineType: cfgRow.engineType, status: "SKIPPED", tendersIngested: 0, tendersUpdated: 0, errorsCount: 0, errorMsg: `engine ${cfgRow.engineType} not registered`, durationMs: 0, dryRun };
  }

  const runRow = dryRun
    ? null
    : await prisma.tenderScraperRun.create({
        data: { configId: cfgRow.id, status: "RUNNING" },
      });

  const engineCfg: EnginePortalConfig = {
    id: cfgRow.id,
    portalCode: cfgRow.portalCode,
    baseUrl: cfgRow.baseUrl,
    rateLimitSeconds: cfgRow.rateLimitSeconds,
    maxRequestsPerDay: cfgRow.maxRequestsPerDay,
    appliesToStates: cfgRow.appliesToStates,
  };

  let tendersIngested = 0;
  let tendersUpdated = 0;
  let errorsCount = 0;
  let errorMsg: string | undefined;
  let summaryStatus: RunSummary["status"] = "SUCCESS";

  try {
    const raws = await engine.listTenders(engineCfg, { limit: opts.limit, dryRun });
    console.log(`[${cfgRow.portalCode}] received ${raws.length} raw tenders from engine`);

    if (dryRun) {
      console.log(`[${cfgRow.portalCode}] DRY RUN — no DB writes`);
      for (const r of raws.slice(0, Math.min(3, raws.length))) {
        console.log(`  • ${r.sourceTenderId}: ${r.title.slice(0, 80)}  closes=${r.bidSubmissionEnd?.toISOString() ?? "?"}`);
      }
    } else {
      for (const raw of raws) {
        try {
          const res = await upsertFromRaw(raw, null);
          if (res === "ingested") tendersIngested++;
          else if (res === "updated") tendersUpdated++;
        } catch (err) {
          errorsCount++;
          console.error(`[${cfgRow.portalCode}] upsert failed for ${raw.sourceTenderId}:`, err);
        }
      }
    }

    if (errorsCount > 0 && tendersIngested === 0 && tendersUpdated === 0) summaryStatus = "FAILED";
    else if (errorsCount > 0) summaryStatus = "PARTIAL";

    if (runRow) {
      await prisma.tenderScraperRun.update({
        where: { id: runRow.id },
        data: {
          status: summaryStatus,
          tendersIngested,
          tendersUpdated,
          errorsCount,
          completedAt: new Date(),
        },
      });
      await prisma.tenderScraperConfig.update({
        where: { id: cfgRow.id },
        data: { lastSuccessfulRunAt: summaryStatus === "SUCCESS" ? new Date() : undefined },
      });
    }
  } catch (err) {
    summaryStatus = "FAILED";
    errorMsg = err instanceof Error ? err.message : String(err);
    if (runRow) {
      await prisma.tenderScraperRun.update({
        where: { id: runRow.id },
        data: { status: "FAILED", completedAt: new Date(), errorLog: { message: errorMsg } },
      });
      await prisma.tenderScraperConfig.update({
        where: { id: cfgRow.id },
        data: { lastFailureAt: new Date(), lastFailureReason: errorMsg.slice(0, 500) },
      });
    }
  }

  const durationMs = Date.now() - startedAt;
  return { portalCode: cfgRow.portalCode, engineType: cfgRow.engineType, status: summaryStatus, tendersIngested, tendersUpdated, errorsCount, errorMsg, durationMs, dryRun };
}

export async function runTenderOrchestrator(opts: RunOptions): Promise<RunSummary[]> {
  const configs = await prisma.tenderScraperConfig.findMany({
    where: {
      isActive: true,
      ...(opts.portalCodes ? { portalCode: { in: opts.portalCodes } } : {}),
    },
  });
  const summaries: RunSummary[] = [];
  for (const cfg of configs) {
    const summary = await runPortal(cfg as Parameters<typeof runPortal>[0], opts);
    summaries.push(summary);
    console.log(`[${cfg.portalCode}] ${summary.status} — ingested=${summary.tendersIngested} updated=${summary.tendersUpdated} errors=${summary.errorsCount} (${summary.durationMs}ms)`);
  }
  return summaries;
}

// ── CLI entry ─────────────────────────────────────────────────────────────
function parseArgs(argv: string[]): RunOptions {
  const opts: RunOptions = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--all") opts.all = true;
    else if (a === "--portal") { opts.portalCodes = [argv[++i]]; }
    else if (a === "--limit") { opts.limit = parseInt(argv[++i], 10); }
  }
  return opts;
}

if (typeof require !== "undefined" && require.main === module) {
  const opts = parseArgs(process.argv);
  runTenderOrchestrator(opts)
    .then((summaries) => {
      console.log("\n══ Orchestrator complete ══");
      console.table(summaries.map((s) => ({
        portal: s.portalCode, status: s.status, ingested: s.tendersIngested, updated: s.tendersUpdated, errors: s.errorsCount, ms: s.durationMs, dry: s.dryRun,
      })));
      process.exit(0);
    })
    .catch((err) => { console.error(err); process.exit(1); });
}
