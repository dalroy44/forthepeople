// Tender PDF text extraction.
// Stage 1 (Phase 2): native text PDFs via pdf-parse — if that package is not
// installed in the workspace yet, the function returns a stub with
// extractionFailed=true and the orchestrator marks the document for manual
// review. Stage 2 (v2): Tesseract/OCR for scanned PDFs.

import { redactPII } from "./pii-redactor";

export interface PdfExtractResult {
  text: string; // PII-redacted
  extractionFailed: boolean;
  reason?: string;
  counts?: Record<string, number>;
}

export async function extractTenderPdf(buffer: Buffer): Promise<PdfExtractResult> {
  try {
    // Lazy require so missing optional dep doesn't break the scraper at boot.
    type PdfParseFn = (data: Buffer) => Promise<{ text: string }>;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error optional dependency; may not be installed
    const mod = await import("pdf-parse").catch(() => null);
    if (!mod) {
      return { text: "", extractionFailed: true, reason: "pdf-parse not installed (add via npm i pdf-parse)" };
    }
    const pdfParse: PdfParseFn = ((mod as { default?: PdfParseFn }).default ?? (mod as unknown as PdfParseFn));
    const parsed = await pdfParse(buffer);
    const raw = parsed.text ?? "";
    if (!raw.trim()) {
      return { text: "", extractionFailed: true, reason: "empty text — likely scanned PDF (needs OCR)" };
    }
    const { text, counts } = redactPII(raw);
    return { text, extractionFailed: false, counts };
  } catch (err) {
    return { text: "", extractionFailed: true, reason: err instanceof Error ? err.message : String(err) };
  }
}
