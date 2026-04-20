// Rate-limited, robots.txt-aware HTTP client for tender portal engines.
// All engines route through tenderFetch() — this enforces the civic-bot
// user agent, hard 3s-per-portal pacing, 3-retry backoff on 403/429/503,
// and daily request caps. Never call fetch() directly from an engine.

// Bots can't use mailto: links, so we point portal operators at a public
// contact URL instead. The contact page routes to support@forthepeople.in.
const USER_AGENT = "ForThePeople.in Civic Transparency Bot (contact: https://forthepeople.in/contact)";

type RobotsSnapshot = { fetchedAt: number; disallow: string[] };
const robotsCache = new Map<string, RobotsSnapshot>();
const ROBOTS_TTL_MS = 24 * 60 * 60 * 1000; // 24h

type PortalState = {
  lastRequestAt: number;
  requestCountToday: number;
  dayStartedAt: number;
};
const portalState = new Map<string, PortalState>();

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function originOf(url: string): string {
  const u = new URL(url);
  return `${u.protocol}//${u.host}`;
}

async function fetchRobots(origin: string): Promise<RobotsSnapshot> {
  const cached = robotsCache.get(origin);
  if (cached && Date.now() - cached.fetchedAt < ROBOTS_TTL_MS) return cached;
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { "User-Agent": USER_AGENT } });
    const body = res.ok ? await res.text() : "";
    const disallow: string[] = [];
    let matchAll = false;
    for (const line of body.split(/\r?\n/)) {
      const lc = line.trim().toLowerCase();
      if (lc.startsWith("user-agent:")) {
        const ua = lc.replace("user-agent:", "").trim();
        matchAll = ua === "*";
      }
      if (matchAll && lc.startsWith("disallow:")) {
        const path = lc.replace("disallow:", "").trim();
        if (path) disallow.push(path);
      }
    }
    const snap: RobotsSnapshot = { fetchedAt: Date.now(), disallow };
    robotsCache.set(origin, snap);
    return snap;
  } catch {
    const snap: RobotsSnapshot = { fetchedAt: Date.now(), disallow: [] };
    robotsCache.set(origin, snap);
    return snap;
  }
}

function isDisallowed(url: string, robots: RobotsSnapshot): boolean {
  const path = new URL(url).pathname;
  return robots.disallow.some((p) => p !== "" && path.startsWith(p));
}

export interface TenderFetchOptions {
  portalCode: string;
  rateLimitSeconds: number;
  maxRequestsPerDay: number;
  method?: "GET" | "POST";
  body?: string | URLSearchParams;
  headers?: Record<string, string>;
  cookies?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface TenderFetchResult {
  ok: boolean;
  status: number;
  body: string;
  headers: Headers;
  cookies: string;
  attempts: number;
  blocked?: "robots" | "rate-limit" | "daily-cap";
  error?: string;
}

export async function tenderFetch(url: string, opts: TenderFetchOptions): Promise<TenderFetchResult> {
  const origin = originOf(url);

  // Robots.txt gate
  const robots = await fetchRobots(origin);
  if (isDisallowed(url, robots)) {
    return { ok: false, status: 0, body: "", headers: new Headers(), cookies: "", attempts: 0, blocked: "robots" };
  }

  // Per-portal state
  const now = Date.now();
  let state = portalState.get(opts.portalCode);
  const oneDay = 24 * 60 * 60 * 1000;
  if (!state || now - state.dayStartedAt > oneDay) {
    state = { lastRequestAt: 0, requestCountToday: 0, dayStartedAt: now };
    portalState.set(opts.portalCode, state);
  }
  if (state.requestCountToday >= opts.maxRequestsPerDay) {
    return { ok: false, status: 0, body: "", headers: new Headers(), cookies: "", attempts: 0, blocked: "daily-cap" };
  }

  // Rate limit gate
  const elapsed = now - state.lastRequestAt;
  const minGap = opts.rateLimitSeconds * 1000;
  if (elapsed < minGap) await sleep(minGap - elapsed);

  // Retry loop with exponential backoff on 403/429/503
  const maxRetries = opts.maxRetries ?? 3;
  const timeoutMs = opts.timeoutMs ?? 30_000;
  let attempt = 0;
  let lastStatus = 0;
  let lastError: string | undefined;

  while (attempt <= maxRetries) {
    attempt++;
    state.lastRequestAt = Date.now();
    state.requestCountToday += 1;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: opts.method ?? "GET",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-IN,en;q=0.9",
          ...(opts.cookies ? { Cookie: opts.cookies } : {}),
          ...(opts.headers ?? {}),
        },
        body: opts.body,
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timer);
      const body = await res.text();
      lastStatus = res.status;

      if (res.status === 403 || res.status === 429 || res.status === 503) {
        const backoff = Math.min(60_000 * Math.pow(2, attempt - 1), 300_000);
        if (attempt <= maxRetries) {
          await sleep(backoff);
          continue;
        }
        return { ok: false, status: res.status, body, headers: res.headers, cookies: res.headers.get("set-cookie") ?? "", attempts: attempt };
      }

      return {
        ok: res.ok,
        status: res.status,
        body,
        headers: res.headers,
        cookies: res.headers.get("set-cookie") ?? "",
        attempts: attempt,
      };
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt > maxRetries) break;
      await sleep(5_000 * attempt);
    }
  }

  return {
    ok: false,
    status: lastStatus,
    body: "",
    headers: new Headers(),
    cookies: "",
    attempts: attempt,
    error: lastError,
  };
}

export const TENDER_BOT_USER_AGENT = USER_AGENT;
