"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Gavel, ArrowLeft, ExternalLink, Share2, Bookmark } from "lucide-react";
import { LoadingShell, ErrorBlock } from "@/components/district/ui";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import CountdownTimer from "@/components/tenders/CountdownTimer";
import RedFlagBadge from "@/components/tenders/RedFlagBadge";
import TenderGanttTimeline, { type TimelineEvent } from "@/components/tenders/TenderGanttTimeline";
import EligibilityWizard from "@/components/tenders/EligibilityWizard";
import { formatInr } from "@/lib/tenders/format";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

type TenderDetail = {
  tender: {
    id: string;
    sourcePortal: string;
    sourceUrl: string;
    title: string;
    description: string | null;
    workType: string;
    procurementType: string;
    authority: { name: string; shortCode: string; authorityType: string; websiteUrl: string | null };
    category: { name: string; slug: string } | null;
    estimatedValueInr: string | null;
    tenderFeeInr: string | null;
    emdAmountInr: string | null;
    performanceSecurityPct: number | null;
    publishedAt: string;
    bidSubmissionEnd: string;
    preBidMeetingAt: string | null;
    technicalOpeningAt: string | null;
    financialOpeningAt: string | null;
    numberOfCovers: number | null;
    status: string;
    locationDistrict: string;
    locationTaluk: string | null;
    mseReserved: boolean;
    startupExempt: boolean;
    eligibility: {
      minAnnualTurnoverInr?: number | null;
      yearsRequired?: number | null;
      similarWorkExp?: string | null;
      registrationTypes?: string[];
      locationRestrictions?: string | null;
    } | null;
    corrigenda: Array<{ id: string; sequenceNo: number; issuedAt: string; changeType: string; summaryPlain: string | null }>;
    awards: Array<{ id: string; winnerName: string; awardedAmountInr: string; priceHitRatePct: number | null; awardedAt: string }>;
    bidders: Array<{ id: string; displayLabel: string; rank: number | null; status: string }>;
    contract: { contractValueInr: string; contractPeriodDays: number | null; implementationStatus: string; expectedCompletionAt: string | null } | null;
    documents: Array<{ id: string; docType: string; displayName: string; sourceUrl: string }>;
    redFlags: Array<{ flagType: string; factualStatement: string; referenceRule: string | null }>;
    aiSummary: {
      plainEnglishSummary: string;
      generatedAt: string;
      aiModel: string;
      documentChecklist: unknown;
      plainBullets: { what?: string; whoCanApply?: string; deadline?: string } | null;
    } | null;
  };
  timeline: TimelineEvent[];
};

export default function TenderDetailPage({ params }: { params: Promise<{ locale: string; state: string; district: string; tenderId: string }> }) {
  const { locale, state: stateSlug, district: districtSlug, tenderId } = use(params);

  const { data, isLoading, error } = useQuery<TenderDetail>({
    queryKey: ["tender-detail", districtSlug, tenderId],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${districtSlug}/${tenderId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  const backHref = `/${locale}/${stateSlug}/${districtSlug}/tenders`;

  if (isLoading) return <div style={{ padding: 24 }}><LoadingShell rows={4} /></div>;
  if (error || !data) return <div style={{ padding: 24 }}><ErrorBlock message="Couldn't load this tender." /></div>;
  const t = data.tender;

  const shareText = `${t.title} — ${formatInr(t.estimatedValueInr)} · closes ${new Date(t.bidSubmissionEnd).toLocaleDateString("en-IN")} · ${location.origin}/${locale}/${stateSlug}/${districtSlug}/tenders/${t.id}`;

  return (
    <ModuleErrorBoundary moduleName="TenderDetail">
      <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 80px" }}>
          <Link href={backHref} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#2563EB", textDecoration: "none", marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to tenders
          </Link>

          <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

          {/* Header — left border colour-coded by deadline urgency:
              green (>7d), yellow (2–7d), red+pulse (<48h), grey (past). */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #E8E8E4",
            borderLeft: `5px solid ${heroUrgency(t.bidSubmissionEnd).borderColor}`,
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            opacity: heroUrgency(t.bidSubmissionEnd).dimmed ? 0.8 : 1,
            animation: heroUrgency(t.bidSubmissionEnd).pulsing ? "ftpTenderPulse 1.6s ease-in-out infinite" : undefined,
          }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={chipStyle("#EEF2FF", "#4338CA")}>{t.authority.shortCode}</span>
              {t.category && <span style={chipStyle("#F3F4F6", "#374151")}>{t.category.name}</span>}
              <span style={chipStyle("#F0FDF4", "#16A34A")}>{t.status}</span>
              {t.mseReserved && <span style={chipStyle("#ECFDF5", "#047857")}>MSE-reserved</span>}
              {t.startupExempt && <span style={chipStyle("#EFF6FF", "#1D4ED8")}>Startup-eligible</span>}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", lineHeight: 1.3, margin: 0, marginBottom: 14 }}>{t.title}</h1>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" style={linkBtn}>
                <ExternalLink size={14} /> View on source portal
              </a>
              <button onClick={() => navigator.share ? navigator.share({ title: t.title, text: shareText }) : navigator.clipboard.writeText(shareText)} style={linkBtn}>
                <Share2 size={14} /> Share on WhatsApp
              </button>
              {/* TODO: Replace with DPDP-compliant email collection + double
                  opt-in + unsubscribe (future v2). For now a mailto opens the
                  user's email client pre-filled with tender context — support@
                  triages and replies when v2 alert infra is live. */}
              <a
                href={`mailto:support@forthepeople.in?subject=${encodeURIComponent(`Alert me for Tender ${t.id}`)}&body=${encodeURIComponent(`Please notify me of updates on this tender.\n\nTender: ${t.title}\nSource portal: ${t.sourcePortal}\nSource URL: ${t.sourceUrl}\nInternal ID: ${t.id}\n\nMy email: (sending from this address is sufficient)`)}`}
                style={linkBtn}
              >
                <Bookmark size={14} /> Save & alert me
              </a>
            </div>
          </div>

          {/* At-a-glance tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
            <Tile label="Estimated value" value={formatInr(t.estimatedValueInr)} />
            <Tile label="EMD" value={t.emdAmountInr ? formatInr(t.emdAmountInr) : (t.mseReserved || t.startupExempt ? "Exempt" : "—")} />
            <Tile label="Tender fee" value={formatInr(t.tenderFeeInr)} />
            <Tile label="Closes in" value={<CountdownTimer deadline={t.bidSubmissionEnd} />} />
          </div>

          {/* Timeline */}
          <div style={{ marginBottom: 20 }}>
            <TenderGanttTimeline events={data.timeline} />
          </div>

          {/* Red flags */}
          {t.redFlags.length > 0 && (
            <Section title="Factual indicators">
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 10 }}>
                Data-derived factual observations, compared against public rules such as GFR 2017 / KTPPA 1999 / CVC guidelines. These are not allegations — legitimate reasons may exist in any individual case.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {t.redFlags.map((f) => (
                  <RedFlagBadge key={f.flagType} flagType={f.flagType} factualStatement={f.factualStatement} referenceRule={f.referenceRule} />
                ))}
              </div>
            </Section>
          )}

          {/* In Plain Words — 3-bullet summary for citizens. Shown above
              the full paragraph summary when available. Falls back to a
              placeholder when the enrichment cron hasn't run yet. */}
          <Section title="In plain words">
            {t.aiSummary?.plainBullets &&
             (t.aiSummary.plainBullets.what ||
              t.aiSummary.plainBullets.whoCanApply ||
              t.aiSummary.plainBullets.deadline) ? (
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.75, fontSize: 14, color: "#0F172A" }}>
                {t.aiSummary.plainBullets.what && (
                  <li><strong>What:</strong> {t.aiSummary.plainBullets.what}</li>
                )}
                {t.aiSummary.plainBullets.whoCanApply && (
                  <li><strong>Who can apply:</strong> {t.aiSummary.plainBullets.whoCanApply}</li>
                )}
                {t.aiSummary.plainBullets.deadline && (
                  <li><strong>Deadline:</strong> {t.aiSummary.plainBullets.deadline}</li>
                )}
              </ul>
            ) : (
              <div style={{ fontSize: 13, color: "#6B7280" }}>Summary being prepared. Check back soon.</div>
            )}
          </Section>

          {/* Full AI summary (paragraph form) — kept below the bullets for
              readers who want the narrative. */}
          {t.aiSummary?.plainEnglishSummary ? (
            <Section title="Full summary">
              <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 8 }}>
                AI-generated via {t.aiSummary.aiModel} · {new Date(t.aiSummary.generatedAt).toLocaleString("en-IN")} · verify against the NIT PDF before bidding.
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#0F172A", whiteSpace: "pre-wrap" }}>{t.aiSummary.plainEnglishSummary}</p>
            </Section>
          ) : null}

          {/* Eligibility wizard */}
          <Section title="Can I apply?">
            <EligibilityWizard eligibility={t.eligibility} tenderMseReserved={t.mseReserved} tenderStartupExempt={t.startupExempt} />
          </Section>

          {/* Corrigenda */}
          {t.corrigenda.length > 0 && (
            <Section title="Corrigenda">
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {t.corrigenda.map((c) => (
                  <li key={c.id} style={{ marginBottom: 10, fontSize: 13, color: "#374151" }}>
                    <strong>#{c.sequenceNo} — {c.changeType.replace(/_/g, " ")}</strong>
                    <span style={{ color: "#6B7280", marginLeft: 8, fontSize: 12 }}>({new Date(c.issuedAt).toLocaleDateString("en-IN")})</span>
                    {c.summaryPlain && <div style={{ color: "#4B5563", marginTop: 4 }}>{c.summaryPlain}</div>}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* Award + Contract */}
          {t.awards.length > 0 && (
            <Section title="Award of contract">
              {t.awards.map((a) => (
                <div key={a.id} style={{ fontSize: 14, color: "#0F172A" }}>
                  <div><strong>Winner:</strong> {a.winnerName}</div>
                  <div><strong>Awarded amount:</strong> {formatInr(a.awardedAmountInr)}</div>
                  {a.priceHitRatePct !== null && <div><strong>Of estimate:</strong> {a.priceHitRatePct.toFixed(1)}%</div>}
                  <div style={{ color: "#6B7280", fontSize: 12 }}>Awarded {new Date(a.awardedAt).toLocaleDateString("en-IN")}</div>
                </div>
              ))}
            </Section>
          )}

          {/* Documents */}
          {t.documents.length > 0 && (
            <Section title="Documents">
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#374151" }}>
                {t.documents.map((d) => (
                  <li key={d.id}>
                    <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB" }}>
                      {d.displayName} ({d.docType})
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <div style={{ marginTop: 40 }}>
            <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
          </div>
        </div>
      </div>
    </ModuleErrorBoundary>
  );
}

/** Shared urgency logic — mirrors deadlineUrgency() in TenderCard so the
 *  card view and the detail hero use identical thresholds. */
function heroUrgency(deadlineIso: string): { borderColor: string; pulsing: boolean; dimmed: boolean } {
  const msLeft = new Date(deadlineIso).getTime() - Date.now();
  const daysLeft = msLeft / 86400_000;
  if (msLeft <= 0) return { borderColor: "#9CA3AF", pulsing: false, dimmed: true };
  if (daysLeft < 2) return { borderColor: "#DC2626", pulsing: true, dimmed: false };
  if (daysLeft < 7) return { borderColor: "#F59E0B", pulsing: false, dimmed: false };
  return { borderColor: "#16A34A", pulsing: false, dimmed: false };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>{title}</h2>
      {children}
    </div>
  );
}
function Tile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>{value}</div>
    </div>
  );
}
function chipStyle(bg: string, color: string): React.CSSProperties {
  return { fontSize: 11, padding: "2px 8px", background: bg, color, borderRadius: 6, fontWeight: 600 };
}
const linkBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
  background: "#F5F5F2", border: "1px solid #E8E8E4", borderRadius: 8,
  color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer", textDecoration: "none",
};
