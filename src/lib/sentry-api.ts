/**
 * ForThePeople.in — Sentry REST API client
 * Reads unresolved issues for display in the admin panel.
 * Docs: https://docs.sentry.io/api/
 *
 * Env vars:
 *   SENTRY_API_TOKEN   — token with "event:read" + "project:read" scopes
 *                        (from sentry.io/settings/account/api/auth-tokens)
 *                        IMPORTANT: different from SENTRY_AUTH_TOKEN (build-time)
 *   SENTRY_ORG         — organization slug (default: forthepeoplein)
 *   SENTRY_PROJECT     — project slug (default: javascript-nextjs)
 */

const SENTRY_API_BASE = "https://sentry.io/api/0";

export interface SentryIssue {
  id: string;
  title: string;
  culprit: string | null;
  level: string; // "error" | "warning" | "fatal" | "info" | "debug"
  status: string; // "unresolved" | "resolved" | "ignored"
  count: string; // returned as string by the API
  firstSeen: string;
  lastSeen: string;
  permalink: string;
  shortId: string;
  metadata?: {
    type?: string;
    value?: string;
    function?: string;
  };
}

export interface SentryFetchResult {
  configured: boolean;
  issues: SentryIssue[];
  error?: string;
  org?: string;
  project?: string;
}

export async function fetchSentryIssues(limit = 10): Promise<SentryFetchResult> {
  const token = process.env.SENTRY_API_TOKEN;
  const org = process.env.SENTRY_ORG || "forthepeoplein";
  const project = process.env.SENTRY_PROJECT || "javascript-nextjs";

  if (!token) {
    return { configured: false, issues: [] };
  }

  try {
    const res = await fetch(
      `${SENTRY_API_BASE}/projects/${org}/${project}/issues/?query=is%3Aunresolved&sort=date&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        // Server fetch; we handle caching ourselves at the API-route level.
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return {
        configured: true,
        issues: [],
        error: `Sentry API ${res.status}: ${res.statusText}`,
        org,
        project,
      };
    }

    const issues = (await res.json()) as SentryIssue[];
    return { configured: true, issues, org, project };
  } catch (err) {
    return {
      configured: true,
      issues: [],
      error: err instanceof Error ? err.message : String(err),
      org,
      project,
    };
  }
}
