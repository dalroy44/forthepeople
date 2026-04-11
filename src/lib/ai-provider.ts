/**
 * ForThePeople.in — Unified AI Provider (OpenRouter)
 * Routes to different models based on task purpose.
 * All AI calls in the codebase go through callAI().
 */

import { prisma } from "@/lib/db";

// ── Types ───────────────────────────────────────────────────
export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  purpose?: string;
  model?: string;
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
  district?: string;
}

export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  usedFallback: boolean;
}

// ── Tiered model routing ────────────────────────────────────
function getModelForPurpose(purpose: string): string {
  switch (purpose) {
    // TIER 1 — Free (₹0) — internal admin tasks only
    case "classify":
    case "summarize":
    case "format":
      return "google/gemma-4-26b-a4b-it:free";

    // TIER 2 — Affordable at scale — user-facing content
    case "insight":
    case "news-analysis":
    case "document":
    case "document-large":
      return "google/gemini-2.5-pro";

    // TIER 3 — Premium — only for critical accuracy
    case "fact-check":
      return "anthropic/claude-sonnet-4";

    default:
      return "google/gemma-4-26b-a4b-it:free";
  }
}

// ── OpenRouter call ─────────────────────────────────────────
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

async function callOpenRouter(
  req: AIRequest,
  model: string,
  maxTokens: number,
  temp: number
): Promise<{ text: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  let sys = req.systemPrompt;
  if (req.jsonMode) {
    sys += "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown fences, no preamble. Pure JSON only.";
  }

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://forthepeople.in",
      "X-Title": "ForThePeople.in",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: req.userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: temp,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  let text = data.choices?.[0]?.message?.content || "";

  if (req.jsonMode) {
    text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  }

  return { text, usage: data.usage };
}

// ── Usage logging ───────────────────────────────────────────
async function logUsage(
  model: string,
  purpose: string,
  district: string | undefined,
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined,
  durationMs: number,
  success: boolean,
  errorMsg?: string
) {
  try {
    await prisma.aIUsageLog.create({
      data: {
        provider: "openrouter",
        model,
        purpose,
        district: district || null,
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
        costUSD: 0,
        costINR: 0,
        durationMs,
        success,
        errorMsg: errorMsg?.slice(0, 500),
      },
    });
  } catch {
    // Never let logging break the AI call
  }
}

// ── Settings cache (for backward compat with admin panel) ───
let cachedSettings: {
  activeProvider: string;
  geminiModel: string;
  anthropicModel: string;
  anthropicBaseUrl: string;
  anthropicSource: string;
  fallbackEnabled: boolean;
  fallbackProvider: string;
  maxTokens: number;
  temperature: number;
} | null = null;
let cacheTs = 0;
const CACHE_TTL = 60_000;

export function invalidateAISettingsCache() {
  cachedSettings = null;
  cacheTs = 0;
}

export function invalidateKeyCache(_provider?: string) {
  // No-op — kept for backward compat with admin API routes
}

export async function getAPIKey(_provider?: string): Promise<string | null> {
  return process.env.OPENROUTER_API_KEY ?? null;
}

async function getSettings() {
  if (cachedSettings && Date.now() - cacheTs < CACHE_TTL) return cachedSettings;
  try {
    const s = await prisma.aIProviderSettings.findUnique({ where: { id: "singleton" } });
    cachedSettings = {
      activeProvider: "openrouter",
      geminiModel: s?.geminiModel ?? "gemini-2.5-flash",
      anthropicModel: s?.anthropicModel ?? "claude-sonnet-4",
      anthropicBaseUrl: "https://openrouter.ai/api/v1",
      anthropicSource: "openrouter",
      fallbackEnabled: s?.fallbackEnabled ?? true,
      fallbackProvider: s?.fallbackProvider ?? "gemini",
      maxTokens: s?.maxTokens ?? 2048,
      temperature: s?.temperature ?? 0.3,
    };
    cacheTs = Date.now();
    return cachedSettings;
  } catch {
    return {
      activeProvider: "openrouter",
      geminiModel: "gemini-2.5-flash",
      anthropicModel: "claude-sonnet-4",
      anthropicBaseUrl: "https://openrouter.ai/api/v1",
      anthropicSource: "openrouter",
      fallbackEnabled: true,
      fallbackProvider: "gemini",
      maxTokens: 2048,
      temperature: 0.3,
    };
  }
}

// ── Main callAI function ────────────────────────────────────
export async function callAI(request: AIRequest): Promise<AIResponse> {
  const s = await getSettings();
  const maxTokens = request.maxTokens ?? s.maxTokens;
  const temp = request.temperature ?? s.temperature;
  const purpose = request.purpose ?? "summarize";
  const model = request.model ?? getModelForPurpose(purpose);

  const startTime = Date.now();

  try {
    const { text, usage } = await callOpenRouter(request, model, maxTokens, temp);

    // Update legacy counters
    prisma.aIProviderSettings
      .update({
        where: { id: "singleton" },
        data: { totalGeminiCalls: { increment: 1 } },
      })
      .catch(() => {});

    // Log usage
    logUsage(model, purpose, request.district, usage, Date.now() - startTime, true);

    return { text, provider: "openrouter", model, usedFallback: false };
  } catch (primaryError) {
    console.error(`[AI] OpenRouter (${model}) failed:`, primaryError);

    const errMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
    logUsage(model, purpose, request.district, undefined, Date.now() - startTime, false, errMsg);

    prisma.aIProviderSettings
      .update({
        where: { id: "singleton" },
        data: { lastError: errMsg.slice(0, 500), lastErrorAt: new Date() },
      })
      .catch(() => {});

    // Fallback: try the free model if the primary model failed
    if (model !== "google/gemma-4-26b-a4b-it:free") {
      const fbModel = "google/gemma-4-26b-a4b-it:free";
      console.log(`[AI] Falling back to ${fbModel}`);
      const fbStart = Date.now();
      try {
        const { text, usage } = await callOpenRouter(request, fbModel, maxTokens, temp);
        logUsage(fbModel, purpose, request.district, usage, Date.now() - fbStart, true);
        return { text, provider: "openrouter", model: fbModel, usedFallback: true };
      } catch (fbError) {
        logUsage(fbModel, purpose, request.district, undefined, Date.now() - fbStart, false,
          fbError instanceof Error ? fbError.message : String(fbError));
        throw new Error(`OpenRouter failed: ${errMsg}. Fallback also failed: ${fbError}`);
      }
    }
    throw primaryError;
  }
}

// ── Convenience: JSON mode ──────────────────────────────────
export async function callAIJSON<T = unknown>(
  request: AIRequest
): Promise<{ data: T } & AIResponse> {
  const res = await callAI({ ...request, jsonMode: true });
  try {
    const data = JSON.parse(res.text) as T;
    return { data, ...res };
  } catch (e) {
    throw new Error(`AI returned invalid JSON from ${res.model}: ${e}`);
  }
}
