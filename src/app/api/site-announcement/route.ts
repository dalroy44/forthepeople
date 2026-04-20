// Public read for the site-wide announcement. Never exposes admin-only fields.
// Returns { enabled: false } when no row exists, so the modal renders nothing.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const SINGLETON_ID = "site-announcement-singleton";

export async function GET() {
  try {
    const row = await prisma.siteAnnouncement.findUnique({ where: { id: SINGLETON_ID } });
    if (!row || !row.enabled) return NextResponse.json({ enabled: false });
    if (row.autoHideAfter && row.autoHideAfter.getTime() <= Date.now()) {
      return NextResponse.json({ enabled: false });
    }
    return NextResponse.json({
      enabled: true,
      variant: row.variant,
      displayMode: row.displayMode,
      title: row.title,
      bodyMd: row.bodyMd,
      bullets: Array.isArray(row.bulletsJson) ? row.bulletsJson : [],
      highlightText: row.highlightText,
      footerNote: row.footerNote,
      ctaButtonText: row.ctaButtonText,
      storageKey: row.storageKey,
      autoHideAfter: row.autoHideAfter?.toISOString() ?? null,
    });
  } catch {
    // DB unreachable — fail open (no banner) rather than breaking the site.
    return NextResponse.json({ enabled: false });
  }
}
