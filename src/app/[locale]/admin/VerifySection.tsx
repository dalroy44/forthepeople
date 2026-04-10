/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useEffect } from "react";

const MODULES = ["leadership", "budget", "infrastructure", "demographics", "courts", "news"];

type VerificationResult = {
  module: string;
  district: string;
  issues: string[];
  suggestions: string[];
  confidence: number;
  status: "ok" | "warning" | "error";
};

const STATUS_COLORS = { ok: "#16A34A", warning: "#D97706", error: "#DC2626" };

export function VerifySection() {
  const [results, setResults] = useState<Record<string, VerificationResult>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [district, setDistrict] = useState("");
  const [districts, setDistricts] = useState<{ slug: string; name: string; state?: { slug: string; name: string } }[]>([]);

  useEffect(() => {
    fetch("/api/admin/districts")
      .then((r) => r.json())
      .then((json) => {
        if (json.districts?.length > 0) {
          setDistricts(json.districts);
          setDistrict((prev) => prev || json.districts[0].slug);
        }
      })
      .catch(() => {});
  }, []);

  async function verify(module: string) {
    setLoading(module);
    try {
      const res = await fetch("/api/admin/verify-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, district }),
      });
      const json = await res.json();
      setResults((prev) => ({ ...prev, [module]: json }));
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [module]: {
          module, district,
          issues: [String(e)],
          suggestions: [],
          confidence: 0,
          status: "error",
        },
      }));
    } finally {
      setLoading(null);
    }
  }

  async function verifyAll() {
    for (const mod of MODULES) {
      await verify(mod);
    }
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E8E4",
        borderRadius: 12,
        overflow: "hidden",
        marginTop: 24,
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid #F0F0EC",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
          🔍 Data Verification (Anthropic Opus)
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            style={{ padding: "5px 10px", border: "1px solid #E8E8E4", borderRadius: 6, fontSize: 12, background: "#FAFAF8" }}
          >
            {Object.entries(
              districts.reduce((acc, d) => {
                const stateName = d.state?.name ?? "Other";
                (acc[stateName] = acc[stateName] || []).push(d);
                return acc;
              }, {} as Record<string, typeof districts>)
            ).map(([stateName, stateDistricts]) => (
              <optgroup key={stateName} label={stateName}>
                {stateDistricts.map((d) => (
                  <option key={d.slug} value={d.slug}>{d.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            onClick={verifyAll}
            disabled={loading !== null}
            style={{
              padding: "6px 14px", background: loading ? "#E8E8E4" : "#7C3AED",
              color: loading ? "#9B9B9B" : "#fff",
              border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? `Verifying ${loading}…` : "Verify All"}
          </button>
        </div>
      </div>

      <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {MODULES.map((mod) => {
          const r = results[mod];
          const isLoading = loading === mod;
          return (
            <div
              key={mod}
              style={{
                border: "1px solid",
                borderColor: r ? STATUS_COLORS[r.status] + "40" : "#E8E8E4",
                borderRadius: 8,
                padding: 12,
                background: r ? STATUS_COLORS[r.status] + "08" : "#FAFAF8",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", textTransform: "capitalize" }}>
                  {mod}
                </span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {r && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                      background: STATUS_COLORS[r.status] + "20",
                      color: STATUS_COLORS[r.status],
                    }}>
                      {r.status.toUpperCase()} · {r.confidence}%
                    </span>
                  )}
                  <button
                    onClick={() => verify(mod)}
                    disabled={isLoading || loading !== null}
                    style={{
                      padding: "3px 10px", background: isLoading ? "#E8E8E4" : "#2563EB",
                      color: isLoading ? "#9B9B9B" : "#fff",
                      border: "none", borderRadius: 5, fontSize: 11, fontWeight: 600,
                      cursor: isLoading || loading !== null ? "not-allowed" : "pointer",
                    }}
                  >
                    {isLoading ? "…" : r ? "Re-check" : "Check"}
                  </button>
                </div>
              </div>
              {r && (
                <div>
                  {r.issues.length > 0 && (
                    <ul style={{ margin: "4px 0 0 0", padding: "0 0 0 14px", fontSize: 11, color: "#DC2626" }}>
                      {r.issues.slice(0, 3).map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                      {r.issues.length > 3 && <li style={{ color: "#9B9B9B" }}>+{r.issues.length - 3} more</li>}
                    </ul>
                  )}
                  {r.issues.length === 0 && (
                    <div style={{ fontSize: 11, color: "#16A34A", marginTop: 4 }}>No issues found</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
