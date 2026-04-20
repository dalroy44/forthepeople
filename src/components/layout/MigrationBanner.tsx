/**
 * ForThePeople.in — Migration notice (temporary splash modal).
 *
 * Shown once per browser on first page load during the Neon + Upstash
 * ownership migration window. User must click "I understand" to enter
 * the site. Acknowledgement is remembered via localStorage so returning
 * visitors aren't blocked.
 *
 * Auto-retires at AUTO_HIDE_AFTER_ISO — no code change needed to stop
 * showing it once the migration window closes.
 */

"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ftp_migration_notice_v1";
// Auto-hide at start of 26 April 2026 IST — the moment "normal service
// resumes" per the copy below.
const AUTO_HIDE_AFTER_ISO = "2026-04-25T18:30:00Z"; // 2026-04-26 00:00 IST
const NORMAL_SERVICE_RESUMES = "26 April 2026";
const MIGRATION_WINDOW_END = "25 April 2026";

export default function MigrationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Date.now() >= new Date(AUTO_HIDE_AFTER_ISO).getTime()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
  }, []);

  // Body scroll lock while the modal is open
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  function acknowledge() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="migration-notice-title"
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
          border: "1px solid #FECACA",
        }}
      >
        {/* Red header strip */}
        <div style={{ background: "#991B1B", color: "#FEF2F2", padding: "14px 22px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }} aria-hidden>🚧</span>
          <strong id="migration-notice-title" style={{ fontSize: 15, letterSpacing: "0.02em" }}>
            Temporary service notice — infrastructure migration
          </strong>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px 8px", fontSize: 14, color: "#0F172A", lineHeight: 1.65 }}>
          <p style={{ margin: "0 0 12px" }}>
            We&apos;re moving ForThePeople.in&apos;s database and cache to a new hosting
            setup between now and <strong>{MIGRATION_WINDOW_END}</strong>. During this
            window you may notice:
          </p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 20, color: "#334155" }}>
            <li>Some dashboards showing outdated or incomplete numbers</li>
            <li>Brief errors or blank sections on a few pages</li>
            <li>Slightly slower load times while caches rebuild</li>
          </ul>
          <p style={{ margin: "0 0 12px" }}>
            None of this affects your data or any payment or contribution you&apos;ve made.
            It&apos;s purely behind-the-scenes infrastructure work — the kind we&apos;d rather tell
            you about than pretend isn&apos;t happening.
          </p>
          <div style={{ padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, color: "#166534", fontSize: 13, margin: "0 0 4px" }}>
            ✅ Normal service resumes from <strong>{NORMAL_SERVICE_RESUMES}</strong>.
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 12, color: "#64748B" }}>
            If something looks seriously wrong, please report it at the feedback link in the footer — it helps us prioritise the post-migration cleanup.
          </p>
        </div>

        {/* Footer / action */}
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
            I understand — continue to site
          </button>
        </div>
      </div>
    </div>
  );
}
