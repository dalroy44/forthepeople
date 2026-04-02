/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import { Flame } from "lucide-react";
import { ModuleHeader, SectionLabel } from "@/components/district/ui";
import { getResponsibilityContent } from "@/lib/constants/responsibility-content";

export default function ResponsibilityPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const content = getResponsibilityContent(district);

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={Flame}
        title="My Responsibility"
        description={content.intro}
        backHref={base}
      />

      {/* Intro callout */}
      <div
        style={{
          background: "linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)",
          border: "1px solid #BFDBFE",
          borderRadius: 14,
          padding: "18px 20px",
          marginBottom: 28,
          fontSize: 14,
          color: "#1D4ED8",
          lineHeight: 1.7,
          fontWeight: 500,
        }}
      >
        🗣️ <strong>This is YOUR district.</strong> Government alone cannot fix everything.
        As citizens, we have real power — and real responsibility. Small actions by many
        people create big change. Here&apos;s what you can do today.
      </div>

      {content.sections.map((section) => (
        <div key={section.title} style={{ marginBottom: 24 }}>
          <SectionLabel>
            {section.emoji} {section.title}
          </SectionLabel>
          <div
            style={{
              background: section.color,
              border: `1px solid ${section.border}`,
              borderRadius: 14,
              padding: "16px 20px",
            }}
          >
            {section.isProjection ? (
              <div
                style={{
                  fontSize: 13,
                  color: "#1A1A1A",
                  marginBottom: 4,
                  fontStyle: "italic",
                }}
              >
                If citizens and government work together, here&apos;s where {content.districtName} can be by 2030:
              </div>
            ) : null}
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {section.items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: "#1A1A1A",
                    lineHeight: 1.6,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      {/* Data quality note */}
      <div
        style={{
          background: "#FAFAF8",
          border: "1px solid #E8E8E4",
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: 12,
          color: "#9B9B9B",
          marginTop: 8,
        }}
      >
        📌 This content is specific to {content.districtName} district based on verified data from
        government portals, SBM reports, and official sources. Each district on ForThePeople.in
        gets its own customised responsibility guide based on its unique challenges and opportunities.
      </div>
    </div>
  );
}
