/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import Link from "next/link";
import type { Metadata } from "next";
import SupportCheckout from "@/components/support/SupportCheckout";
import ContributorWallClient from "@/components/support/ContributorWallClient";
import FeedbackModal from "@/components/common/FeedbackModal";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

export const metadata: Metadata = {
  title: "Support ForThePeople.in — ₹1.50/day serves one district",
  description: "Help keep India's citizen transparency platform running. ₹12 lakh/year to serve 780+ districts. Every rupee keeps government data free and accessible.",
  alternates: { canonical: `${BASE_URL}/en/support` },
};

const TIERS = [
  {
    emoji: "☕",
    label: "Buy me a Chai",
    defaultAmount: 50,
    desc: "One-time · covers 1 hour of server cost",
    color: "#FFF7ED",
    border: "#FED7AA",
    accent: "#EA580C",
    isMonthly: false,
  },
  {
    emoji: "🙏",
    label: "Monthly Supporter",
    defaultAmount: 200,
    desc: "Monthly · keeps one taluk's data pipeline running",
    color: "#EFF6FF",
    border: "#BFDBFE",
    accent: "#2563EB",
    featured: true,
    isMonthly: true,
  },
  {
    emoji: "🏛️",
    label: "District Sponsor",
    defaultAmount: 2000,
    desc: "Monthly · sponsors one full district — your name shown on the district page",
    color: "#F0FDF4",
    border: "#BBF7D0",
    accent: "#16A34A",
    isMonthly: true,
  },
  {
    emoji: "🇮🇳",
    label: "State Champion",
    defaultAmount: 10000,
    desc: "Monthly · sponsors all districts in one state",
    color: "#F5F3FF",
    border: "#DDD6FE",
    accent: "#7C3AED",
    isMonthly: true,
  },
  {
    emoji: "🌏",
    label: "All-India Patron",
    defaultAmount: 50000,
    desc: "Monthly · help us cover all 780 districts across India",
    color: "#FFF9F0",
    border: "#FDE68A",
    accent: "#D97706",
    isMonthly: true,
  },
];

const SCALE_COSTS = [
  { label: "1 District", monthly: "₹500/month", yearly: "₹6,000/year", usd: "~$6/month" },
  { label: "1 State (avg 31 districts)", monthly: "₹7,000/month", yearly: "₹84,000/year", usd: "~$85/month" },
  { label: "All India (780 districts)", monthly: "₹96,000/month", yearly: "₹11.5 lakh/year", usd: "~$1,175/month" },
];

const COST_BREAKDOWN = [
  { label: "Servers & Database (Vercel Pro + Neon + Railway)", pct: 35, color: "#2563EB" },
  { label: "AI Analysis & Intelligence (Anthropic + Gemini API)", pct: 25, color: "#7C3AED" },
  { label: "Data Collection Infrastructure (APIs + Processing)", pct: 20, color: "#16A34A" },
  { label: "Development & Maintenance", pct: 10, color: "#F59E0B" },
  { label: "Domain, CDN & Security", pct: 10, color: "#6B7280" },
];

export default function SupportPage() {
  return (
    <main style={{ background: "#FAFAF8", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>

      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(180deg, #EFF6FF 0%, #FAFAF8 100%)",
          borderBottom: "1px solid #E8E8E4",
          padding: "52px 24px 44px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🇮🇳</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.6px", marginBottom: 12 }}>
            Bringing Government Data<br />to Every Indian Citizen
          </h1>
          <p style={{ fontSize: 16, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 24 }}>
            ForThePeople.in makes government data accessible, visual, and free
            for all <strong style={{ color: "#1A1A1A" }}>780+ districts</strong> in India.
            No paywalls. No ads. Just public data for the public.
          </p>
          <div
            style={{
              display: "inline-block",
              background: "#FFFFFF",
              border: "2px solid #BFDBFE",
              borderRadius: 14,
              padding: "16px 28px",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: "#2563EB", fontFamily: "var(--font-mono, monospace)", letterSpacing: "-1px" }}>
              ₹1.50 / district / day
            </div>
            <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
              That&apos;s all it costs to give a district&apos;s citizens free access to their government data
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 0" }}>

        {/* Scale Section */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 16,
            padding: "28px 32px",
            marginBottom: 40,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            The Scale
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
            More than ₹12 lakh / year to serve ALL of India
          </div>
          <div style={{ fontSize: 14, color: "#6B6B6B", lineHeight: 1.7, marginBottom: 20 }}>
            780 districts × 29 dashboards = <strong style={{ color: "#1A1A1A" }}>22,620 live data modules</strong> —
            updated every 5–30 minutes from government portals.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { value: "₹96K", label: "monthly server cost (all India)" },
              { value: "22,620", label: "live data modules" },
              { value: "5 min", label: "fastest refresh rate" },
              { value: "₹0", label: "cost to citizens" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB", fontFamily: "var(--font-mono, monospace)", letterSpacing: "-0.5px" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost at Scale */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 16, letterSpacing: "-0.3px" }}>
          💰 Cost at Scale
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12, marginBottom: 40 }}>
          {SCALE_COSTS.map((c) => (
            <div key={c.label}
              style={{
                background: "#FFFFFF", border: "1px solid #E8E8E4",
                borderRadius: 14, padding: "20px 20px",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#2563EB", fontFamily: "var(--font-mono, monospace)", letterSpacing: "-0.5px" }}>{c.monthly}</div>
              <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>{c.yearly}</div>
              <div style={{ fontSize: 11, color: "#9B9B9B" }}>{c.usd}</div>
            </div>
          ))}
        </div>

        {/* Support Tiers */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 16, letterSpacing: "-0.3px" }}>
          💳 Choose Your Contribution
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {TIERS.map((tier) => (
            <div
              key={tier.label}
              style={{
                background: tier.featured ? "#EFF6FF" : tier.color,
                border: `2px solid ${tier.featured ? "#2563EB" : tier.border}`,
                borderRadius: 14,
                padding: "24px 20px",
                position: "relative",
              }}
            >
              {tier.featured && (
                <div
                  style={{
                    position: "absolute", top: -10, left: "50%",
                    transform: "translateX(-50%)",
                    background: "#2563EB", color: "#fff",
                    fontSize: 10, fontWeight: 700,
                    padding: "3px 10px", borderRadius: 10,
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  Most Popular
                </div>
              )}
              <div style={{ fontSize: 36, marginBottom: 10 }}>{tier.emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 2 }}>
                {tier.label}
              </div>
              <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 12 }}>
                {tier.isMonthly ? "Monthly · edit amount below" : "One-time · edit amount below"}
              </div>
              <div style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 16, lineHeight: 1.5 }}>
                {tier.desc}
              </div>
              <SupportCheckout
                tier={{
                  emoji: tier.emoji,
                  label: tier.label,
                  defaultAmount: tier.defaultAmount,
                  accent: tier.accent,
                  isMonthly: tier.isMonthly,
                }}
              />
            </div>
          ))}

          {/* Custom Amount Card */}
          <div
            style={{
              background: "#F9F9F7",
              border: "2px dashed #D0D0CC",
              borderRadius: 14,
              padding: "24px 20px",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>💝</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 2 }}>
              Custom Amount
            </div>
            <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 12 }}>
              Any amount helps!
            </div>
            <div style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 16, lineHeight: 1.5 }}>
              Enter any amount from ₹10 — every rupee goes directly to infrastructure.
            </div>
            <SupportCheckout
              tier={{
                emoji: "💝",
                label: "Custom Amount",
                defaultAmount: 100,
                accent: "#7C3AED",
                isCustom: true,
              }}
            />
          </div>
        </div>

        {/* Personal Message */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E8E4",
            borderRadius: 16,
            padding: "28px 32px",
            marginBottom: 40,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            <div
              style={{
                width: 54, height: 54, borderRadius: "50%",
                background: "#2563EB", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, flexShrink: 0,
              }}
            >
              J
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Jayanth M B</div>
              <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 16 }}>
                Developer from Mandya, Karnataka · Creator, ForThePeople.in
              </div>
              <p style={{ fontSize: 14, color: "#1A1A1A", lineHeight: 1.8, margin: 0 }}>
                &ldquo;I&apos;m a solo developer from Karnataka who believes government data should be free
                and accessible to every citizen — not buried in PDF reports and broken portals.
                I built ForThePeople.in entirely by myself: every data pipeline, every API, every dashboard,
                every line of code.
                <br /><br />
                This is <strong>not a startup</strong>. This is <strong>not for profit</strong>. This is a
                citizen initiative under India&apos;s Open Data Policy (NDSAP). Running this already costs
                <strong> more than ₹12 lakh a year</strong> — and I cover it myself.
                <br /><br />
                Every rupee you contribute goes directly to infrastructure — keeping the servers
                running, the data fresh, and helping me expand to more districts faster.
                This is my way of building India — one district at a time.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Where Your Money Goes */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 16, letterSpacing: "-0.3px" }}>
          🔍 Where Your Money Goes
        </h2>
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E8E4",
            borderRadius: 14,
            padding: "20px 24px",
            marginBottom: 40,
          }}
        >
          {COST_BREAKDOWN.map((item) => (
            <div key={item.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: "#1A1A1A" }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono, monospace)", color: item.color }}>
                  {item.pct}%
                </span>
              </div>
              <div style={{ background: "#F5F5F0", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${item.pct}%`, height: "100%", background: item.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Other Ways to Help */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 16, letterSpacing: "-0.3px" }}>
          🤝 Other Ways to Help
        </h2>
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E8E4",
            borderRadius: 14,
            padding: "20px 24px",
            marginBottom: 40,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { emoji: "⭐", label: "Star on GitHub", desc: "Help us get visibility — star the repository", href: "https://github.com/jayanthmb14/forthepeople", external: true },
              { emoji: "🐦", label: "Share on social media", desc: "Share ForThePeople.in with #OpenDataIndia", href: "https://twitter.com/intent/tweet?text=Check%20out%20ForThePeople.in%20%E2%80%94%20free%20government%20data%20dashboards%20for%20Indian%20districts%20%23OpenDataIndia%20%23ForThePeople&url=https://forthepeople.in", external: true },
              { emoji: "💻", label: "Contribute code", desc: "We're open source — PRs welcome on GitHub", href: "https://github.com/jayanthmb14/forthepeople/issues", external: true },
              { emoji: "📊", label: "Send district data", desc: "Know RTI documents or official reports? Share them", href: "/en/feedback", external: false },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="support-help-item"
                style={{ display: "flex", alignItems: "flex-start", gap: 12, textDecoration: "none", padding: "8px 10px", borderRadius: 8 }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B" }}>{item.desc}</div>
                </div>
              </a>
            ))}
            {/* Report data errors — uses feedback modal */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 10px" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🐛</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Report data errors</div>
                <div style={{ fontSize: 12, color: "#6B6B6B" }}>
                  Found wrong data?{" "}
                  <FeedbackModal label="Use our feedback form →" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)",
            border: "1px solid #BFDBFE",
            borderRadius: 16,
            padding: "28px 32px",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
            Even ₹50 helps.
          </div>
          <p style={{ fontSize: 14, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 20 }}>
            It pays for one day of collecting data for a district — weather updates, crop prices, dam levels,
            and 26 more data streams. Free for every citizen in that district.
          </p>
          <div style={{ display: "inline-block", minWidth: 220 }}>
            <SupportCheckout
              tier={{
                emoji: "❤️",
                label: "Buy me a Chai",
                defaultAmount: 50,
                accent: "#2563EB",
              }}
            />
          </div>
        </div>

        {/* Live Contributor Wall */}
        <ContributorWallClient />

        {/* International payment disclaimer */}
        <div style={{
          background: "#FAFAF8", border: "0.5px solid #E8E8E4", borderRadius: 10,
          padding: "14px 18px", fontSize: 13, color: "#6B6B6B", lineHeight: 1.6, marginTop: 24,
        }}>
          🌏 International supporters: We currently accept payments within India only.
          If you&apos;d like to contribute from outside India, please DM us on Instagram{" "}
          <a href="https://www.instagram.com/jayanth_m_b/" target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
            @jayanth_m_b
          </a>{" "}
          and we&apos;ll arrange an alternative payment method.
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/en" style={{ fontSize: 13, color: "#9B9B9B", textDecoration: "none" }}>
            ← Back to ForThePeople.in
          </Link>
        </div>
      </div>
    </main>
  );
}
