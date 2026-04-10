/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, Component, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, ArrowRight, MapPin } from "lucide-react";
import { INDIA_STATES } from "@/lib/constants/districts";

// Districts activated within the last 30 days get a "NEW" badge
const DISTRICT_ACTIVATED_AT: Record<string, string> = {
  hyderabad: "2026-04-10",
  // Add new districts here as they go live
};
function isNewDistrict(slug: string): boolean {
  const activatedAt = DISTRICT_ACTIVATED_AT[slug];
  if (!activatedAt) return false;
  return Date.now() - new Date(activatedAt).getTime() < 30 * 24 * 60 * 60 * 1000;
}
import dynamic from "next/dynamic";
import HomepageStats from "@/components/home/HomepageStats";
import LiveDataPreview from "@/components/home/LiveDataPreview";
import HowItWorks from "@/components/home/HowItWorks";
import DistrictRequestSection from "@/components/home/DistrictRequestSection";

const DrillDownMap = dynamic(() => import("@/components/map/DrillDownMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        minHeight: 300,
        background: "#F5F7FF",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#9B9B9B",
        fontSize: 13,
      }}
    >
      Loading map…
    </div>
  ),
});

// Error boundary so a map crash never brings down the whole page
class MapErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return (
        <div style={{ width: "100%", height: "100%", minHeight: 300, background: "#F5F7FF", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#9B9B9B", fontSize: 13 }}>
          <span style={{ fontSize: 28 }}>🗺️</span>
          <span>Map unavailable</span>
          <span style={{ fontSize: 11 }}>Select your district from the list →</span>
        </div>
      );
    }
    return this.props.children;
  }
}

interface DistrictPreview {
  slug: string;
  name: string;
  nameLocal: string;
  tagline: string | null;
  weather: { temp: number | null; conditions: string | null } | null;
  dam: { name: string; storagePct: number } | null;
  crop: { commodity: string; price: number } | null;
  healthGrade: string | null;
  healthScore: number | null;
}

interface PreviewResponse {
  districtPreviews: DistrictPreview[];
}

interface HomeDrilldownProps {
  locale: string;
  tickerShown?: boolean;
}

function gradeColor(grade: string): { bg: string; text: string } {
  if (grade === "A+" || grade === "A") return { bg: "#DCFCE7", text: "#15803D" };
  if (grade === "B+" || grade === "B") return { bg: "#DBEAFE", text: "#1D4ED8" };
  if (grade === "C+" || grade === "C") return { bg: "#FEF3C7", text: "#92400E" };
  if (grade === "D") return { bg: "#FEE2E2", text: "#991B1B" };
  return { bg: "#F3F4F6", text: "#6B7280" };
}

export default function HomeDrilldown({ locale }: HomeDrilldownProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: previewData } = useQuery<PreviewResponse>({
    queryKey: ["homepage-preview"],
    queryFn: () => fetch("/api/data/homepage-preview").then((r) => r.json()),
    staleTime: 300_000,
  });

  const allDistricts = INDIA_STATES.flatMap((s) =>
    s.districts.map((d) => ({ state: s, district: d }))
  );
  const filtered = searchQuery.length >= 2
    ? allDistricts
        .filter(({ district }) =>
          district.active &&
          (district.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            district.nameLocal.includes(searchQuery))
        )
        .slice(0, 5)
    : [];

  const activeDistricts = INDIA_STATES.flatMap((s) =>
    s.districts.filter((d) => d.active).map((d) => ({ ...d, _stateSlug: s.slug }))
  );

  const districtPreviews = previewData?.districtPreviews ?? [];

  return (
    <main style={{ background: "#FAFAF8", paddingBottom: 40 }}>
      {/* Hero Stats */}
      <HomepageStats />

      {/* Map + District cards: 2-col on desktop, stacked on mobile */}
      <div>
        <div
          style={{ padding: "12px 16px 8px" }}
        >
          <span
            style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
              textTransform: "uppercase", color: "#9B9B9B",
            }}
          >
            <span className="hidden md:inline">Click</span>
            <span className="md:hidden">Tap</span>
            {" "}a state to explore
          </span>
        </div>

        <div className="md:grid md:grid-cols-[60%_40%]" style={{ gap: 20, padding: "0 16px" }}>
          {/* Map column */}
          <div>
            <div className="touch-pan-y md:touch-auto">
              <MapErrorBoundary>
                <DrillDownMap locale={locale} />
              </MapErrorBoundary>
            </div>
          </div>

          {/* Districts + Search column */}
          <div style={{ marginTop: 16 }} className="md:mt-0">
            {/* Search */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#FFFFFF", border: "1.5px solid #E8E8E4",
                  borderRadius: 12, padding: "11px 14px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <Search size={15} style={{ color: "#9B9B9B", flexShrink: 0 }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your district…"
                  style={{
                    flex: 1, border: "none", outline: "none",
                    fontSize: 15, color: "#1A1A1A", background: "transparent",
                  }}
                />
              </div>
              {filtered.length > 0 && (
                <div
                  style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "#fff", border: "1px solid #E8E8E4", borderRadius: 10,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.1)", zIndex: 20, overflow: "hidden",
                  }}
                >
                  {filtered.map(({ state, district }) => (
                    <Link key={district.slug} href={`/${locale}/${state.slug}/${district.slug}`}
                      style={{
                        display: "flex", alignItems: "center", padding: "11px 14px",
                        textDecoration: "none", color: "#1A1A1A",
                        borderBottom: "1px solid #F5F5F0",
                      }}
                    >
                      <MapPin size={13} style={{ color: "#2563EB", marginRight: 8, flexShrink: 0 }} />
                      <span style={{ fontSize: 14 }}>{district.name}</span>
                      {district.nameLocal && (
                        <span style={{ fontSize: 11, color: "#9B9B9B", marginLeft: 5, fontFamily: "var(--font-regional)" }}>
                          {district.nameLocal}
                        </span>
                      )}
                      {isNewDistrict(district.slug) && (
                        <span style={{ fontSize: 9, fontWeight: 500, padding: "1px 6px", background: "#D1FAE5", color: "#065F46", borderRadius: 10, marginLeft: 5 }}>NEW</span>
                      )}
                      <span style={{ fontSize: 12, color: "#9B9B9B", marginLeft: "auto" }}>{state.name}</span>
                      <ArrowRight size={12} style={{ color: "#C0C0C0", marginLeft: 6 }} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Active district cards */}
            {activeDistricts.length > 0 && (
              <ActiveDistrictsCard
                locale={locale}
                activeDistricts={activeDistricts}
                districtPreviews={districtPreviews}
              />
            )}
          </div>
        </div>
      </div>

      {/* Remaining sections — full width, stacked */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        {/* Live Data Preview cards */}
        <LiveDataPreview locale={locale} />

        {/* How It Works */}
        <HowItWorks />

        {/* District Request voting */}
        <DistrictRequestSection />

        {/* Support button */}
        <div style={{ padding: "0 16px" }}>
          <Link
            href="/support"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "13px 0", background: "#FFF1F2", border: "1px solid #FECDD3",
              borderRadius: 12, fontSize: 15, fontWeight: 600, color: "#DC2626",
              textDecoration: "none", minHeight: 44,
            }}
          >
            ❤️ Support — ₹1.50/day serves one district
          </Link>
        </div>

        {/* Disclaimer */}
        <DisclaimerStrip />
      </div>
    </main>
  );
}

// ── Shared subcomponents ─────────────────────────────────────────────────────

function ActiveDistrictsCard({
  locale, activeDistricts, districtPreviews,
}: {
  locale: string;
  activeDistricts: Array<(typeof INDIA_STATES)[number]["districts"][number] & { _stateSlug: string }>;
  districtPreviews: DistrictPreview[];
}) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 16, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#1D4ED8", fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, background: "#22C55E", borderRadius: "50%", display: "inline-block" }} />
          LIVE — {activeDistricts.length} Districts
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {activeDistricts.map((d) => {
          const preview = districtPreviews.find((p) => p.slug === d.slug);
          return (
            <Link key={d.slug} href={`/${locale}/${d._stateSlug}/${d.slug}`}
              style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                padding: "12px 14px", background: "#F8FAFF", border: "1px solid #DBEAFE",
                borderRadius: 10, textDecoration: "none",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{d.name}</span>
                  {preview?.healthGrade && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 6px",
                      background: gradeColor(preview.healthGrade).bg,
                      color: gradeColor(preview.healthGrade).text,
                      borderRadius: 4,
                    }}>
                      {preview.healthGrade}
                    </span>
                  )}
                  {isNewDistrict(d.slug) && (
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: "2px 8px",
                      background: "#D1FAE5", color: "#065F46",
                      borderRadius: 10,
                    }}>
                      NEW
                    </span>
                  )}
                </div>
                {d.nameLocal && (
                  <div style={{ fontSize: 12, color: "#6B6B6B", fontFamily: "var(--font-regional)" }}>{d.nameLocal}</div>
                )}
                {d.tagline && (
                  <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 1 }}>{d.tagline}</div>
                )}
                {preview && (
                  <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                    {preview.weather?.temp != null && (
                      <span style={{ fontSize: 11, color: "#2563EB", fontFamily: "var(--font-mono, monospace)" }}>
                        🌡️ {preview.weather.temp}°C
                      </span>
                    )}
                    {preview.dam && (
                      <span style={{ fontSize: 11, color: preview.dam.storagePct > 60 ? "#16A34A" : "#F59E0B", fontFamily: "var(--font-mono, monospace)" }}>
                        🚰 {preview.dam.name.split(" ")[0]}: {preview.dam.storagePct}%
                      </span>
                    )}
                    {preview.crop && (
                      <span style={{ fontSize: 11, color: "#6B6B6B", fontFamily: "var(--font-mono, monospace)" }}>
                        🌾 {preview.crop.commodity}: ₹{preview.crop.price.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <ArrowRight size={14} style={{ color: "#2563EB", flexShrink: 0, marginTop: 2 }} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DisclaimerStrip() {
  return (
    <div
      style={{
        borderTop: "1px solid #E8E8E4", padding: "10px 16px",
        fontSize: 11, color: "#9B9B9B", background: "#FFFFFF",
        borderRadius: 10, margin: "0 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 8,
      }}
    >
      <span>
        <strong style={{ color: "#6B6B6B" }}>ForThePeople.in</strong> — Independent. NOT an official government website. Data under NDSAP.{" "}
        <Link href="/disclaimer" style={{ color: "#2563EB", textDecoration: "none" }}>Disclaimer →</Link>
      </span>
      <span>
        Built by{" "}
        <a href="https://www.instagram.com/jayanth_m_b/" target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", textDecoration: "none" }}>
          Jayanth M B
        </a>
      </span>
    </div>
  );
}
