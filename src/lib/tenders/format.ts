// Client-safe formatting & guard helpers for the Tenders module.
// Must NOT import from @/lib/db — used by client components.

// ── BigInt-safe serialiser ────────────────────────────────────────────────
export function serializeForJson<T>(value: T): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeForJson);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeForJson(v);
    }
    return out;
  }
  return value;
}

// ── Rupee formatter (display only) ────────────────────────────────────────
export function formatInr(value: bigint | number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "bigint" ? Number(value) : typeof value === "string" ? parseFloat(value) : value;
  if (!isFinite(n) || n <= 0) return "—";
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toLocaleString("en-IN")}`;
}

// ── Banned-adjective guard ────────────────────────────────────────────────
const BANNED = /(suspicious|corrupt|dubious|cartel|irregular|fraudulent)/i;
export function assertFactualCopy(text: string, where: string): void {
  if (BANNED.test(text)) {
    throw new Error(`[Tenders] Banned adjective in ${where}: "${text}". Use factual, neutral language.`);
  }
}

export function tenderError(code: string, message: string, status = 400) {
  return { error: { code, message }, status };
}
