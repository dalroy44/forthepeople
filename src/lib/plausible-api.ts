/**
 * ForThePeople.in — Plausible Stats API client
 * Docs: https://plausible.io/docs/stats-api
 *
 * Env vars:
 *   PLAUSIBLE_API_KEY   — from plausible.io → Settings → API Keys
 *   PLAUSIBLE_SITE_ID   — your site domain in Plausible (default: forthepeople.in)
 */

const PLAUSIBLE_API_BASE = "https://plausible.io/api/v1/stats";

export type PlausiblePeriod = "day" | "7d" | "30d" | "90d" | "month" | "year";

export interface PlausibleAggregate {
  visitors?: { value: number };
  pageviews?: { value: number };
  bounce_rate?: { value: number };
  visit_duration?: { value: number };
}

export interface PlausibleBreakdownRow {
  [k: string]: string | number;
  visitors: number;
}

export interface PlausibleBreakdown {
  results: PlausibleBreakdownRow[];
}

export interface PlausibleData {
  configured: boolean;
  siteId?: string;
  error?: string;
  realtimeVisitors?: number;
  aggregate?: PlausibleAggregate;
  topPages?: PlausibleBreakdown;
  topReferrers?: PlausibleBreakdown;
  deviceBreakdown?: PlausibleBreakdown;
  countryBreakdown?: PlausibleBreakdown;
}

const siteId = () => process.env.PLAUSIBLE_SITE_ID || "forthepeople.in";
const headers = () => ({ Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY}` });

async function safeFetch<T>(url: string): Promise<T | null> {
  if (!process.env.PLAUSIBLE_API_KEY) return null;
  try {
    const res = await fetch(url, { headers: headers(), cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getRealtimeVisitors(): Promise<number> {
  const r = await safeFetch<number>(
    `${PLAUSIBLE_API_BASE}/realtime/visitors?site_id=${encodeURIComponent(siteId())}`
  );
  return typeof r === "number" ? r : 0;
}

export async function getAggregate(period: PlausiblePeriod = "30d"): Promise<PlausibleAggregate | null> {
  const json = await safeFetch<{ results: PlausibleAggregate }>(
    `${PLAUSIBLE_API_BASE}/aggregate?site_id=${encodeURIComponent(
      siteId()
    )}&period=${period}&metrics=visitors,pageviews,bounce_rate,visit_duration`
  );
  return json?.results ?? null;
}

export async function getBreakdown(
  property: string,
  period: PlausiblePeriod = "30d",
  limit = 10
): Promise<PlausibleBreakdown | null> {
  return safeFetch<PlausibleBreakdown>(
    `${PLAUSIBLE_API_BASE}/breakdown?site_id=${encodeURIComponent(
      siteId()
    )}&period=${period}&property=${encodeURIComponent(property)}&limit=${limit}&metrics=visitors`
  );
}

export async function fetchAllPlausibleData(period: PlausiblePeriod = "30d"): Promise<PlausibleData> {
  if (!process.env.PLAUSIBLE_API_KEY) {
    return { configured: false };
  }

  const [realtimeVisitors, aggregate, topPages, topReferrers, deviceBreakdown, countryBreakdown] =
    await Promise.all([
      getRealtimeVisitors(),
      getAggregate(period),
      getBreakdown("event:page", period, 10),
      getBreakdown("visit:source", period, 10),
      getBreakdown("visit:device", period, 5),
      getBreakdown("visit:country", period, 10),
    ]);

  return {
    configured: true,
    siteId: siteId(),
    realtimeVisitors,
    aggregate: aggregate ?? undefined,
    topPages: topPages ?? undefined,
    topReferrers: topReferrers ?? undefined,
    deviceBreakdown: deviceBreakdown ?? undefined,
    countryBreakdown: countryBreakdown ?? undefined,
  };
}
