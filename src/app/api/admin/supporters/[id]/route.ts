/**
 * ForThePeople.in — Edit supporter
 * PATCH /api/admin/supporters/[id]
 *
 * Invalidates public contributor caches on update so the Wall reflects changes.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import type { Prisma } from "@/generated/prisma";
import { logAuditAuto } from "@/lib/audit-log";

const COOKIE = "ftp_admin_v1";

const CONTRIBUTOR_CACHE_KEYS = [
  "ftp:contributors:v1",
  "ftp:contributors:all",
  "ftp:contributors:leaderboard",
  "ftp:contributors:district-rankings",
];

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();

  const data: Prisma.SupporterUpdateInput = {};
  const stringFields = [
    "name",
    "email",
    "phone",
    "tier",
    "method",
    "message",
    "socialLink",
    "socialPlatform",
    "badgeType",
    "badgeLevel",
    "referenceNumber",
    "status",
  ] as const;
  for (const f of stringFields) {
    if (body[f] !== undefined) {
      (data as Record<string, unknown>)[f] = body[f] ?? null;
    }
  }
  if (body.amount !== undefined) data.amount = Number(body.amount);
  if (body.isPublic !== undefined) data.isPublic = Boolean(body.isPublic);
  if (body.districtId !== undefined) {
    data.sponsoredDistrict = body.districtId
      ? { connect: { id: body.districtId } }
      : { disconnect: true };
  }
  if (body.stateId !== undefined) {
    data.sponsoredState = body.stateId
      ? { connect: { id: body.stateId } }
      : { disconnect: true };
  }

  const supporter = await prisma.supporter.update({ where: { id }, data });
  await Promise.all(CONTRIBUTOR_CACHE_KEYS.map((k) => cacheSet(k, null, 1)));

  await logAuditAuto({
    action: "supporter_edit",
    resource: "Supporter",
    resourceId: id,
    details: { fields: Object.keys(data) },
  });

  return NextResponse.json({ supporter });
}
