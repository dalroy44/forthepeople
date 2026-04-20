// GET /api/tenders/how-it-works
// Returns explainer content from TenderEducationContent, ordered.
// Filtered by docType='explainer' so disclaimer / FAQ rows (also stored in
// this table but served by dedicated endpoints) don't leak into the
// How-It-Works page.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sections = await prisma.tenderEducationContent.findMany({
    where: { docType: "explainer" },
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
