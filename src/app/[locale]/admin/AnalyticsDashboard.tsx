"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  topRequestedDistricts: Array<{ district: string; state: string; votes: number }>;
  topVotedFeatures: Array<{ title: string; votes: number; status: string }>;
  feedbackTrend: Array<{ week: string; count: number }>;
  revenueTrend: Array<{ week: string; amount: number }>;
  feedbackByType: Array<{ type: string; count: number }>;
  totals: {
    totalFeedback: number;
    feedbackThisWeek: number;
    totalContributions: number;
    contributionsThisWeek: number;
    totalRevenue: number;
    totalFeatureVotes: number;
    featureVotesThisWeek: number;
    totalDistrictRequests: number;
    districtRequestsThisWeek: number;
  };
}

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 10,
  padding: 16,
};

const STATUS_BADGE: Record<string, { emoji: string; bg: string; color: string }> = {
  proposed: { emoji: "🟡", bg: "#FEF3C7", color: "#D97706" },
  "in-progress": { emoji: "🔵", bg: "#DBEAFE", color: "#2563EB" },
  completed: { emoji: "🟢", bg: "#DCFCE7", color: "#16A34A" },
};

function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function trendArrow(prev: number, curr: number): string {
  if (curr > prev) return " ↑";
  if (curr < prev) return " ↓";
  return "";
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>
        Loading analytics...
      </div>
    );
  }

  if (!data) return null;

  const maxDistrictVotes = Math.max(...(data.topRequestedDistricts.map((d) => d.votes) || [1]), 1);
  const maxFeatureVotes = Math.max(...(data.topVotedFeatures.map((f) => f.votes) || [1]), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>Analytics</h2>

      {/* Section A: Top Requested Districts */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>
          Most Requested Districts
        </div>
        {data.topRequestedDistricts.length === 0 ? (
          <div style={{ fontSize: 12, color: "#9B9B9B" }}>No district requests yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.topRequestedDistricts.map((d) => (
              <div key={d.district + d.state} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 120, fontSize: 12, fontWeight: 500, color: "#1A1A1A", flexShrink: 0 }}>
                  {d.district}
                </div>
                <div style={{ flex: 1, height: 22, background: "#F3F4F6", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                  <div
                    style={{
                      width: `${(d.votes / maxDistrictVotes) * 100}%`,
                      height: "100%",
                      background: "rgba(37, 99, 235, 0.15)",
                      borderRadius: 4,
                      minWidth: 2,
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2563EB", minWidth: 40, textAlign: "right" }}>
                  {d.votes}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section B: Top Voted Features */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>
          Top Voted Features
        </div>
        {data.topVotedFeatures.length === 0 ? (
          <div style={{ fontSize: 12, color: "#9B9B9B" }}>No feature votes yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.topVotedFeatures.map((f) => {
              const badge = STATUS_BADGE[f.status] || STATUS_BADGE.proposed;
              return (
                <div key={f.title} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 180, fontSize: 12, fontWeight: 500, color: "#1A1A1A", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10 }}>{badge.emoji}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.title}</span>
                  </div>
                  <div style={{ flex: 1, height: 22, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${(f.votes / maxFeatureVotes) * 100}%`,
                        height: "100%",
                        background: "rgba(37, 99, 235, 0.15)",
                        borderRadius: 4,
                        minWidth: 2,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#2563EB", minWidth: 40, textAlign: "right" }}>
                    {f.votes}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section C: Trends */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Feedback Trend */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 10 }}>
            Feedback Trend (4 weeks)
          </div>
          {data.feedbackTrend.length === 0 ? (
            <div style={{ fontSize: 12, color: "#9B9B9B" }}>No data yet.</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 60 }}>
              {data.feedbackTrend.slice(-4).map((w, i, arr) => {
                const max = Math.max(...arr.map((x) => x.count), 1);
                const arrow = i > 0 ? trendArrow(arr[i - 1].count, w.count) : "";
                return (
                  <div key={w.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>
                      {w.count}{arrow}
                    </span>
                    <div style={{
                      width: "100%",
                      height: `${(w.count / max) * 40}px`,
                      background: "#2563EB",
                      borderRadius: 3,
                      minHeight: 4,
                    }} />
                    <span style={{ fontSize: 9, color: "#9B9B9B" }}>{w.week.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue Trend */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 10 }}>
            Revenue Trend (4 weeks)
          </div>
          {data.revenueTrend.length === 0 ? (
            <div style={{ fontSize: 12, color: "#9B9B9B" }}>No revenue data yet.</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 60 }}>
              {data.revenueTrend.slice(-4).map((w, i, arr) => {
                const max = Math.max(...arr.map((x) => x.amount), 1);
                const arrow = i > 0 ? trendArrow(arr[i - 1].amount, w.amount) : "";
                return (
                  <div key={w.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A1A" }}>
                      {formatINR(w.amount)}{arrow}
                    </span>
                    <div style={{
                      width: "100%",
                      height: `${(w.amount / max) * 40}px`,
                      background: "#16A34A",
                      borderRadius: 3,
                      minHeight: 4,
                    }} />
                    <span style={{ fontSize: 9, color: "#9B9B9B" }}>{w.week.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Section D: Engagement metrics (totals + 7d delta) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          {
            label: "Total Feedback",
            value: String(data.totals.totalFeedback),
            sub: `${data.totals.feedbackThisWeek} this week`,
            color: "#D97706",
          },
          {
            label: "Total Contributions",
            value: String(data.totals.totalContributions),
            sub: `${data.totals.contributionsThisWeek} this week`,
            color: "#2563EB",
          },
          {
            label: "Total Feature Votes",
            value: data.totals.totalFeatureVotes.toLocaleString("en-IN"),
            sub: `+${data.totals.featureVotesThisWeek} this week`,
            color: "#7C3AED",
          },
          {
            label: "District Requests",
            value: data.totals.totalDistrictRequests.toLocaleString("en-IN"),
            sub: `${data.totals.districtRequestsThisWeek} updated this week`,
            color: "#16A34A",
          },
        ].map((s) => (
          <div key={s.label} style={card}>
            <div
              style={{
                fontSize: 11,
                color: "#9B9B9B",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Feedback breakdown by type */}
      {data.feedbackByType && data.feedbackByType.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>
            Feedback by Type
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(() => {
              const max = Math.max(...data.feedbackByType.map((f) => f.count), 1);
              return data.feedbackByType
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((f) => (
                  <div key={f.type} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 120,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#1A1A1A",
                        flexShrink: 0,
                        textTransform: "capitalize",
                      }}
                    >
                      {f.type.replace(/_/g, " ")}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 20,
                        background: "#F3F4F6",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(f.count / max) * 100}%`,
                          height: "100%",
                          background: "rgba(217, 119, 6, 0.3)",
                          minWidth: 2,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#D97706",
                        minWidth: 40,
                        textAlign: "right",
                      }}
                    >
                      {f.count}
                    </span>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}

      {/* Section E: External Analytics Link */}
      <div style={card}>
        <div style={{ fontSize: 13, color: "#6B6B6B" }}>
          External analytics can be configured by setting NEXT_PUBLIC_PLAUSIBLE_DOMAIN in environment variables.
        </div>
      </div>
    </div>
  );
}
