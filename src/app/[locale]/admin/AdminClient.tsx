"use client";

/**
 * ForThePeople.in — Admin dashboard tab switcher
 * Reads active tab from ?tab= query param (set by sidebar links).
 * Five sub-tabs render in-place on /admin: dashboard, system-health, alerts, analytics, costs.
 * Other admin areas (ai-settings, review, supporters, feedback, security) are full routes.
 */

import { type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import SystemHealth from "./SystemHealth";
import AlertsAndLogs from "./AlertsAndLogs";
import AnalyticsDashboard from "./AnalyticsDashboard";
import CostsTab from "./CostsTab";
import ExpenditureTab from "./ExpenditureTab";
import TrafficTab from "./TrafficTab";
import VaultTab from "./VaultTab";
import ContentEditorTab from "./ContentEditorTab";
import UpdateLogTab from "./UpdateLogTab";
import SupportPageEditor from "./SupportPageEditor";
import AnnouncementTab from "./AnnouncementTab";

type TabId =
  | "dashboard"
  | "system-health"
  | "alerts"
  | "analytics"
  | "costs"
  | "expenditure"
  | "traffic"
  | "vault"
  | "content-editor"
  | "update-log"
  | "support-page"
  | "announcement";

function normalizeTab(raw: string | null): TabId {
  switch (raw) {
    case "system-health":
    case "alerts":
    case "analytics":
    case "costs":
    case "expenditure":
    case "traffic"  :
    case "vault":
    case "content-editor":
    case "update-log":
    case "support-page":
    case "announcement":
      return raw;
    default:
      return "dashboard";
  }
}

export default function AdminClient({ children }: { children: ReactNode; locale: string }) {
  const searchParams = useSearchParams();
  const tab = normalizeTab(searchParams?.get("tab") ?? null);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {tab === "dashboard" && children}
      {tab === "system-health" && <SystemHealth />}
      {tab === "alerts" && <AlertsAndLogs />}
      {tab === "analytics" && <AnalyticsDashboard />}
      {tab === "costs" && <CostsTab />}
      {tab === "expenditure" && <ExpenditureTab />}
      {tab === "traffic" && <TrafficTab />}
      {tab === "vault" && <VaultTab />}
      {tab === "content-editor" && <ContentEditorTab />}
      {tab === "update-log" && <UpdateLogTab />}
      {tab === "support-page" && <SupportPageEditor />}
      {tab === "announcement" && <AnnouncementTab />}
    </div>
  );
}
