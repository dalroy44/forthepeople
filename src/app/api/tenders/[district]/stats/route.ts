// GET /api/tenders/[district]/stats — dashboard aggregates

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveDistrictName, serializeForJson } from "@/lib/tenders/tender-helpers";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ district: string }> }) {
  const { district: districtSlug } = await ctx.params;
  const districtName = await resolveDistrictName(districtSlug);
  if (!districtName) {
    return NextResponse.json({ error: { code: "DISTRICT_NOT_ACTIVE", message: `District '${districtSlug}' is not active.` } }, { status: 404 });
  }

  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 3600_000);
  const in7d = new Date(now.getTime() + 7 * 86400_000);
  const in14d = new Date(now.getTime() + 14 * 86400_000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400_000);

  const baseLocation = { locationDistrict: districtName };
  const live = { ...baseLocation, bidSubmissionEnd: { gte: now } };

  const [
    liveCount,
    liveValueAgg,
    closingIn48h,
    closingIn7d,
    closingIn14d,
    awardedLast30,
    awardedLast30Value,
    mseReservedLive,
    startupExemptLive,
    topAuthorities,
    categoryDistribution,
    redFlaggedLive,
  ] = await Promise.all([
    prisma.tender.count({ where: live }),
    prisma.tender.aggregate({ where: live, _sum: { estimatedValueInr: true } }),
    prisma.tender.count({ where: { ...baseLocation, bidSubmissionEnd: { gte: now, lte: in48h } } }),
    prisma.tender.count({ where: { ...baseLocation, bidSubmissionEnd: { gte: now, lte: in7d } } }),
    prisma.tender.count({ where: { ...baseLocation, bidSubmissionEnd: { gte: now, lte: in14d } } }),
    prisma.tenderAward.count({ where: { awardedAt: { gte: ninetyDaysAgo }, tender: baseLocation } }),
    prisma.tenderAward.aggregate({ where: { awardedAt: { gte: ninetyDaysAgo }, tender: baseLocation }, _sum: { awardedAmountInr: true } }),
    prisma.tender.count({ where: { ...live, mseReserved: true } }),
    prisma.tender.count({ where: { ...live, startupExempt: true } }),
    prisma.tender.groupBy({ by: ["authorityId"], where: live, _count: true, orderBy: { _count: { authorityId: "desc" } }, take: 5 }),
    prisma.tender.groupBy({ by: ["categoryId"], where: live, _count: true, orderBy: { _count: { categoryId: "desc" } }, take: 10 }),
    prisma.tender.count({ where: { ...live, redFlags: { some: {} } } }),
  ]);

  // Hydrate authority + category names
  const authIds = topAuthorities.map((r) => r.authorityId).filter((v): v is string => !!v);
  const authRows = authIds.length
    ? await prisma.tenderAuthority.findMany({ where: { id: { in: authIds } }, select: { id: true, name: true, shortCode: true } })
    : [];
  const authorityMap = new Map(authRows.map((a) => [a.id, a]));

  const catIds = categoryDistribution.map((r) => r.categoryId).filter((v): v is string => !!v);
  const catRows = catIds.length
    ? await prisma.tenderCategory.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const categoryMap = new Map(catRows.map((c) => [c.id, c]));

  return NextResponse.json(serializeForJson({
    districtName,
    live: {
      count: liveCount,
      totalValueInr: liveValueAgg._sum.estimatedValueInr ?? BigInt(0),
      mseReservedCount: mseReservedLive,
      startupExemptCount: startupExemptLive,
      redFlaggedCount: redFlaggedLive,
    },
    deadlineHistogram: [
      { bucket: "<48h", count: closingIn48h },
      { bucket: "2-7d", count: Math.max(0, closingIn7d - closingIn48h) },
      { bucket: "7-14d", count: Math.max(0, closingIn14d - closingIn7d) },
      { bucket: ">14d", count: Math.max(0, liveCount - closingIn14d) },
    ],
    awarded90d: {
      count: awardedLast30,
      totalValueInr: awardedLast30Value._sum.awardedAmountInr ?? BigInt(0),
    },
    topAuthorities: topAuthorities.map((r) => ({
      authority: authorityMap.get(r.authorityId) ?? { id: r.authorityId, name: "Unknown", shortCode: "UNK" },
      count: r._count,
    })),
    categoryDistribution: categoryDistribution
      .filter((r) => r.categoryId)
      .map((r) => ({
        category: categoryMap.get(r.categoryId!) ?? null,
        count: r._count,
      })),
  }));
}
