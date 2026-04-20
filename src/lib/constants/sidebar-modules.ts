// ── ForThePeople.in — District Dashboard Modules ─────────────
//
// Single source of truth for sidebar + mobile nav. Each module has a
// civic-priority number (1 = top). Ordering is deterministic — nav
// components render SIDEBAR_MODULES sorted by priority, grouped into
// tiers via `tierFromPriority()`.
//
// Priority slot 30 is intentionally vacant — reserved for "Compare
// Districts" which is a standalone header link, not a module.

import {
  LayoutDashboard, Map, Users, Waves, Factory,
  PiggyBank, Wheat, BarChart3, Cloud, Shield,
  ScrollText, FileText, Vote, Bus, Droplets,
  Home, Zap, GraduationCap, Tractor,
  ClipboardList, FilePen, Building, Scale, Heart,
  AlertTriangle, Building2, Handshake, Newspaper,
  Database, Flame, Star, BookOpen, History, HardHat, Gavel,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SidebarModule {
  slug: string;
  label: string;
  emoji: string;
  icon: LucideIcon;
  description: string;
  /** 1 = top of sidebar, 37 = bottom. Gaps allowed. */
  priority: number;
}

export const SIDEBAR_MODULES: SidebarModule[] = [
  // ── Tier 1: Civic Duty (priorities 1–3) ───────────────────
  { slug: "responsibility",   label: "My Responsibility",   emoji: "🌱", icon: Flame,            description: "What YOU can do to improve your district", priority: 1 },
  { slug: "overview",         label: "Overview",            emoji: "📊", icon: LayoutDashboard,  description: "District summary, stats, weather", priority: 2 },
  { slug: "leadership",       label: "Leadership",          emoji: "👥", icon: Users,            description: "MP, MLAs, DC, SP, judges", priority: 3 },

  // ── Tier 2: Money & Resources (4–7) ──────────────────────
  { slug: "finance",          label: "Finance & Budget",    emoji: "💰", icon: PiggyBank,        description: "Budget breakdown, lapsed funds tracker", priority: 4 },
  { slug: "infrastructure",   label: "Infrastructure",      emoji: "🏗️", icon: HardHat,          description: "News-driven project tracker with timelines", priority: 5 },
  { slug: "tenders",          label: "Govt. Tenders",       emoji: "📑", icon: Gavel,            description: "Live tender tracker, red-flag indicators, apply guide", priority: 6 },
  { slug: "industries",       label: "Local Industries",    emoji: "🏭", icon: Factory,          description: "Sugar factories, arrears tracker", priority: 7 },

  // ── Tier 3: Daily Services (8–13) ────────────────────────
  { slug: "jjm",              label: "Water Supply (JJM)",  emoji: "💧", icon: Droplets,         description: "Jal Jeevan Mission tap connections", priority: 8 },
  { slug: "power",            label: "Power & Outages",     emoji: "⚡", icon: Zap,              description: "Scheduled cuts, DISCOM tracker", priority: 9 },
  { slug: "transport",        label: "Transport",           emoji: "🚌", icon: Bus,              description: "Bus routes, trains, auto fares", priority: 10 },
  { slug: "health",           label: "Health",              emoji: "🏥", icon: Heart,            description: "Hospitals, bed count, doctor ratio", priority: 11 },
  { slug: "schools",          label: "Schools",             emoji: "🎓", icon: GraduationCap,    description: "Board results, school directory", priority: 12 },
  { slug: "housing",          label: "Housing Schemes",     emoji: "🏠", icon: Home,             description: "PMAY tracker, completion rates", priority: 13 },

  // ── Tier 4: Accountability (14–18) ───────────────────────
  { slug: "police",           label: "Police & Traffic",    emoji: "👮", icon: Shield,           description: "Stations, traffic revenue, crime stats", priority: 14 },
  { slug: "courts",           label: "Courts",              emoji: "⚖️", icon: Scale,            description: "Case pendency, disposal rates", priority: 15 },
  { slug: "file-rti",         label: "File RTI",            emoji: "📜", icon: FilePen,          description: "Guided RTI wizard with templates", priority: 16 },
  { slug: "rti",              label: "RTI Tracker",         emoji: "🏛️", icon: ClipboardList,    description: "Filing trends, response times", priority: 17 },
  { slug: "contributors",     label: "Contributors",        emoji: "🤝", icon: Heart,            description: "People who support this district's data", priority: 18 },

  // ── Tier 5: Engagement (19–22) ───────────────────────────
  { slug: "schemes",          label: "Gov. Schemes",        emoji: "📋", icon: ScrollText,       description: "Active schemes, eligibility, apply links", priority: 19 },
  { slug: "services",         label: "Services Guide",      emoji: "📋", icon: FileText,         description: "How to get certificates, land records", priority: 20 },
  { slug: "exams",            label: "Exams & Jobs",        emoji: "📝", icon: BookOpen,         description: "Govt. exam notifications, eligibility, staffing data", priority: 21 },
  { slug: "elections",        label: "Elections",           emoji: "📊", icon: Vote,             description: "Results, turnout, booth finder", priority: 22 },

  // ── Tier 6: Local Info (23–29; slot 30 reserved) ─────────
  { slug: "famous-personalities", label: "Famous People",   emoji: "🌟", icon: Star,             description: "Notable people from this district", priority: 23 },
  { slug: "alerts",           label: "Local Alerts",        emoji: "⚠️", icon: AlertTriangle,    description: "Real-time advisories", priority: 24 },
  { slug: "offices",          label: "Offices & Services",  emoji: "🏢", icon: Building2,        description: "Govt offices, hours, open now", priority: 25 },
  { slug: "citizen-corner",   label: "Citizen Corner",      emoji: "🤝", icon: Handshake,        description: "Responsibility tips, helplines", priority: 26 },
  { slug: "news",             label: "News & Updates",      emoji: "📰", icon: Newspaper,        description: "Local news aggregated from RSS", priority: 27 },
  { slug: "data-sources",     label: "Data Sources",        emoji: "🔗", icon: Database,         description: "All official sources + data refresh status", priority: 28 },
  { slug: "update-log",       label: "Update Log",          emoji: "🕒", icon: History,          description: "Every data change, live", priority: 29 },

  // ── Tier 7: Maps & Data (31–37) ──────────────────────────
  { slug: "map",              label: "Interactive Map",     emoji: "🗺️", icon: Map,              description: "Drill-down map: state → district → taluk", priority: 31 },
  { slug: "population",       label: "Population",          emoji: "📈", icon: BarChart3,        description: "Census trends, literacy, sex ratio", priority: 32 },
  { slug: "weather",          label: "Weather & Rainfall",  emoji: "🌦️", icon: Cloud,            description: "Live weather, monsoon tracking", priority: 33 },
  { slug: "crops",            label: "Crop Prices",         emoji: "🌾", icon: Wheat,            description: "Live mandi prices from AGMARKNET", priority: 34 },
  { slug: "gram-panchayat",   label: "Gram Panchayat",      emoji: "🏘️", icon: Building,         description: "Village data, MGNREGA, funds", priority: 35 },
  { slug: "farm",             label: "Farm Advisory",       emoji: "🌾", icon: Tractor,          description: "Soil health, KVK crop advisory", priority: 36 },
  { slug: "water",            label: "Water & Dams",        emoji: "🚰", icon: Waves,            description: "Live dam levels, canal schedules", priority: 37 },
];

// Human-readable tier label for a priority number. Used to render section
// headings in the sidebar. Keep boundaries in sync with the priority blocks
// above — any reassignment also shifts the tier.
export function tierFromPriority(priority: number): string {
  if (priority <= 3) return "Civic Duty";
  if (priority <= 7) return "Money & Resources";
  if (priority <= 13) return "Daily Services";
  if (priority <= 18) return "Accountability";
  if (priority <= 22) return "Engagement";
  if (priority <= 29) return "Local Info";
  return "Maps & Data";
}

export const TIER_LABELS = [
  "Civic Duty",
  "Money & Resources",
  "Daily Services",
  "Accountability",
  "Engagement",
  "Local Info",
  "Maps & Data",
] as const;

/** Modules grouped by tier label, each group already sorted by priority. */
export function getTieredModules(): Array<{ label: string; modules: SidebarModule[] }> {
  // Plain Record instead of global Map — 'Map' is shadowed by the
  // lucide-react icon import at the top of this file.
  const sorted = [...SIDEBAR_MODULES].sort((a, b) => a.priority - b.priority);
  const byTier: Record<string, SidebarModule[]> = {};
  for (const m of sorted) {
    const t = tierFromPriority(m.priority);
    if (!byTier[t]) byTier[t] = [];
    byTier[t].push(m);
  }
  // Preserve the canonical tier order even if a tier is empty.
  return TIER_LABELS.filter((t) => byTier[t] !== undefined).map((label) => ({ label, modules: byTier[label] }));
}

/** Flat list of module slugs in priority order. Used by collapsed sidebars. */
export function getOrderedSlugs(): string[] {
  return [...SIDEBAR_MODULES].sort((a, b) => a.priority - b.priority).map((m) => m.slug);
}

// The 4 fixed tabs on mobile bottom-nav. Bottom-nav priority is different
// from sidebar priority — citizens glance here most frequently.
export const MOBILE_TAB_MODULES = ["overview", "crops", "weather", "news"] as const;
