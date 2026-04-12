/**
 * ForThePeople.in — Traffic (Plausible Stats API)
 * GET /api/admin/traffic?period=7d|30d|90d
 * Redis cache: 3 minutes. Degrades gracefully when PLAUSIBLE_API_KEY is missing.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cacheGet, cacheSet } from "@/lib/cache";
import {
  fetchAllPlausibleData,
  type PlausibleData,
  type PlausiblePeriod,
} from "@/lib/plausible-api";

const COOKIE = "ftp_admin_v1";
const CACHE_KEY = "ftp:admin:traffic";
const CACHE_TTL = 180;

function normalizePeriod(raw: string | null): PlausiblePeriod {
  switch (raw) {
    case "day":
    case "7d":
    case "30d":
    case "90d":
    case "month":
    case "year":
      return raw;
    default:
      return "30d";
  }
}

export async function GET(req: NextRequest) {
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = normalizePeriod(req.nextUrl.searchParams.get("period"));
  const cacheKey = `${CACHE_KEY}:${period}`;

  const cached = await cacheGet<PlausibleData>(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, period, cached: true });
  }

  const data = await fetchAllPlausibleData(period);
  await cacheSet(cacheKey, data, CACHE_TTL);
  return NextResponse.json({ ...data, period, cached: false });
}
