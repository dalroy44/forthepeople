"use client";

/**
 * ForThePeople.in — Traffic tab (Plausible Stats API)
 * Real-time visitors, aggregates, top pages, referrers, devices, countries.
 * Shows setup instructions when PLAUSIBLE_API_KEY is not set.
 */

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import ModuleHelp from "@/components/admin/ModuleHelp";

interface BreakdownRow {
  [k: string]: string | number | undefined;
  visitors: number;
}
interface Breakdown {
  results: BreakdownRow[];
}

interface TrafficData {
  configured: boolean;
  siteId?: string;
  error?: string;
  period?: "7d" | "30d" | "90d" | "day" | "month" | "year";
  realtimeVisitors?: number;
  aggregate?: {
    visitors?: { value: number };
    pageviews?: { value: number };
    bounce_rate?: { value: number };
    visit_duration?: { value: number };
  };
  topPages?: Breakdown;
  topReferrers?: Breakdown;
  deviceBreakdown?: Breakdown;
  countryBreakdown?: Breakdown;
}

const TRAFFIC_HELP =
  "Traffic data from Plausible Analytics (cookieless, DPDP-compliant). Real-time visitors, top pages, referral sources, devices, and countries. Data is cached for 3 minutes. Click 'View Full Analytics' for the complete Plausible dashboard.";

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 10,
  padding: 16,
};

type Period = "7d" | "30d" | "90d";

function humanizePage(path: string): string {
  // /en/karnataka/mandya → "Karnataka / Mandya"
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  if (parts.length === 1) return path;
  return parts
    .slice(1)
    .map((p) =>
      p
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    )
    .join(" / ");
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export default function TrafficTab() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  const load = useCallback(
    (p: Period = period) => {
      setLoading(true);
      fetch(`/api/admin/traffic?period=${p}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: TrafficData | null) => d && setData(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [period]
  );

  useEffect(() => {
    load(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const notConfigured = data && !data.configured;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>
            Traffic
          </h2>
          <ModuleHelp text={TRAFFIC_HELP} size={14} />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: period === p ? "1px solid #2563EB" : "1px solid #E8E8E4",
                background: period === p ? "#EFF6FF" : "#fff",
                color: period === p ? "#2563EB" : "#6B6B6B",
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => load(period)}
            style={{
              background: "none",
              border: "1px solid #E8E8E4",
              borderRadius: 6,
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "#6B6B6B",
            }}
          >
            <RefreshCw size={11} /> Refresh
          </button>
          {data?.configured && (
            <a
              href={`https://plausible.io/${data.siteId ?? ""}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "4px 10px",
                background: "#fff",
                color: "#2563EB",
                border: "1px solid #DBEAFE",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              View Full Analytics <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      {loading && !data ? (
        <div style={{ padding: 24, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>
          Loading traffic...
        </div>
      ) : notConfigured ? (
        <NotConfigured />
      ) : data ? (
        <>
          {/* Top metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <Metric
              label="Live Now"
              value={String(data.realtimeVisitors ?? 0)}
              sub="right now"
              color="#16A34A"
            />
            <Metric
              label="Visitors"
              value={(data.aggregate?.visitors?.value ?? 0).toLocaleString("en-IN")}
              sub={`last ${period}`}
              color="#2563EB"
            />
            <Metric
              label="Pageviews"
              value={(data.aggregate?.pageviews?.value ?? 0).toLocaleString("en-IN")}
              sub={`last ${period}`}
              color="#7C3AED"
            />
            <Metric
              label="Bounce Rate"
              value={`${Math.round(data.aggregate?.bounce_rate?.value ?? 0)}%`}
              sub={
                data.aggregate?.visit_duration
                  ? `avg visit ${formatDuration(data.aggregate.visit_duration.value)}`
                  : `last ${period}`
              }
              color="#D97706"
            />
          </div>

          {/* Two-column layout */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <BreakdownCard
              title="Top Pages"
              rows={data.topPages?.results ?? []}
              labelKey="page"
              labelFormat={(v) => humanizePage(String(v))}
            />
            <BreakdownCard
              title="Top Referrers"
              rows={data.topReferrers?.results ?? []}
              labelKey="source"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <BreakdownCard
              title="Devices"
              rows={data.deviceBreakdown?.results ?? []}
              labelKey="device"
            />
            <BreakdownCard
              title="Top Countries"
              rows={data.countryBreakdown?.results ?? []}
              labelKey="country"
            />
          </div>

          {data.error && (
            <div
              style={{
                ...card,
                background: "#FEF3C7",
                borderColor: "#FDE68A",
                color: "#92400E",
                fontSize: 12,
              }}
            >
              ⚠️ Plausible API warning: {data.error}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div style={card}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#9B9B9B",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color,
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
  labelKey,
  labelFormat,
}: {
  title: string;
  rows: BreakdownRow[];
  labelKey: string;
  labelFormat?: (v: string | number) => string;
}) {
  const max = Math.max(...rows.map((r) => r.visitors), 1);
  return (
    <div style={card}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 10 }}>
        {title}
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 12, color: "#9B9B9B" }}>No data.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((row, i) => {
            const raw = row[labelKey];
            const label = labelFormat && raw != null ? labelFormat(raw) : String(raw ?? "—");
            const w = max > 0 ? (row.visitors / max) * 100 : 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 160,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#1A1A1A",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={label}
                >
                  {label}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 18,
                    background: "#F3F4F6",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${w}%`,
                      height: "100%",
                      background: "rgba(37,99,235,0.2)",
                      minWidth: 2,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#2563EB",
                    minWidth: 48,
                    textAlign: "right",
                  }}
                >
                  {row.visitors.toLocaleString("en-IN")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotConfigured() {
  return (
    <div
      style={{
        ...card,
        background: "#FEF3C7",
        border: "1px solid #FDE68A",
        color: "#92400E",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
        Plausible Analytics is not configured
      </div>
      <ol style={{ paddingLeft: 18, fontSize: 12, lineHeight: 1.7, margin: 0 }}>
        <li>Sign up at plausible.io (free for &lt;10K pageviews/month)</li>
        <li>
          Add your site: <code>forthepeople.in</code>
        </li>
        <li>Generate an API key from Settings → API Keys</li>
        <li>
          Add <code>PLAUSIBLE_API_KEY</code> and <code>PLAUSIBLE_SITE_ID</code> to Vercel environment variables
        </li>
        <li>Redeploy</li>
      </ol>
      <div style={{ fontSize: 11, color: "#78350F", marginTop: 10 }}>
        The tracking script is already in <code>layout.tsx</code> — controlled by{" "}
        <code>NEXT_PUBLIC_PLAUSIBLE_DOMAIN</code>.
      </div>
    </div>
  );
}
