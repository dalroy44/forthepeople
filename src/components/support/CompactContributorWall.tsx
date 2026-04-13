/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ContributorsResponse } from "@/app/api/payment/contributors/route";

export default function CompactContributorWall() {
  const { data, isLoading } = useQuery<ContributorsResponse>({
    queryKey: ["contributors"],
    queryFn: () => fetch("/api/payment/contributors").then((r) => r.json()),
    refetchInterval: 60_000,
    staleTime: 50_000,
  });

  const contributors = data?.contributors ?? [];

  // Don't render if no contributors
  if (!isLoading && contributors.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes compact-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .compact-track {
          animation: compact-scroll 20s linear infinite;
        }
        .compact-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div
        style={{
          background: "#FFFFFF",
          borderTop: "1px solid #E8E8E4",
          borderBottom: "1px solid #E8E8E4",
          padding: "14px 0",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, overflow: "hidden" }}>
            {/* Label */}
            <div style={{ flexShrink: 0 }}>
              {!isLoading && data && data.count > 0 ? (
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", whiteSpace: "nowrap" }}>
                  <span style={{ color: "#2563EB", fontWeight: 700 }}>{data.count}</span> citizens support ForThePeople.in
                </span>
              ) : (
                <span style={{ fontSize: 12, color: "#9B9B9B" }}>Loading…</span>
              )}
            </div>

            {/* Scrolling names */}
            <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
              {/* Fade mask left */}
              <div
                style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, width: 24,
                  background: "linear-gradient(to right, #FFFFFF, transparent)",
                  zIndex: 1, pointerEvents: "none",
                }}
              />
              {isLoading ? (
                <div style={{ height: 16, width: 200, background: "#E8E8E4", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
              ) : (
                <div
                  className={contributors.length >= 3 ? "compact-track" : undefined}
                  style={{ display: "flex", gap: 16, width: contributors.length >= 3 ? "max-content" : undefined, alignItems: "center" }}
                >
                  {(contributors.length >= 3 ? [...contributors, ...contributors] : contributors).map((c, i) => (
                    <span
                      key={i}
                      style={{ fontSize: 12, color: "#1A1A1A", whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      <span style={{ fontWeight: 600 }}>{c.displayName}</span>
                      <span style={{ color: "#16A34A", marginLeft: 4, fontWeight: 700 }}>
                        {c.tierLabel}
                      </span>
                      <span style={{ color: "#C0C0BA", marginLeft: 8 }}>•</span>
                    </span>
                  ))}
                </div>
              )}
              {/* Fade mask right */}
              <div
                style={{
                  position: "absolute", right: 0, top: 0, bottom: 0, width: 24,
                  background: "linear-gradient(to left, #FFFFFF, transparent)",
                  zIndex: 1, pointerEvents: "none",
                }}
              />
            </div>

            {/* CTA link */}
            <Link
              href="/support"
              style={{
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 600,
                color: "#2563EB",
                textDecoration: "none",
                whiteSpace: "nowrap",
                padding: "5px 10px",
                background: "#EFF6FF",
                borderRadius: 6,
              }}
            >
              Join them →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
