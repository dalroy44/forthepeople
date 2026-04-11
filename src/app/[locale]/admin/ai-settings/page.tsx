/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useEffect } from "react";

interface AISettings {
  id: string;
  activeProvider: string;
  anthropicSource: string;
  anthropicBaseUrl: string;
  geminiModel: string;
  anthropicModel: string;
  fallbackEnabled: boolean;
  fallbackProvider: string;
  maxTokens: number;
  temperature: number;
  totalGeminiCalls: number;
  totalAnthropicCalls: number;
  lastSwitchedAt: string;
  lastError?: string | null;
  lastErrorAt?: string | null;
}

interface SettingsResponse {
  settings: AISettings;
  keyStatus: { geminiConfigured: boolean; anthropicConfigured: boolean };
}

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
const ANTHROPIC_MODELS = [
  { value: "claude-opus-4-6", label: "claude-opus-4-6 (Best — Recommended)" },
  { value: "claude-opus-4-20250514", label: "claude-opus-4 (Stable)" },
  { value: "claude-sonnet-4-6", label: "claude-sonnet-4-6 (Balanced)" },
  { value: "claude-sonnet-4-20250514", label: "claude-sonnet-4 (Stable)" },
  { value: "claude-haiku-4-5-20251001", label: "claude-haiku-4-5 (Fastest)" },
];

// The 3 provider options — maps to (activeProvider, anthropicSource) pairs
const PROVIDERS = [
  {
    id: "anthropic_legacy",
    icon: "⚡",
    name: "Anthropic (Legacy)",
    tagline: "Not in use — routed via OpenRouter",
    desc: "Previously used via proxy. All calls now route through OpenRouter which handles Anthropic models directly.",
    keyName: "anthropic",
    keyLabel: "Anthropic API Key (legacy)",
    keyPlaceholder: "sk-ant-…",
    activeProvider: "anthropic",
    anthropicSource: "official",
    color: "#9B9B9B",
    bgColor: "#F5F5F0",
    borderActive: "#9B9B9B",
  },
  {
    id: "official",
    icon: "🤖",
    name: "Official Anthropic",
    tagline: "Direct API — highest quality",
    desc: "Direct connection to Anthropic's API. Best for fact checking and sensitive analysis where quality is critical.",
    keyName: "anthropic_official",
    keyLabel: "Anthropic API Key",
    keyPlaceholder: "sk-ant-api03-…",
    activeProvider: "anthropic",
    anthropicSource: "official",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    borderActive: "#2563EB",
  },
  {
    id: "gemini",
    icon: "✨",
    name: "Google Gemini",
    tagline: "Best for news analysis",
    desc: "Google's Gemini is excellent for news analysis, summarisation, and high-throughput pipelines. 1M token context.",
    keyName: "gemini",
    keyLabel: "Gemini API Key",
    keyPlaceholder: "AIza…",
    activeProvider: "gemini",
    anthropicSource: "",
    color: "#16A34A",
    bgColor: "#F0FDF4",
    borderActive: "#16A34A",
  },
] as const;

export default function AISettingsPage() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [, setSaving] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; provider?: string; model?: string; durationMs?: number; usedFallback?: boolean; error?: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [keyInfo, setKeyInfo] = useState<Record<string, { source: string; masked: string | null; isActive: boolean }> | null>(null);
  const [keyInput, setKeyInput] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/ai-settings")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
    fetch("/api/admin/api-keys")
      .then((r) => r.json())
      .then(setKeyInfo)
      .catch(() => {});
  }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function save(patch: Partial<AISettings>) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "Save failed", false);
      } else {
        setData((prev) => prev ? { ...prev, settings: { ...prev.settings, ...json.settings } } : prev);
        showToast("Saved");
      }
    } finally {
      setSaving(false);
    }
  }

  async function activateProvider(providerId: string) {
    const p = PROVIDERS.find((x) => x.id === providerId);
    if (!p) return;
    setActivating(providerId);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeProvider: p.activeProvider,
          ...(p.anthropicSource ? { anthropicSource: p.anthropicSource } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "Failed", false);
      } else {
        setData((prev) => prev ? { ...prev, settings: { ...prev.settings, ...json.settings } } : prev);
        showToast(`✅ Switched to ${p.name}`);
      }
    } finally {
      setActivating(null);
    }
  }

  async function saveKey(keyName: string) {
    const apiKey = (keyInput[keyName] ?? "").trim();
    if (!apiKey) return showToast("Enter a key first", false);
    setSavingKey(keyName);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: keyName, apiKey }),
      });
      const json = await res.json();
      if (res.ok) {
        setKeyInput((prev) => ({ ...prev, [keyName]: "" }));
        setKeyInfo((prev) => prev ? {
          ...prev,
          [keyName]: { source: "database", masked: json.masked, isActive: true },
        } : prev);
        showToast("Key saved");
      } else {
        showToast(json.error ?? "Save failed", false);
      }
    } finally {
      setSavingKey(null);
    }
  }

  async function removeKey(keyName: string) {
    if (!confirm(`Remove key from database? Will fall back to env var if set.`)) return;
    setSavingKey(keyName);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: keyName }),
      });
      const json = await res.json();
      if (res.ok) {
        setKeyInfo((prev) => prev ? {
          ...prev,
          [keyName]: { source: json.fallbackToEnv ? "environment" : "none", masked: null, isActive: json.fallbackToEnv },
        } : prev);
        showToast("Key removed");
      }
    } finally {
      setSavingKey(null);
    }
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/ai-test", { method: "POST" });
      const json = await res.json();
      setTestResult(json);
    } catch (e) {
      setTestResult({ success: false, error: String(e) });
    } finally {
      setTesting(false);
    }
  }

  function isProviderActive(_p: typeof PROVIDERS[number], _s: AISettings) {
    // OpenRouter is now the only active provider — legacy cards always show as inactive
    return false;
  }

  if (!data) {
    return <div style={{ padding: 32, color: "#6B6B6B", fontSize: 13 }}>Loading AI settings…</div>;
  }

  const s = data.settings;

  const cardBase: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #E8E8E4",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  };

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          background: toast.ok ? "#16A34A" : "#DC2626",
          color: "#fff", padding: "10px 18px", borderRadius: 8,
          fontSize: 13, fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
          🤖 AI Provider Settings
        </h1>
        <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
          OpenRouter is the primary AI gateway. All calls route through it with tiered model selection.
        </div>
      </div>

      {/* ─── OpenRouter Active Card ─── */}
      <div style={{ ...cardBase, borderLeft: "4px solid #16A34A", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>🌐</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>OpenRouter</span>
              <span style={{ fontSize: 10, fontWeight: 700, background: "#16A34A", color: "#fff", padding: "2px 8px", borderRadius: 10 }}>ACTIVE</span>
            </div>
            <div style={{ fontSize: 12, color: "#6B6B6B" }}>Unified API gateway — 300+ models via single endpoint</div>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>Model Routing</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
          {[
            { purpose: "Classification / Summaries / Format", model: "google/gemma-4-26b-a4b-it:free", cost: "Free" },
            { purpose: "District Insights / News / Documents", model: "google/gemini-2.5-pro", cost: "~$1.25/M tokens" },
            { purpose: "Fact-check (critical accuracy)", model: "anthropic/claude-sonnet-4", cost: "~$3/M tokens" },
          ].map((r) => (
            <div key={r.purpose} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#FAFAF8", borderRadius: 6, fontSize: 12 }}>
              <span style={{ color: "#6B6B6B" }}>{r.purpose}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "#1A1A1A", fontWeight: 500, fontSize: 11 }}>{r.model}</span>
                <span style={{ fontSize: 10, color: "#16A34A", fontWeight: 600 }}>{r.cost}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#6B6B6B" }}>
          <span>Total calls: <strong style={{ fontFamily: "monospace", color: "#1A1A1A" }}>{(s.totalGeminiCalls + s.totalAnthropicCalls).toLocaleString("en-IN")}</strong></span>
        </div>

        {s.lastError && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 8, fontSize: 11, color: "#DC2626" }}>
            Last error: {s.lastError}
            {s.lastErrorAt && ` (${new Date(s.lastErrorAt).toLocaleString("en-IN")})`}
          </div>
        )}
      </div>

      {/* ─── Legacy Provider Cards (fallback configuration) ─── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 14 }}>
          Legacy Providers (fallback keys)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {PROVIDERS.map((p) => {
            const active = isProviderActive(p, s);
            const info = keyInfo?.[p.keyName];
            const isExpanded = expandedCard === p.id;
            return (
              <div
                key={p.id}
                style={{
                  border: `2px solid ${active ? p.borderActive : "#E8E8E4"}`,
                  borderRadius: 12,
                  background: active ? p.bgColor : "#FFFFFF",
                  transition: "all 150ms",
                  overflow: "hidden",
                }}
              >
                {/* Card header */}
                <div style={{ padding: "16px 16px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontSize: 24 }}>{p.icon}</div>
                    {active && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, background: p.color,
                        color: "#fff", padding: "2px 8px", borderRadius: 10,
                      }}>
                        ✓ ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", marginBottom: 2 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: p.color, fontWeight: 600, marginBottom: 8 }}>
                    {p.tagline}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B6B6B", lineHeight: 1.5, marginBottom: 12 }}>
                    {p.desc}
                  </div>

                  {/* Key status badge */}
                  <div style={{ marginBottom: 12 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                      background: info?.isActive ? "#DCFCE7" : "#FEE2E2",
                      color: info?.isActive ? "#16A34A" : "#DC2626",
                    }}>
                      {info?.source === "database" ? "🔑 DB Key" : info?.source === "environment" ? "🌿 Env Var" : "❌ Key Missing"}
                    </span>
                    {info?.masked && (
                      <div style={{ fontSize: 10, fontFamily: "monospace", color: "#9B9B9B", marginTop: 4 }}>
                        {info.masked}
                      </div>
                    )}
                  </div>

                  {/* Activate / Configure buttons */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {!active && (
                      <button
                        onClick={() => activateProvider(p.id)}
                        disabled={activating === p.id}
                        style={{
                          flex: 1, padding: "7px 0", background: p.color, color: "#fff",
                          border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600,
                          cursor: activating === p.id ? "not-allowed" : "pointer",
                          opacity: activating === p.id ? 0.6 : 1,
                        }}
                      >
                        {activating === p.id ? "Switching…" : "Activate"}
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : p.id)}
                      style={{
                        flex: active ? 1 : undefined,
                        padding: "7px 10px", background: "#F5F5F0", color: "#6B6B6B",
                        border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {isExpanded ? "Hide key" : "Set key"}
                    </button>
                  </div>
                </div>

                {/* Expanded key input */}
                {isExpanded && (
                  <div style={{ padding: "0 16px 16px", borderTop: "1px solid #F0F0EC" }}>
                    <div style={{ paddingTop: 12 }}>
                      <label style={{ fontSize: 11, color: "#6B6B6B", display: "block", marginBottom: 4 }}>
                        {p.keyLabel}
                      </label>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type="password"
                          placeholder={p.keyPlaceholder}
                          value={keyInput[p.keyName] ?? ""}
                          onChange={(e) => setKeyInput((prev) => ({ ...prev, [p.keyName]: e.target.value }))}
                          style={{
                            flex: 1, padding: "6px 10px", border: "1px solid #E8E8E4",
                            borderRadius: 6, fontSize: 11, background: "#fff",
                          }}
                        />
                        <button
                          onClick={() => saveKey(p.keyName)}
                          disabled={savingKey === p.keyName || !(keyInput[p.keyName] ?? "").trim()}
                          style={{
                            padding: "6px 10px", background: "#2563EB", color: "#fff",
                            border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600,
                            cursor: "pointer",
                            opacity: savingKey === p.keyName || !(keyInput[p.keyName] ?? "").trim() ? 0.5 : 1,
                          }}
                        >
                          Save
                        </button>
                      </div>
                      {info?.source === "database" && (
                        <button
                          onClick={() => removeKey(p.keyName)}
                          disabled={savingKey === p.keyName}
                          style={{
                            marginTop: 6, padding: "4px 10px", background: "#FEE2E2",
                            color: "#DC2626", border: "none", borderRadius: 6,
                            fontSize: 11, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          Remove DB key
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Usage counters */}
        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "#6B6B6B" }}>
          <span>Gemini: <strong style={{ fontFamily: "monospace" }}>{s.totalGeminiCalls.toLocaleString("en-IN")}</strong> calls</span>
          <span>Anthropic: <strong style={{ fontFamily: "monospace" }}>{s.totalAnthropicCalls.toLocaleString("en-IN")}</strong> calls</span>
        </div>

        {/* Last error */}
        {s.lastError && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 8, fontSize: 11, color: "#DC2626" }}>
            Last error: {s.lastError}
            {s.lastErrorAt && ` (${new Date(s.lastErrorAt).toLocaleString("en-IN")})`}
          </div>
        )}
      </div>

      {/* ─── Model Selection ─── */}
      <div style={cardBase}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
          Model Selection
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6B6B6B", display: "block", marginBottom: 4 }}>
              Gemini Model
            </label>
            <select
              value={s.geminiModel}
              onChange={(e) => save({ geminiModel: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #E8E8E4", borderRadius: 7, fontSize: 13, background: "#FAFAF8" }}
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6B6B6B", display: "block", marginBottom: 4 }}>
              Anthropic Model
            </label>
            <select
              value={s.anthropicModel}
              onChange={(e) => save({ anthropicModel: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #E8E8E4", borderRadius: 7, fontSize: 13, background: "#FAFAF8" }}
            >
              {ANTHROPIC_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 8 }}>
          Opus = highest quality &nbsp;·&nbsp; Sonnet = balanced &nbsp;·&nbsp; Haiku = fastest / cheapest
        </div>
      </div>

      {/* ─── Fallback ─── */}
      <div style={cardBase}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
          Fallback Settings
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={s.fallbackEnabled}
            onChange={(e) => save({ fallbackEnabled: e.target.checked })}
            style={{ width: 14, height: 14 }}
          />
          <span style={{ fontSize: 13, color: "#1A1A1A" }}>Enable automatic fallback</span>
          <span style={{ fontSize: 11, color: "#9B9B9B" }}>(if primary fails, try the other)</span>
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#6B6B6B" }}>Fallback to:</span>
          <select
            value={s.fallbackProvider}
            onChange={(e) => save({ fallbackProvider: e.target.value })}
            disabled={!s.fallbackEnabled}
            style={{ padding: "5px 8px", border: "1px solid #E8E8E4", borderRadius: 6, fontSize: 12, background: "#FAFAF8" }}
          >
            <option value="gemini">Google Gemini</option>
            <option value="anthropic">Anthropic Claude</option>
          </select>
        </div>
        {s.fallbackEnabled && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#F5F7FF", borderRadius: 8, fontSize: 12, color: "#6B6B6B" }}>
            Flow: <strong>OpenRouter (paid model)</strong> → fails → <strong>OpenRouter (gemini-flash:free)</strong>
          </div>
        )}
      </div>

      {/* ─── Advanced ─── */}
      <div style={cardBase}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
          Advanced
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6B6B6B", display: "block", marginBottom: 4 }}>
              Max Tokens: <strong>{s.maxTokens}</strong>
            </label>
            <input
              type="range" min={512} max={4096} step={128}
              value={s.maxTokens}
              onChange={(e) => setData((prev) => prev ? { ...prev, settings: { ...prev.settings, maxTokens: Number(e.target.value) } } : prev)}
              onMouseUp={(e) => save({ maxTokens: Number((e.target as HTMLInputElement).value) })}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9B9B9B" }}>
              <span>512</span><span>4096</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6B6B6B", display: "block", marginBottom: 4 }}>
              Temperature: <strong>{s.temperature.toFixed(1)}</strong>
            </label>
            <input
              type="range" min={0} max={1} step={0.1}
              value={s.temperature}
              onChange={(e) => setData((prev) => prev ? { ...prev, settings: { ...prev.settings, temperature: Number(e.target.value) } } : prev)}
              onMouseUp={(e) => save({ temperature: Number((e.target as HTMLInputElement).value) })}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9B9B9B" }}>
              <span>0.0 (precise)</span><span>1.0 (creative)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Test Connection ─── */}
      <div style={cardBase}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
          Test Connection
        </div>
        <button
          onClick={testConnection}
          disabled={testing}
          style={{
            padding: "10px 20px",
            background: testing ? "#E8E8E4" : "#2563EB",
            color: testing ? "#9B9B9B" : "#fff",
            border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: testing ? "not-allowed" : "pointer",
          }}
        >
          {testing ? "Testing…" : "Test Active Provider"}
        </button>
        {testResult && (
          <div style={{
            marginTop: 12, padding: "12px 14px",
            background: testResult.success ? "#F0FDF4" : "#FFF1F2",
            border: `1px solid ${testResult.success ? "#BBF7D0" : "#FECDD3"}`,
            borderRadius: 8, fontSize: 12,
          }}>
            {testResult.success ? (
              <>
                ✅ <strong>Success</strong> &nbsp;·&nbsp;
                Provider: <strong>{testResult.provider}</strong> &nbsp;·&nbsp;
                Model: <strong>{testResult.model}</strong> &nbsp;·&nbsp;
                Time: <strong>{testResult.durationMs}ms</strong>
                {testResult.usedFallback && <span style={{ color: "#D97706" }}> &nbsp;·&nbsp; Used fallback</span>}
              </>
            ) : (
              <span style={{ color: "#DC2626" }}>❌ Error: {testResult.error}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
