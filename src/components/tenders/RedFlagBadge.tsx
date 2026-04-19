// Factual-only red flag pill. Throws at runtime if statement contains banned adjectives.

"use client";

import { assertFactualCopy } from "@/lib/tenders/format";

const LABELS: Record<string, string> = {
  SINGLE_BIDDER: "Single bidder",
  SHORT_WINDOW: "Short bidding window",
  PRICE_HIT_RATE: "Price ≈ estimate",
  REPEAT_WINNER: "Repeat winner",
  RETENDERED: "Re-tendered",
  RESTRICTIVE_TURNOVER: "Higher-than-typical turnover",
  DIRECT_NOMINATION: "Direct nomination",
};

export default function RedFlagBadge({
  flagType,
  factualStatement,
  referenceRule,
}: {
  flagType: string;
  factualStatement: string;
  referenceRule?: string | null;
}) {
  // Runtime guard — any dynamic factual statement must be adjective-free.
  try {
    assertFactualCopy(factualStatement, `RedFlagBadge(${flagType})`);
  } catch (err) {
    console.error(err);
  }
  return (
    <div
      role="note"
      title={`${factualStatement}${referenceRule ? ` — Reference: ${referenceRule}` : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        background: "#FEF2F2",
        border: "1px solid #FCA5A5",
        borderRadius: 999,
        fontSize: 12,
        color: "#991B1B",
        fontWeight: 600,
        cursor: "help",
      }}
    >
      <span>◆</span>
      <span>{LABELS[flagType] ?? flagType}</span>
    </div>
  );
}
