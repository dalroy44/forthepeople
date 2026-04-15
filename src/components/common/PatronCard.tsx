/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { Instagram, Linkedin, Github, Twitter, ExternalLink } from "lucide-react";
import { BADGE_COLORS } from "@/lib/badge-level";
import { getContributorLabel } from "@/lib/contributor-label";
import { normalizeSocialLink } from "@/lib/social-link";

interface Patron {
  id: string;
  name: string;
  tier?: string;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  monthsActive: number;
  message: string | null;
  districtName?: string | null;
  stateName?: string | null;
}

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

export default function PatronCard({ patron }: { patron: Patron }) {
  const isFounder = patron.tier === "founder";
  const badgeColors = patron.badgeLevel ? BADGE_COLORS[patron.badgeLevel] : null;
  const SocialIcon = patron.socialPlatform ? SOCIAL_ICONS[patron.socialPlatform] : null;
  const initials = patron.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        background: isFounder
          ? "linear-gradient(135deg, #FEF3C7, #FDE68A)"
          : "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
        border: `2px solid ${isFounder ? "#D97706" : "#F59E0B"}`,
        borderRadius: 14,
        padding: "20px 24px",
        marginBottom: 16,
        boxShadow: isFounder ? "0 4px 12px rgba(245, 158, 11, 0.15)" : undefined,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
        {isFounder ? "👑 FOUNDING BUILDER" : "🌟 ALL-INDIA PATRON"}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: isFounder ? 56 : 48,
            height: isFounder ? 56 : 48,
            borderRadius: "50%",
            background: badgeColors?.bg ?? "#FEF3C7",
            color: badgeColors?.text ?? "#92400E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isFounder ? 20 : 18,
            fontWeight: 800,
            flexShrink: 0,
            border: `3px solid ${badgeColors?.border ?? "#F59E0B"}`,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: isFounder ? 18 : 16, fontWeight: 700, color: "#1A1A1A" }}>
              {patron.name}
            </span>
            {SocialIcon && normalizeSocialLink(patron.socialLink) && (
              <a href={normalizeSocialLink(patron.socialLink)!} target="_blank" rel="noopener noreferrer" style={{ color: "#92400E", lineHeight: 0 }}>
                <SocialIcon size={16} />
              </a>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#92400E", marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span>
              {getContributorLabel(patron.tier ?? "patron", patron.districtName, patron.stateName)} · {patron.monthsActive} month{patron.monthsActive !== 1 ? "s" : ""}
            </span>
            {patron.badgeLevel && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: badgeColors?.bg, color: badgeColors?.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {patron.badgeLevel}
              </span>
            )}
          </div>
          {patron.message && (
            <div style={{ fontSize: 14, color: "#4B4B4B", marginTop: 8, fontStyle: "italic", lineHeight: 1.6 }}>
              &ldquo;{patron.message}&rdquo;
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#B45309", marginTop: 10 }}>
        {isFounder
          ? "This Founding Builder supports ALL 780+ districts and is permanently featured across ForThePeople.in."
          : "This patron supports ALL 780+ districts across India. Their contribution keeps every district dashboard running."}
      </div>
    </div>
  );
}
