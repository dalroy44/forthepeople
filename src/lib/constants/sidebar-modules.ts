// ── ForThePeople.in — 30 Dashboard Modules ───────────────
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
  group: "core" | "civic" | "welfare" | "info";
}

export const SIDEBAR_MODULES: SidebarModule[] = [
  // ── Core ─────────────────────────────────────────────────
  { slug: "overview",         label: "Overview",            emoji: "📊", icon: LayoutDashboard,  description: "District summary, stats, weather", group: "core" },
  { slug: "map",              label: "Interactive Map",     emoji: "🗺️", icon: Map,              description: "Drill-down map: state → district → taluk", group: "core" },
  { slug: "leadership",       label: "Leadership",          emoji: "👥", icon: Users,            description: "MP, MLAs, DC, SP, judges", group: "core" },
  { slug: "water",            label: "Water & Dams",        emoji: "🚰", icon: Waves,            description: "Live dam levels, canal schedules", group: "core" },
  { slug: "industries",       label: "Local Industries",    emoji: "🏭", icon: Factory,          description: "Sugar factories, arrears tracker", group: "core" },
  { slug: "finance",          label: "Finance & Budget",    emoji: "💰", icon: PiggyBank,        description: "Budget breakdown, lapsed funds tracker", group: "core" },
  { slug: "infrastructure",   label: "Infrastructure",      emoji: "🏗️", icon: HardHat,          description: "News-driven project tracker with timelines", group: "core" },
  { slug: "tenders",          label: "Govt. Tenders",       emoji: "📑", icon: Gavel,            description: "Live tender tracker, red-flag indicators, apply guide", group: "core" },
  { slug: "crops",            label: "Crop Prices",         emoji: "🌾", icon: Wheat,            description: "Live mandi prices from AGMARKNET", group: "core" },
  { slug: "population",       label: "Population",          emoji: "📈", icon: BarChart3,        description: "Census trends, literacy, sex ratio", group: "core" },
  { slug: "weather",          label: "Weather & Rainfall",  emoji: "🌦️", icon: Cloud,            description: "Live weather, monsoon tracking", group: "core" },
  { slug: "police",           label: "Police & Traffic",    emoji: "👮", icon: Shield,           description: "Stations, traffic revenue, crime stats", group: "core" },

  // ── Civic ────────────────────────────────────────────────
  { slug: "schemes",          label: "Gov. Schemes",        emoji: "📋", icon: ScrollText,       description: "Active schemes, eligibility, apply links", group: "civic" },
  { slug: "exams",            label: "Exams & Jobs",         emoji: "📝", icon: BookOpen,         description: "Govt. exam notifications, eligibility, staffing data", group: "civic" },
  { slug: "services",         label: "Services Guide",      emoji: "📋", icon: FileText,         description: "How to get certificates, land records", group: "civic" },
  { slug: "elections",        label: "Elections",           emoji: "📊", icon: Vote,             description: "Results, turnout, booth finder", group: "civic" },
  { slug: "transport",        label: "Transport",           emoji: "🚌", icon: Bus,              description: "Bus routes, trains, auto fares", group: "civic" },
  { slug: "jjm",              label: "Water Supply (JJM)",  emoji: "💧", icon: Droplets,         description: "Jal Jeevan Mission tap connections", group: "civic" },
  { slug: "housing",          label: "Housing Schemes",     emoji: "🏠", icon: Home,             description: "PMAY tracker, completion rates", group: "civic" },
  { slug: "power",            label: "Power & Outages",     emoji: "⚡", icon: Zap,              description: "Scheduled cuts, DISCOM tracker", group: "civic" },
  { slug: "schools",          label: "Schools",             emoji: "🎓", icon: GraduationCap,    description: "Board results, school directory", group: "civic" },
  { slug: "farm",             label: "Farm Advisory",       emoji: "🌾", icon: Tractor,          description: "Soil health, KVK crop advisory", group: "civic" },
  { slug: "rti",              label: "RTI Tracker",         emoji: "🏛️", icon: ClipboardList,    description: "Filing trends, response times", group: "civic" },
  { slug: "file-rti",         label: "File RTI",            emoji: "📜", icon: FilePen,          description: "Guided RTI wizard with templates", group: "civic" },

  // ── Welfare ──────────────────────────────────────────────
  { slug: "gram-panchayat",   label: "Gram Panchayat",      emoji: "🏘️", icon: Building,         description: "Village data, MGNREGA, funds", group: "welfare" },
  { slug: "courts",           label: "Courts",              emoji: "⚖️", icon: Scale,            description: "Case pendency, disposal rates", group: "welfare" },
  { slug: "health",           label: "Health",              emoji: "🏥", icon: Heart,            description: "Hospitals, bed count, doctor ratio", group: "welfare" },

  // ── Info ─────────────────────────────────────────────────
  { slug: "famous-personalities", label: "Famous People",   emoji: "🌟", icon: Star,             description: "Notable people from this district", group: "info" },
  { slug: "alerts",           label: "Local Alerts",        emoji: "⚠️", icon: AlertTriangle,    description: "Real-time advisories", group: "info" },
  { slug: "offices",          label: "Offices & Services",  emoji: "🏢", icon: Building2,        description: "Govt offices, hours, open now", group: "info" },
  { slug: "citizen-corner",   label: "Citizen Corner",      emoji: "🤝", icon: Handshake,        description: "Responsibility tips, helplines", group: "info" },
  { slug: "responsibility",   label: "My Responsibility",   emoji: "🌱", icon: Flame,            description: "What YOU can do to improve your district", group: "info" },
  { slug: "news",             label: "News & Updates",      emoji: "📰", icon: Newspaper,        description: "Local news aggregated from RSS", group: "info" },
  { slug: "data-sources",     label: "Data Sources",        emoji: "🔗", icon: Database,         description: "All official sources + data refresh status", group: "info" },
  { slug: "update-log",       label: "Update Log",          emoji: "🕒", icon: History,          description: "Every data change, live", group: "info" },
  { slug: "contributors",     label: "Contributors",        emoji: "🤝", icon: Heart,            description: "People who support this district's data", group: "info" },
];

// The 5 modules shown in mobile bottom nav
// "responsibility" replaces "schemes" — citizen engagement over passive scheme listing
export const MOBILE_TAB_MODULES = ["overview", "crops", "weather", "news", "responsibility"] as const;
