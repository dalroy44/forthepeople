/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Linkedin, Github, Twitter, ExternalLink } from "lucide-react";
import { getContributorLabel } from "@/lib/contributor-label";
import { normalizeSocialLink } from "@/lib/social-link";

interface TopTierContributor {
  id: string;
  name: string;
  tier: string;
  amount?: number | null;
  socialLink: string | null;
  socialPlatform: string | null;
  monthsActive: number;
  districtName: string | null;
  stateName: string | null;
}

const PLACEHOLDER_TARGET = 3; // hide placeholders once we have this many real names
const PLACEHOLDER_AMOUNT = 9999;

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

export default function TopTierShowcase({ locale = "en" }: { locale?: string }) {
  const { data, isLoading } = useQuery<{ contributors: TopTierContributor[]; total?: number }>({
    queryKey: ["top-tier-contributors"],
    queryFn: () => fetch("/api/data/contributors?type=top-tier&limit=20").then((r) => r.json()),
    staleTime: 120_000,
    refetchInterval: 300_000,
  });

  const contributors = data?.contributors ?? [];

  if (isLoading) return null;

  if (contributors.length === 0) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
          borderTop: "1px solid #FDE68A",
          borderBottom: "1px solid #FDE68A",
          padding: "12px 24px",
          textAlign: "center",
        }}
      >
        <Link
          href={`/${locale}/support?tier=district`}
          style={{ fontSize: 12, fontWeight: 600, color: "#92400E", textDecoration: "none" }}
        >
          🏆 Be the first to back India&apos;s data revolution — from ₹99/mo →
        </Link>
      </div>
    );
  }

  // Sort all India-tier names by amount descending so the biggest contributor
  // shows first. Tier strings (founder/patron) take priority labelling; anyone
  // ≥ ₹9,999 lands here regardless thanks to the amount-based API filter.
  const ordered = [...contributors].sort((a, b) => {
    const av = a.amount ?? (a.tier === "founder" ? Number.MAX_SAFE_INTEGER : 0);
    const bv = b.amount ?? (b.tier === "founder" ? Number.MAX_SAFE_INTEGER : 0);
    return bv - av;
  });

  // Show up to 2 "Your name here" slots until we have 3+ real contributors.
  const placeholderSlots = ordered.length >= PLACEHOLDER_TARGET ? 0 : Math.min(2, PLACEHOLDER_TARGET - ordered.length);

  // Only run the auto-scroll ticker when there are enough real contributors to
  // justify the seamless-loop duplication. With fewer names, duplication makes
  // the same name appear twice, which reads as a rendering bug.
  const shouldScroll = ordered.length >= 3;
  // Duplicate only when scrolling — the seamless CSS loop needs two copies.
  const rendered = shouldScroll ? [...ordered, ...ordered] : ordered;

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ftp-ticker-track {
          animation: ticker-scroll 60s linear infinite;
          will-change: transform;
        }
        .ftp-ticker-viewport:hover .ftp-ticker-track {
          animation-play-state: paused;
        }
        .ftp-ticker-viewport::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .ftp-ticker-track {
            animation-duration: 30s;
          }
          .top-tier-row {
            flex-direction: column;
            align-items: stretch !important;
            gap: 6px !important;
          }
          .top-tier-label,
          .top-tier-cta {
            text-align: center;
          }
          .top-tier-cta {
            align-self: center;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-ticker-track {
            animation: none;
          }
        }
      `}</style>

      <div
        style={{
          background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
          borderTop: "1px solid #FDE68A",
          borderBottom: "1px solid #FDE68A",
          padding: "10px 0",
          overflow: "hidden",
        }}
        className="top-tier-showcase"
      >
        <div
          className="top-tier-row"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            className="top-tier-label"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#92400E",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            🏆 Backed By
          </div>

          <div
            className="ftp-ticker-viewport"
            style={{
              display: "flex",
              flex: 1,
              overflowX: shouldScroll ? "hidden" : "auto",
              overflowY: "hidden",
              minWidth: 0,
              position: "relative",
              scrollbarWidth: "none",
            }}
          >
            <div
              className={shouldScroll ? "ftp-ticker-track" : undefined}
              style={{
                display: "flex",
                gap: 10,
                width: "max-content",
              }}
            >
              {rendered.map((c, i) => (
                <ContributorChip
                  key={`${c.id}-${i}`}
                  c={c}
                  emoji={c.tier === "founder" || (c.amount ?? 0) >= 50000 ? "👑" : "🌟"}
                />
              ))}
              {Array.from({ length: placeholderSlots }).map((_, i) => (
                <PlaceholderChip key={`ph-${i}`} locale={locale} />
              ))}
            </div>
          </div>

          <Link
            href={`/${locale}/support`}
            className="top-tier-cta"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#92400E",
              textDecoration: "none",
              flexShrink: 0,
              padding: "5px 10px",
              background: "rgba(255,255,255,0.6)",
              borderRadius: 6,
              whiteSpace: "nowrap",
            }}
          >
            Support ForThePeople.in →
          </Link>
        </div>
      </div>
    </>
  );
}

function ContributorChip({ c, emoji }: { c: TopTierContributor; emoji: string }) {
  const safeLink = normalizeSocialLink(c.socialLink);
  const SocialIcon =
    (c.socialPlatform ? SOCIAL_ICONS[c.socialPlatform] : null) ?? (safeLink ? ExternalLink : null);
  const label = getContributorLabel(c.tier, c.districtName, c.stateName);

  const content = (
    <>
      <span style={{ fontSize: 11 }}>{emoji}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", whiteSpace: "nowrap" }}>{c.name}</span>
      {SocialIcon && <SocialIcon size={11} color="#92400E" />}
    </>
  );

  return (
    <div
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        background: "#FFFFFF",
        border: "1px solid #FDE68A",
        borderRadius: 999,
        flexShrink: 0,
        scrollSnapAlign: "start",
      }}
    >
      {safeLink ? (
        <a
          href={safeLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none", color: "inherit" }}
        >
          {content}
        </a>
      ) : (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{content}</div>
      )}
    </div>
  );
}

function PlaceholderChip({ locale }: { locale: string }) {
  return (
    <Link
      href={`/${locale}/support?tier=patron`}
      title="Become an All-India Patron — ₹9,999/mo"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        background: "rgba(255,255,255,0.55)",
        border: "1px dashed #FDE68A",
        borderRadius: 999,
        flexShrink: 0,
        textDecoration: "none",
        color: "#92400E",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 11 }}>🌟</span>
      <span style={{ fontSize: 12 }}>
        Your name here — Support All India ₹{PLACEHOLDER_AMOUNT.toLocaleString("en-IN")}/mo →
      </span>
    </Link>
  );
}
