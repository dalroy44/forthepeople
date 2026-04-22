/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { INDIA_STATES } from "@/lib/constants/districts";
import { useTranslations } from "next-intl";

interface TopRequest {
  id: string;
  stateName: string;
  districtName: string;
  requestCount: number;
}

export default function DistrictRequestSection() {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Dynamic count of active districts from constants
  const activeCount = INDIA_STATES.reduce((sum, s) => sum + s.districts.filter(d => d.active).length, 0);

  const { data } = useQuery<{ top: TopRequest[] }>({
    queryKey: ["district-requests"],
    queryFn: () => fetch("/api/district-request").then((r) => r.json()),
    staleTime: 300_000,
  });

  const mutation = useMutation({
    mutationFn: (body: { stateName: string; districtName: string }) =>
      fetch("/api/district-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["district-requests"] });
      setSubmitted(true);
    },
  });

  const stateData = INDIA_STATES.find((s) => s.name === selectedState);
  const lockedDistricts = stateData?.districts.filter((d) => !d.active) ?? [];

  function handleRequest() {
    if (!selectedState || !selectedDistrict) return;
    mutation.mutate({ stateName: selectedState, districtName: selectedDistrict });
  }

  const topRequest = data?.top?.[0];

  return (
    <div style={{ padding: "0 16px 16px" }}>
      {/* Progress bar */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8E8E4",
          borderRadius: 14,
          padding: "16px 18px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>
            {t("expandingTitle")}
          </span>
          <span style={{ fontSize: 11, color: "#9B9B9B", fontFamily: "var(--font-mono, monospace)" }}>
            {t("liveStatus", { count: activeCount })}
          </span>
        </div>
        <div style={{ background: "#F5F5F0", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 12 }}>
          <div
            style={{
              width: `${(activeCount / 780) * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg, #2563EB, #7C3AED)",
              borderRadius: 4,
              minWidth: 8,
            }}
          />
        </div>

        {topRequest && (
          <div style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600, marginBottom: 12 }}>
            🔥 {t("mostRequested", { district: topRequest.districtName, state: topRequest.stateName, count: topRequest.requestCount })}
          </div>
        )}

        {submitted ? (
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 13,
              color: "#16A34A",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            ✓ {t("requestSubmitted", { district: selectedDistrict })}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(""); }}
              style={{
                flex: 1,
                minWidth: 130,
                padding: "8px 10px",
                border: "1px solid #E8E8E4",
                borderRadius: 8,
                fontSize: 13,
                color: "#1A1A1A",
                background: "#FAFAF8",
                outline: "none",
              }}
            >
              <option value="">{tNav("selectState")}</option>
              {INDIA_STATES.map((s) => (
                <option key={s.slug} value={s.name}>{s.name}</option>
              ))}
            </select>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState}
              style={{
                flex: 1,
                minWidth: 130,
                padding: "8px 10px",
                border: "1px solid #E8E8E4",
                borderRadius: 8,
                fontSize: 13,
                color: selectedDistrict ? "#1A1A1A" : "#9B9B9B",
                background: "#FAFAF8",
                outline: "none",
                opacity: !selectedState ? 0.5 : 1,
              }}
            >
              <option value="">{tNav("selectDistrict")}</option>
              {lockedDistricts.map((d) => (
                <option key={d.slug} value={d.name}>{d.name}</option>
              ))}
            </select>

            <button
              onClick={handleRequest}
              disabled={!selectedState || !selectedDistrict || mutation.isPending}
              style={{
                padding: "8px 16px",
                background: selectedState && selectedDistrict ? "#2563EB" : "#E8E8E4",
                color: selectedState && selectedDistrict ? "#fff" : "#9B9B9B",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: selectedState && selectedDistrict ? "pointer" : "default",
                transition: "background 0.15s",
                minHeight: 44,
              }}
            >
              {mutation.isPending ? "…" : t("requestButton")}
            </button>
          </div>
        )}

        {/* Feature voting link */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F0F0EC" }}>
          <Link
            href="/en/features"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 12px", background: "#F5F3FF", border: "1px solid #DDD6FE",
              borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 600,
              color: "#7C3AED",
            }}
          >
            <span>🗳️ {t("voteFeatures")}</span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
