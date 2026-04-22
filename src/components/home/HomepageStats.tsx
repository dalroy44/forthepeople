/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Stats {
  activeDistricts: number;
  modulesPerDistrict: number;
  totalDataPoints: number;
  mostRecentAt: string | null;
  plannedDistricts: number;
}

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}


function StatCard({ value, label, mono = true }: { value: string; label: string; mono?: boolean }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E8E4",
        borderRadius: 12,
        padding: "16px 14px",
        textAlign: "center",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "#2563EB",
          fontFamily: mono ? "var(--font-mono, monospace)" : "var(--font-plus-jakarta, system-ui, sans-serif)",
          letterSpacing: "-1px",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

export default function HomepageStats() {
  const t = useTranslations("home");
  const { data } = useQuery<Stats>({
    queryKey: ["homepage-stats"],
    queryFn: () => fetch("/api/data/homepage-stats").then((r) => r.json()),
    staleTime: 300_000,
  });

  // Drive the count-up animation from real values only. While the API is in
  // flight we render an em-dash so users never see "0 Districts LIVE" during
  // a cold function start.
  const districts = useCountUp(data?.activeDistricts ?? 0);
  const modules = useCountUp(data?.modulesPerDistrict ?? 29);
  const dataPoints = useCountUp(data?.totalDataPoints ?? 0);
  const ready = !!data;

  return (
    <div>
      <div className="grid grid-cols-2 md:flex" style={{ gap: 8, padding: "12px 16px 0" }}>
        <StatCard value={ready ? `${districts}` : "—"} label={t("districtsLive")} />
        <StatCard value={ready ? `${modules}` : "—"} label={t("dashboards")} />
        <StatCard
          value={ready ? dataPoints.toLocaleString("en-IN") : "—"}
          label={t("dataPoints")}
        />
        <StatCard value={`${(data?.plannedDistricts ?? 780).toLocaleString("en-IN")}+`} label={t("districtsComing")} />
        <div className="hidden md:contents">
          <StatCard value={t("live")} label={t("lastUpdated")} mono={false} />
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#9B9B9B", textAlign: "center", marginTop: 8 }}>
        {t("refreshNotice")}
      </p>
    </div>
  );
}
