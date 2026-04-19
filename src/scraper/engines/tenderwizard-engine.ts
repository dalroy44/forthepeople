// TenderWizard / Antares engine — HAL portal (eproc.hal-india.co.in).
// Different URL + markup shape from NICGEP: form-based search landing,
// listing lives at /TenderSearch.aspx-style entries. Lower volume than
// CPPP/KPPP, so a 60-minute cadence is sufficient.

import * as cheerio from "cheerio";
import { tenderFetch } from "./tender-http";
import type {
  EngineListOptions,
  EnginePortalConfig,
  RawTender,
  ScraperEngine,
} from "./types";

const TW_LIST_PATHS = ["/TenderSearch.aspx", "/FrontEndTenderSearch.aspx", "/"];

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
  const m1 = t.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (m1) return new Date(parseInt(m1[3]), parseInt(m1[2]) - 1, parseInt(m1[1]), m1[4] ? parseInt(m1[4]) : 0, m1[5] ? parseInt(m1[5]) : 0);
  const m2 = t.match(/^(\d{2})[- ](\w{3})[- ](\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (m2) {
    const months: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    const mo = months[m2[2]];
    if (mo !== undefined) return new Date(parseInt(m2[3]), mo, parseInt(m2[1]), m2[4] ? parseInt(m2[4]) : 0, m2[5] ? parseInt(m2[5]) : 0);
  }
  return null;
}

function parseTwHtml(html: string, base: string): RawTender[] {
  const $ = cheerio.load(html);
  const out: RawTender[] = [];

  $("table").each((_i, table) => {
    const header = $(table).find("tr").first().text().toLowerCase();
    // TenderWizard commonly uses columns like "Tender Ref No", "Title", "Closing Date"
    if (!header.includes("tender") || !(header.includes("closing") || header.includes("last date") || header.includes("due date"))) return;
    $(table).find("tr").slice(1).each((_j, tr) => {
      const cells = $(tr).find("td");
      if (cells.length < 3) return;
      const cellText = cells.toArray().map((c) => $(c).text().trim());
      const titleLink = $(cells).find("a").first();
      const title = titleLink.text().trim() || cellText[1] || "";
      if (!title) return;
      const href = titleLink.attr("href") ?? "";

      const nitRef = cellText.find((t) => /HAL|Ref|Tender No/i.test(t) && /\d/.test(t)) ?? cellText[0];
      const dateCells = cellText.map(parseDate).filter((d): d is Date => d !== null);
      const published = dateCells[0] ?? null;
      const closing = dateCells.length > 1 ? dateCells[dateCells.length - 1] : null;
      const valueCell = cellText.find((t) => /₹|INR|Rs\.?/i.test(t));

      out.push({
        sourcePortal: "HAL_TW",
        sourceTenderId: (nitRef ?? title).slice(0, 120),
        sourceUrl: href ? abs(base, href) : base,
        nitRefNumber: nitRef ?? null,
        title,
        workType: /supply|goods|equipment|spare/i.test(title) ? "GOODS" : /service|maintenance|housekeep/i.test(title) ? "SERVICES" : "WORKS",
        procurementType: "OPEN",
        authorityName: "Hindustan Aeronautics Limited",
        estimatedValueInr: parseCurrencyInr(valueCell),
        publishedAt: published,
        bidSubmissionEnd: closing ?? undefined,
        locationState: "Karnataka",
        locationDistrict: "Bengaluru Urban",
        status: closing && closing.getTime() > Date.now() ? "OPEN_FOR_BIDS" : "BID_CLOSED",
      });
    });
  });

  return out;
}

export const tenderWizardEngine: ScraperEngine = {
  engineType: "tenderwizard",

  async listTenders(cfg: EnginePortalConfig, opts: EngineListOptions): Promise<RawTender[]> {
    // Try the known candidate paths in order — portals running TenderWizard
    // vary slightly in entry URL. First one that returns parseable data wins.
    for (const path of TW_LIST_PATHS) {
      const url = cfg.baseUrl.replace(/\/$/, "") + path;
      const res = await tenderFetch(url, {
        portalCode: cfg.portalCode,
        rateLimitSeconds: cfg.rateLimitSeconds,
        maxRequestsPerDay: cfg.maxRequestsPerDay,
      });
      if (!res.ok) continue;
      const parsed = parseTwHtml(res.body, url);
      if (parsed.length > 0) {
        return opts.limit ? parsed.slice(0, opts.limit) : parsed;
      }
    }
    console.warn(`[${cfg.portalCode}] TenderWizard listTenders: no candidate URL yielded parseable data.`);
    return [];
  },
};
