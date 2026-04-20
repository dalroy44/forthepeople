/**
 * ForThePeople.in — Site-wide announcement (modal or banner).
 *
 * Reads the singleton SiteAnnouncement row from /api/site-announcement.
 * Admins edit it from /en/admin?tab=announcement. The admin toggle is
 * the SOLE source of truth — when the DB says `enabled: false`, no row
 * exists, or the API errors, this component renders nothing.
 *
 * Two display modes:
 *  • "modal"  — blocking splash on first load; user must click CTA to enter.
 *  • "banner" — thin dismissible strip at the top of every page.
 *
 * Acknowledgement per browser via localStorage[storageKey]. Changing the
 * storageKey in admin (e.g. bumping ..._v1 → ..._v2) forces every returning
 * visitor to see the announcement again — useful for multi-phase incidents.
 *
 * Filename is historical ("MigrationBanner"); behaviour is now generic
 * site-announcement. Export name preserved for stable import path.
 */

"use client";
import { useEffect, useState } from "react";

type Announcement = {
  enabled: boolean;
  variant: "critical" | "warning" | "info";
  displayMode: "modal" | "banner";
  title: string;
  bodyMd: string;
  bullets: string[];
  highlightText: string | null;
  footerNote: string | null;
  ctaButtonText: string;
  storageKey: string;
  autoHideAfter: string | null;
};

const VARIANT_STYLE: Record<string, { header: string; ring: string; badge: string }> = {
  critical: { header: "#991B1B", ring: "#FECACA", badge: "🚧" },
  warning:  { header: "#B45309", ring: "#FED7AA", badge: "⚠️" },
  info:     { header: "#1D4ED8", ring: "#BFDBFE", badge: "ℹ️" },
};

/**
 * Resolve the announcement to show from the public API. Returns null while
 * loading, or when the API says no announcement should render. The admin
 * toggle is the only path to a non-null value here — there is no fallback.
 */
function useResolvedAnnouncement(): Announcement | null {
  const [ann, setAnn] = useState<Announcement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/site-announcement", { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) return;
        const data = (await res.json()) as Partial<Announcement>;
        if (!data.enabled) return;
        if (data.autoHideAfter && new Date(data.autoHideAfter).getTime() <= Date.now()) return;
        setAnn(data as Announcement);
      } catch {
        // Network or DB error — fail closed (no banner) rather than show stale copy.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return ann;
}

export default function MigrationBanner() {
  const ann = useResolvedAnnouncement();
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!ann) return;
    if (localStorage.getItem(ann.storageKey)) setAcknowledged(true);
  }, [ann]);

  // Body scroll lock only while a modal is actively blocking
  useEffect(() => {
    if (!ann || ann.displayMode !== "modal" || acknowledged) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [ann, acknowledged]);

  if (!ann || acknowledged) return null;

  function acknowledge() {
    if (!ann) return;
    localStorage.setItem(ann.storageKey, new Date().toISOString());
    setAcknowledged(true);
  }

  const style = VARIANT_STYLE[ann.variant] ?? VARIANT_STYLE.critical;
  const paragraphs = ann.bodyMd.split(/\n\n+/).filter(Boolean);

  // ── Banner mode: thin dismissible strip ───────────────────────────────
  if (ann.displayMode === "banner") {
    return (
      <div
        role="alert"
        style={{
          background: style.header,
          borderBottom: `1px solid ${style.ring}`,
          color: "#FEF2F2",
          padding: "10px 16px",
          fontSize: 13,
          lineHeight: 1.55,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ flexShrink: 0, fontSize: 16 }} aria-hidden>{style.badge}</span>
        <span style={{ flex: 1 }}>
          <strong>{ann.title}.</strong>{" "}
          {paragraphs[0]}
          {ann.highlightText ? ` — ${ann.highlightText}` : ""}
        </span>
        <button
          onClick={acknowledge}
          aria-label="Dismiss notice"
          style={{
            flexShrink: 0,
            background: "transparent",
            border: "1px solid rgba(254, 242, 242, 0.4)",
            color: "#FEF2F2",
            borderRadius: 6,
            padding: "3px 10px",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Dismiss
        </button>
      </div>
    );
  }

  // ── Modal mode: centered splash ───────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-announcement-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(15, 23, 42, 0.78)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#FFFFFF",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
          border: `1px solid ${style.ring}`,
        }}
      >
        <div style={{ background: style.header, color: "#FEF2F2", padding: "14px 22px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }} aria-hidden>{style.badge}</span>
          <strong id="site-announcement-title" style={{ fontSize: 15, letterSpacing: "0.02em" }}>{ann.title}</strong>
        </div>

        <div style={{ padding: "20px 22px 8px", fontSize: 14, color: "#0F172A", lineHeight: 1.65 }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? "0 0 12px" : "12px 0" }}>{p}</p>
          ))}
          {ann.bullets.length > 0 && (
            <ul style={{ margin: "0 0 14px", paddingLeft: 20, color: "#334155" }}>
              {ann.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
          {ann.highlightText && (
            <div style={{ padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, color: "#166534", fontSize: 13, margin: "0 0 4px" }}>
              ✅ {ann.highlightText}
            </div>
          )}
          {ann.footerNote && (
            <p style={{ margin: "14px 0 0", fontSize: 12, color: "#64748B" }}>{ann.footerNote}</p>
          )}
        </div>

        <div style={{ padding: "14px 22px 18px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={acknowledge}
            style={{
              background: "#0F172A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            {ann.ctaButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
