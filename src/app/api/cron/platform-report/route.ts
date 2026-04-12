/**
 * ForThePeople.in — Weekly platform report cron
 * GET /api/cron/platform-report
 * Schedule: Sundays 00:00 UTC (vercel.json)
 * Auth: x-cron-secret header === CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { generatePlatformReport } from "@/lib/platform-analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const provided =
    req.headers.get("x-cron-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (provided !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await generatePlatformReport("weekly");
    return NextResponse.json({
      ok: true,
      reportId: report.id,
      aiModel: report.aiModel,
      aiCostUSD: report.aiCostUSD,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
