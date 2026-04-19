"use client";

import { useState } from "react";

type Section = { slug: string; section: string; orderIndex: number; title: string; bodyMd: string; bodyKn: string | null; translationPending: boolean };

// Minimal markdown renderer — we deliberately keep this dependency-free to
// avoid pulling in a remark/rehype toolchain for three formatting types.
// Supports: **bold**, *italic*, inline `code`, line breaks, simple lists,
// pipe-tables, and paragraph splitting. Educational content only.
function renderMarkdown(md: string): React.ReactNode {
  const blocks = md.split(/\n\n+/);
  return blocks.map((b, i) => {
    if (/^\|.*\|/.test(b) && b.includes("\n")) {
      const lines = b.split("\n").filter((l) => l.trim().startsWith("|"));
      const [head, sep, ...rest] = lines;
      if (head && sep && /\|\s*-+\s*\|/.test(sep)) {
        const headers = head.split("|").map((s) => s.trim()).filter(Boolean);
        const rows = rest.map((r) => r.split("|").map((s) => s.trim()).filter(Boolean));
        return (
          <div key={i} style={{ overflowX: "auto", margin: "12px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>{headers.map((h, j) => <th key={j} style={{ textAlign: "left", padding: "6px 10px", background: "#F5F5F2", borderBottom: "1px solid #D1D5DB", fontWeight: 700 }}>{inline(h)}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k} style={{ padding: "6px 10px", borderBottom: "1px solid #E8E8E4", verticalAlign: "top" }}>{inline(c)}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        );
      }
    }
    if (b.split("\n").every((l) => /^\d+\.\s/.test(l.trim()))) {
      return <ol key={i} style={{ paddingLeft: 22, margin: "8px 0", lineHeight: 1.7 }}>{b.split("\n").map((l, j) => <li key={j}>{inline(l.replace(/^\d+\.\s*/, ""))}</li>)}</ol>;
    }
    if (b.split("\n").every((l) => /^[-*]\s/.test(l.trim()))) {
      return <ul key={i} style={{ paddingLeft: 22, margin: "8px 0", lineHeight: 1.7 }}>{b.split("\n").map((l, j) => <li key={j}>{inline(l.replace(/^[-*]\s*/, ""))}</li>)}</ul>;
    }
    return <p key={i} style={{ margin: "10px 0", lineHeight: 1.7 }}>{inline(b)}</p>;
  });
}

function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let k = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    const tok = match[0];
    if (tok.startsWith("**")) parts.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) parts.push(<code key={k++} style={{ background: "#F3F4F6", padding: "1px 6px", borderRadius: 4, fontSize: "0.9em" }}>{tok.slice(1, -1)}</code>);
    else parts.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    lastIdx = match.index + tok.length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}

export default function HowTenderWorks({ sections }: { sections: Section[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(sections[0]?.slug ?? null);
  const [lang, setLang] = useState<"en" | "kn">("en");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <div style={{ display: "inline-flex", border: "1px solid #D1D5DB", borderRadius: 8, overflow: "hidden" }}>
          <button onClick={() => setLang("en")} style={{ padding: "6px 14px", background: lang === "en" ? "#0F172A" : "#FFFFFF", color: lang === "en" ? "#FFFFFF" : "#374151", border: "none", cursor: "pointer", fontSize: 13 }}>English</button>
          <button onClick={() => setLang("kn")} style={{ padding: "6px 14px", background: lang === "kn" ? "#0F172A" : "#FFFFFF", color: lang === "kn" ? "#FFFFFF" : "#374151", border: "none", borderLeft: "1px solid #D1D5DB", cursor: "pointer", fontSize: 13 }}>ಕನ್ನಡ (Kannada)</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sections.map((s) => {
          const isOpen = openSlug === s.slug;
          const body = lang === "kn" && s.bodyKn ? s.bodyKn : s.bodyMd;
          const fallbackToEng = lang === "kn" && !s.bodyKn;
          return (
            <div key={s.slug} style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 10, overflow: "hidden" }}>
              <button
                onClick={() => setOpenSlug(isOpen ? null : s.slug)}
                style={{ width: "100%", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
                  <span style={{ color: "#6B7280", marginRight: 10 }}>{s.orderIndex}.</span> {s.title}
                </span>
                <span style={{ color: "#6B7280", fontSize: 18 }}>{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div style={{ padding: "0 16px 16px", fontSize: 14, color: "#0F172A", borderTop: "1px solid #F3F4F6" }}>
                  {fallbackToEng && (
                    <div style={{ fontSize: 11, color: "#B45309", padding: "8px 10px", background: "#FFF9F0", borderRadius: 6, marginBottom: 10 }}>
                      ಕನ್ನಡ ಅನುವಾದ ಬಾಕಿಯಿದೆ · Kannada translation pending — showing English below.
                    </div>
                  )}
                  {renderMarkdown(body)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
