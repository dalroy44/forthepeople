/**
 * ForThePeople.in — Compact infrastructure snippet for the district overview.
 *
 * Shows: counts (total/active/completed/delayed), top 3 in-progress
 * projects with mini progress bars, and total tracked budget. Links
 * to the full /infrastructure page. Renders nothing if the district
 * has zero projects so empty districts don't show a hollow shell.
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  HardHat, Route, Train, TramFront, Landmark, Droplets, Waves, Building2,
  Zap, Heart, GraduationCap, Trophy, Plane, Anchor, TreePine, TrafficCone,
  Leaf, Factory,
} from "lucide-react";
import type { ComponentType } from "react";
import type { InfraProject } from "@/hooks/useRealtimeData";

type LucideCmp = ComponentType<{ size?: number | string; style?: React.CSSProperties; className?: string }>;

// Same icon mapping as the full infrastructure page (kept in sync)
const CATEGORY_ICON: Record<string, LucideCmp> = {
  Roads: Route, Metro: Train, Rail: TramFront, Bridge: Landmark, Flyover: Landmark,
  Water: Droplets, Sewage: Waves, Housing: Building2, Power: Zap, Hospital: Heart,
  Education: GraduationCap, "Sports & Stadium": Trophy, Airport: Plane, Port: Anchor,
  "Parks & Lakes": TreePine, Traffic: TrafficCone, Environment: Leaf, Industry: Factory,
  Telecom: Factory, Other: HardHat,
};

function normalizeCategory(raw: string | null | undefined): string {
  if (!raw) return "Other";
  const s = raw.trim().toLowerCase();
  if (/\b(road|highway|nh|pmgsy)\b/.test(s)) return "Roads";
  if (/\bmetro\b/.test(s) && !/rail/.test(s)) return "Metro";
  if (/\b(rail|railway|train)\b/.test(s)) return "Rail";
  if (/\b(bridge|overbridge|rob|fob)\b/.test(s)) return "Bridge";
  if (/\bflyover\b/.test(s)) return "Flyover";
  if (/\b(sewage|sewer|drainage)\b/.test(s)) return "Sewage";
  if (/\b(water|jjm|tap)\b/.test(s)) return "Water";
  if (/\b(housing|pmay)\b/.test(s)) return "Housing";
  if (/\b(power|electricity|grid)\b/.test(s)) return "Power";
  if (/\bairport\b/.test(s)) return "Airport";
  if (/\b(port|harbour|harbor)\b/.test(s)) return "Port";
  if (/\b(hospital|health)\b/.test(s)) return "Hospital";
  if (/\b(school|college|education)\b/.test(s)) return "Education";
  if (/\b(stadium|sports)\b/.test(s)) return "Sports & Stadium";
  return "Other";
}

function normalizeStatus(s: string | null | undefined): string {
  if (!s) return "PROPOSED";
  return s.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

const STATUS_LABEL: Record<string, string> = {
  PROPOSED: "Proposed", APPROVED: "Approved", TENDER_ISSUED: "Tender Issued",
  UNDER_CONSTRUCTION: "Under Construction", IN_PROGRESS: "Under Construction",
  ONGOING: "Under Construction", ON_TRACK: "On Track",
  DELAYED: "Delayed", STALLED: "Stalled", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

function isCompleted(p: InfraProject) { return ["COMPLETED", "INAUGURATED"].includes(normalizeStatus(p.status)); }
function isCancelled(p: InfraProject) { return normalizeStatus(p.status) === "CANCELLED"; }
function isDelayed(p: InfraProject) {
  const s = normalizeStatus(p.status);
  return s === "DELAYED" || s === "STALLED" || (p.delayMonths ?? 0) > 0;
}

function formatINR(rupees: number | null | undefined): string {
  if (rupees == null || rupees <= 0) return "—";
  if (rupees >= 1_00_00_00_00_000) return `₹${(rupees / 1_00_00_00_00_000).toFixed(2)} Lakh Cr`;
  if (rupees >= 10_00_00_000) return `₹${(rupees / 10_00_00_000).toFixed(0)} Cr`;
  if (rupees >= 1_00_000) return `₹${(rupees / 1_00_000).toFixed(0)} Lakh`;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

interface ApiResponse { data: InfraProject[]; meta?: unknown }

export default function InfraSnippet({
  district, state, base,
}: {
  district: string; state: string; base: string;
}) {
  const { data } = useQuery<ApiResponse>({
    queryKey: ["district", district, "infrastructure", "snippet"],
    queryFn: () => fetch(`/api/data/infrastructure?district=${district}&state=${state}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const projects = data?.data ?? [];
  if (projects.length === 0) return null; // no shell when no data

  const counts = {
    total: projects.length,
    active: projects.filter((p) => !isCancelled(p) && !isCompleted(p)).length,
    completed: projects.filter(isCompleted).length,
    delayed: projects.filter(isDelayed).length,
  };
  const totalBudget = projects.reduce(
    (s, p) => s + (p.revisedBudget ?? p.originalBudget ?? p.budget ?? 0),
    0
  );

  // Pick top 3 to feature: prefer in-progress ordered by progress desc;
  // fall back to completed if no in-progress; final fallback: any.
  const inProgress = projects
    .filter((p) => !isCompleted(p) && !isCancelled(p))
    .sort((a, b) => (b.progressPct ?? 0) - (a.progressPct ?? 0));
  const completed = projects.filter(isCompleted);
  const top: InfraProject[] = (inProgress.length > 0 ? inProgress : completed).slice(0, 3);
  if (top.length < 3) top.push(...projects.filter((p) => !top.includes(p)).slice(0, 3 - top.length));

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HardHat size={14} style={{ color: "#D97706" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Infrastructure At a Glance
          </span>
        </div>
        <Link
          href={`${base}/infrastructure`}
          style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", fontWeight: 500 }}
        >
          View all →
        </Link>
      </div>

      <div
        style={{
          background: "#FFF",
          border: "1px solid #E8E8E4",
          borderRadius: 14,
          padding: "14px 16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {/* Top counts row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, color: "#1A1A1A", marginBottom: 12 }}>
          <span><strong style={{ fontFamily: "var(--font-mono)" }}>{counts.total}</strong> Projects</span>
          <span style={{ color: "#D97706" }}>· <strong style={{ fontFamily: "var(--font-mono)" }}>{counts.active}</strong> Active</span>
          <span style={{ color: "#16A34A" }}>· <strong style={{ fontFamily: "var(--font-mono)" }}>{counts.completed}</strong> Completed</span>
          <span style={{ color: counts.delayed > 0 ? "#DC2626" : "#9B9B9B" }}>
            · <strong style={{ fontFamily: "var(--font-mono)" }}>{counts.delayed}</strong> Delayed
          </span>
        </div>

        {/* Top 3 projects */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {top.map((p) => {
            const Icon = CATEGORY_ICON[normalizeCategory(p.category)] ?? HardHat;
            const status = normalizeStatus(p.status);
            const statusLabel = STATUS_LABEL[status] ?? status;
            const completedRow = isCompleted(p);
            const progress = p.progressPct ?? (completedRow ? 100 : 0);

            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon size={14} style={{ color: "#2563EB", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#1A1A1A", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: 10, color: "#9B9B9B", flexShrink: 0 }}>
                      {completedRow ? "✅ Completed" : `${progress}% · ${statusLabel}`}
                    </span>
                  </div>
                  {!completedRow && (
                    <div style={{ height: 4, background: "#F0F0EC", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
                      <div
                        style={{
                          width: `${Math.min(100, progress)}%`,
                          height: "100%",
                          background: progress >= 75 ? "#16A34A" : progress >= 40 ? "#D97706" : "#2563EB",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {totalBudget > 0 && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#6B6B6B" }}>
            Total budget tracked: <strong style={{ color: "#1A1A1A", fontFamily: "var(--font-mono)" }}>{formatINR(totalBudget)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
