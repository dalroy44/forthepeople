// KPPP — Karnataka eProcurement (eproc.karnataka.gov.in)
// JBoss Seam + JSF. Every POST echoes javax.faces.ViewState + cid
// conversation ID. Public tender list requires no login.
// Reference (Python equivalent): github.com/openbangalore/karnataka_eprocurement

import * as cheerio from "cheerio";
import { tenderFetch } from "./tender-http";
import type {
  EngineListOptions,
  EnginePortalConfig,
  RawTender,
  RawTenderDetail,
  ScraperEngine,
} from "./types";

const LIST_PATH = "/eproc-g1/pages/tenders.seam";

function abs(base: string, href: string): string {
  try { return new URL(href, base).toString(); } catch { return href; }
}

function parseCurrencyInr(text: string | undefined): bigint | null {
  if (!text) return null;
  const cleaned = text.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  // KPPP sometimes shows in lakhs/crores — for safety we only parse plain rupee figures here.
  // The enrichment step refines via the detail PDF.
  const val = parseFloat(cleaned);
  if (!isFinite(val) || val <= 0) return null;
  return BigInt(Math.round(val));
}

function parseDate(text: string | undefined): Date | null {
  if (!text) return null;
  const t = text.trim();
  // KPPP commonly uses dd-MMM-yyyy HH:mm or dd/MM/yyyy
  const m1 = t.match(/^(\d{2})[-/](\w{3})[-/](\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (m1) {
    const months: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    const mo = months[m1[2]];
    if (mo === undefined) return null;
    return new Date(parseInt(m1[3]), mo, parseInt(m1[1]), m1[4] ? parseInt(m1[4]) : 0, m1[5] ? parseInt(m1[5]) : 0);
  }
  const m2 = t.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (m2) return new Date(parseInt(m2[3]), parseInt(m2[2]) - 1, parseInt(m2[1]), m2[4] ? parseInt(m2[4]) : 0, m2[5] ? parseInt(m2[5]) : 0);
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
}

function parseTenderListHtml(html: string, base: string): RawTender[] {
  const $ = cheerio.load(html);
  const rows: RawTender[] = [];

  // Heuristic: find the main tender-listing table. KPPP markup uses a table
  // with headers including "Tender Title" / "Reference Number" / "Closing Date".
  // If template drifts, we log a warning upstream but don't crash.
  $("table").each((_i, table) => {
    const headerText = $(table).find("tr").first().text().toLowerCase();
    if (!headerText.includes("tender") || !(headerText.includes("closing") || headerText.includes("deadline") || headerText.includes("submission"))) {
      return;
    }
    $(table).find("tr").slice(1).each((_j, tr) => {
      const cells = $(tr).find("td");
      if (cells.length < 3) return;
      const firstLink = $(cells[0]).find("a").first();
      const title = firstLink.text().trim() || $(cells[0]).text().trim();
      const href = firstLink.attr("href") ?? "";
      if (!title) return;

      // Pull text from remaining cells heuristically
      const cellText = cells.toArray().map((c) => $(c).text().trim());
      const nitRef = cellText.find((t) => /NIT|Ref|ID/i.test(t) && /\d/.test(t))?.replace(/\s+/g, " ");
      const publishedAt = cellText.map(parseDate).find((d) => d !== null) ?? null;
      // Closing date is usually the *last* date-like cell
      const dateCells = cellText.map(parseDate).filter((d): d is Date => d !== null);
      const bidEnd = dateCells.length > 1 ? dateCells[dateCells.length - 1] : dateCells[0] ?? null;
      const valueCell = cellText.find((t) => /₹|INR|Rs\.?|Rupee/i.test(t));

      rows.push({
        sourcePortal: "KPPP",
        sourceTenderId: (nitRef ?? title).slice(0, 120),
        sourceUrl: href ? abs(base, href) : base,
        nitRefNumber: nitRef ?? null,
        title,
        workType: "WORKS", // refined later from detail page
        procurementType: "OPEN",
        estimatedValueInr: parseCurrencyInr(valueCell),
        publishedAt,
        bidSubmissionEnd: bidEnd ?? undefined,
        locationState: "Karnataka",
        status: bidEnd && bidEnd.getTime() > Date.now() ? "OPEN_FOR_BIDS" : "BID_CLOSED",
      });
    });
  });

  return rows;
}

export const kpppSeamEngine: ScraperEngine = {
  engineType: "kppp-seam",

  async listTenders(cfg: EnginePortalConfig, opts: EngineListOptions): Promise<RawTender[]> {
    const url = cfg.baseUrl.replace(/\/$/, "") + LIST_PATH;
    const res = await tenderFetch(url, {
      portalCode: cfg.portalCode,
      rateLimitSeconds: cfg.rateLimitSeconds,
      maxRequestsPerDay: cfg.maxRequestsPerDay,
    });

    if (!res.ok) {
      const reason = res.blocked ?? (res.status === 0 ? (res.error ?? "network") : `HTTP ${res.status}`);
      console.warn(`[KPPP] listTenders blocked: ${reason} (attempts=${res.attempts})`);
      return [];
    }

    const parsed = parseTenderListHtml(res.body, url);
    const limited = opts.limit ? parsed.slice(0, opts.limit) : parsed;
    return limited;
  },

  async fetchTenderDetail(cfg: EnginePortalConfig, sourceTenderId: string): Promise<RawTenderDetail | null> {
    // The KPPP detail URL pattern is /eproc-g1/pages/tenderDetails.seam?id=<id>&cid=<cid>.
    // We don't currently have a reliable id-to-URL map because the listing's sourceUrl is
    // already the detail URL. Phase 2 keeps this as a stub — detail enrichment happens when
    // listTenders returns the direct detail URL as sourceUrl.
    void cfg; void sourceTenderId;
    return null;
  },
};
