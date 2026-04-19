// POST /api/tenders/alerts/subscribe
// v1 captures intent only — delivery pipeline is v2.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    tenderId?: string;
    userIdentifier?: string;
    alertChannelEmail?: string;
    alertChannelWhatsapp?: string;
    alertOnDeadline?: boolean;
    alertOnCorrigendum?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_JSON", message: "Invalid JSON body" } }, { status: 400 });
  }

  if (!body.tenderId || !body.userIdentifier) {
    return NextResponse.json({ error: { code: "MISSING_FIELDS", message: "tenderId and userIdentifier are required" } }, { status: 400 });
  }
  if (!body.alertChannelEmail && !body.alertChannelWhatsapp) {
    return NextResponse.json({ error: { code: "NO_CHANNEL", message: "At least one of alertChannelEmail or alertChannelWhatsapp is required" } }, { status: 400 });
  }

  const tender = await prisma.tender.findUnique({ where: { id: body.tenderId }, select: { id: true } });
  if (!tender) {
    return NextResponse.json({ error: { code: "TENDER_NOT_FOUND", message: `Tender ${body.tenderId} does not exist` } }, { status: 404 });
  }

  await prisma.tenderSavedByUser.upsert({
    where: { tenderId_userIdentifier: { tenderId: body.tenderId, userIdentifier: body.userIdentifier } },
    update: {
      alertChannelEmail: body.alertChannelEmail ?? null,
      alertChannelWhatsapp: body.alertChannelWhatsapp ?? null,
      alertOnDeadline: body.alertOnDeadline ?? true,
      alertOnCorrigendum: body.alertOnCorrigendum ?? true,
    },
    create: {
      tenderId: body.tenderId,
      userIdentifier: body.userIdentifier,
      alertChannelEmail: body.alertChannelEmail ?? null,
      alertChannelWhatsapp: body.alertChannelWhatsapp ?? null,
      alertOnDeadline: body.alertOnDeadline ?? true,
      alertOnCorrigendum: body.alertOnCorrigendum ?? true,
    },
  });

  return NextResponse.json({ ok: true, note: "Alert intent captured. Delivery pipeline rolls out in v2." });
}
