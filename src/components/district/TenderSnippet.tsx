/**
 * ForThePeople.in — Compact tenders snippet for the district overview.
 *
 * Matches the shape of LeadersSnippet / InfraSnippet:
 *   • Client component
 *   • useQuery with 5-minute staleTime
 *   • Renders null when the full dashboard would have nothing useful
 *     AND the district isn't in the 'we should nudge people' state.
 *
 * Status states (derived by /api/tenders/[district]/stats):
 *   LIVE      — activated + recent scraper run → show counts + next deadline
 *   STALE     — activated + no run in last 24h → show counts but yellow badge
 *   LOCKED    — tendersActive=false → show "coming soon" + Support CTA
 *   NO_DATA   — activated but no tender rows yet → short "just activated" state
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Gavel, Lock, Clock, ArrowRight } from "lucide-react";

type Status = "LIVE" | "STALE" | "LOCKED" | "NO_DATA";

interface StatsResponse {
  districtName: string;
  tendersActive: boolean;
  snippetStatus: Status;
  lastCheckedAt: string | null;
  nextDeadline: { id: string; title: string; bidSubmissionEnd: string; daysLeft: number } | null;
  closing48hCount: number;
  closing7dCount: number;
  live: { count: number };
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const STATUS_BADGE: Record<Status, { label: string; bg: string; color: string }> = {
  LIVE:    { label: "LIVE",   bg: "#DCFCE7", color: "#15803D" },
  STALE:   { label: "STALE",  bg: "#FEF3C7", color: "#B45309" },
  LOCKED:  { label: "LOCKED", bg: "#F3F4F6", color: "#6B7280" },
  NO_DATA: { label: "NO DATA", bg: "#F3F4F6", color: "#6B7280" },
};

export default function TenderSnippet({
  locale, state, district, base,
}: {
  locale: string; state: string; district: string; base: string;
}) {
  const { data } = useQuery<StatsResponse>({
    queryKey: ["district", district, "tenders", "snippet"],
    queryFn: () => fetch(`/api/tenders/${district}/stats`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  if (!data) return null;
  const status = data.snippetStatus;
  const badge = STATUS_BADGE[status];

  // Card styling shared across all statuses — mirrors the existing
  // Leaders/Infra snippet card shell so the overview stays visually consistent.
  const href = `${base}/tenders`;

  return (
    <Link
      href={href}
      aria-label={`Govt. Tenders for ${data.districtName}`}
      style={{
        display: "block",
        background: "#FFFFFF",
        border: "1px solid #E8E8E4",
        borderRadius: 12,
        padding: 16,
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 120ms, box-shadow 120ms",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Gavel size={16} color="#0F172A" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Govt. Tenders</span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.05em",
            padding: "2px 8px",
            borderRadius: 999,
            background: badge.bg,
            color: badge.color,
          }}
        >
          {badge.label}
        </span>
      </div>

      {/* Body — varies by status */}
      {status === "LOCKED" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
          <Lock size={14} color="#9CA3AF" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
              Coming soon for <strong>{data.districtName}</strong>.
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
              Support us to prioritise your district →
            </div>
          </div>
          <ArrowRight size={14} color="#9CA3AF" />
        </div>
      )}

      {status === "NO_DATA" && (
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
          Tender tracking just activated. First data sync in progress.
        </div>
      )}

      {(status === "LIVE" || status === "STALE") && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
              {data.live.count.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: 12, color: "#6B7280" }}>live tender{data.live.count === 1 ? "" : "s"}</span>
            {data.closing48hCount > 0 && (
              <span style={{ fontSize: 11, color: "#B91C1C", fontWeight: 600, marginLeft: 4 }}>
                · {data.closing48hCount} closing in 48h
              </span>
            )}
          </div>

          {data.nextDeadline && (
            <div
              style={{
                fontSize: 12,
                color: "#374151",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                background: "#F9FAFB",
                borderRadius: 6,
                marginBottom: 8,
              }}
            >
              <Clock size={11} color="#6B7280" />
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Next deadline: <strong style={{ color: "#0F172A" }}>{data.nextDeadline.title}</strong>
              </span>
              <span style={{ color: data.nextDeadline.daysLeft <= 2 ? "#B91C1C" : "#6B7280", fontWeight: 600, flexShrink: 0 }}>
                {data.nextDeadline.daysLeft === 0 ? "today" : `${data.nextDeadline.daysLeft}d`}
              </span>
            </div>
          )}

          <div style={{ fontSize: 11, color: "#9CA3AF" }}>
            Updated {timeAgo(data.lastCheckedAt)}{status === "STALE" ? " · refresh pending" : ""}
          </div>
        </>
      )}
    </Link>
  );
}
