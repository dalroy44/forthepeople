/**
 * ForThePeople.in — Admin audit log
 * Writes AdminAuditLog entries. Never throws — audit logging must not break
 * the main operation if the DB is transiently unavailable.
 */

import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export interface AuditInput {
  /** AdminUser.id for future per-user auth. Leave undefined for the legacy cookie session. */
  adminUserId?: string;
  /** Human-readable actor label. Defaults to "admin" for the legacy cookie session. */
  actorLabel?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

/** Best-effort IP + UA extraction from Next.js headers(). Returns undefined if unavailable. */
export async function extractRequestMeta(): Promise<{ ipAddress?: string; userAgent?: string }> {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      undefined;
    const ua = h.get("user-agent") ?? undefined;
    return { ipAddress: ip, userAgent: ua };
  } catch {
    return {};
  }
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: input.adminUserId ?? null,
        actorLabel: input.actorLabel ?? "admin",
        action: input.action,
        resource: input.resource ?? null,
        resourceId: input.resourceId ?? null,
        details: (input.details as object | undefined) ?? undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[audit-log] write failed:", err instanceof Error ? err.message : err);
  }
}

/** Convenience: extracts request metadata and writes in one call. */
export async function logAuditAuto(
  input: Omit<AuditInput, "ipAddress" | "userAgent">
): Promise<void> {
  const meta = await extractRequestMeta();
  await logAudit({ ...input, ...meta });
}
