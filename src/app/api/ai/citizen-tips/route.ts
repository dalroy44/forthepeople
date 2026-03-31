/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — AI Citizen Tips (READ-ONLY)
// GET /api/ai/citizen-tips?district=mandya&state=karnataka
// Serves ONLY from Redis cache — never generates live AI on public GET.
// Live AI generation restricted to backend crons + admins only.
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { cacheGet } from "@/lib/cache";

const CACHE_TTL = 6 * 60 * 60; // 6 hours

interface TipsResponse {
  tips: Array<{
    category: string; icon: string; title: string;
    description: string; urgency: string;
  }>;
  month: number;
  year: number;
  generatedAt: string;
}

// ── Route handler — READ-ONLY (public) ───────────────────
// Zero-credit guarantee: never calls live AI on public GET.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtSlug = searchParams.get("district");

  if (!districtSlug) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const cacheKeyStr = `ftp:ai:citizen-tips:${districtSlug}:${year}:${month}`;

  const cached = await cacheGet<TipsResponse>(cacheKeyStr);
  if (cached) {
    return NextResponse.json(
      { ...cached, fromCache: true },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}` } }
    );
  }

  // Zero-credit guarantee: return empty instead of generating live AI
  return NextResponse.json({ tips: [], month, year, generatedAt: null });
}
