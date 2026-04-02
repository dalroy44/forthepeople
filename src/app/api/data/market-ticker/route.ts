/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Market Ticker API
// GET /api/data/market-ticker
// Free data: Yahoo Finance + open.er-api.com + goodreturns.in
// Redis cache: 5 min market hours, 30 min after hours
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";

const CACHE_KEY = "ftp:market-ticker:v2";
// Fuel prices removed — not universal across districts

export interface TickerItem {
  symbol: string;
  label: string;
  value: string;
  change: string;
  changePct: number;
  direction: "up" | "down" | "flat";
  unit: string;
}

// IST offset = UTC+5:30
function isMarketHours(): boolean {
  const now = new Date();
  const istHour = (now.getUTCHours() + 5) % 24;
  const istMin = (now.getUTCMinutes() + 30) % 60;
  const istTotalMin = istHour * 60 + istMin;
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  // 9:15 AM to 3:30 PM IST
  return istTotalMin >= 555 && istTotalMin <= 930;
}

function getCacheTTL(): number {
  return isMarketHours() ? 300 : 1800;
}

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://finance.yahoo.com",
  Referer: "https://finance.yahoo.com",
};

async function fetchYahooQuote(
  ticker: string
): Promise<{ price: number; change: number; changePct: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: YAHOO_HEADERS,
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? meta.previousClose;
    const prev = meta.previousClose ?? meta.chartPreviousClose;
    const change = price - prev;
    const changePct = (change / prev) * 100;
    return { price, change, changePct };
  } catch {
    return null;
  }
}

async function fetchUSDINR(): Promise<{ rate: number; changePct: number } | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rate = json?.rates?.INR;
    if (!rate) return null;
    // open.er-api doesn't give change, use small estimated variation
    return { rate, changePct: 0 };
  } catch {
    return null;
  }
}

// Fuel prices (petrol/LPG) removed — they are city-specific, not universal

// Fallback static data (last known realistic values — used when all sources fail)
// Fallback static data (last known realistic values — used when all sources fail)
const FALLBACK: TickerItem[] = [
  { symbol: "SENSEX", label: "Sensex", value: "74,248", change: "+312", changePct: 0.42, direction: "up", unit: "" },
  { symbol: "NIFTY50", label: "Nifty 50", value: "22,519", change: "+87", changePct: 0.39, direction: "up", unit: "" },
  { symbol: "GOLD", label: "Gold", value: "₹93,450", change: "-120", changePct: -0.13, direction: "down", unit: "/10g" },
  { symbol: "SILVER", label: "Silver", value: "₹97,800", change: "+450", changePct: 0.46, direction: "up", unit: "/kg" },
  { symbol: "USD_INR", label: "USD/INR", value: "₹84.52", change: "+0.08", changePct: 0.09, direction: "up", unit: "" },
  { symbol: "CRUDE", label: "Crude", value: "$78.40", change: "-0.90", changePct: -1.14, direction: "down", unit: "/bbl" },
];

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

export async function GET() {
  // Check cache first
  const cached = await cacheGet<{ items: TickerItem[]; asOf: string; fromCache: boolean }>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  const items: TickerItem[] = [];
  let fetchedAny = false;

  // Sensex
  const sensex = await fetchYahooQuote("^BSESN");
  if (sensex) {
    fetchedAny = true;
    items.push({
      symbol: "SENSEX",
      label: "Sensex",
      value: fmt(Math.round(sensex.price)),
      change: `${sensex.change >= 0 ? "+" : ""}${fmt(Math.round(sensex.change))}`,
      changePct: sensex.changePct,
      direction: sensex.change > 0 ? "up" : sensex.change < 0 ? "down" : "flat",
      unit: "",
    });
  }

  // Nifty 50
  const nifty = await fetchYahooQuote("^NSEI");
  if (nifty) {
    fetchedAny = true;
    items.push({
      symbol: "NIFTY50",
      label: "Nifty 50",
      value: fmt(Math.round(nifty.price)),
      change: `${nifty.change >= 0 ? "+" : ""}${fmt(Math.round(nifty.change))}`,
      changePct: nifty.changePct,
      direction: nifty.change > 0 ? "up" : nifty.change < 0 ? "down" : "flat",
      unit: "",
    });
  }

  // USD/INR
  const usd = await fetchUSDINR();
  if (usd) {
    fetchedAny = true;
    items.push({
      symbol: "USD_INR",
      label: "USD/INR",
      value: `₹${fmt(usd.rate, 2)}`,
      change: "–",
      changePct: 0,
      direction: "flat",
      unit: "",
    });
  }

  // Crude oil
  const crude = await fetchYahooQuote("CL=F");
  if (crude) {
    fetchedAny = true;
    items.push({
      symbol: "CRUDE",
      label: "Crude",
      value: `$${fmt(crude.price, 2)}`,
      change: `${crude.change >= 0 ? "+" : ""}${fmt(crude.change, 2)}`,
      changePct: crude.changePct,
      direction: crude.change > 0 ? "up" : crude.change < 0 ? "down" : "flat",
      unit: "/bbl",
    });
  }

  // Gold (Yahoo Finance: GC=F for futures, approximate INR conversion)
  const goldUSD = await fetchYahooQuote("GC=F");
  if (goldUSD && usd) {
    fetchedAny = true;
    // Gold futures are per troy oz. Convert to 10g: 1 oz = 31.1035g, 10g = 10/31.1035 oz
    const goldPer10gINR = (goldUSD.price / 31.1035) * 10 * usd.rate;
    const goldChangePer10gINR = (goldUSD.change / 31.1035) * 10 * usd.rate;
    items.push({
      symbol: "GOLD",
      label: "Gold",
      value: `₹${fmt(Math.round(goldPer10gINR / 100) * 100)}`,
      change: `${goldChangePer10gINR >= 0 ? "+" : ""}₹${fmt(Math.round(Math.abs(goldChangePer10gINR) / 10) * 10)}`,
      changePct: goldUSD.changePct,
      direction: goldUSD.change > 0 ? "up" : goldUSD.change < 0 ? "down" : "flat",
      unit: "/10g",
    });
  }

  // Silver
  const silverUSD = await fetchYahooQuote("SI=F");
  if (silverUSD && usd) {
    fetchedAny = true;
    // Silver futures per oz → per kg (1 kg = 32.1507 oz)
    const silverPerKgINR = (silverUSD.price / 1) * 32.1507 * usd.rate;
    const silverChangeINR = (silverUSD.change / 1) * 32.1507 * usd.rate;
    items.push({
      symbol: "SILVER",
      label: "Silver",
      value: `₹${fmt(Math.round(silverPerKgINR / 100) * 100)}`,
      change: `${silverChangeINR >= 0 ? "+" : ""}₹${fmt(Math.round(Math.abs(silverChangeINR) / 10) * 10)}`,
      changePct: silverUSD.changePct,
      direction: silverUSD.change > 0 ? "up" : silverUSD.change < 0 ? "down" : "flat",
      unit: "/kg",
    });
  }

  // Order: Sensex, Nifty, Gold, Silver, USD/INR, Crude (universal only)
  const ordered: TickerItem[] = [
    items.find((i) => i.symbol === "SENSEX"),
    items.find((i) => i.symbol === "NIFTY50"),
    items.find((i) => i.symbol === "GOLD"),
    items.find((i) => i.symbol === "SILVER"),
    items.find((i) => i.symbol === "USD_INR"),
    items.find((i) => i.symbol === "CRUDE"),
  ].filter(Boolean) as TickerItem[];

  // Use fallback if nothing fetched
  const finalItems = fetchedAny && ordered.length >= 2 ? ordered : FALLBACK;

  const result = {
    items: finalItems,
    asOf: new Date().toISOString(),
    isMarketHours: isMarketHours(),
    fromCache: false,
    usingFallback: !fetchedAny,
  };

  await cacheSet(CACHE_KEY, result, getCacheTTL());
  return NextResponse.json(result, {
    headers: { "Cache-Control": `public, s-maxage=${getCacheTTL()}, stale-while-revalidate=60` },
  });
}
