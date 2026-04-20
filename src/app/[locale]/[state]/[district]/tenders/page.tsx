/**
 * ForThePeople.in — Module 30 (Tenders)
 * District tender transparency dashboard.
 * Data from 6 Karnataka government procurement portals — every tender carries
 * a source URL and timestamp. No editorialising; only factual red-flag labels.
 */

"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Gavel, AlertTriangle, Info, BookOpen, ShieldCheck } from "lucide-react";
import { ModuleHeader, LoadingShell, ErrorBlock, EmptyBlock } from "@/components/district/ui";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { getModuleSources } from "@/lib/constants/state-config";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import TenderCard, { type TenderCardData } from "@/components/tenders/TenderCard";
import TenderLockedState from "@/components/tenders/TenderLockedState";
import { formatInr } from "@/lib/tenders/format";

interface AccessResponse {
  tendersActive: boolean;
  districtName: string;
  districtSlug: string;
  stateName: string;
  stateSlug: string;
}

type ListResponse = { tenders: TenderCardData[]; total: number; page: number; pageSize: number; districtName: string };
type StatsResponse = {
  districtName: string;
  live: { count: number; totalValueInr: string; mseReservedCount: number; startupExemptCount: number; redFlaggedCount: number };
  deadlineHistogram: { bucket: string; count: number }[];
  awarded90d: { count: number; totalValueInr: string };
  topAuthorities: { authority: { name: string; shortCode: string }; count: number }[];
  categoryDistribution: { category: { name: string; slug: string } | null; count: number }[];
};

type Tab = "LIVE" | "CLOSING_SOON" | "AWARDED" | "ARCHIVE";

const VALUE_PRESETS = [
  { label: "Any", min: null, max: null },
  { label: "SME (₹1L–₹5Cr)", min: 100_000, max: 50_000_000 },
  { label: "Mid (₹5Cr–₹50Cr)", min: 50_000_000, max: 500_000_000 },
  { label: "Large (₹50Cr+)", min: 500_000_000, max: null },
];

export default function TendersPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);
  const [tab, setTab] = useState<Tab>("LIVE");
  const [valuePreset, setValuePreset] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [onlyMse, setOnlyMse] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Per-district lock check — reads from DB.tendersActive. When false we
  // render TenderLockedState instead of the dashboard. Cheap single-row
  // query; cached for 2 minutes by react-query so it won't fire per nav.
  const access = useQuery<AccessResponse>({
    queryKey: ["tenders-access", districtSlug],
    queryFn: () => fetch(`/api/tenders/${districtSlug}/access`).then((r) => r.json()),
    staleTime: 2 * 60_000,
  });

  const listQuery = useQuery<ListResponse>({
    queryKey: ["tenders-list", districtSlug, tab, valuePreset, category, onlyFlagged, onlyMse, search, page],
    queryFn: async () => {
      const qs = new URLSearchParams({ status: tab, page: String(page), pageSize: String(pageSize) });
      const preset = VALUE_PRESETS[valuePreset];
      if (preset.min) qs.set("valueMin", String(preset.min));
      if (preset.max) qs.set("valueMax", String(preset.max));
      if (category) qs.set("category", category);
      if (onlyMse) qs.set("mseReserved", "true");
      if (search) qs.set("search", search);
      const res = await fetch(`/api/tenders/${districtSlug}?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });
  const stats = useQuery<StatsResponse>({
    queryKey: ["tenders-stats", districtSlug],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${districtSlug}/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  const moduleSources = getModuleSources("tenders", stateSlug);
  const tenders = (listQuery.data?.tenders ?? []).filter((t) => (onlyFlagged ? t.redFlags.length > 0 : true));

  // Render the locked state whenever the flag resolves false. Until the
  // access query resolves we show nothing heavy — the dashboard shell
  // below its own loading states will handle the brief flash.
  if (access.data && access.data.tendersActive === false) {
    return (
      <ModuleErrorBoundary moduleName="TendersLocked">
        <TenderLockedState
          locale={locale}
          stateSlug={stateSlug}
          stateName={access.data.stateName ?? ""}
          districtSlug={districtSlug}
          districtName={access.data.districtName ?? ""}
        />
      </ModuleErrorBoundary>
    );
  }

  return (
    <ModuleErrorBoundary moduleName="Tenders">
      <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 80px" }}>
          <ModuleHeader
            icon={Gavel}
            title={`Government Tenders · ${listQuery.data?.districtName ?? stats.data?.districtName ?? ""}`}
            description="Live tenders from KPPP, CPPP, IREPS, defproc, BEL eProc, HAL TenderWizard. Factual red-flag indicators, plain-English summaries, apply guide."
            backHref={`/${locale}/${stateSlug}/${districtSlug}`}
            liveTag
          />

          <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
          <DataSourceBanner
            moduleName="tenders"
            sources={moduleSources.sources}
            updateFrequency={moduleSources.frequency}
            isLive={moduleSources.isLive}
          />

          {/* Stats strip */}
          {stats.data && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
              <StatCard label="Live tenders" value={stats.data.live.count.toLocaleString("en-IN")} />
              <StatCard label="Total live value" value={formatInr(stats.data.live.totalValueInr)} />
              <StatCard label="Closing <48h" value={String(stats.data.deadlineHistogram.find((b) => b.bucket === "<48h")?.count ?? 0)} accent="#DC2626" />
              <StatCard label="MSE-reserved" value={String(stats.data.live.mseReservedCount)} accent="#047857" />
              <StatCard label="Startup-eligible" value={String(stats.data.live.startupExemptCount)} accent="#1D4ED8" />
              <StatCard label="Flagged" value={String(stats.data.live.redFlaggedCount)} accent="#991B1B" />
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, borderBottom: "1px solid #E8E8E4", overflowX: "auto" }}>
            <TabBtn active={tab === "LIVE"} onClick={() => { setTab("LIVE"); setPage(1); }}>🔴 Live</TabBtn>
            <TabBtn active={tab === "CLOSING_SOON"} onClick={() => { setTab("CLOSING_SOON"); setPage(1); }}>⏰ Closing &lt;48h</TabBtn>
            <TabBtn active={tab === "AWARDED"} onClick={() => { setTab("AWARDED"); setPage(1); }}>✅ Recently Awarded</TabBtn>
            <TabBtn active={tab === "ARCHIVE"} onClick={() => { setTab("ARCHIVE"); setPage(1); }}>📚 Archive</TabBtn>
          </div>

          {/* Filter ribbon */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: 12, background: "#F5F5F2", border: "1px solid #E8E8E4", borderRadius: 10, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Value</label>
              <select value={valuePreset} onChange={(e) => { setValuePreset(Number(e.target.value)); setPage(1); }} style={filterSelect}>
                {VALUE_PRESETS.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Category</label>
              <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} style={filterSelect}>
                <option value="">All</option>
                {stats.data?.categoryDistribution.filter((c) => c.category).map((c) => (
                  <option key={c.category!.slug} value={c.category!.slug}>{c.category!.name} ({c.count})</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "end", gap: 10 }}>
              <label style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={onlyMse} onChange={(e) => setOnlyMse(e.target.checked)} /> MSE only
              </label>
              <label style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} /> Flagged only
              </label>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Search</label>
              <input
                placeholder="Search tender title..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ ...filterSelect, minWidth: 200, width: "100%" }}
              />
            </div>
          </div>

          {/* Secondary nav */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <SecondaryLink href={`/${locale}/${stateSlug}/${districtSlug}/tenders/apply-guide`} icon={<ShieldCheck size={14} />}>Apply Guide</SecondaryLink>
            <SecondaryLink href={`/${locale}/${stateSlug}/${districtSlug}/tenders/transparency`} icon={<AlertTriangle size={14} />}>Transparency</SecondaryLink>
            <SecondaryLink href={`/${locale}/${stateSlug}/${districtSlug}/tenders/how-it-works`} icon={<BookOpen size={14} />}>How It Works</SecondaryLink>
          </div>

          {/* Body */}
          {listQuery.isLoading && <LoadingShell rows={3} />}
          {listQuery.error && <ErrorBlock message="Couldn't load tenders — please try again in a moment." />}
          {!listQuery.isLoading && !listQuery.error && tenders.length === 0 && (
            <EmptyBlock message={tab === "LIVE"
              ? "No tenders match your filters. Try switching tabs or loosening filters. New tenders ingest every 30 minutes."
              : "No tenders match your filters. Try the Live tab for current opportunities."}
            />
          )}
          {tenders.length > 0 && (
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
              {tenders.map((t) => (
                <TenderCard key={t.id} tender={t} districtSlug={districtSlug} stateSlug={stateSlug} locale={locale} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {listQuery.data && listQuery.data.total > pageSize && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24 }}>
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={pagerBtn}>‹ Prev</button>
              <span style={{ alignSelf: "center", fontSize: 13, color: "#6B7280" }}>
                Page {page} of {Math.ceil(listQuery.data.total / pageSize)}
              </span>
              <button disabled={page >= Math.ceil(listQuery.data.total / pageSize)} onClick={() => setPage((p) => p + 1)} style={pagerBtn}>Next ›</button>
            </div>
          )}

          <div style={{ marginTop: 40 }}>
            <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
          </div>
        </div>
      </div>
    </ModuleErrorBoundary>
  );
}

// ── Local tiny UI primitives ────────────────────────────────────────────────
function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent ?? "#0F172A", marginTop: 4 }}>{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 16px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
        color: active ? "#0F172A" : "#6B7280",
        borderBottom: active ? "2px solid #0F172A" : "2px solid transparent",
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 8, textDecoration: "none", color: "#374151", fontSize: 13, fontWeight: 500 }}>
      {icon} {children}
    </Link>
  );
}

const filterSelect: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 13,
  borderRadius: 8,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#0F172A",
};

const pagerBtn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#374151",
  cursor: "pointer",
  fontSize: 13,
};
