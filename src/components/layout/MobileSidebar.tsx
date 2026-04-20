/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";

const SIDEBAR_CATEGORIES = [
  {
    label: "LIVE DATA",
    slugs: ["overview", "crops", "weather", "water", "population", "police"],
  },
  {
    label: "GOVERNANCE",
    slugs: ["leadership", "finance", "infrastructure", "schemes", "services", "exams", "elections"],
  },
  {
    label: "COMMUNITY",
    slugs: ["transport", "jjm", "housing", "power", "schools"],
  },
  {
    label: "TRANSPARENCY",
    slugs: ["tenders", "rti", "file-rti", "gram-panchayat", "courts", "health"],
  },
  {
    label: "LOCAL INFO",
    slugs: ["alerts", "offices", "citizen-corner", "famous-personalities", "news"],
  },
  {
    label: "LOCAL ECONOMY",
    slugs: ["industries", "farm", "map", "data-sources", "update-log", "responsibility"],
  },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  locale: string;
  stateSlug?: string;
  districtSlug?: string;
}

export default function MobileSidebar({
  open, onClose, locale, stateSlug, districtSlug,
}: MobileSidebarProps) {
  const pathname = usePathname();

  if (!open) return null;

  const pathParts = pathname.split("/").filter(Boolean);
  const activeSlug = pathParts[3] ?? "overview";
  const base = stateSlug && districtSlug ? `/${locale}/${stateSlug}/${districtSlug}` : null;

  function moduleHref(slug: string) {
    if (!base) return `/${locale}`;
    return slug === "overview" ? base : `${base}/${slug}`;
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 200,
        }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          background: "#FFFFFF",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
          animation: "slideInLeft 200ms ease",
        }}
      >
        <style>{`
          @keyframes slideInLeft {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid #E8E8E4",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>
            🗣️ ForThePeople.in
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              border: "1px solid #E8E8E4",
              borderRadius: 6,
              background: "#FAFAF8",
              cursor: "pointer",
              color: "#6B6B6B",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Module list */}
        <div style={{ flex: 1, paddingBottom: 16 }}>
          {SIDEBAR_CATEGORIES.map((cat) => {
            const mods = cat.slugs
              .map((slug) => SIDEBAR_MODULES.find((m) => m.slug === slug))
              .filter(Boolean) as typeof SIDEBAR_MODULES;
            if (!mods.length) return null;

            return (
              <div key={cat.label}>
                {/* Category header */}
                <div style={{
                  padding: "12px 16px 4px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#9B9B9B",
                }}>
                  {cat.label}
                </div>

                {/* Module links */}
                {mods.map((mod) => {
                  const isActive = activeSlug === mod.slug || (mod.slug === "overview" && activeSlug === "overview");
                  return (
                    <Link
                      key={mod.slug}
                      href={moduleHref(mod.slug)}
                      onClick={onClose}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "11px 16px",
                        textDecoration: "none",
                        background: isActive ? "#EFF6FF" : "transparent",
                        borderLeft: isActive ? "3px solid #2563EB" : "3px solid transparent",
                        color: isActive ? "#2563EB" : "#1A1A1A",
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 400,
                        minHeight: 44,
                        transition: "background 120ms ease",
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{mod.emoji}</span>
                      <span>{mod.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}

          {/* Divider */}
          <div style={{ height: 1, background: "#E8E8E4", margin: "8px 0" }} />

          {/* Compare Districts */}
          {base && (
            <Link
              href={`/${locale}/compare?a=${districtSlug}`}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 16px",
                textDecoration: "none",
                color: "#6B6B6B",
                fontSize: 14,
                minHeight: 44,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>⚖️</span>
              <span>Compare Districts</span>
            </Link>
          )}

          {/* Support */}
          <Link
            href="/support"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 16px",
              textDecoration: "none",
              color: "#E11D48",
              fontSize: 14,
              fontWeight: 500,
              minHeight: 44,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>❤️</span>
            <span>Support This Project</span>
          </Link>

          {/* Vote on Features */}
          <Link
            href="/en/features"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 16px",
              textDecoration: "none",
              color: "#7C3AED",
              fontSize: 14,
              fontWeight: 500,
              minHeight: 44,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>🗳️</span>
            <span>Vote on Features</span>
          </Link>
        </div>
      </div>
    </>
  );
}
