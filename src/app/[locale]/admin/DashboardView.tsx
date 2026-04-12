"use client";

/**
 * ForThePeople.in — Admin Dashboard content
 * Fetches everything via /api/admin/dashboard-summary (single combined call,
 * 30s Redis cache) so the dashboard never triggers a fan-out.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Server,
  Activity,
  Wallet,
  Bot,
  RefreshCw,
} from "lucide-react";
import PlatformReportCard from "@/components/admin/PlatformReportCard";

interface OpenRouterUsage {
  spent: number;
  limit: number | null;
  remaining: number | null;
  percentUsed: number;
  usdToInr: number;
  fetchedAt: string;
  source: "api" | "fallback";
  error?: string;
}

interface Summary {
  timestamp: string;
  unreadAlerts: number;
  pendingReviews: number;
  unreadFeedback: number;
  staleDistricts: Array<{ slug: string; name: string; modules: string[] }>;
  emailConfigured: boolean;
  revenue: {
    thisWeek: number;
    total: number;
    supporterCount: number;
    latest: { name: string; amount: number; tier: string; createdAt: string } | null;
  };
  ai: { totalCalls: number; totalTokens: number; totalCostINR: number };
  scrapers: { total: number; successful: number; failed: number; successPct: number };
  db: { status: "healthy" | "error"; responseMs: number; activeDistricts: number };
  redis: { status: "healthy" | "error"; responseMs: number };
  openRouter: OpenRouterUsage | null;
  recentActivity: Array<{
    ts: string;
    kind: "payment" | "feedback" | "error" | "system";
    icon: string;
    text: string;
  }>;
}

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 12,
  padding: 16,
};

type ActivityFilter = "all" | "payment" | "feedback" | "error" | "system";

export default function DashboardView({ locale }: { locale: string }) {
  const [data, setData] = useState<Summary | null>(null);
  const [openRouter, setOpenRouter] = useState<OpenRouterUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/dashboard-summary").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/openrouter-usage").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([summary, or]) => {
        if (summary) setData(summary);
        if (or) setOpenRouter(or);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const effectiveOR = openRouter ?? data?.openRouter ?? null;

  const filteredActivity = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.recentActivity;
    return data.recentActivity.filter((a) => a.kind === filter);
  }, [data, filter]);

  if (loading && !data) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#9B9B9B" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: 8, fontSize: 13 }}>Loading dashboard...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }
  if (!data) return null;

  const actionItems: Array<{ text: string; href: string; count: number }> = [];
  if (data.unreadAlerts > 0) {
    actionItems.push({
      text: `${data.unreadAlerts} unread alert${data.unreadAlerts === 1 ? "" : "s"}`,
      href: `/${locale}/admin?tab=alerts`,
      count: data.unreadAlerts,
    });
  }
  if (data.pendingReviews > 0) {
    actionItems.push({
      text: `${data.pendingReviews} AI insight${data.pendingReviews === 1 ? "" : "s"} pending review`,
      href: `/${locale}/admin/review`,
      count: data.pendingReviews,
    });
  }
  if (data.unreadFeedback > 0) {
    actionItems.push({
      text: `${data.unreadFeedback} unread feedback`,
      href: `/${locale}/admin/feedback`,
      count: data.unreadFeedback,
    });
  }
  if (data.staleDistricts.length > 0) {
    actionItems.push({
      text: `${data.staleDistricts.length} district${data.staleDistricts.length === 1 ? " has" : "s have"} stale data (>24h)`,
      href: `/${locale}/admin?tab=system-health`,
      count: data.staleDistricts.length,
    });
  }
  if (!data.emailConfigured) {
    actionItems.push({
      text: "Email alerts not configured",
      href: `/${locale}/admin?tab=alerts`,
      count: 1,
    });
  }

  const scraperPct = Math.round(data.scrapers.successPct);
  const scraperStatus =
    data.scrapers.total === 0 ? "idle" : scraperPct >= 90 ? "healthy" : scraperPct >= 70 ? "degraded" : "down";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
            Admin Dashboard
          </h1>
          <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
            ForThePeople.in —{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
        <button
          onClick={load}
          style={{
            background: "none",
            border: "1px solid #E8E8E4",
            borderRadius: 6,
            padding: "6px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "#6B6B6B",
          }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Section A: Action Required Banner */}
      {actionItems.length > 0 ? (
        <div
          style={{
            background: "#FEF3C7",
            border: "1px solid #FDE68A",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} color="#D97706" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>
              Action Required
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {actionItems.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                  color: "#92400E",
                  textDecoration: "none",
                  padding: "4px 0",
                }}
              >
                <span>• {item.text}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#92400E" }}>
                  {item.text.startsWith("Email") ? "Fix →" : "View →"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#DCFCE7",
            border: "1px solid #BBF7D0",
            borderRadius: 12,
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} color="#16A34A" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>
            All caught up — no pending actions.
          </span>
        </div>
      )}

      {/* Section B: Platform Health (3 cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <Link
          href={`/${locale}/admin?tab=system-health`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div style={card}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Database size={16} color="#6B6B6B" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Database
              </span>
            </div>
            <StatusDot status={data.db.status === "healthy" ? "healthy" : "down"} />
            <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 6 }}>
              {data.db.responseMs}ms · {data.db.activeDistricts} districts
            </div>
          </div>
        </Link>

        <Link
          href={`/${locale}/admin?tab=system-health`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div style={card}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Server size={16} color="#6B6B6B" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Redis
              </span>
            </div>
            <StatusDot status={data.redis.status === "healthy" ? "healthy" : "down"} />
            <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 6 }}>
              {data.redis.responseMs}ms response
            </div>
          </div>
        </Link>

        <Link
          href={`/${locale}/admin?tab=system-health`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div style={card}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Activity size={16} color="#6B6B6B" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Scrapers
              </span>
            </div>
            <StatusDot
              status={scraperStatus}
              label={
                data.scrapers.total === 0
                  ? "No activity"
                  : `${scraperPct}% OK`
              }
            />
            <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 6 }}>
              {data.scrapers.successful}✓ {data.scrapers.failed}✗ (24h)
            </div>
          </div>
        </Link>
      </div>

      {/* Section C: Revenue + AI Provider */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Link
          href={`/${locale}/admin/supporters`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div style={card}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Wallet size={16} color="#16A34A" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Revenue
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.6 }}>
              <div>
                This week:{" "}
                <strong>₹{data.revenue.thisWeek.toLocaleString("en-IN")}</strong>
              </div>
              <div>
                Total:{" "}
                <strong>₹{data.revenue.total.toLocaleString("en-IN")}</strong>
              </div>
              <div>
                {data.revenue.supporterCount} supporter
                {data.revenue.supporterCount === 1 ? "" : "s"}
              </div>
              {data.revenue.latest && (
                <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>
                  Latest: {data.revenue.latest.name} ₹
                  {data.revenue.latest.amount.toLocaleString("en-IN")}
                </div>
              )}
            </div>
          </div>
        </Link>

        <Link
          href={`/${locale}/admin/ai-settings`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div style={card}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Bot size={16} color="#7C3AED" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                AI Provider
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.6 }}>
              <div>
                <strong>OpenRouter Active</strong>
              </div>
              <div>{data.ai.totalCalls.toLocaleString("en-IN")} total calls</div>
            </div>
            <OpenRouterBar data={effectiveOR} />
          </div>
        </Link>
      </div>

      {/* AI Platform Analysis */}
      <PlatformReportCard />

      {/* Section D: Recent Activity */}
      <div
        style={{
          ...card,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #F0F0EC",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
            Recent Activity
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "payment", "feedback", "error", "system"] as ActivityFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  border: filter === f ? "1px solid #2563EB" : "1px solid #E8E8E4",
                  background: filter === f ? "#EFF6FF" : "#fff",
                  color: filter === f ? "#2563EB" : "#6B6B6B",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {f === "payment" ? "Payments" : f === "error" ? "Errors" : f}
              </button>
            ))}
          </div>
        </div>
        {filteredActivity.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: "#9B9B9B", textAlign: "center" }}>
            No activity to show.
          </div>
        ) : (
          <div>
            {filteredActivity.map((item, i) => {
              const href =
                item.kind === "payment"
                  ? `/${locale}/admin/supporters`
                  : item.kind === "feedback"
                  ? `/${locale}/admin/feedback`
                  : item.kind === "error"
                  ? `/${locale}/admin?tab=alerts`
                  : `/${locale}/admin?tab=system-health`;
              return (
                <Link
                  key={i}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 20px",
                    borderBottom:
                      i < filteredActivity.length - 1 ? "1px solid #F5F5F0" : "none",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                    {item.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.4 }}>
                      {item.text}
                    </div>
                    <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>
                      {formatDistanceToNow(new Date(item.ts), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ status, label }: { status: "healthy" | "degraded" | "down" | "idle"; label?: string }) {
  const color =
    status === "healthy"
      ? "#16A34A"
      : status === "degraded"
      ? "#D97706"
      : status === "idle"
      ? "#9B9B9B"
      : "#DC2626";
  const text =
    label ??
    (status === "healthy"
      ? "Healthy"
      : status === "degraded"
      ? "Degraded"
      : status === "idle"
      ? "Idle"
      : "Down");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 15, fontWeight: 700, color }}>{text}</span>
    </div>
  );
}

function OpenRouterBar({ data }: { data: OpenRouterUsage | null }) {
  if (!data) {
    return (
      <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 8 }}>
        Credit data unavailable
      </div>
    );
  }
  const pct = Math.min(100, data.percentUsed);
  const color = pct >= 80 ? "#DC2626" : pct >= 50 ? "#D97706" : "#16A34A";
  const limitLabel =
    data.limit == null
      ? "Unlimited"
      : `$${data.spent.toFixed(2)} / $${data.limit.toFixed(2)}`;
  const inrSpent = Math.round(data.spent * data.usdToInr);
  const inrLimit = data.limit == null ? null : Math.round(data.limit * data.usdToInr);

  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#6B6B6B",
          marginBottom: 4,
        }}
      >
        <span>{limitLabel}</span>
        <span>
          {data.limit != null && `${pct.toFixed(0)}%`}
        </span>
      </div>
      {data.limit != null && (
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: "#F0F0EC",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: color,
              transition: "width 300ms",
            }}
          />
        </div>
      )}
      <div style={{ fontSize: 10, color: "#9B9B9B", marginTop: 4 }}>
        ~₹{inrSpent.toLocaleString("en-IN")}
        {inrLimit != null && ` / ₹${inrLimit.toLocaleString("en-IN")}`}
        {data.source === "fallback" && " · ⚠️ estimated"}
      </div>
      {data.limit != null && pct >= 70 && (
        <div
          style={{
            marginTop: 6,
            fontSize: 10,
            color: "#DC2626",
            fontWeight: 600,
          }}
        >
          ⚠️ OpenRouter credits running low
        </div>
      )}
    </div>
  );
}
