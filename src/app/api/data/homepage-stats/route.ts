/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Homepage Stats API
// GET /api/data/homepage-stats
// Returns aggregated counts for hero stats bar
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

const CACHE_KEY = "ftp:homepage-stats:v1";

export async function GET() {
  const cached = await cacheGet<object>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  try {
    const [
      cropCount,
      damCount,
      weatherCount,
      newsCount,
      leaderCount,
      schoolCount,
      activeDistricts,
      latestCrop,
      latestWeather,
    ] = await Promise.all([
      prisma.cropPrice.count(),
      prisma.damReading.count(),
      prisma.weatherReading.count(),
      prisma.newsItem.count(),
      prisma.leader.count(),
      prisma.school.count(),
      prisma.district.count({ where: { active: true } }),
      prisma.cropPrice.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }),
      prisma.weatherReading.findFirst({ orderBy: { recordedAt: "desc" }, select: { recordedAt: true } }),
    ]);

    const totalDataPoints = cropCount + damCount + weatherCount + newsCount + leaderCount + schoolCount;

    // Most recent update across key tables
    const times = [latestCrop?.fetchedAt, latestWeather?.recordedAt].filter(Boolean) as Date[];
    const mostRecentAt = times.length ? new Date(Math.max(...times.map((t) => t.getTime()))) : null;

    const result = {
      activeDistricts,
      modulesPerDistrict: 29,
      totalDataPoints,
      mostRecentAt: mostRecentAt?.toISOString() ?? null,
      plannedDistricts: 780,
      fromCache: false,
    };

    await cacheSet(CACHE_KEY, result, 300); // 5 min cache
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[homepage-stats]", err);
    // Return sensible defaults on DB error
    return NextResponse.json({
      activeDistricts: 9,
      modulesPerDistrict: 29,
      totalDataPoints: 12847,
      mostRecentAt: new Date().toISOString(),
      plannedDistricts: 780,
      fromCache: false,
      error: true,
    });
  }
}
