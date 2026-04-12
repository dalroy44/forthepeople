/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Insight Generator — uses callAI (OpenRouter tiered routing)
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai-provider";
import { ModuleInsightConfig, getTtlMs } from "./insight-config";

type Severity = "good" | "watch" | "alert" | "critical";

interface GeneratedInsight {
  severity: Severity;
  opinion: string;
  recommendation: string;
  aiProvider: string;
  aiModel: string;
}

// ── Fetch module data from our own API ────────────────────
async function fetchModuleData(
  module: string,
  districtSlug: string,
  stateSlug: string
): Promise<Record<string, unknown>> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";
    const url = `${baseUrl}/api/data/${module}?district=${districtSlug}&state=${stateSlug}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ForThePeople-InsightBot/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return {};
    const json = await res.json();
    return (json?.data ?? json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ── Build system + user prompts ───────────────────────────
function buildPrompts(
  config: ModuleInsightConfig,
  districtName: string,
  stateName: string,
  data: Record<string, unknown>
): { systemPrompt: string; userPrompt: string } {
  const snippet = JSON.stringify(data, null, 2).slice(0, 3000);

  const systemPrompt = `You are a civic data analyst for ForThePeople.in — India's citizen transparency platform.
Your role: Analyse government data and provide clear, actionable assessments for ordinary citizens.
Always respond ONLY with valid JSON in the exact schema requested. No markdown, no explanation.`;

  const userPrompt = `Analyse the following ${config.label} data for ${districtName}, ${stateName}.
Focus: ${config.promptHint}

Data:
${snippet}

Return a JSON object with exactly these three fields:
- severity: one of "good", "watch", "alert", or "critical"
- opinion: 2-3 sentence plain English assessment for citizens
- recommendation: 1-2 concrete actions citizens or officials should take

Severity meaning:
- good: metrics are healthy, no immediate concerns
- watch: minor issues worth monitoring
- alert: significant problems needing attention soon
- critical: urgent action required immediately`;

  return { systemPrompt, userPrompt };
}

// ── Generate and persist one insight ─────────────────────
export async function generateInsight(
  config: ModuleInsightConfig,
  districtId: string,
  districtSlug: string,
  districtName: string,
  stateSlug: string,
  stateName: string
): Promise<boolean> {
  try {
    const data = await fetchModuleData(config.module, districtSlug, stateSlug);
    const { systemPrompt, userPrompt } = buildPrompts(config, districtName, stateName, data);

    // Use unified AI provider (OpenRouter tiered routing)
    const response = await callAI({
      systemPrompt,
      userPrompt,
      purpose: "insight",
      jsonMode: true,
      maxTokens: 2048,
      temperature: 0.3,
      district: districtSlug,
    });

    // Parse the AI response
    const text = response.text.trim().replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(text) as { severity?: string; opinion?: string; recommendation?: string };

    // Validate required fields
    const severity = (["good", "watch", "alert", "critical"].includes(parsed.severity ?? "")
      ? parsed.severity
      : "watch") as Severity;
    const opinion = parsed.opinion ?? "No analysis available.";
    const recommendation = parsed.recommendation ?? "No recommendation available.";

    const result: GeneratedInsight = {
      severity,
      opinion,
      recommendation,
      aiProvider: response.provider,
      aiModel: response.model,
    };

    const expiresAt = new Date(Date.now() + getTtlMs(config));

    await prisma.aIModuleInsight.upsert({
      where: { districtId_module: { districtId, module: config.module } },
      update: {
        severity: result.severity,
        opinion: result.opinion,
        recommendation: result.recommendation,
        aiProvider: result.aiProvider,
        aiModel: result.aiModel,
        expiresAt,
        generatedAt: new Date(),
      },
      create: {
        districtId,
        module: config.module,
        severity: result.severity,
        opinion: result.opinion,
        recommendation: result.recommendation,
        aiProvider: result.aiProvider,
        aiModel: result.aiModel,
        expiresAt,
      },
    });

    return true;
  } catch {
    return false;
  }
}

// ── Fetch insight for a module (from DB) ─────────────────
export async function getStoredInsight(districtId: string, module: string) {
  return prisma.aIModuleInsight.findUnique({
    where: { districtId_module: { districtId, module } },
  });
}

// ── Check if insight needs regeneration ──────────────────
export function isExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt;
}
