/**
 * ForThePeople.in — Manual supporter creation
 * POST /api/admin/manual-supporter
 *
 * For offline contributions (UPI direct, bank transfer, cash, cheque). Writes a
 * Supporter row with source="manual" and invalidates public contributor caches
 * so the change shows up on the Wall immediately.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import { logAuditAuto } from "@/lib/audit-log";

const COOKIE = "ftp_admin_v1";

const CONTRIBUTOR_CACHE_KEYS = [
  "ftp:contributors:v1",
  "ftp:contributors:all",
  "ftp:contributors:leaderboard",
  "ftp:contributors:district-rankings",
];

async function invalidateContributorCaches() {
  await Promise.all(CONTRIBUTOR_CACHE_KEYS.map((k) => cacheSet(k, null, 1)));
}

export async function POST(req: NextRequest) {
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.name || body.amount == null) {
    return NextResponse.json(
      { error: "name and amount are required" },
      { status: 400 }
    );
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  const tier = String(body.tier ?? "custom");
  const createdAt = body.paymentDate ? new Date(body.paymentDate) : new Date();

  const supporter = await prisma.supporter.create({
    data: {
      name: String(body.name).trim(),
      email: body.email ? String(body.email).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      amount,
      currency: "INR",
      tier,
      method: body.paymentMethod ?? null,
      status: "success",
      source: "manual",
      referenceNumber: body.referenceNumber ?? null,
      message: body.message ?? null,
      districtId: body.districtId ?? null,
      stateId: body.stateId ?? null,
      socialLink: body.socialLink ?? null,
      socialPlatform: body.socialPlatform ?? null,
      isPublic: body.isPublic === undefined ? true : Boolean(body.isPublic),
      createdAt,
    },
  });

  await invalidateContributorCaches();

  await logAuditAuto({
    action: "supporter_add_manual",
    resource: "Supporter",
    resourceId: supporter.id,
    details: { name: supporter.name, amount, tier, method: body.paymentMethod ?? null },
  });

  return NextResponse.json({ supporter });
}
