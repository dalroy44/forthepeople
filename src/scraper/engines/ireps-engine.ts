// IREPS engine — Indian Railways ePS (ireps.gov.in)
// Listings-only scope. Bidding is DSC-gated and off limits for us.
// We filter by Zone=SWR (South Western Railway) and Division=Bengaluru/Mysuru
// for the Karnataka pilot.

import * as cheerio from "cheerio";
import { tenderFetch } from "./tender-http";
import type {
  EngineListOptions,
  EnginePortalConfig,
  RawTender,
  ScraperEngine,
} from "./types";

const ANON_SEARCH_PATH = "/epsn/anonymSearchTender.do";

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
  const m = t.match(/^(\d{2})-(\w{3})-(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (m) {
    const months: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    const mo = months[m[2]];
    if (mo !== undefined) return new Date(parseInt(m[3]), mo, parseInt(m[1]), m[4] ? parseInt(m[4]) : 0, m[5] ? parseInt(m[5]) : 0);
  }
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
}

function parseIrepsHtml(html: string, base: string): RawTender[] {
  const $ = cheerio.load(html);
  const out: RawTender[] = [];

  $("table").each((_i, table) => {
    const header = $(table).find("tr").first().text().toLowerCase();
    if (!header.includes("tender") || !(header.includes("close") || header.includes("deadline"))) return;
    $(table).find("tr").slice(1).each((_j, tr) => {
      const cells = $(tr).find("td");
      if (cells.length < 4) return;
      const cellText = cells.toArray().map((c) => $(c).text().trim());
      const rowText = cellText.join(" | ");

      // SWR filter: keep rows that mention South Western Railway / Bengaluru / Mysuru
      if (!/south western|swr|bengaluru|bangalore|mysuru|mysore/i.test(rowText)) return;

      const titleLink = $(cells).find("a").first();
      const title = titleLink.text().trim() || cellText[2] || "";
      if (!title) return;
      const href = titleLink.attr("href") ?? "";

      const nitRef = cellText.find((t) => /IREPS|Tender|\bRef\b/i.test(t) && /\d/.test(t)) ?? cellText[0];
      const dateCells = cellText.map(parseDate).filter((d): d is Date => d !== null);
      const published = dateCells[0] ?? null;
      const closing = dateCells.length > 1 ? dateCells[dateCells.length - 1] : null;
      const valueCell = cellText.find((t) => /₹|INR|Rs\.?/i.test(t));
      const district = /mysuru|mysore/i.test(rowText) ? "Mysuru" : "Bengaluru Urban";

      out.push({
        sourcePortal: "IREPS",
        sourceTenderId: (nitRef ?? title).slice(0, 120),
        sourceUrl: href ? abs(base, href) : base,
        nitRefNumber: nitRef ?? null,
        title,
        workType: /works|construction|track|bridge/i.test(title) ? "WORKS" : /supply|goods|equipment/i.test(title) ? "GOODS" : "SERVICES",
        procurementType: "OPEN",
        authorityName: /mysuru|mysore/i.test(rowText) ? "South Western Railway — Mysuru Division" : "South Western Railway — Bengaluru Division",
        estimatedValueInr: parseCurrencyInr(valueCell),
        publishedAt: published,
        bidSubmissionEnd: closing ?? undefined,
        locationState: "Karnataka",
        locationDistrict: district,
        status: closing && closing.getTime() > Date.now() ? "OPEN_FOR_BIDS" : "BID_CLOSED",
      });
    });
  });

  return out;
}

export const irepsEngine: ScraperEngine = {
  engineType: "ireps",

  async listTenders(cfg: EnginePortalConfig, opts: EngineListOptions): Promise<RawTender[]> {
    const url = cfg.baseUrl.replace(/\/$/, "") + ANON_SEARCH_PATH;
    const res = await tenderFetch(url, {
      portalCode: cfg.portalCode,
      rateLimitSeconds: cfg.rateLimitSeconds,
      maxRequestsPerDay: cfg.maxRequestsPerDay,
    });

    if (!res.ok) {
      const reason = res.blocked ?? (res.status === 0 ? (res.error ?? "network") : `HTTP ${res.status}`);
      console.warn(`[IREPS] listTenders blocked: ${reason} (attempts=${res.attempts})`);
      return [];
    }

    const parsed = parseIrepsHtml(res.body, url);
    const limited = opts.limit ? parsed.slice(0, opts.limit) : parsed;
    return limited;
  },
};
