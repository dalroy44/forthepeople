"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Download, Mail, X } from "lucide-react";
import ModuleHelp from "@/components/admin/ModuleHelp";
import SentryErrorsSection from "@/components/admin/SentryErrorsSection";

interface AdminAlertItem {
  id: string;
  level: string;
  title: string;
  message: string;
  details: Record<string, string | number> | null;
  module: string | null;
  district: string | null;
  read: boolean;
  emailed: boolean;
  createdAt: string;
}

interface ApiResponse {
  alerts: AdminAlertItem[];
  total: number;
  emailConfigured: boolean;
}

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 10,
  padding: 16,
};

const EMOJI: Record<string, string> = { critical: "🚨", warning: "⚠️", info: "ℹ️" };
const LEVEL_COLOR: Record<string, string> = {
  critical: "#DC2626",
  warning: "#D97706",
  info: "#2563EB",
};

const ALERTS_HELP =
  "Alerts are triggered by: scraper job failures, new user feedback submissions, payment events (received/failed), and system errors. Email alerts require RESEND_API_KEY and ADMIN_EMAIL environment variables. Alerts older than 30 days can be cleared.";

type SourceFilter = "all" | "scraper" | "feedback" | "payment" | "system";
type DateFilter = "all" | "1" | "7" | "30";

function sourceOf(alert: AdminAlertItem): Exclude<SourceFilter, "all"> {
  const t = alert.title;
  if (t.startsWith("Scraper Failed") || t.startsWith("Cron Job Failed") || t.startsWith("Stale Data")) return "scraper";
  if (t.includes("Feedback")) return "feedback";
  if (t.includes("Payment") || t.includes("Contribution")) return "payment";
  return "system";
}

const SOURCE_BADGE: Record<
  Exclude<SourceFilter, "all">,
  { label: string; bg: string; color: string }
> = {
  scraper: { label: "Scraper", bg: "#F3F4F6", color: "#4B5563" },
  feedback: { label: "Feedback", bg: "#DBEAFE", color: "#2563EB" },
  payment: { label: "Payment", bg: "#DCFCE7", color: "#16A34A" },
  system: { label: "System", bg: "#EDE9FE", color: "#7C3AED" },
};

export default function AlertsAndLogs() {
  const [alerts, setAlerts] = useState<AdminAlertItem[]>([]);
  const [total, setTotal] = useState(0);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<string>("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [dateRange, setDateRange] = useState<DateFilter>("all");
  const [district, setDistrict] = useState<string>("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [offset, setOffset] = useState(0);
  const [showEmailHelp, setShowEmailHelp] = useState(false);

  const buildParams = useCallback(
    (resetOffset: boolean): URLSearchParams => {
      const params = new URLSearchParams();
      if (level !== "all") params.set("level", level);
      if (unreadOnly) params.set("read", "false");
      if (source !== "all") params.set("source", source);
      if (dateRange !== "all") params.set("sinceDays", dateRange);
      if (district.trim()) params.set("district", district.trim());
      params.set("limit", "50");
      params.set("offset", resetOffset ? "0" : String(offset));
      return params;
    },
    [level, unreadOnly, source, dateRange, district, offset]
  );

  const fetchAlerts = useCallback(
    (reset = true) => {
      setLoading(true);
      fetch(`/api/admin/alerts?${buildParams(reset)}`)
        .then((r) => r.json() as Promise<ApiResponse>)
        .then((d) => {
          setEmailConfigured(Boolean(d.emailConfigured));
          if (reset) {
            setAlerts(d.alerts || []);
            setOffset(50);
          } else {
            setAlerts((prev) => [...prev, ...(d.alerts || [])]);
            setOffset((prev) => prev + 50);
          }
          setTotal(d.total || 0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [buildParams]
  );

  useEffect(() => {
    fetchAlerts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, unreadOnly, source, dateRange, district]);

  const markRead = async (ids: string[]) => {
    await fetch("/api/admin/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setAlerts((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, read: true } : a)));
  };

  const markAllRead = async () => {
    await fetch("/api/admin/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const clearOld = async () => {
    if (!confirm("Delete alerts older than 30 days?")) return;
    const res = await fetch("/api/admin/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ olderThanDays: 30 }),
    });
    const d = await res.json();
    if (d.deleted > 0) fetchAlerts(true);
  };

  const exportCsv = () => {
    const rows = [
      ["id", "created", "level", "source", "title", "message", "module", "district", "read", "emailed"],
      ...alerts.map((a) => [
        a.id,
        a.createdAt,
        a.level,
        sourceOf(a),
        a.title.replace(/"/g, '""'),
        a.message.replace(/"/g, '""'),
        a.module ?? "",
        a.district ?? "",
        a.read ? "yes" : "no",
        a.emailed ? "yes" : "no",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/\n/g, " ")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ftp-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const districts = useMemo(() => {
    const set = new Set<string>();
    for (const a of alerts) if (a.district) set.add(a.district);
    return Array.from(set).sort();
  }, [alerts]);

  const unreadCount = alerts.filter((a) => !a.read).length;
  const critToday = alerts.filter(
    (a) =>
      a.level === "critical" &&
      new Date(a.createdAt).toDateString() === new Date().toDateString()
  ).length;
  const lastAlert = alerts[0]?.createdAt;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>
          Alerts & Logs
        </h2>
        <ModuleHelp text={ALERTS_HELP} size={14} />
      </div>

      {/* Sentry production errors (separate from internal AdminAlert feed) */}
      <SentryErrorsSection />

      {/* Email config warning */}
      {!emailConfigured && (
        <div
          style={{
            background: "#FEF3C7",
            border: "1px solid #FDE68A",
            borderRadius: 10,
            padding: 12,
            fontSize: 12,
            color: "#92400E",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Email alerts are not active.</strong> Set RESEND_API_KEY and
              ADMIN_EMAIL in Vercel environment variables to receive email
              notifications for scraper failures, payments, and feedback.{" "}
              <button
                type="button"
                onClick={() => setShowEmailHelp((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#92400E",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                How to fix →
              </button>
              {showEmailHelp && (
                <ol style={{ marginTop: 8, paddingLeft: 18, fontSize: 11, lineHeight: 1.6 }}>
                  <li>Open Vercel Dashboard → Settings → Environment Variables</li>
                  <li>Add <code>RESEND_API_KEY</code> (from resend.com dashboard)</li>
                  <li>Add <code>ADMIN_EMAIL</code> (your email address)</li>
                  <li>Redeploy for changes to take effect</li>
                </ol>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats + actions */}
      <div
        style={{
          ...card,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 13, color: "#6B6B6B" }}>
          <strong style={{ color: "#1A1A1A" }}>{unreadCount}</strong> unread
          {" · "}
          <strong style={{ color: "#DC2626" }}>{critToday}</strong> critical today
          {lastAlert && (
            <>
              {" · Last alert: "}
              {formatDistanceToNow(new Date(lastAlert), { addSuffix: true })}
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={markAllRead}
            style={{
              background: "#2563EB",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Mark All Read
          </button>
          <button
            onClick={exportCsv}
            style={{
              background: "#fff",
              color: "#2563EB",
              border: "1px solid #DBEAFE",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Download size={12} /> Export CSV
          </button>
          <button
            onClick={clearOld}
            style={{
              background: "#fff",
              color: "#DC2626",
              border: "1px solid #FCA5A5",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear 30d+
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {[
          { id: "all", label: "All" },
          { id: "critical", label: "🚨 Critical" },
          { id: "warning", label: "⚠️ Warning" },
          { id: "info", label: "ℹ️ Info" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setLevel(f.id)}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: level === f.id ? "1px solid #2563EB" : "1px solid #E8E8E4",
              background: level === f.id ? "#EFF6FF" : "#fff",
              color: level === f.id ? "#2563EB" : "#6B6B6B",
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as SourceFilter)}
          style={selectStyle}
        >
          <option value="all">All sources</option>
          <option value="scraper">Scraper</option>
          <option value="feedback">Feedback</option>
          <option value="payment">Payment</option>
          <option value="system">System</option>
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateFilter)}
          style={selectStyle}
        >
          <option value="all">All time</option>
          <option value="1">Today</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
        {districts.length > 0 && (
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            style={selectStyle}
          >
            <option value="">All districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            color: "#6B6B6B",
            marginLeft: 8,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            style={{ accentColor: "#2563EB" }}
          />
          Unread only
        </label>
        {(level !== "all" ||
          source !== "all" ||
          dateRange !== "all" ||
          district ||
          unreadOnly) && (
          <button
            onClick={() => {
              setLevel("all");
              setSource("all");
              setDateRange("all");
              setDistrict("");
              setUnreadOnly(false);
            }}
            style={{
              background: "none",
              border: "none",
              fontSize: 11,
              color: "#6B6B6B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <X size={11} /> Clear filters
          </button>
        )}
      </div>

      {/* Feed */}
      {loading && alerts.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>
          Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div
          style={{
            ...card,
            textAlign: "center",
            color: "#9B9B9B",
            fontSize: 13,
            padding: 32,
          }}
        >
          No alerts found.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {alerts.map((alert) => {
            const src = sourceOf(alert);
            const badge = SOURCE_BADGE[src];
            const sideColor = LEVEL_COLOR[alert.level] || "#D1D5DB";
            return (
              <div
                key={alert.id}
                style={{
                  ...card,
                  borderLeft: `4px solid ${sideColor}`,
                  cursor: "pointer",
                }}
                onClick={() => toggleExpand(alert.id)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span>{EMOJI[alert.level] || "ℹ️"}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: LEVEL_COLOR[alert.level] || "#1A1A1A",
                      }}
                    >
                      {alert.title}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: badge.bg,
                        color: badge.color,
                      }}
                    >
                      {badge.label}
                    </span>
                    {!alert.read && (
                      <span
                        style={{
                          background: "#2563EB",
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: 4,
                        }}
                      >
                        unread
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#9B9B9B",
                      whiteSpace: "nowrap",
                      marginLeft: 8,
                    }}
                  >
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>
                  {alert.message}
                </div>

                {expanded.has(alert.id) && alert.details && (
                  <div
                    style={{
                      marginTop: 8,
                      background: "#FAFAF8",
                      border: "1px solid #E8E8E4",
                      borderRadius: 6,
                      padding: 10,
                      fontSize: 12,
                    }}
                  >
                    {Object.entries(alert.details).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", gap: 8, padding: "2px 0" }}>
                        <span style={{ color: "#9B9B9B", minWidth: 80 }}>{k}:</span>
                        <span
                          style={{
                            color: "#1A1A1A",
                            fontWeight: 500,
                            wordBreak: "break-all",
                          }}
                        >
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  {!alert.read ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead([alert.id]);
                      }}
                      style={{
                        background: "none",
                        border: "1px solid #E8E8E4",
                        borderRadius: 4,
                        padding: "3px 10px",
                        fontSize: 11,
                        color: "#2563EB",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Mark as Read
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: "#9B9B9B" }}>Read</span>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: alert.emailed ? "#16A34A" : "#DC2626",
                    }}
                  >
                    <Mail size={11} />
                    {alert.emailed ? "Emailed" : emailConfigured ? "Not emailed" : "Email disabled"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {alerts.length < total && (
        <button
          onClick={() => fetchAlerts(false)}
          style={{
            background: "#fff",
            border: "1px solid #E8E8E4",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 13,
            color: "#2563EB",
            cursor: "pointer",
            fontWeight: 600,
            alignSelf: "center",
          }}
        >
          Load more ({total - alerts.length} remaining)
        </button>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "5px 10px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  border: "1px solid #E8E8E4",
  background: "#fff",
  color: "#6B6B6B",
  cursor: "pointer",
};
