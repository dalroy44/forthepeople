/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { useTranslations } from "next-intl";

export default function HowItWorks() {
  const t = useTranslations("home");
  const steps = [
    {
      icon: "📡",
      title: t("step1Title"),
      desc: t("step1Desc"),
    },
    {
      icon: "📊",
      title: t("step2Title"),
      desc: t("step2Desc"),
    },
    {
      icon: "👁️",
      title: t("step3Title"),
      desc: t("step3Desc"),
    },
  ];

  return (
    <div style={{ padding: "0 16px 8px" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "#9B9B9B",
          marginBottom: 12,
        }}
      >
        {t("howItWorks")}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
              {s.title}
            </div>
            <div style={{ fontSize: 11, color: "#6B6B6B", lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
