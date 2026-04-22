/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { MapPin } from "lucide-react";
import type { DistrictBadge } from "@/lib/constants/districts";
import DistrictBadges from "./DistrictBadges";

// ── Per-district palette ─────────────────────────────────
interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  gradientBase: string; // "r, g, b"
}

export const PALETTES: Record<string, Palette> = {
  mandya:           { primary: "#7a9e6b", secondary: "#5c8a4e", accent: "#d4e4c8", gradientBase: "243,248,238" },
  mysuru:           { primary: "#b8941f", secondary: "#957518", accent: "#f0e6c0", gradientBase: "250,246,235" },
  "bengaluru-urban": { primary: "#5a8a9e", secondary: "#3d6e82", accent: "#c8dfe8", gradientBase: "240,247,250" },
  hyderabad:        { primary: "#c4956a", secondary: "#a87d55", accent: "#e8d5c0", gradientBase: "250,245,238" },
  chennai:          { primary: "#5a9e8f", secondary: "#3d8275", accent: "#c8e8e0", gradientBase: "240,250,247" },
  "new-delhi":      { primary: "#c4a87a", secondary: "#a8905e", accent: "#e8dcc8", gradientBase: "250,246,240" },
  mumbai:           { primary: "#6a7a8a", secondary: "#4e6070", accent: "#c8d4de", gradientBase: "244,247,250" },
  kolkata:          { primary: "#c4a050", secondary: "#a8862e", accent: "#f0e0b0", gradientBase: "250,246,235" },
  lucknow:          { primary: "#a87d9e", secondary: "#8a6185", accent: "#e0cede", gradientBase: "248,242,247" },
};

export const DEFAULT_PALETTE: Palette = { primary: "#9B9B9B", secondary: "#7a7a7a", accent: "#e0e0e0", gradientBase: "248,248,245" };

// ── SVG illustrations per district ───────────────────────
function DistrictSVG({ slug, p }: { slug: string; p: Palette }) {
  switch (slug) {
    case "mandya":
      return (
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Hills */}
          <ellipse cx="320" cy="280" rx="120" ry="40" fill={p.accent} opacity="0.5" />
          <ellipse cx="350" cy="260" rx="80" ry="30" fill={p.accent} opacity="0.6" />
          {/* KRS Dam */}
          <rect x="260" y="140" width="120" height="80" rx="4" fill={p.primary} opacity="0.5" />
          <rect x="265" y="145" width="22" height="70" rx="2" fill={p.secondary} opacity="0.5" />
          <rect x="292" y="145" width="22" height="70" rx="2" fill={p.secondary} opacity="0.5" />
          <rect x="319" y="145" width="22" height="70" rx="2" fill={p.secondary} opacity="0.5" />
          <rect x="346" y="145" width="22" height="70" rx="2" fill={p.secondary} opacity="0.5" />
          {/* Water spillway */}
          <path d="M270 220 Q290 250 310 220 Q330 250 350 220 Q370 250 390 220" stroke={p.primary} strokeWidth="2" fill="none" opacity="0.4" />
          {/* Sugarcane */}
          {[200, 215, 230, 245].map((x) => (
            <g key={x}>
              <line x1={x} y1="280" x2={x} y2="240" stroke={p.primary} strokeWidth="2" opacity="0.3" />
              <path d={`M${x - 5} ${245} Q${x} ${235} ${x + 5} ${245}`} fill={p.primary} opacity="0.25" />
            </g>
          ))}
          {/* Birds */}
          <path d="M180 80 Q185 75 190 80" stroke={p.secondary} strokeWidth="1.2" fill="none" opacity="0.3" />
          <path d="M200 65 Q204 61 208 65" stroke={p.secondary} strokeWidth="1.2" fill="none" opacity="0.25" />
        </svg>
      );

    case "mysuru":
      return (
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Chamundi Hill */}
          <path d="M200 280 Q300 180 400 260 L400 300 L200 300Z" fill={p.accent} opacity="0.4" />
          {/* Palace base */}
          <rect x="260" y="160" width="120" height="80" rx="3" fill={p.primary} opacity="0.45" />
          {/* Palace towers */}
          <rect x="275" y="120" width="20" height="40" rx="2" fill={p.primary} opacity="0.5" />
          <rect x="345" y="120" width="20" height="40" rx="2" fill={p.primary} opacity="0.5" />
          {/* Central dome */}
          <ellipse cx="320" cy="130" rx="25" ry="20" fill={p.secondary} opacity="0.5" />
          <rect x="305" y="130" width="30" height="30" rx="2" fill={p.primary} opacity="0.45" />
          {/* Dome pinnacle */}
          <line x1="320" y1="110" x2="320" y2="100" stroke={p.secondary} strokeWidth="2" opacity="0.5" />
          {/* Arches */}
          {[270, 295, 320, 345].map((x) => (
            <path key={x} d={`M${x} 240 Q${x + 10} 225 ${x + 20} 240`} stroke={p.secondary} strokeWidth="1.5" fill="none" opacity="0.35" />
          ))}
          {/* Birds */}
          <path d="M190 90 Q195 85 200 90" stroke={p.secondary} strokeWidth="1.2" fill="none" opacity="0.3" />
        </svg>
      );

    case "bengaluru-urban":
      return (
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Trees */}
          {[240, 260, 340, 365].map((x) => (
            <ellipse key={x} cx={x} cy="260" rx="14" ry="18" fill={p.accent} opacity="0.5" />
          ))}
          {/* Buildings */}
          <rect x="270" y="120" width="28" height="150" rx="3" fill={p.primary} opacity="0.45" />
          <rect x="305" y="90" width="32" height="180" rx="3" fill={p.secondary} opacity="0.45" />
          <rect x="345" y="140" width="26" height="130" rx="3" fill={p.primary} opacity="0.4" />
          <rect x="378" y="160" width="22" height="110" rx="3" fill={p.secondary} opacity="0.35" />
          {/* Windows */}
          {[130, 150, 170, 190, 210].map((y) => (
            <g key={y}>
              <rect x="312" y={y} width="6" height="6" rx="1" fill={p.accent} opacity="0.6" />
              <rect x="322" y={y} width="6" height="6" rx="1" fill={p.accent} opacity="0.6" />
            </g>
          ))}
          {/* Plane */}
          <path d="M190 55 L200 52 L195 55 L200 58Z" fill={p.secondary} opacity="0.3" />
          <line x1="185" y1="55" x2="195" y2="55" stroke={p.secondary} strokeWidth="1" opacity="0.25" />
          {/* Birds */}
          <path d="M220 80 Q224 76 228 80" stroke={p.secondary} strokeWidth="1" fill="none" opacity="0.25" />
        </svg>
      );

    case "hyderabad":
      return (
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Bazaar arches */}
          {[230, 260, 290].map((x) => (
            <path key={x} d={`M${x} 260 Q${x + 12} 240 ${x + 24} 260`} stroke={p.accent} strokeWidth="1.5" fill="none" opacity="0.35" />
          ))}
          {/* Charminar base */}
          <rect x="300" y="140" width="70" height="120" rx="3" fill={p.primary} opacity="0.45" />
          {/* Central arch */}
          <path d="M315 260 Q335 230 355 260" fill={p.accent} opacity="0.5" />
          {/* Four minarets */}
          {[298, 325, 348, 372].map((x) => (
            <g key={x}>
              <rect x={x} y="100" width="8" height="60" rx="2" fill={p.secondary} opacity="0.5" />
              <ellipse cx={x + 4} cy="100" rx="5" ry="6" fill={p.primary} opacity="0.5" />
              <line x1={x + 4} y1="94" x2={x + 4} y2="85" stroke={p.secondary} strokeWidth="1.2" opacity="0.45" />
            </g>
          ))}
          {/* Dome */}
          <ellipse cx="335" cy="135" rx="18" ry="14" fill={p.secondary} opacity="0.4" />
          {/* Birds */}
          <path d="M220 70 Q224 66 228 70" stroke={p.secondary} strokeWidth="1.2" fill="none" opacity="0.3" />
          <path d="M240 60 Q243 57 246 60" stroke={p.secondary} strokeWidth="1" fill="none" opacity="0.25" />
        </svg>
      );

    case "chennai":
      return (
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Waves */}
          <path d="M200 280 Q240 270 280 280 Q320 290 360 280 Q380 275 400 280 L400 300 L200 300Z" fill={p.accent} opacity="0.4" />
          <path d="M220 285 Q260 275 300 285 Q340 295 380 285 L400 290 L400 300 L220 300Z" fill={p.accent} opacity="0.3" />
          {/* Lighthouse */}
          <rect x="330" y="130" width="20" height="120" rx="3" fill={p.primary} opacity="0.5" />
          <polygon points="325,130 340,100 355,130" fill={p.secondary} opacity="0.5" />
          <ellipse cx="340" cy="115" rx="8" ry="6" fill={p.accent} opacity="0.7" />
          {/* Beach curve */}
          <path d="M260 260 Q310 230 380 260" stroke={p.primary} strokeWidth="1.5" fill="none" opacity="0.3" />
          {/* Fishing boat */}
          <path d="M250 265 Q260 255 270 265" stroke={p.secondary} strokeWidth="1.5" fill="none" opacity="0.35" />
          <line x1="260" y1="265" x2="260" y2="252" stroke={p.secondary} strokeWidth="1" opacity="0.3" />
          {/* Gopuram */}
          <polygon points="370,200 380,160 390,200" fill={p.primary} opacity="0.3" />
          {/* Birds */}
          <path d="M210 80 Q214 76 218 80" stroke={p.secondary} strokeWidth="1.2" fill="none" opacity="0.3" />
        </svg>
      );

    case "new-delhi":
      return (
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Rajpath perspective lines */}
          <line x1="220" y1="270" x2="330" y2="200" stroke={p.accent} strokeWidth="1" opacity="0.25" />
          <line x1="400" y1="270" x2="330" y2="200" stroke={p.accent} strokeWidth="1" opacity="0.25" />
          {/* India Gate */}
          <rect x="300" y="130" width="60" height="110" rx="3" fill={p.primary} opacity="0.45" />
          <path d="M305 130 Q330 90 355 130" fill={p.secondary} opacity="0.5" />
          {/* Inner arch */}
          <path d="M312 240 Q330 200 348 240" fill="rgba(250,246,240,0.5)" />
          {/* Rashtrapati Bhavan dome (distant) */}
          <ellipse cx="330" cy="195" rx="12" ry="8" fill={p.secondary} opacity="0.25" />
          <rect x="322" y="195" width="16" height="12" rx="1" fill={p.accent} opacity="0.2" />
          {/* Flag */}
          <line x1="330" y1="90" x2="330" y2="75" stroke={p.secondary} strokeWidth="1.5" opacity="0.4" />
          <rect x="330" y="75" width="12" height="8" rx="1" fill={p.primary} opacity="0.35" />
          {/* Birds */}
          <path d="M240 65 Q244 61 248 65" stroke={p.secondary} strokeWidth="1.2" fill="none" opacity="0.3" />
          <path d="M260 55 Q263 52 266 55" stroke={p.secondary} strokeWidth="1" fill="none" opacity="0.2" />
        </svg>
      );

    case "mumbai":
      return (
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Water */}
          <path d="M200 270 Q280 260 360 270 Q380 275 400 270 L400 300 L200 300Z" fill={p.accent} opacity="0.35" />
          {/* Gateway of India */}
          <rect x="290" y="120" width="70" height="130" rx="3" fill={p.primary} opacity="0.45" />
          <path d="M295 120 Q325 80 355 120" fill={p.secondary} opacity="0.5" />
          {/* Inner arch */}
          <path d="M305 250 Q325 220 345 250" fill="rgba(244,247,250,0.4)" />
          {/* Towers */}
          <rect x="288" y="100" width="12" height="30" rx="2" fill={p.secondary} opacity="0.45" />
          <rect x="350" y="100" width="12" height="30" rx="2" fill={p.secondary} opacity="0.45" />
          {/* Taj dome (distant) */}
          <ellipse cx="380" cy="150" rx="15" ry="12" fill={p.accent} opacity="0.35" />
          <rect x="368" y="155" width="24" height="20" rx="2" fill={p.secondary} opacity="0.2" />
          {/* Boats */}
          <path d="M240 275 Q248 268 256 275" stroke={p.secondary} strokeWidth="1.2" fill="none" opacity="0.3" />
          <line x1="248" y1="275" x2="248" y2="266" stroke={p.secondary} strokeWidth="0.8" opacity="0.25" />
          {/* Birds */}
          <path d="M220 80 Q224 76 228 80" stroke={p.secondary} strokeWidth="1" fill="none" opacity="0.25" />
        </svg>
      );

    case "kolkata":
      return (
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* River */}
          <path d="M200 265 Q300 255 400 265 L400 300 L200 300Z" fill={p.accent} opacity="0.35" />
          <path d="M210 275 Q290 268 380 275" stroke={p.primary} strokeWidth="1" fill="none" opacity="0.2" />
          {/* Howrah Bridge — cantilever */}
          <path d="M260 160 L320 120 L380 160" stroke={p.primary} strokeWidth="3" fill="none" opacity="0.5" />
          <path d="M260 160 L280 120" stroke={p.secondary} strokeWidth="1.5" fill="none" opacity="0.35" />
          <path d="M380 160 L360 120" stroke={p.secondary} strokeWidth="1.5" fill="none" opacity="0.35" />
          {/* Bridge deck */}
          <rect x="255" y="160" width="130" height="8" rx="2" fill={p.primary} opacity="0.45" />
          {/* Pillars */}
          <rect x="258" y="160" width="10" height="100" rx="2" fill={p.secondary} opacity="0.4" />
          <rect x="377" y="160" width="10" height="100" rx="2" fill={p.secondary} opacity="0.4" />
          {/* Victoria Memorial dome (distant) */}
          <ellipse cx="230" cy="230" rx="18" ry="12" fill={p.accent} opacity="0.35" />
          <rect x="218" y="235" width="24" height="15" rx="2" fill={p.accent} opacity="0.25" />
          {/* Birds */}
          <path d="M210 80 Q214 76 218 80" stroke={p.secondary} strokeWidth="1.2" fill="none" opacity="0.3" />
          <path d="M230 70 Q233 67 236 70" stroke={p.secondary} strokeWidth="1" fill="none" opacity="0.2" />
        </svg>
      );

    case "lucknow":
      return (
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Rumi Darwaza — iconic gateway */}
          <rect x="290" y="100" width="80" height="150" rx="3" fill={p.primary} opacity="0.45" />
          {/* Main arch */}
          <path d="M300 250 Q330 190 360 250" fill={p.accent} opacity="0.6" />
          {/* Ornamental top — Mughal crown */}
          <path d="M285 100 Q330 60 375 100" fill={p.secondary} opacity="0.5" />
          <ellipse cx="330" cy="75" rx="12" ry="10" fill={p.primary} opacity="0.45" />
          {/* Pinnacle */}
          <line x1="330" y1="65" x2="330" y2="50" stroke={p.secondary} strokeWidth="2" opacity="0.5" />
          {/* Side turrets */}
          <rect x="282" y="85" width="14" height="60" rx="2" fill={p.secondary} opacity="0.4" />
          <rect x="374" y="85" width="14" height="60" rx="2" fill={p.secondary} opacity="0.4" />
          <ellipse cx="289" cy="85" rx="7" ry="6" fill={p.primary} opacity="0.4" />
          <ellipse cx="381" cy="85" rx="7" ry="6" fill={p.primary} opacity="0.4" />
          {/* Bara Imambara silhouette (distant) */}
          <rect x="220" y="200" width="50" height="40" rx="2" fill={p.accent} opacity="0.3" />
          <ellipse cx="245" cy="200" rx="20" ry="12" fill={p.accent} opacity="0.25" />
          {/* Decorative arches */}
          {[300, 320, 340].map((x) => (
            <path key={x} d={`M${x} 150 Q${x + 8} 140 ${x + 16} 150`} stroke={p.secondary} strokeWidth="1" fill="none" opacity="0.3" />
          ))}
          {/* Birds */}
          <path d="M210 70 Q214 66 218 70" stroke={p.secondary} strokeWidth="1.2" fill="none" opacity="0.3" />
          <path d="M230 60 Q233 57 236 60" stroke={p.secondary} strokeWidth="1" fill="none" opacity="0.25" />
        </svg>
      );

    default:
      // Generic placeholder for locked/future districts
      return (
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <circle cx="320" cy="150" r="50" fill={p.accent} opacity="0.2" />
          <circle cx="320" cy="150" r="35" fill={p.accent} opacity="0.15" />
          <circle cx="320" cy="150" r="20" fill={p.accent} opacity="0.1" />
          <path d="M250 270 Q320 240 400 260" stroke={p.accent} strokeWidth="1" fill="none" opacity="0.25" />
        </svg>
      );
  }
}

// ── Main hero component ──────────────────────────────────
interface DistrictHeroProps {
  stateSlug: string;
  districtSlug: string;
  districtName: string;
  stateName: string;
  districtNameLocal?: string;
  tagline?: string;
  badges?: DistrictBadge[];
  active?: boolean;
  stats: {
    population?: string;
    area?: string;
    literacy?: string;
    subDistrictCount?: number;
    subDistrictLabel: string;
  };
}

export default function DistrictHeroIllustration({
  stateSlug,
  districtSlug,
  districtName,
  stateName,
  districtNameLocal,
  tagline,
  badges,
  active = true,
  stats,
}: DistrictHeroProps) {
  const palette = PALETTES[districtSlug] ?? DEFAULT_PALETTE;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid #E8E8E4",
        minHeight: 220,
      }}
      className="hero-illustration"
    >
      {/* SVG background — right-aligned */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "60%",
          height: "100%",
          opacity: 0.9,
        }}
      >
        <DistrictSVG slug={districtSlug} p={palette} />
      </div>

      {/* Gradient overlay — left to right */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to right, rgba(${palette.gradientBase},0.97) 0%, rgba(${palette.gradientBase},0.92) 30%, rgba(${palette.gradientBase},0.65) 55%, rgba(${palette.gradientBase},0.2) 80%, rgba(${palette.gradientBase},0.05) 100%)`,
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, padding: "24px 28px 20px", maxWidth: "55%" }}>
        <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
          <MapPin size={11} />
          {stateName}
          {!active && (
            <span style={{ marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 6, fontSize: 11, color: "#EA580C" }}>
              Preview
            </span>
          )}
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.6px", margin: 0, lineHeight: 1.1 }}>
          {districtName}
        </h1>
        {districtNameLocal && (
          <div style={{ fontSize: 16, color: "#6B6B6B", fontFamily: "var(--font-regional)", marginTop: 4 }}>
            {districtNameLocal}
          </div>
        )}
        {tagline && (
          <div style={{ fontSize: 13, color: "#9B9B9B", marginTop: 6, fontStyle: "italic" }}>
            &ldquo;{tagline}&rdquo;
          </div>
        )}

        {/* Badges */}
        {badges && badges.length > 0 && <DistrictBadges badges={badges} districtSlug={districtSlug} />}

        {/* Stats strip */}
        <div className="stats-strip" style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap", minWidth: 0, overflow: "hidden" }}>
          {stats.population && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.4px", color: "#1A1A1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {stats.population}
              </div>
              <div style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Population</div>
            </div>
          )}
          {stats.area && (
            <div style={{ paddingLeft: 20, borderLeft: "1px solid #E8E8E4" }}>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.4px", color: "#1A1A1A" }}>
                {stats.area}
              </div>
              <div style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>km²</div>
            </div>
          )}
          {stats.literacy && (
            <div style={{ paddingLeft: 20, borderLeft: "1px solid #E8E8E4" }}>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.4px", color: "#1A1A1A" }}>
                {stats.literacy}
              </div>
              <div style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Literacy</div>
            </div>
          )}
          {stats.subDistrictCount != null && stats.subDistrictCount > 0 && (
            <div style={{ paddingLeft: 20, borderLeft: "1px solid #E8E8E4" }}>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.4px", color: "#1A1A1A" }}>
                {stats.subDistrictCount}
              </div>
              <div style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stats.subDistrictLabel}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
