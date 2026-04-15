/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useState } from "react";
import Image from "next/image";
import { Users, Phone, Mail, Info } from "lucide-react";
import { useLeaders, useAIInsight } from "@/hooks/useRealtimeData";
import { ModuleHeader, SectionLabel, LoadingShell, ErrorBlock, AIInsightBanner } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import { getModuleSources } from "@/lib/constants/state-config";

function formatVerifiedDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return null; }
}

function leaderProvenance(l: { source?: string | null; lastVerifiedAt?: string | null }): string {
  const verified = formatVerifiedDate(l.lastVerifiedAt);
  const src = (l.source ?? "").toLowerCase();
  if (src.startsWith("http")) return verified ? `Updated from news · Last verified: ${verified}` : "Updated from news";
  if (src.includes("manual-research")) return verified ? `Manually researched · Last verified: ${verified}` : "Manually researched";
  if (src.includes("seed") || src === "" || src === "manual" || !src) {
    return verified ? `Added from seed data · Last verified: ${verified}` : "Added from seed data";
  }
  return verified ? `Last verified: ${verified}` : "Verification pending";
}

const TIER_LABELS: Record<number, string> = {
  1: "Parliament (MP)",
  2: "State Assembly (MLAs)",
  3: "Elected Local Body",
  4: "District Administration (IAS/KAS)",
  5: "Police (IPS/KPS)",
  6: "Judiciary",
  7: "Revenue Administration",
  8: "Development & Panchayat",
  9: "Department Heads",
  10: "Taluk Level",
};

// CC-licensed party colors (saffron, blue, green)
const PARTY_COLORS: Record<string, string> = {
  BJP:       "#FF9933",
  INC:       "#19AAED",
  Congress:  "#19AAED",
  "JD(S)":   "#228B22",
  JDS:       "#228B22",
  JDU:       "#008000",
  AAP:       "#00AEEF",
  SP:        "#CC0000",
  BSP:       "#003366",
  TDP:       "#E6B800",
  TMC:       "#1C7430",
  DMK:       "#FF0000",
  AIADMK:    "#000080",
  NCP:       "#005DAA",
  SHS:       "#FF6600",
  Independent: "#6B7280",
  SKP:         "#E07B00",
};

function getPartyColor(party: string | null | undefined): string {
  if (!party) return "#6B7280";
  return PARTY_COLORS[party] ?? "#6B7280";
}

// Avatar component: shows photo if available, falls back to colored initials
function LeaderAvatar({
  name, photoUrl, partyColor,
}: {
  name: string;
  photoUrl?: string | null;
  partyColor: string;
}) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (photoUrl && !imgError) {
    return (
      <div
        style={{
          width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
          overflow: "hidden",
          border: `2px solid ${partyColor}40`,
        }}
      >
        <Image
          src={photoUrl}
          alt={name}
          width={56}
          height={56}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
        background: `${partyColor}18`,
        border: `2px solid ${partyColor}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, fontWeight: 700, color: partyColor,
      }}
    >
      {initials}
    </div>
  );
}

function LeadershipPageInner({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useLeaders(district, state);
  const { data: aiInsight } = useAIInsight(district, "leadership");
  const leaders = data?.data ?? [];

  const byTier = leaders.reduce((acc: Record<number, typeof leaders>, l) => {
    (acc[l.tier] ??= []).push(l);
    return acc;
  }, {});

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={Users}
        title="Leadership & Hierarchy"
        description="MP, MLAs, District Collector, SP, and other officials"
        backHref={base}
      />
      {aiInsight && (
        <AIInsightBanner
          headline={aiInsight.headline}
          summary={aiInsight.summary}
          sentiment={aiInsight.sentiment}
          confidence={aiInsight.confidence}
          sourceUrls={aiInsight.sourceUrls}
          createdAt={aiInsight.createdAt}
        />
      )}
      {(() => { const _src = getModuleSources("leaders", state); return <DataSourceBanner moduleName="leaders" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}

      <div
        role="note"
        style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E40AF",
          borderRadius: 8, padding: "10px 14px", marginBottom: 14,
          fontSize: 12, lineHeight: 1.55,
        }}
      >
        <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Leadership data reflects the latest available information. Political positions and party affiliations change frequently. Verify current officeholders at the official district administration website.
        </span>
      </div>

      <AIInsightCard module="leaders" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && leaders.length === 0 && (
        <div style={{ textAlign: "center", padding: "56px 24px", background: "#F9F9F7", border: "1px dashed #D0D0CC", borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#6B6B6B", marginBottom: 6 }}>No leadership data yet</div>
          <div style={{ fontSize: 13, color: "#9B9B9B", lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>
            Data on elected representatives and officials for this district will be updated soon. Our team monitors official gazette notifications.
          </div>
        </div>
      )}

      {Object.entries(byTier)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([tier, tierLeaders]) => (
          <div key={tier} style={{ marginBottom: 28 }}>
            <SectionLabel>{TIER_LABELS[Number(tier)] ?? `Tier ${tier}`}</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {tierLeaders.map((l) => {
                const partyColor = getPartyColor(l.party);
                return (
                  <div
                    key={l.id}
                    style={{
                      background: "#FFF", border: "1px solid #E8E8E4",
                      borderRadius: 14, padding: "18px 18px 14px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <LeaderAvatar name={l.name} photoUrl={l.photoUrl} partyColor={partyColor} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.2 }}>
                          {l.name}
                        </div>
                        {l.nameLocal && (
                          <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)", marginTop: 1 }}>
                            {l.nameLocal}
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>{l.role}</div>
                        {l.party && (
                          <div
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6,
                              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                              color: partyColor, background: `${partyColor}18`,
                              border: `1px solid ${partyColor}30`,
                            }}
                          >
                            {l.party}
                          </div>
                        )}
                        {l.constituency && (
                          <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 4 }}>
                            📍 {l.constituency}
                          </div>
                        )}
                        {l.since && (
                          <div style={{ fontSize: 12, color: "#9B9B9B" }}>Since {l.since}</div>
                        )}
                      </div>
                    </div>

                    {(l.phone || l.email) && (
                      <div
                        style={{
                          borderTop: "1px solid #F5F5F0", marginTop: 12, paddingTop: 10,
                          display: "flex", gap: 12, flexWrap: "wrap",
                        }}
                      >
                        {l.phone && (
                          <a
                            href={`tel:${l.phone}`}
                            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#2563EB", textDecoration: "none" }}
                          >
                            <Phone size={12} /> {l.phone}
                          </a>
                        )}
                        {l.email && (
                          <a
                            href={`mailto:${l.email}`}
                            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#2563EB", textDecoration: "none" }}
                          >
                            <Mail size={12} /> Email
                          </a>
                        )}
                      </div>
                    )}
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed #F0F0EC", fontSize: 10, color: "#9B9B9B", fontStyle: "italic" }}>
                      {leaderProvenance(l)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {leaders.length > 0 && (
        <div
          role="note"
          style={{
            background: "#F9F9F7", border: "1px solid #E8E8E4", borderRadius: 8,
            padding: 16, marginTop: 24,
            fontSize: 12, color: "#4B5563", lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#1A1A1A" }}>Note on political affiliations:</strong>{" "}
          Political party affiliations shown are as last reported and may not reflect current affiliations due to party
          changes, cabinet reshuffles, or elections. Government officers (IAS, IPS) carry no party. ForThePeople.in does
          not endorse or oppose any political party or individual.
        </div>
      )}
    </div>
  );
}

export default function LeadershipPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Leadership">
      <LeadershipPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
