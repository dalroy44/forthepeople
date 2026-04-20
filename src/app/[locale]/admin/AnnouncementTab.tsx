"use client";

/**
 * Admin: edit the site-wide announcement singleton.
 * Controls enabled/disabled, display mode (modal vs banner), copy, bullets,
 * optional highlight + footer, CTA text, storage key (change to force
 * re-acknowledgement), and auto-hide deadline.
 */

import { useEffect, useState } from "react";

type Announcement = {
  id: string;
  enabled: boolean;
  variant: "critical" | "warning" | "info";
  displayMode: "modal" | "banner";
  title: string;
  bodyMd: string;
  bulletsJson: string[];
  highlightText: string | null;
  footerNote: string | null;
  ctaButtonText: string;
  storageKey: string;
  autoHideAfter: string | null;
  updatedAt: string;
};

const MIGRATION_TEMPLATE = {
  enabled: true,
  variant: "critical" as const,
  displayMode: "modal" as const,
  title: "Temporary service notice — infrastructure migration",
  bodyMd: `We're moving ForThePeople.in's database and cache to a new hosting setup between now and 25 April 2026. During this window you may notice some pages behaving a little differently than usual.

None of this affects your data or any payment or contribution you've made. It's purely behind-the-scenes infrastructure work — the kind we'd rather tell you about than pretend isn't happening.`,
  bullets: [
    "Some dashboards showing outdated or incomplete numbers",
    "Brief errors or blank sections on a few pages",
    "Slightly slower load times while caches rebuild",
  ],
  highlightText: "Normal service resumes from 26 April 2026.",
  footerNote: "If something looks seriously wrong, please report it via the feedback link in the footer — it helps us prioritise the post-migration cleanup.",
  ctaButtonText: "I understand — continue to site",
  storageKey: "ftp_site_announcement_v1",
  autoHideAfter: "2026-04-25T18:30:00.000Z",
};

export default function AnnouncementTab() {
  const [data, setData] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/site-announcement", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      setData(j.announcement);
    } catch (err) {
      setFlash(`Load failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!data) return;
    setSaving(true); setFlash(null);
    try {
      const res = await fetch("/api/admin/site-announcement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: data.enabled,
          variant: data.variant,
          displayMode: data.displayMode,
          title: data.title,
          bodyMd: data.bodyMd,
          bullets: data.bulletsJson,
          highlightText: data.highlightText || null,
          footerNote: data.footerNote || null,
          ctaButtonText: data.ctaButtonText,
          storageKey: data.storageKey,
          autoHideAfter: data.autoHideAfter || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      setData(j.announcement);
      setFlash("✅ Saved. Public visitors will pick up the change on their next page load.");
    } catch (err) {
      setFlash(`❌ Save failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  function applyMigrationTemplate() {
    if (!data) return;
    setData({
      ...data,
      enabled: MIGRATION_TEMPLATE.enabled,
      variant: MIGRATION_TEMPLATE.variant,
      displayMode: MIGRATION_TEMPLATE.displayMode,
      title: MIGRATION_TEMPLATE.title,
      bodyMd: MIGRATION_TEMPLATE.bodyMd,
      bulletsJson: MIGRATION_TEMPLATE.bullets,
      highlightText: MIGRATION_TEMPLATE.highlightText,
      footerNote: MIGRATION_TEMPLATE.footerNote,
      ctaButtonText: MIGRATION_TEMPLATE.ctaButtonText,
      storageKey: MIGRATION_TEMPLATE.storageKey,
      autoHideAfter: MIGRATION_TEMPLATE.autoHideAfter,
    });
    setFlash("Template loaded — review and click Save to publish.");
  }

  function bumpStorageKey() {
    if (!data) return;
    const m = data.storageKey.match(/_v(\d+)$/);
    const next = m ? Number(m[1]) + 1 : 2;
    const newKey = data.storageKey.replace(/_v\d+$/, "") + `_v${next}`;
    setData({ ...data, storageKey: newKey });
    setFlash(`Storage key bumped to ${newKey}. Saving will force all previously-acknowledged visitors to see the notice again.`);
  }

  if (loading) return <div style={{ color: "#6B7280" }}>Loading announcement…</div>;
  if (!data) return <div style={{ color: "#B91C1C" }}>Could not load announcement.</div>;

  const dt = data.autoHideAfter ? new Date(data.autoHideAfter) : null;
  const autoHideLocal = dt ? new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>Site Announcement</h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>
        One sitewide notice, shown to every visitor on first page load. Toggle off to hide entirely.
        Changes publish instantly — no redeploy needed.
      </p>

      {flash && (
        <div style={{ padding: "10px 14px", marginBottom: 16, borderRadius: 8, background: flash.startsWith("❌") ? "#FEF2F2" : "#F0FDF4", border: "1px solid", borderColor: flash.startsWith("❌") ? "#FECACA" : "#BBF7D0", color: flash.startsWith("❌") ? "#991B1B" : "#166534", fontSize: 13 }}>
          {flash}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <button onClick={applyMigrationTemplate} style={btn("#EFF6FF", "#1D4ED8")}>Load migration template</button>
        <button onClick={bumpStorageKey} style={btn("#FFF9F0", "#B45309")}>Bump storage key (re-show to all)</button>
      </div>

      <Field label="Enabled" hint="Master switch. Off = nothing renders, component returns null.">
        <Toggle value={data.enabled} onChange={(v) => setData({ ...data, enabled: v })} />
      </Field>

      <Field label="Display mode" hint="'modal' = blocking splash on first load. 'banner' = thin dismissible strip at the top.">
        <select value={data.displayMode} onChange={(e) => setData({ ...data, displayMode: e.target.value as "modal" | "banner" })} style={select}>
          <option value="modal">Modal (blocking splash)</option>
          <option value="banner">Banner (top strip)</option>
        </select>
      </Field>

      <Field label="Variant" hint="Colour + icon scheme.">
        <select value={data.variant} onChange={(e) => setData({ ...data, variant: e.target.value as Announcement["variant"] })} style={select}>
          <option value="critical">Critical (red)</option>
          <option value="warning">Warning (amber)</option>
          <option value="info">Info (blue)</option>
        </select>
      </Field>

      <Field label="Title">
        <input value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} style={input} />
      </Field>

      <Field label="Body" hint="Plain text. Blank lines split into paragraphs.">
        <textarea value={data.bodyMd} onChange={(e) => setData({ ...data, bodyMd: e.target.value })} rows={7} style={textarea} />
      </Field>

      <Field label="Bullets" hint="One per line. Leave empty for no list.">
        <textarea
          value={data.bulletsJson.join("\n")}
          onChange={(e) => setData({ ...data, bulletsJson: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
          rows={4}
          style={textarea}
        />
      </Field>

      <Field label="Green highlight line (optional)" hint="Rendered as an inline green confirmation box. Use for a positive closing line, e.g. return date.">
        <input value={data.highlightText ?? ""} onChange={(e) => setData({ ...data, highlightText: e.target.value || null })} style={input} />
      </Field>

      <Field label="Footer note (optional)" hint="Smaller grey text below the body.">
        <input value={data.footerNote ?? ""} onChange={(e) => setData({ ...data, footerNote: e.target.value || null })} style={input} />
      </Field>

      <Field label="CTA button text (modal only)">
        <input value={data.ctaButtonText} onChange={(e) => setData({ ...data, ctaButtonText: e.target.value })} style={input} />
      </Field>

      <Field label="Auto-hide after (optional)" hint="Component returns null after this date regardless of the enabled flag. Local timezone.">
        <input
          type="datetime-local"
          value={autoHideLocal}
          onChange={(e) => setData({ ...data, autoHideAfter: e.target.value ? new Date(e.target.value).toISOString() : null })}
          style={input}
        />
      </Field>

      <Field label="Storage key" hint="Changing this forces all previously-acknowledged visitors to see the notice again.">
        <input value={data.storageKey} onChange={(e) => setData({ ...data, storageKey: e.target.value })} style={input} />
      </Field>

      <div style={{ marginTop: 22, display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={save} disabled={saving} style={{ background: "#0F172A", color: "#FFFFFF", padding: "10px 22px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        <span style={{ fontSize: 12, color: "#64748B" }}>
          Last updated {data.updatedAt ? new Date(data.updatedAt).toLocaleString("en-IN") : "—"}
        </span>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4, letterSpacing: "0.02em" }}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 52, height: 28, borderRadius: 999, border: "none",
      background: value ? "#16A34A" : "#CBD5E1", position: "relative", cursor: "pointer", transition: "background 120ms",
    }} aria-pressed={value}>
      <span style={{
        position: "absolute", top: 3, left: value ? 27 : 3,
        width: 22, height: 22, borderRadius: "50%", background: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 120ms",
      }} />
    </button>
  );
}

function btn(bg: string, color: string): React.CSSProperties {
  return { padding: "6px 12px", background: bg, color, border: "1px solid", borderColor: color, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 };
}
const input: React.CSSProperties = { width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 8, border: "1px solid #D1D5DB", background: "#FFFFFF", color: "#0F172A", boxSizing: "border-box" };
const select: React.CSSProperties = input;
const textarea: React.CSSProperties = { ...input, fontFamily: "inherit", lineHeight: 1.55, resize: "vertical" };
