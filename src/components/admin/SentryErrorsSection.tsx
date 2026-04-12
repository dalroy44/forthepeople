"use client";

/**
 * Sentry unresolved issues — rendered at the top of Alerts & Logs.
 * Graceful degradation: shows setup instructions when SENTRY_API_TOKEN missing.
 */

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bug, ExternalLink, RefreshCw } from "lucide-react";

interface SentryIssue {
  id: string;
  title: string;
  culprit: string | null;
  level: string;
  status: string;
  count: string;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
  shortId: string;
}

interface ApiResponse {
  configured: boolean;
  issues: SentryIssue[];
  error?: string;
  org?: string;
  project?: string;
  cached?: boolean;
}

const LEVEL_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  fatal: { bg: "#FEE2E2", border: "#DC2626", text: "#991B1B" },
  error: { bg: "#FEE2E2", border: "#DC2626", text: "#991B1B" },
  warning: { bg: "#FEF3C7", border: "#D97706", text: "#92400E" },
  info: { bg: "#DBEAFE", border: "#2563EB", text: "#1E40AF" },
  debug: { bg: "#F3F4F6", border: "#6B7280", text: "#374151" },
};

export default function SentryErrorsSection() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/sentry-errors?limit=10")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ApiResponse | null) => {
        if (d) {
          setData(d);
          setLastRefresh(new Date());
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const card: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #E8E8E4",
    borderRadius: 10,
    padding: 16,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Bug size={16} color="#DC2626" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
            Production Errors (Sentry)
          </span>
          {data?.configured && data.issues.length > 0 && (
            <span
              style={{
                background: "#FEE2E2",
                color: "#DC2626",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 10,
              }}
            >
              {data.issues.length}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastRefresh && (
            <span style={{ fontSize: 10, color: "#9B9B9B" }}>
              Last checked: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </span>
          )}
          <button
            onClick={load}
            style={{
              background: "none",
              border: "1px solid #E8E8E4",
              borderRadius: 6,
              padding: "3px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 11,
              color: "#6B6B6B",
            }}
          >
            <RefreshCw size={10} /> Refresh
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ ...card, fontSize: 12, color: "#9B9B9B", textAlign: "center" }}>
          Loading...
        </div>
      ) : !data?.configured ? (
        <NotConfigured />
      ) : data.error ? (
        <div
          style={{
            ...card,
            background: "#FEF3C7",
            borderColor: "#FDE68A",
            color: "#92400E",
            fontSize: 12,
          }}
        >
          ⚠️ {data.error}
        </div>
      ) : data.issues.length === 0 ? (
        <div
          style={{
            ...card,
            background: "#DCFCE7",
            borderColor: "#BBF7D0",
            color: "#166534",
            fontSize: 12,
          }}
        >
          ✓ No unresolved production errors
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.issues.map((issue) => {
            const c = LEVEL_COLOR[issue.level] ?? LEVEL_COLOR.info;
            return (
              <div
                key={issue.id}
                style={{
                  ...card,
                  borderLeft: `4px solid ${c.border}`,
                  padding: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={issue.title}
                    >
                      {issue.level === "error" || issue.level === "fatal"
                        ? "🔴"
                        : issue.level === "warning"
                        ? "🟡"
                        : "🔵"}{" "}
                      {issue.title}
                    </div>
                    {issue.culprit && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6B6B6B",
                          marginTop: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {issue.culprit}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 10,
                        color: "#9B9B9B",
                        marginTop: 3,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        First: {formatDistanceToNow(new Date(issue.firstSeen), { addSuffix: true })}
                      </span>
                      <span>
                        Last: {formatDistanceToNow(new Date(issue.lastSeen), { addSuffix: true })}
                      </span>
                      <span>{issue.shortId}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span
                      style={{
                        background: c.bg,
                        color: c.text,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 10,
                      }}
                    >
                      ×{issue.count}
                    </span>
                    <a
                      href={issue.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#2563EB",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 11,
                        textDecoration: "none",
                      }}
                    >
                      Open <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotConfigured() {
  return (
    <div
      style={{
        background: "#FEF3C7",
        border: "1px solid #FDE68A",
        borderRadius: 10,
        padding: 12,
        color: "#92400E",
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        Sentry API reading is not configured
      </div>
      <ol style={{ paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
        <li>
          Create a token at sentry.io → Settings → Account → API → Auth Tokens with{" "}
          <code>event:read</code> and <code>project:read</code> scopes
        </li>
        <li>
          Add to Vercel env: <code>SENTRY_API_TOKEN</code>, <code>SENTRY_ORG</code> (slug),{" "}
          <code>SENTRY_PROJECT</code> (slug)
        </li>
        <li>Redeploy</li>
      </ol>
      <div style={{ fontSize: 11, color: "#78350F", marginTop: 8 }}>
        Note: this is distinct from <code>SENTRY_AUTH_TOKEN</code> (used only for source-map uploads during build).
      </div>
    </div>
  );
}
