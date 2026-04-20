/**
 * ForThePeople.in — Compact tenders snippet for the district overview.
 *
 * Mirrors LeadersSnippet / InfraSnippet structure exactly for visual
 * parity on the overview:
 *   <div marginBottom:24>                       ← section wrapper
 *     <div flex justify-between>                ← header row
 *       <icon + uppercase label>                ← left
 *       <View all → Link>                       ← right
 *     </div>
 *     <div bg:#FFF border padding>              ← inner card
 *       {status-specific body}
 *     </div>
 *   </div>
 *
 * Status badge moves into the card body. The whole card is click-through
 * to /tenders via an absolutely-positioned invisible <Link> so the rest
 * of the hierarchy stays identical to peer snippets.
 *
 * Status states (derived by /api/tenders/[district]/stats):
 *   LIVE      — green badge, counts, next deadline
 *   STALE     — yellow badge, counts, "refresh pending"
 *   LOCKED    — grey badge, "Coming soon" + Support CTA
 *   NO_DATA   — grey badge, short "just activated" placeholder
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Gavel, Lock, Clock } from "lucide-react";

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
  LIVE:    { label: "LIVE",    bg: "#DCFCE7", color: "#15803D" },
  STALE:   { label: "STALE",   bg: "#FEF3C7", color: "#B45309" },
  LOCKED:  { label: "LOCKED",  bg: "#F3F4F6", color: "#6B7280" },
  NO_DATA: { label: "NO DATA", bg: "#F3F4F6", color: "#6B7280" },
};

export default function TenderSnippet({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header row — matches LeadersSnippet / InfraSnippet exactly for
          visual parity across the overview. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Gavel size={14} style={{ color: "#0891B2" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Govt. Tenders
          </span>
        </div>
        <Link
          href={`${base}/tenders`}
          style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", fontWeight: 500 }}
        >
          View all →
        </Link>
      </div>

      {/* Inner card — identical shell to the other two snippets
          (bg:#FFF · border · borderRadius:14 · padding:14px 16px · small shadow). */}
      <div
        style={{
          background: "#FFF",
          border: "1px solid #E8E8E4",
          borderRadius: 14,
          padding: "14px 16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {/* Status badge lives at top-right of the card body */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
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
            aria-label={`Tenders data status: ${badge.label}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Body varies by status */}
        {status === "LOCKED" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Lock size={14} color="#9CA3AF" />
            <div style={{ flex: 1, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
              Coming soon for <strong>{data.districtName}</strong>.
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                <Link href="/support" style={{ color: "#2563EB", textDecoration: "none", fontWeight: 500 }}>
                  Support us to prioritise your district →
                </Link>
              </div>
            </div>
          </div>
        )}

        {status === "NO_DATA" && (
          <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
            Tender tracking just activated. First data sync in progress.
          </div>
        )}

        {(status === "LIVE" || status === "STALE") && (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", fontFamily: "var(--font-mono)" }}>
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
                  Next deadline: <strong style={{ color: "#1A1A1A" }}>{data.nextDeadline.title}</strong>
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
      </div>
    </div>
  );
}
