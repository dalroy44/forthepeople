/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Cron: Generate / refresh AI module insights
// POST /api/cron/generate-insights
// Schedule: every 2 hours (vercel.json)
// Processes all districts × modules where expiresAt < now
// Rate-limited: 2s delay between Anthropic calls
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { MODULE_INSIGHT_CONFIGS } from "@/lib/insight-config";
import { generateInsight, hasDataChanged } from "@/lib/insight-generator";
import { alertCronFailed } from "@/lib/admin-alerts";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min max

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  // Auth check
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: { district: string; module: string; ok: boolean }[] = [];

  try {
    // Get all active districts
    const districts = await prisma.district.findMany({
      where: { active: true },
      select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    });

    // Find all expired or missing insights
    const now = new Date();

    for (const district of districts) {
      for (const config of MODULE_INSIGHT_CONFIGS) {
        // Check if insight exists and is still valid
        const existing = await prisma.aIModuleInsight.findUnique({
          where: { districtId_module: { districtId: district.id, module: config.module } },
          select: { expiresAt: true },
        });

        if (existing && existing.expiresAt > now) {
          // Still fresh — skip
          continue;
        }

        // April 13, 2026 — skip regeneration if underlying data hasn't changed
        // since the last insight. Static modules (leaders, budget, schools)
        // rarely change and were burning Gemini Pro calls on every run.
        if (!(await hasDataChanged(district.id, config.module))) {
          console.log(
            `[generate-insights] Skip ${config.module}/${district.slug} — no data change`
          );
          continue;
        }

        // Generate new insight
        const ok = await generateInsight(
          config,
          district.id,
          district.slug,
          district.name,
          district.state.slug,
          district.state.name
        );

        results.push({ district: district.slug, module: config.module, ok });

        // 2-second delay between calls to respect Anthropic rate limits
        await sleep(2000);

        // Stop if approaching timeout
        if (Date.now() - startTime > 270_000) {
          console.log("[generate-insights] Approaching timeout, stopping early");
          break;
        }
      }
    }

    const succeeded = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    return NextResponse.json({
      ok: true,
      processed: results.length,
      succeeded,
      failed,
      durationMs: Date.now() - startTime,
    });
  } catch (err) {
    Sentry.captureException(err);
    alertCronFailed("generate-insights", err instanceof Error ? err.message : String(err)).catch(() => {});
    console.error("[generate-insights] Fatal:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// Vercel cron calls via GET
export async function GET(req: NextRequest) {
  return POST(req);
}
