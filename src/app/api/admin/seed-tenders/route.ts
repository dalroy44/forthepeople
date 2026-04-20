/**
 * One-shot admin endpoint to seed the Karnataka tenders dataset into
 * production. Idempotent — safe to re-run (all entries are upserted).
 *
 * Auth: Bearer <SEED_SECRET> header. SEED_SECRET must be set on Vercel
 * (all environments). Generate a fresh value with `openssl rand -hex 32`.
 *
 * Usage:
 *   curl -X POST https://forthepeople.in/api/admin/seed-tenders \
 *        -H "Authorization: Bearer <SEED_SECRET>"
 *
 * Not intended for routine scheduling — this is a migration tool to
 * bootstrap tenders data once the NEW Neon database has the Tender*
 * schema (auto-applied by vercel.json's buildCommand).
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Vercel Pro allows up to 60s — seed touches ~80 rows across 5 tables,
// well within budget. Bump if you ever grow the seed substantially.
export const maxDuration = 60;

// Force this route to be dynamic — never statically generated.
export const dynamic = "force-dynamic";

export async function POST() {
  const hdrs = await headers();
  const authHeader = hdrs.get("authorization");
  const expected = process.env.SEED_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "Server misconfigured: SEED_SECRET not set" },
      { status: 500 },
    );
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Dynamic import so the seed module isn't loaded unless this route fires.
    const mod = await import("@/../prisma/seed-tenders-karnataka");
    await mod.seedTendersKarnataka();
    return NextResponse.json({
      success: true,
      message:
        "Tenders seed complete. Check Prisma Studio or /api/tenders/<district>?status=LIVE to verify.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
