/**
 * Full tenders disclaimer page. Composes:
 *   - Universal clauses (GFR 2017, GODL-India, RTI §4, DPDP Act 2023,
 *     Advocates Act §33, support contact, etc.)
 *   - State-specific clauses (e.g., Karnataka → KTPPA 1999).
 *
 * Data source: TenderEducationContent rows where docType='disclaimer',
 * filtered by stateSlug = null (universal) or the current state.
 */

"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

interface DisclaimerClause {
  slug: string;
  title: string;
  bodyMd: string;
}
interface DisclaimerResponse {
  stateSlug: string;
  universal: DisclaimerClause[];
  stateSpecific: DisclaimerClause[];
}

// Minimal markdown renderer — bold + italic + paragraph splits only.
// Mirrors the approach in HowTenderWorks to avoid pulling in remark/rehype
// just for legal copy.
function renderParagraphs(md: string): React.ReactNode {
  return md.split(/\n\n+/).map((block, i) => (
    <p key={i} style={{ margin: "10px 0", lineHeight: 1.7, color: "#334155" }}>
      {inline(block)}
    </p>
  ));
}
function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let idx = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > idx) parts.push(text.slice(idx, m.index));
    parts.push(
      m[0].startsWith("**") ? (
        <strong key={key++}>{m[0].slice(2, -2)}</strong>
      ) : (
        <em key={key++}>{m[0].slice(1, -1)}</em>
      ),
    );
    idx = m.index + m[0].length;
  }
  if (idx < text.length) parts.push(text.slice(idx));
  return parts;
}

export default function TenderDisclaimerPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);

  const { data, isLoading, error } = useQuery<DisclaimerResponse>({
    queryKey: ["tenders-disclaimer", stateSlug],
    queryFn: () => fetch(`/api/tenders/disclaimer/${stateSlug}`).then((r) => r.json()),
    staleTime: 60 * 60_000, // legal copy barely changes
  });

  const hasContent =
    data && (data.universal.length > 0 || data.stateSpecific.length > 0);

  return (
    <ModuleErrorBoundary moduleName="TendersDisclaimer">
      <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px 80px" }}>
          <Link
            href={`/${locale}/${stateSlug}/${districtSlug}/tenders`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#2563EB",
              textDecoration: "none",
              marginBottom: 20,
            }}
          >
            <ArrowLeft size={14} /> Back to tenders
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <ShieldCheck size={22} color="#0F172A" />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: "-0.2px" }}>
              Tenders — Legal & Usage Disclaimer
            </h1>
          </div>

          {isLoading && (
            <p style={{ color: "#6B7280", fontSize: 14 }}>Loading disclaimer…</p>
          )}
          {error && !isLoading && (
            <p style={{ color: "#B91C1C", fontSize: 14 }}>
              Couldn&rsquo;t load the disclaimer. Please reach out to{" "}
              <a
                href="mailto:support@forthepeople.in?subject=Tenders%20disclaimer%20load%20failure"
                style={{ color: "#2563EB" }}
              >
                support@forthepeople.in
              </a>
              .
            </p>
          )}
          {!isLoading && !error && data && !hasContent && (
            <p style={{ color: "#6B7280", fontSize: 14 }}>
              Disclaimer content not seeded yet. Please check back shortly.
            </p>
          )}

          {data && hasContent && (
            <>
              {data.universal.length > 0 && (
                <section style={{ marginBottom: 32 }}>
                  <h2 style={sectionHeaderStyle}>General / Nationwide</h2>
                  {data.universal.map((c) => (
                    <div key={c.slug} style={clauseCardStyle}>
                      <div style={clauseTitleStyle}>{c.title}</div>
                      {renderParagraphs(c.bodyMd)}
                    </div>
                  ))}
                </section>
              )}

              {data.stateSpecific.length > 0 && (
                <section>
                  <h2 style={sectionHeaderStyle}>
                    State-specific ({stateSlug.replace(/-/g, " ")})
                  </h2>
                  {data.stateSpecific.map((c) => (
                    <div key={c.slug} style={clauseCardStyle}>
                      <div style={clauseTitleStyle}>{c.title}</div>
                      {renderParagraphs(c.bodyMd)}
                    </div>
                  ))}
                </section>
              )}
            </>
          )}

          <div style={{ marginTop: 48, padding: 16, background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 10, fontSize: 13, color: "#075985" }}>
            <strong>Takedown or grievance?</strong> Email{" "}
            <a
              href="mailto:support@forthepeople.in?subject=Takedown%20Request%3A%20Tenders%20disclaimer"
              style={{ color: "#0369A1", textDecoration: "underline" }}
            >
              support@forthepeople.in
            </a>
            . SLA: 7 working days per IT Rules 2021.
          </div>
        </div>
      </div>
    </ModuleErrorBoundary>
  );
}

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#6B7280",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  margin: "0 0 14px",
};

const clauseCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 10,
  padding: "16px 20px",
  marginBottom: 14,
};

const clauseTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0F172A",
  marginBottom: 6,
  letterSpacing: "0.01em",
};
