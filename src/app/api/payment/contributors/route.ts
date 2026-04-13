/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

const CACHE_KEY = "ftp:contributors:v2";
const CACHE_TTL = 60; // 60 seconds

export interface ContributorItem {
  displayName: string;
  tierLabel: string;
  tier: string | null;
  message: string | null;
  timeAgo: string;
}

export interface ContributorsResponse {
  contributors: ContributorItem[];
  totalRupees: number;
  count: number;
}

function anonymizeName(raw: string, isPublic: boolean): string {
  if (!isPublic) return "Anonymous";
  const name = (raw || "").trim();
  if (!name) return "Anonymous";
  const parts = name.split(/\s+/);
  if (parts.length === 1) {
    const first = parts[0];
    if (first.length <= 3) return first;
    return `${first.slice(0, 3)}...`;
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

function tierLabelFor(amountRupees: number): string {
  if (amountRupees < 200) return "☕ Chai Supporter";
  if (amountRupees < 1000) return "🏛️ District Supporter";
  if (amountRupees < 5000) return "🗺️ State Supporter";
  return "🇮🇳 Patron";
}

function relativeTime(date: Date | null): string {
  const d = date ?? new Date();
  const diff = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "Today";
  if (diff < 7 * day) return "This week";
  if (diff < 30 * day) return "This month";
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function truncateMessage(msg: string | null): string | null {
  if (!msg) return null;
  if (msg.length <= 100) return msg;
  return `${msg.slice(0, 100)}...`;
}

export async function GET() {
  try {
    const cached = await cacheGet<ContributorsResponse>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const rows = await prisma.contribution.findMany({
      where: { status: "paid" },
      orderBy: { paidAt: "desc" },
      take: 50,
      select: {
        name: true,
        amount: true,
        tier: true,
        message: true,
        isPublic: true,
        paidAt: true,
      },
    });

    const totals = await prisma.contribution.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
      _count: { id: true },
    });

    const contributors: ContributorItem[] = rows.map((r) => {
      const rupees = Math.floor(r.amount / 100);
      return {
        displayName: anonymizeName(r.name, r.isPublic),
        tierLabel: tierLabelFor(rupees),
        tier: r.tier,
        message: r.isPublic ? truncateMessage(r.message ?? null) : null,
        timeAgo: relativeTime(r.paidAt ?? null),
      };
    });

    const result: ContributorsResponse = {
      contributors,
      totalRupees: Math.floor((totals._sum.amount ?? 0) / 100),
      count: totals._count.id,
    };

    await cacheSet(CACHE_KEY, result, CACHE_TTL);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[contributors]", err);
    return NextResponse.json({ contributors: [], totalRupees: 0, count: 0 });
  }
}
