/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useEffect, Component, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, ArrowRight, MapPin } from "lucide-react";
import { INDIA_STATES } from "@/lib/constants/districts";
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

const TICKER_H = 48;

function gradeColor(grade: string): { bg: string; text: string } {
  if (grade === "A+" || grade === "A") return { bg: "#DCFCE7", text: "#15803D" };
  if (grade === "B+" || grade === "B") return { bg: "#DBEAFE", text: "#1D4ED8" };
  if (grade === "C+" || grade === "C") return { bg: "#FEF3C7", text: "#92400E" };
  if (grade === "D") return { bg: "#FEE2E2", text: "#991B1B" };
  return { bg: "#F3F4F6", text: "#6B7280" };
}

export default function HomeDrilldown({ locale, tickerShown = false }: HomeDrilldownProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: previewData } = useQuery<PreviewResponse>({
    queryKey: ["homepage-preview"],
    queryFn: () => fetch("/api/data/homepage-preview").then((r) => r.json()),
    staleTime: 300_000,
  });

  // On desktop only: lock body scroll so the page is exactly one viewport
  useEffect(() => {
    const apply = () => {
      if (window.innerWidth >= 768) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      document.body.style.overflow = "";
    };
  }, []);

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
  const lockedStates = INDIA_STATES.filter((s) => !s.active);

  const tickerOffset = tickerShown ? TICKER_H : 0;

  return (
    <main style={{ background: "#FAFAF8" }}>
      {/* ── Desktop 2-column grid ── md+ only ───────────────────────────── */}
      <div
        className="hidden md:flex"
        style={{
          flexDirection: "column",
          height: `calc(100vh - 56px - 36px - ${tickerOffset}px)`,
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "60% 40%" }}>
          {/* Left: map — DO NOT TOUCH */}
          <div
            style={{
              borderRight: "1px solid #E8E8E4",
              padding: "16px 20px 12px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
                textTransform: "uppercase", color: "#9B9B9B", marginBottom: 8, flexShrink: 0,
              }}
            >
              Click a state to explore
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <MapErrorBoundary>
                <DrillDownMap locale={locale} />
              </MapErrorBoundary>
            </div>
          </div>

          {/* Right: info */}
          <InfoPanel
            locale={locale}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filtered={filtered}
            activeDistricts={activeDistricts}
            lockedStates={lockedStates}
            districtPreviews={previewData?.districtPreviews ?? []}
          />
        </div>

        {/* Disclaimer strip */}
        <DisclaimerStrip />
      </div>

      {/* ── Mobile single-column layout ── <768px only ──────────────────── */}
      <div className="md:hidden" style={{ paddingBottom: 40 }}>
        {/* Hero Stats */}
        <HomepageStats />

        {/* Map label */}
        <div
          style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
            textTransform: "uppercase", color: "#9B9B9B",
            padding: "12px 16px 8px",
          }}
        >
          Tap a state to explore
        </div>

        {/* Map — touch-pan-y on mobile: vertical swipes scroll the page, taps still register */}
        <div className="touch-pan-y md:touch-auto" style={{ padding: "0 16px" }}>
          <MapErrorBoundary>
            <DrillDownMap locale={locale} />
          </MapErrorBoundary>
        </div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Search */}
          <div style={{ position: "relative", padding: "0 16px" }}>
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
                  position: "absolute", top: "calc(100% + 4px)", left: 16, right: 16,
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
                    <span style={{ fontSize: 12, color: "#9B9B9B", marginLeft: "auto" }}>{state.name}</span>
                    <ArrowRight size={12} style={{ color: "#C0C0C0", marginLeft: 6 }} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Active districts with live data */}
          {activeDistricts.length > 0 && (
            <MobileActiveDistrictsCard
              locale={locale}
              activeDistricts={activeDistricts}
              districtPreviews={previewData?.districtPreviews ?? []}
            />
          )}

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
        </div>
      </div>
    </main>
  );
}

// ── Shared subcomponents ─────────────────────────────────────────────────────

function InfoPanel({
  locale, searchQuery, setSearchQuery, filtered, activeDistricts, lockedStates, districtPreviews,
}: {
  locale: string;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filtered: { state: (typeof INDIA_STATES)[number]; district: (typeof INDIA_STATES)[number]["districts"][number] }[];
  activeDistricts: Array<(typeof INDIA_STATES)[number]["districts"][number] & { _stateSlug: string }>;
  lockedStates: typeof INDIA_STATES;
  districtPreviews: DistrictPreview[];
}) {
  // suppress unused warning — lockedStates replaced by DesktopDistrictRequest
  void lockedStates;

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "16px 20px 12px", gap: 12, overflow: "hidden" }}>
      {/* Search */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#FFFFFF", border: "1.5px solid #E8E8E4",
            borderRadius: 10, padding: "9px 14px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Search size={14} style={{ color: "#9B9B9B", flexShrink: 0 }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your district…"
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: 14, color: "#1A1A1A", background: "transparent",
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
                  display: "flex", alignItems: "center", padding: "9px 12px",
                  textDecoration: "none", color: "#1A1A1A",
                  borderBottom: "1px solid #F5F5F0",
                }}
              >
                <MapPin size={12} style={{ color: "#2563EB", marginRight: 7, flexShrink: 0 }} />
                <span style={{ fontSize: 13 }}>{district.name}</span>
                {district.nameLocal && (
                  <span style={{ fontSize: 11, color: "#9B9B9B", marginLeft: 5, fontFamily: "var(--font-regional)" }}>
                    {district.nameLocal}
                  </span>
                )}
                <span style={{ fontSize: 11, color: "#9B9B9B", marginLeft: "auto" }}>{state.name}</span>
                <ArrowRight size={11} style={{ color: "#C0C0C0", marginLeft: 5 }} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced district cards with live data */}
      {activeDistricts.length > 0 && (
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "#EFF6FF", border: "1px solid #BFDBFE",
              borderRadius: 20, padding: "2px 9px", fontSize: 10, color: "#1D4ED8", fontWeight: 600,
            }}>
              <span style={{ width: 5, height: 5, background: "#22C55E", borderRadius: "50%", display: "inline-block" }} />
              LIVE — {activeDistricts.length} Districts
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {activeDistricts.map((d) => {
              const preview = districtPreviews.find((p) => p.slug === d.slug);
              return (
                <Link key={d.slug} href={`/${locale}/${d._stateSlug}/${d.slug}`}
                  style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    padding: "9px 12px", background: "#FFFFFF", border: "1px solid #E8E8E4",
                    borderRadius: 10, textDecoration: "none",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{d.name}</span>
                      {preview?.healthGrade && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "1px 5px",
                          background: gradeColor(preview.healthGrade).bg,
                          color: gradeColor(preview.healthGrade).text,
                          borderRadius: 4, letterSpacing: "0.03em",
                        }}>
                          {preview.healthGrade}
                        </span>
                      )}
                    </div>
                    {d.nameLocal && (
                      <div style={{ fontSize: 10, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{d.nameLocal}</div>
                    )}
                    {preview && (
                      <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                        {preview.weather?.temp != null && (
                          <span style={{ fontSize: 10, color: "#2563EB", fontFamily: "var(--font-mono, monospace)" }}>
                            🌡️{preview.weather.temp}°C
                          </span>
                        )}
                        {preview.dam && (
                          <span style={{ fontSize: 10, color: preview.dam.storagePct > 60 ? "#16A34A" : "#F59E0B", fontFamily: "var(--font-mono, monospace)" }}>
                            🚰{preview.dam.storagePct}%
                          </span>
                        )}
                        {preview.crop && (
                          <span style={{ fontSize: 10, color: "#6B6B6B", fontFamily: "var(--font-mono, monospace)" }}>
                            🌾₹{preview.crop.price.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ArrowRight size={12} style={{ color: "#2563EB", flexShrink: 0, marginTop: 2 }} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* District Request (replaces coming soon chips) */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 6, flexShrink: 0 }}>
          Want your district next?
        </div>
        <DesktopDistrictRequest />
      </div>

      {/* Support */}
      <Link href="/support"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "9px 0", background: "#FFF1F2", border: "1px solid #FECDD3",
          borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#DC2626",
          textDecoration: "none", flexShrink: 0,
        }}
      >
        ❤️ Support — ₹1.50/day serves one district
      </Link>
    </div>
  );
}

function DesktopDistrictRequest() {
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const stateData = INDIA_STATES.find((s) => s.name === selectedState);
  const lockedDistricts = stateData?.districts.filter((d) => !d.active) ?? [];

  async function handleRequest() {
    if (!selectedState || !selectedDistrict) return;
    try {
      await fetch("/api/district-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateName: selectedState, districtName: selectedDistrict }),
      });
      setSubmitted(true);
    } catch { /* ignore */ }
  }

  if (submitted) {
    return (
      <div style={{ fontSize: 11, color: "#16A34A", fontWeight: 600, padding: "8px 0" }}>
        ✓ Requested! We&apos;ll prioritise {selectedDistrict}.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <select
        value={selectedState}
        onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(""); }}
        style={{
          padding: "6px 8px", border: "1px solid #E8E8E4",
          borderRadius: 7, fontSize: 11, color: "#1A1A1A",
          background: "#FAFAF8", outline: "none",
        }}
      >
        <option value="">Select your state…</option>
        {INDIA_STATES.map((s) => (
          <option key={s.slug} value={s.name}>{s.name}</option>
        ))}
      </select>

      {selectedState && (
        <div style={{ display: "flex", gap: 5 }}>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{
              flex: 1, padding: "6px 8px", border: "1px solid #E8E8E4",
              borderRadius: 7, fontSize: 11,
              color: selectedDistrict ? "#1A1A1A" : "#9B9B9B",
              background: "#FAFAF8", outline: "none",
            }}
          >
            <option value="">Select district…</option>
            {lockedDistricts.map((d) => (
              <option key={d.slug} value={d.name}>{d.name}</option>
            ))}
          </select>
          <button
            onClick={handleRequest}
            disabled={!selectedDistrict}
            style={{
              padding: "6px 10px",
              background: selectedDistrict ? "#2563EB" : "#E8E8E4",
              color: selectedDistrict ? "#fff" : "#9B9B9B",
              border: "none", borderRadius: 7,
              fontSize: 11, fontWeight: 600,
              cursor: selectedDistrict ? "pointer" : "default",
            }}
          >
            Request →
          </button>
        </div>
      )}
    </div>
  );
}

function MobileActiveDistrictsCard({
  locale, activeDistricts, districtPreviews,
}: {
  locale: string;
  activeDistricts: Array<(typeof INDIA_STATES)[number]["districts"][number] & { _stateSlug: string }>;
  districtPreviews: DistrictPreview[];
}) {
  return (
    <div style={{ padding: "0 16px" }}>
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
    </div>
  );
}

function DisclaimerStrip() {
  return (
    <div
      style={{
        borderTop: "1px solid #E8E8E4", padding: "7px 20px",
        fontSize: 10, color: "#9B9B9B", background: "#FFFFFF",
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
