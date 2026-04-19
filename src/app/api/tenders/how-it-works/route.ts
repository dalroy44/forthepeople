// GET /api/tenders/how-it-works
// Returns educational content from TenderEducationContent, ordered.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sections = await prisma.tenderEducationContent.findMany({
    orderBy: [{ orderIndex: "asc" }],
  });

  return NextResponse.json({
    sections: sections.map((s) => ({
      slug: s.slug,
      section: s.section,
      orderIndex: s.orderIndex,
      title: s.title,
      bodyMd: s.bodyMd,
      bodyKn: s.bodyKn,
      translationPending: s.translationPending,
      lastEditedAt: s.lastEditedAt.toISOString(),
    })),
  });
}
