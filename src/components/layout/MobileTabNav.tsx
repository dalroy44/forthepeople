/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { SIDEBAR_MODULES, getTieredModules, MOBILE_TAB_MODULES } from "@/lib/constants/sidebar-modules";

// 4 fixed bottom tabs (5th slot = "More" button). Defined once in
// sidebar-modules.ts; citizens use these most frequently.
const FIXED_TABS = MOBILE_TAB_MODULES;

// Drawer categories derived from the single source of truth — no
// hardcoded slug arrays in this component.
const DRAWER_CATEGORIES = getTieredModules().map((g) => ({
  label: g.label,
  slugs: g.modules.map((m) => m.slug),
}));

interface MobileTabNavProps {
  locale: string;
  stateSlug: string;
  districtSlug: string;
}

export default function MobileTabNav({ locale, stateSlug, districtSlug }: MobileTabNavProps) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const activeSlug = parts[3] ?? "overview";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const baseUrl = `/${locale}/${stateSlug}/${districtSlug}`;

  const tabs = FIXED_TABS.map((slug) => SIDEBAR_MODULES.find((m) => m.slug === slug)!).filter(Boolean);

  // Is any non-fixed-tab module active? Highlight "More" if so.
  const moreIsActive = !FIXED_TABS.includes(activeSlug as typeof FIXED_TABS[number]) && activeSlug !== "overview";

  return (
    <>
      {/* ── Bottom tab bar ──────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          bottom: 36,
          left: 0,
          right: 0,
          height: 60,
          background: "#FFFFFF",
          borderTop: "1px solid #E8E8E4",
          display: "flex",
          alignItems: "stretch",
          zIndex: 41,
        }}
        className="md:hidden"
      >
        {tabs.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeSlug === mod.slug;
          return (
            <Link
              key={mod.slug}
              href={mod.slug === "overview" ? baseUrl : `${baseUrl}/${mod.slug}`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                textDecoration: "none",
                color: isActive ? "#2563EB" : "#9B9B9B",
                minWidth: 0,
                minHeight: 44,
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap" }}>
                {mod.label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            border: "none",
            background: "transparent",
            color: moreIsActive ? "#2563EB" : "#9B9B9B",
            cursor: "pointer",
            minHeight: 44,
            padding: 0,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>⋯</span>
          <span style={{ fontSize: 10, fontWeight: moreIsActive ? 600 : 400 }}>More</span>
        </button>
      </nav>

      {/* ── Drawer overlay + sheet ───────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Background overlay — tap to close */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 50,
            }}
            className="md:hidden"
          />

          {/* Slide-up sheet */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: "82vh",
              background: "#FFFFFF",
              borderRadius: "20px 20px 0 0",
              zIndex: 51,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
            }}
            className="md:hidden"
          >
            {/* Sheet handle + header */}
            <div
              style={{
                position: "sticky",
                top: 0,
                background: "#FFFFFF",
                borderBottom: "1px solid #E8E8E4",
                padding: "12px 20px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                zIndex: 1,
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ width: 36, height: 4, background: "#E8E8E4", borderRadius: 99, margin: "0 auto 8px" }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>All Modules</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: "1px solid #E8E8E4", background: "#FAFAF8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} style={{ color: "#6B6B6B" }} />
              </button>
            </div>

            {/* Category groups */}
            <div style={{ padding: "8px 0 24px" }}>
              {DRAWER_CATEGORIES.map((cat) => {

                const mods = cat.slugs
                  .map((slug) => SIDEBAR_MODULES.find((m) => m.slug === slug))
                  .filter(Boolean) as typeof SIDEBAR_MODULES;

                return (
                  <div key={cat.label} style={{ marginBottom: 4 }}>
                    {/* Category label */}
                    <div
                      style={{
                        padding: "10px 20px 6px",
                        fontSize: 11, fontWeight: 600,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "#9B9B9B",
                      }}
                    >
                      {cat.label}
                    </div>

                    {/* Module rows — 44px tap targets */}
                    {mods.map((mod) => {
                      const Icon = mod.icon;
                      const isActive = activeSlug === mod.slug;
                      return (
                        <Link
                          key={mod.slug}
                          href={mod.slug === "overview" ? baseUrl : `${baseUrl}/${mod.slug}`}
                          onClick={() => setDrawerOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "0 20px",
                            minHeight: 52,
                            textDecoration: "none",
                            background: isActive ? "#EFF6FF" : "transparent",
                            borderLeft: isActive ? "3px solid #2563EB" : "3px solid transparent",
                          }}
                        >
                          {/* Icon circle */}
                          <div
                            style={{
                              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: isActive ? "rgba(37,99,235,0.12)" : "#F5F5F0",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            <Icon size={18} style={{ color: isActive ? "#2563EB" : "#6B6B6B" }} />
                          </div>

                          {/* Labels */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14, fontWeight: isActive ? 600 : 500,
                              color: isActive ? "#2563EB" : "#1A1A1A",
                            }}>
                              {mod.emoji} {mod.label}
                            </div>
                            <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {mod.description}
                            </div>
                          </div>

                          {isActive && (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB", flexShrink: 0 }} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}

              {/* Quick links — Vote on Features + Support */}
              <div style={{ borderTop: "1px solid #E8E8E4", margin: "8px 0 0", padding: "4px 0" }}>
                <Link
                  href="/en/features"
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "0 20px", minHeight: 52, textDecoration: "none",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "#F5F3FF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 18 }}>🗳️</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#7C3AED" }}>Vote on Features</div>
                    <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 1 }}>Help shape what we build next</div>
                  </div>
                </Link>
                <Link
                  href="/support"
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "0 20px", minHeight: 52, textDecoration: "none",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "#FFF1F2",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 18 }}>❤️</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#DC2626" }}>Support This Project</div>
                    <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 1 }}>Keep ForThePeople.in running</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
