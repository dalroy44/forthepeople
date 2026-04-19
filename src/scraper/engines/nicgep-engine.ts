// NICGEP engine — reusable for CPPP (eprocure.gov.in), defproc.gov.in,
// and BEL's NIC instance (eprocurebel.co.in). All three ride the same
// NIC GePNIC servlet template, so one engine handles them via per-portal
// config. JSESSIONID persists across requests within a run.

import * as cheerio from "cheerio";
import { tenderFetch } from "./tender-http";
import type {
  EngineListOptions,
  EnginePortalConfig,
  RawTender,
  ScraperEngine,
} from "./types";

// GePNIC query-string path. Orchestrator supplies baseUrl already pointing
// at the /eprocure/app entry (or equivalent), so we just append the query.
const LIST_QUERY = "?page=FrontEndLatestActiveTenders&service=page";
const ARCHIVE_QUERY = "?page=FrontEndTendersInArchive&service=page";

function abs(base: string, href: string): string {
  try { return new URL(href, base).toString(); } catch { return href; }
}

function parseCurrencyInr(text: string | undefined): bigint | null {
  if (!text) return null;
  const cleaned = text.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const val = parseFloat(cleaned);
  if (!isFinite(val) || val <= 0) return null;
  return BigInt(Math.round(val));
}

function parseDate(text: string | undefined): Date | null {
  if (!text) return null;
  const t = text.trim();
  // NIC GePNIC commonly renders dd-MMM-yyyy HH:mm
  const m = t.match(/^(\d{2})[-/](\w{3,})[-/](\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (m) {
    const months: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11,January:0,February:1,March:2,April:3,June:5,July:6,August:7,September:8,October:9,November:10,December:11 };
    const mo = months[m[2]];
    if (mo !== undefined) return new Date(parseInt(m[3]), mo, parseInt(m[1]), m[4] ? parseInt(m[4]) : 0, m[5] ? parseInt(m[5]) : 0);
  }
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
}

// Heuristic Karnataka location detector — used only when the engine is
// CPPP/defproc and we need to filter by state. BEL and defproc are
// all-India portals. When listing for Karnataka, we select tenders whose
// organisation or location cell mentions Karnataka/Bengaluru/Mysuru/Mandya.
function looksKarnataka(text: string): boolean {
  return /karnataka|bengaluru|bangalore|mysuru|mysore|mandya|hubli|mangalore|belagavi|tumakuru/i.test(text);
}

function inferDistrict(text: string): string {
  const t = text.toLowerCase();
  if (/bengaluru|bangalore/.test(t)) return "Bengaluru Urban";
  if (/mysuru|mysore/.test(t)) return "Mysuru";
  if (/mandya/.test(t)) return "Mandya";
  return "Unknown";
}

function parseNicgepHtml(html: string, base: string, portalCode: string, filterKarnataka: boolean): RawTender[] {
  const $ = cheerio.load(html);
  const out: RawTender[] = [];

  $("table").each((_i, table) => {
    const header = $(table).find("tr").first().text().toLowerCase();
    if (!header.includes("tender") || !header.includes("closing")) return;
    $(table).find("tr").slice(1).each((_j, tr) => {
      const cells = $(tr).find("td");
      if (cells.length < 4) return;
      const cellText = cells.toArray().map((c) => $(c).text().trim());
      const rowText = cellText.join(" | ");
      if (filterKarnataka && !looksKarnataka(rowText)) return;

      const titleLink = $(cells).find("a").first();
      const title = titleLink.text().trim() || cellText[2] || cellText[1] || "";
      if (!title) return;
      const href = titleLink.attr("href") ?? "";

      const nitRef = cellText.find((t) => /NIT|Tender Id|Tender No/i.test(t) && /\d/.test(t)) ?? cellText[1];
      const dateCells = cellText.map(parseDate).filter((d): d is Date => d !== null);
      const closing = dateCells.length > 0 ? dateCells[dateCells.length - 1] : null;
      const published = dateCells.length > 1 ? dateCells[0] : null;
      const valueCell = cellText.find((t) => /₹|INR|Rs\.?/i.test(t));
      const orgCell = cellText.find((t) => /ministry|department|railway|authority|corp/i.test(t)) ?? "";

      out.push({
        sourcePortal: portalCode,
        sourceTenderId: (nitRef ?? title).slice(0, 120),
        sourceUrl: href ? abs(base, href) : base,
        nitRefNumber: nitRef ?? null,
        title,
        workType: /supply|goods|equipment/i.test(title) ? "GOODS" : /service|consult/i.test(title) ? "SERVICES" : "WORKS",
        procurementType: "OPEN",
        authorityName: orgCell || undefined,
        estimatedValueInr: parseCurrencyInr(valueCell),
        publishedAt: published,
        bidSubmissionEnd: closing ?? undefined,
        locationState: "Karnataka",
        locationDistrict: inferDistrict(rowText),
        status: closing && closing.getTime() > Date.now() ? "OPEN_FOR_BIDS" : "BID_CLOSED",
      });
    });
  });

  return out;
}

export const nicgepEngine: ScraperEngine = {
  engineType: "nicgep",

  async listTenders(cfg: EnginePortalConfig, opts: EngineListOptions): Promise<RawTender[]> {
    const url = cfg.baseUrl.replace(/\/$/, "") + LIST_QUERY;
    const res = await tenderFetch(url, {
      portalCode: cfg.portalCode,
      rateLimitSeconds: cfg.rateLimitSeconds,
      maxRequestsPerDay: cfg.maxRequestsPerDay,
    });

    if (!res.ok) {
      const reason = res.blocked ?? (res.status === 0 ? (res.error ?? "network") : `HTTP ${res.status}`);
      console.warn(`[${cfg.portalCode}] NICGEP listTenders blocked: ${reason} (attempts=${res.attempts})`);
      return [];
    }

    // CPPP is an all-India portal so we keep only Karnataka rows when scraping
    // for Karnataka. BEL/defproc are national but we filter by org wording too.
    const filterKA = cfg.portalCode === "CPPP" || cfg.portalCode === "DEFPROC" || cfg.portalCode === "BEL_NIC";
    const parsed = parseNicgepHtml(res.body, url, cfg.portalCode, filterKA);
    const limited = opts.limit ? parsed.slice(0, opts.limit) : parsed;
    return limited;
  },
};

export const nicgepEngineArchive = {
  // Convenience helper — same engine, archive listing URL. Orchestrator calls
  // this on a slower cadence to backfill awarded/closed tenders.
  async listArchive(cfg: EnginePortalConfig): Promise<RawTender[]> {
    const url = cfg.baseUrl.replace(/\/$/, "") + ARCHIVE_QUERY;
    const res = await tenderFetch(url, {
      portalCode: cfg.portalCode,
      rateLimitSeconds: cfg.rateLimitSeconds,
      maxRequestsPerDay: cfg.maxRequestsPerDay,
    });
    if (!res.ok) return [];
    return parseNicgepHtml(res.body, url, cfg.portalCode, true);
  },
};
