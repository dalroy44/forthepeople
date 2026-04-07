/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Help expand ForThePeople.in to your district — report errors, add data, or contribute code.",
  alternates: { canonical: `${BASE_URL}/en/contribute` },
};

const WAYS = [
  {
    icon: "🐛",
    title: "Report a data error",
    desc: "Found incorrect or outdated data? Tell us. We correct errors within 24 hours.",
    action: "Open an issue",
    href: "https://github.com/jayanthmb14/forthepeople/issues/new?template=data_error.md",
  },
  {
    icon: "🗺️",
    title: "Request your district",
    desc: "Your district isn't listed yet? Submit a request and we'll prioritise it.",
    action: "Request district",
    href: "https://github.com/jayanthmb14/forthepeople/issues/new?template=district_request.md",
  },
  {
    icon: "💻",
    title: "Contribute code",
    desc: "The platform is open-source. PRs welcome — from bug fixes to new data modules.",
    action: "View on GitHub",
    href: "https://github.com/jayanthmb14/forthepeople",
  },
  {
    icon: "🌐",
    title: "Help with translations",
    desc: "We need native speakers to verify regional-language data labels. All Indian languages welcome.",
    action: "Join translation",
    href: "mailto:translate@forthepeople.in",
  },
  {
    icon: "📊",
    title: "Share a data source",
    desc: "Know of a government portal or dataset we haven't tapped yet? Let us know.",
    action: "Suggest source",
    href: "mailto:data@forthepeople.in",
  },
  {
    icon: "📣",
    title: "Spread the word",
    desc: "Share ForThePeople.in with journalists, activists, students, and local officials in your district.",
    action: null,
    href: null,
  },
];

export default function ContributePage() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px",
        fontFamily: "var(--font-plus-jakarta, system-ui, sans-serif)",
      }}
    >
      <Link
        href="/"
        style={{ fontSize: 13, color: "#9B9B9B", textDecoration: "none", display: "inline-block", marginBottom: 16 }}
      >
        ← ForThePeople.in
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.4px", marginBottom: 8 }}>
        Contribute
      </h1>
      <p style={{ fontSize: 16, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 32, maxWidth: 560 }}>
        ForThePeople.in is built and maintained by volunteers. Every contribution —
        big or small — helps more citizens access the data they&apos;re entitled to.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginBottom: 40 }}>
        {WAYS.map((w) => (
          <div
            key={w.title}
            style={{
              background: "#FFF",
              border: "1px solid #E8E8E4",
              borderRadius: 12,
              padding: "20px 22px",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{w.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>{w.title}</div>
            <div style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.6, marginBottom: w.action ? 14 : 0 }}>
              {w.desc}
            </div>
            {w.action && w.href && (
              <a
                href={w.href}
                target={w.href.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "7px 14px",
                  background: "#EFF6FF",
                  color: "#2563EB",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {w.action} →
              </a>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#F0FDF4",
          border: "1px solid #BBF7D0",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: "#15803D", marginBottom: 4 }}>
          Open Source Pledge
        </div>
        <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.7, margin: 0 }}>
          ForThePeople.in is fully open-source under the MIT licence. The code, data
          pipelines, and seed data are all publicly available. We believe transparency
          about our own code is as important as the data transparency we demand from
          government.
        </p>
      </div>
    </div>
  );
}
