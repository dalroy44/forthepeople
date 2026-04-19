"use client";

import Link from "next/link";
import { formatInr } from "@/lib/tenders/format";
import CountdownTimer from "./CountdownTimer";

export type TenderCardData = {
  id: string;
  title: string;
  authority: { name: string; shortCode: string; authorityType: string };
  category: { name: string; slug: string } | null;
  locationDistrict: string;
  locationTaluk: string | null;
  estimatedValueInr: string | null; // serialised BigInt
  status: string;
  bidSubmissionEnd: string; // ISO
  publishedAt: string;
  mseReserved: boolean;
  startupExempt: boolean;
  redFlags: { flagType: string; factualStatement: string }[];
  _count: { corrigenda: number; documents: number };
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  OPEN_FOR_BIDS:       { bg: "#F0FDF4", color: "#16A34A", label: "Open" },
  PUBLISHED:           { bg: "#EFF6FF", color: "#2563EB", label: "Published" },
  BID_CLOSED:          { bg: "#F3F4F6", color: "#4B5563", label: "Closed" },
  UNDER_EVALUATION:    { bg: "#FFF7ED", color: "#C2410C", label: "Under evaluation" },
  AWARDED:             { bg: "#F0FDF4", color: "#15803D", label: "Awarded" },
  CANCELLED:           { bg: "#FEF2F2", color: "#B91C1C", label: "Cancelled" },
  RETENDERED:          { bg: "#FDF4FF", color: "#86198F", label: "Re-tendered" },
  COMPLETED:           { bg: "#F0FDF4", color: "#15803D", label: "Completed" },
  NO_BID:              { bg: "#F3F4F6", color: "#4B5563", label: "No bid received" },
};

export default function TenderCard({ tender, districtSlug, stateSlug, locale }: { tender: TenderCardData; districtSlug: string; stateSlug: string; locale: string }) {
  const status = STATUS_STYLE[tender.status] ?? { bg: "#F3F4F6", color: "#4B5563", label: tender.status };
  const flagCount = tender.redFlags.length;
  const publishedDaysAgo = Math.floor((Date.now() - new Date(tender.publishedAt).getTime()) / 86400_000);
  const href = `/${locale}/${stateSlug}/${districtSlug}/tenders/${tender.id}`;

  return (
    <Link
      href={href}
      style={{
        display: "block",
        border: "1px solid #E8E8E4",
        background: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 120ms, box-shadow 120ms",
      }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = "#C7D2FE"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = "#E8E8E4"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Line 1: dept + category + location */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 11, padding: "2px 8px", background: "#EEF2FF", color: "#4338CA", borderRadius: 6, fontWeight: 600 }}>
          {tender.authority.shortCode}
        </span>
        {tender.category && (
          <span style={{ fontSize: 11, padding: "2px 8px", background: "#F3F4F6", color: "#374151", borderRadius: 6 }}>
            {tender.category.name}
          </span>
        )}
        <span style={{ fontSize: 11, color: "#6B7280" }}>
          · {tender.locationTaluk ? `${tender.locationTaluk}, ` : ""}{tender.locationDistrict}
        </span>
      </div>

      {/* Line 2: title */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#0F172A",
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        {tender.title}
      </div>

      {/* Line 3: value + MSE/Startup chips + status */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{formatInr(tender.estimatedValueInr)}</span>
        {tender.mseReserved && (
          <span style={{ fontSize: 10, padding: "2px 6px", background: "#ECFDF5", color: "#047857", borderRadius: 4, fontWeight: 600 }}>MSE-reserved</span>
        )}
        {tender.startupExempt && (
          <span style={{ fontSize: 10, padding: "2px 6px", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 4, fontWeight: 600 }}>Startup-eligible</span>
        )}
        <span style={{ fontSize: 11, padding: "2px 8px", background: status.bg, color: status.color, borderRadius: 6, fontWeight: 600 }}>
          {status.label}
        </span>
      </div>

      {/* Line 4: timing + corrigendum + flag counts */}
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontSize: 12, color: "#6B7280" }}>
        <span>Published {publishedDaysAgo}d ago</span>
        <span>·</span>
        <span>Closes in <CountdownTimer deadline={tender.bidSubmissionEnd} compact /></span>
        {tender._count.corrigenda > 0 && (
          <span style={{ color: "#B45309" }}>· {tender._count.corrigenda} corrigendum{tender._count.corrigenda > 1 ? "a" : ""}</span>
        )}
        {flagCount > 0 && (
          <span style={{ color: "#991B1B", fontWeight: 600 }}>· ◆ {flagCount} flag{flagCount > 1 ? "s" : ""}</span>
        )}
      </div>
    </Link>
  );
}
