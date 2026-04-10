/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "ftp_admin_v1";

export async function GET() {
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { slug: true, name: true, nameLocal: true, state: { select: { slug: true, name: true } } },
    orderBy: [{ state: { name: "asc" } }, { name: "asc" }],
  });
  return NextResponse.json({ districts });
}
