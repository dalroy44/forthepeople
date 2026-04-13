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

interface TopTierContributor {
  id: string;
  name: string;
  tier: string;
  socialLink: string | null;
  socialPlatform: string | null;
  monthsActive: number;
  districtName: string | null;
  stateName: string | null;
}

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

  const founders = contributors.filter((c) => c.tier === "founder");
  const patrons = contributors.filter((c) => c.tier === "patron");
  const ordered = [...founders, ...patrons];
  const shouldScroll = ordered.length > 6;
  // Duplicate the list for seamless CSS loop if scrolling.
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
        @media (max-width: 768px) {
          .ftp-ticker-track {
            animation-duration: 45s;
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
              overflow: "hidden",
              minWidth: 0,
              position: "relative",
            }}
          >
            <div
              className={shouldScroll ? "ftp-ticker-track" : undefined}
              style={{
                display: "flex",
                gap: 10,
                width: shouldScroll ? "max-content" : "100%",
              }}
            >
              {rendered.map((c, i) => (
                <ContributorChip key={`${c.id}-${i}`} c={c} emoji={c.tier === "founder" ? "👑" : "🌟"} />
              ))}
            </div>
          </div>

          <Link
            href={`/${locale}/support`}
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
  const SocialIcon = c.socialPlatform ? SOCIAL_ICONS[c.socialPlatform] : null;
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
      {c.socialLink ? (
        <a
          href={c.socialLink}
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
