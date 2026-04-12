"use client";

/**
 * Dashboard card showing the most recent AI platform report + "Generate New" flow.
 * Two-step generation: first click fetches cost estimate, second click confirms.
 */

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bot, RefreshCw, Sparkles } from "lucide-react";

interface ActionItem {
  priority: number;
  title: string;
  description: string;
}

interface CostTip {
  tip: string;
  estimatedSaving: string;
  priority: "high" | "medium" | "low";
}

interface Report {
  id: string;
  type: string;
  summary: string;
  actionItems: ActionItem[];
  costTips: CostTip[];
  growthNotes: string | null;
  aiModel: string;
  aiCostUSD: number;
  generatedAt: string;
}

interface Estimate {
  usd: number;
  inr: number;
}

interface ApiResponse {
  report: Report | null;
  estimate: Estimate;
}

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 12,
  padding: 16,
};

export default function PlatformReportCard() {
  const [report, setReport] = useState<Report | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirmPrompt, setConfirmPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/platform-report")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ApiResponse | null) => {
        if (d) {
          setReport(d.report);
          setEstimate(d.estimate);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/platform-report?confirm=true", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setReport(json.report);
      setConfirmPrompt(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={card}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bot size={16} color="#7C3AED" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
            AI Platform Analysis
          </span>
          {report && (
            <span style={{ fontSize: 11, color: "#9B9B9B" }}>
              · Last: {formatDistanceToNow(new Date(report.generatedAt), { addSuffix: true })}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {confirmPrompt ? (
            <>
              <button
                onClick={generate}
                disabled={generating}
                style={{
                  padding: "5px 12px",
                  background: "#16A34A",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: generating ? "wait" : "pointer",
                  opacity: generating ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {generating ? (
                  <RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Sparkles size={11} />
                )}
                {generating ? "Generating..." : `Confirm (~₹${estimate?.inr ?? 1})`}
              </button>
              <button
                onClick={() => setConfirmPrompt(false)}
                disabled={generating}
                style={{
                  padding: "5px 10px",
                  background: "#fff",
                  color: "#6B6B6B",
                  border: "1px solid #E8E8E4",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmPrompt(true)}
              style={{
                padding: "5px 12px",
                background: "#7C3AED",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Sparkles size={11} /> Generate New
            </button>
          )}
        </div>
      </div>

      {confirmPrompt && !generating && (
        <div
          style={{
            background: "#F0F0EC",
            padding: 10,
            borderRadius: 6,
            fontSize: 12,
            color: "#1A1A1A",
            marginBottom: 10,
          }}
        >
          This will use Gemini 2.5 Pro (~${estimate?.usd.toFixed(3) ?? "0.002"} / ~₹{estimate?.inr ?? 1} per report).
          Click <strong>Confirm</strong> to proceed.
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#FEE2E2",
            color: "#991B1B",
            padding: 10,
            borderRadius: 6,
            fontSize: 12,
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      {loading && !report ? (
        <div style={{ fontSize: 12, color: "#9B9B9B" }}>Loading latest report...</div>
      ) : !report ? (
        <div style={{ fontSize: 12, color: "#6B6B6B" }}>
          No analysis generated yet. Click <strong>Generate New</strong> to create your first report
          (~₹{estimate?.inr ?? 1}). Weekly cron runs Sundays 00:00 UTC once CRON_SECRET is set.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontSize: 13,
              color: "#1A1A1A",
              lineHeight: 1.55,
              background: "#FAFAF8",
              padding: 10,
              borderRadius: 6,
            }}
          >
            {report.summary}
          </div>

          {report.actionItems.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                }}
              >
                ⚡ Action Items
              </div>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.6 }}>
                {report.actionItems
                  .sort((a, b) => a.priority - b.priority)
                  .map((item, i) => (
                    <li key={i} style={{ marginBottom: 3 }}>
                      <strong style={{ color: "#1A1A1A" }}>{item.title}</strong>
                      {item.description && (
                        <span style={{ color: "#6B6B6B" }}> — {item.description}</span>
                      )}
                    </li>
                  ))}
              </ol>
            </div>
          )}

          {report.costTips.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                }}
              >
                💰 Cost Tips
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.6 }}>
                {report.costTips.map((t, i) => (
                  <li key={i} style={{ marginBottom: 3 }}>
                    {t.tip}
                    {t.estimatedSaving && (
                      <span style={{ color: "#16A34A", fontWeight: 600 }}> — {t.estimatedSaving}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.growthNotes && (
            <div
              style={{
                fontSize: 12,
                color: "#1E40AF",
                background: "#DBEAFE",
                padding: 10,
                borderRadius: 6,
              }}
            >
              <strong>📈 Growth:</strong> {report.growthNotes}
            </div>
          )}

          <div style={{ fontSize: 10, color: "#9B9B9B" }}>
            Generated by {report.aiModel} · cost ${report.aiCostUSD.toFixed(4)} · {report.type}
          </div>
        </div>
      )}
    </div>
  );
}
