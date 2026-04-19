// PII regex redactor — runs on every extracted PDF text body before DB write.
// Per DPDP Act 2023 (enforcement May 2027) + the Tenders module legal framework:
// never store Aadhaar, phone numbers, personal email addresses, or individual PAN.
// Company PANs (those appearing alongside "company", "Pvt Ltd", "LLP") are left intact.

export interface RedactionResult {
  text: string;
  counts: Record<string, number>;
}

const AADHAAR_RE = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
const PHONE_IN_RE = /\b[6-9]\d{9}\b/g;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PAN_RE = /\b[A-Z]{5}\d{4}[A-Z]\b/g;

export function redactPII(input: string): RedactionResult {
  if (!input) return { text: input, counts: {} };
  const counts: Record<string, number> = {};
  let out = input;

  out = out.replace(AADHAAR_RE, (m) => {
    counts.aadhaar = (counts.aadhaar ?? 0) + 1;
    void m;
    return "[AADHAAR_REDACTED]";
  });

  out = out.replace(PHONE_IN_RE, () => {
    counts.phone = (counts.phone ?? 0) + 1;
    return "[PHONE_REDACTED]";
  });

  out = out.replace(EMAIL_RE, () => {
    counts.email = (counts.email ?? 0) + 1;
    return "[EMAIL_REDACTED]";
  });

  // PAN: only redact when the surrounding 60-char window looks like a natural
  // person (proprietor / individual / Shri / Smt). Company PANs remain visible.
  out = out.replace(PAN_RE, (match, offset: number) => {
    const ctxStart = Math.max(0, offset - 60);
    const ctxEnd = Math.min(out.length, offset + match.length + 60);
    const ctx = out.slice(ctxStart, ctxEnd).toLowerCase();
    const looksIndividual = /proprietor|individual|shri\b|smt\b|mr\.?|ms\.?|mrs\.?/.test(ctx);
    if (looksIndividual) {
      counts.panIndividual = (counts.panIndividual ?? 0) + 1;
      return "[PAN_REDACTED]";
    }
    return match;
  });

  return { text: out, counts };
}

export const PII_REDACTOR_VERSION = "1.0.0";
