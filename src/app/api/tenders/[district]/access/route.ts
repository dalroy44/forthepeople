// GET /api/tenders/[district]/access
// Lightweight "is tenders activated for this district?" probe called by the
// tenders page before loading the dashboard. Intentionally returns zero
// credential-bearing fields — just district identity + boolean flag.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ district: string }> },
) {
  const { district: districtSlug } = await ctx.params;

  try {
    const row = await prisma.district.findFirst({
      where: { slug: districtSlug, active: true },
      select: {
        name: true,
        slug: true,
        tendersActive: true,
        state: { select: { name: true, slug: true } },
      },
    });
    if (!row) {
      return NextResponse.json(
        { error: { code: "DISTRICT_NOT_ACTIVE", message: `District '${districtSlug}' not active` } },
        { status: 404 },
      );
    }
    return NextResponse.json({
      tendersActive: row.tendersActive,
      districtName: row.name,
      districtSlug: row.slug,
      stateName: row.state.name,
      stateSlug: row.state.slug,
    });
  } catch {
    // Fail-open: if the DB is unreachable, default to locked so we don't
    // accidentally expose a broken dashboard.
    return NextResponse.json({ tendersActive: false, error: "db-unreachable" }, { status: 200 });
  }
}
