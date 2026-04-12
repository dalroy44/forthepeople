/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STALE_ALERT_DAYS = 14;

export async function GET() {
  const checks: Record<string, string> = {};
  const meta: Record<string, unknown> = {};

  // Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "✅ Connected";
  } catch (e) {
    checks.database = "❌ " + (e instanceof Error ? e.message : "Failed");
  }

  // AI Provider — include source detail
  try {
    const settings = await prisma.aIProviderSettings.findUnique({ where: { id: "singleton" } });
    if (settings) {
      const sourceLabel = "openrouter";
      const model = "tiered (gemini-flash/claude-sonnet/gemini-pro)";
      checks.aiProvider = `✅ ${sourceLabel} (${model})`;
      meta.aiProvider = { source: sourceLabel, model, fallbackEnabled: settings.fallbackEnabled };
    } else {
      checks.aiProvider = "❌ No settings";
    }
  } catch {
    checks.aiProvider = "❌ Failed";
  }

  // Keys (status only, never values)
  checks.openrouterKey = process.env.OPENROUTER_API_KEY ? "✅ Set" : "❌ Missing";
  checks.encryptionSecret = process.env.ENCRYPTION_SECRET ? "✅ Set" : "⚠️ Using fallback";
  checks.resendKey = process.env.RESEND_API_KEY ? "✅ Set" : "⚠️ Not set";

  // Last fact check
  try {
    const lastFC = await prisma.factCheck.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, status: true, issuesFound: true, districtId: true },
    });
    if (lastFC) {
      checks.lastFactCheck = `✅ ${lastFC.createdAt.toISOString().split("T")[0]} — ${lastFC.status} (${lastFC.issuesFound} issues)`;
      meta.lastFactCheck = { date: lastFC.createdAt.toISOString(), status: lastFC.status, issuesFound: lastFC.issuesFound };
    } else {
      checks.lastFactCheck = "⚠️ Never run";
    }
  } catch {
    checks.lastFactCheck = "⚠️ Unavailable";
  }

  // Active + stale alert counts
  try {
    const staleDate = new Date(Date.now() - STALE_ALERT_DAYS * 86_400_000);
    const [activeAlerts, staleAlerts] = await Promise.all([
      prisma.localAlert.count({ where: { active: true } }),
      prisma.localAlert.count({ where: { active: true, createdAt: { lt: staleDate } } }),
    ]);
    checks.alerts = staleAlerts > 0
      ? `⚠️ ${activeAlerts} active (${staleAlerts} stale >14d)`
      : `✅ ${activeAlerts} active alerts`;
    meta.alerts = { active: activeAlerts, stale: staleAlerts };
  } catch {
    checks.alerts = "⚠️ Unavailable";
  }

  const allGood = !Object.values(checks).some((v) => v.startsWith("❌"));

  return NextResponse.json({
    status: allGood ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
    meta,
  });
}
