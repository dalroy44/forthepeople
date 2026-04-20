"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen } from "lucide-react";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import HowTenderWorks from "@/components/tenders/HowTenderWorks";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

type Resp = { sections: Array<{ slug: string; section: string; orderIndex: number; title: string; bodyMd: string; bodyKn: string | null; translationPending: boolean }> };

export default function HowItWorksPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);

  const { data, isLoading } = useQuery<Resp>({
    queryKey: ["tenders-education"],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/how-it-works`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  return (
    <ModuleErrorBoundary moduleName="HowTendersWork">
      <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px 80px" }}>
          <Link href={`/${locale}/${stateSlug}/${districtSlug}/tenders`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#2563EB", textDecoration: "none", marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to tenders
          </Link>
          <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>
            <BookOpen size={24} style={{ display: "inline", marginRight: 8, verticalAlign: "-4px", color: "#2563EB" }} />
            How government tenders actually work
          </h1>
          <p style={{ fontSize: 14, color: "#475569", marginBottom: 24, maxWidth: 720 }}>
            Plain-English explainer for first-time bidders — citizens, freelancers, SMEs. No jargon, no marketing. Scroll through or click a section below.
          </p>

          {isLoading && <div style={{ color: "#6B7280" }}>Loading…</div>}
          {data?.sections && <HowTenderWorks sections={data.sections} />}

          <div style={{ marginTop: 40 }}>
            <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
          </div>
        </div>
      </div>
    </ModuleErrorBoundary>
  );
}
