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
    // TIER 1 — Free (₹0)
    // Includes news-analysis (April 13, 2026 cost cut). Classification is
    // basically pick-a-category-from-list and extract-a-few-fields — the free
    // tier handles it fine and the fallback chain catches rate-limit misses.
    case "classify":
    case "summarize":
    case "format":
    case "news-analysis":
      return "openai/gpt-oss-20b:free";

    // TIER 2 — Affordable at scale — user-facing citizen-impact content
    case "insight":
    case "document":
    case "document-large":
      return "google/gemini-2.5-pro";

    // TIER 3 — Premium — only for critical accuracy
    case "fact-check":
      return "anthropic/claude-sonnet-4";

    default:
      return "openai/gpt-oss-20b:free";
  }
}

// Fallback chain: if primary model fails (rate limit, unavailable), try these in order.
// qwen3-235b runs first now — in April 2026 the OSS-20b free tier has been hitting
// 200 req/day limits consistently, which forces paid fallbacks on the tiered router.
const FREE_FALLBACK_MODELS = [
  "qwen/qwen3-235b-a22b:free",
  "openai/gpt-oss-20b:free",
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "z-ai/glm-4.5-air:free",
];

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

    // Update counters + clear any stale error on success
    prisma.aIProviderSettings
      .update({
        where: { id: "singleton" },
        data: { totalGeminiCalls: { increment: 1 }, lastError: null, lastErrorAt: null },
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

    // Fallback: try each free model in sequence until one works
    const tryFallbacks = FREE_FALLBACK_MODELS.filter((m) => m !== model);
    for (const fbModel of tryFallbacks) {
      console.log(`[AI] Falling back to ${fbModel}`);
      const fbStart = Date.now();
      try {
        const { text, usage } = await callOpenRouter(request, fbModel, maxTokens, temp);
        logUsage(fbModel, purpose, request.district, usage, Date.now() - fbStart, true);
        return { text, provider: "openrouter", model: fbModel, usedFallback: true };
      } catch (fbError) {
        logUsage(fbModel, purpose, request.district, undefined, Date.now() - fbStart, false,
          fbError instanceof Error ? fbError.message : String(fbError));
        // continue to next fallback
      }
    }
    throw new Error(`All OpenRouter models failed. Primary (${model}): ${errMsg}`);
  }
}

// ── Robust JSON extractor ───────────────────────────────────
function extractJSON(text: string): unknown {
  try { return JSON.parse(text.trim()); } catch { /* continue */ }
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* continue */ }
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { /* continue */ }
  }
  throw new Error(`Could not parse JSON: ${text.slice(0, 200)}`);
}

// ── Convenience: JSON mode ──────────────────────────────────
export async function callAIJSON<T = unknown>(
  request: AIRequest
): Promise<{ data: T } & AIResponse> {
  const res = await callAI({ ...request, jsonMode: true });
  const data = extractJSON(res.text) as T;
  return { data, ...res };
}
