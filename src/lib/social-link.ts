/**
 * ForThePeople.in — Social link helpers
 *
 * Bare domains entered in the admin (e.g. "khattamicah.xyz") need a scheme
 * before they can be used as href targets. This normaliser prepends https://
 * when the input is missing one.
 */

import { detectAndCleanSocialLink } from "./social-detect";

export function normalizeSocialLink(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Delegate to the richer cleaner so "@handle", bare usernames, and profile
  // URLs all end up as valid absolute profile links. Old behaviour would turn
  // "@iamv1n_" into "https://@iamv1n_" which browsers treat as a relative path.
  const detected = detectAndCleanSocialLink(trimmed);
  if (detected) return detected.cleanUrl;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return null;
}

/** Best-effort platform detection from a URL. */
export function detectSocialPlatform(raw: string | null | undefined): string | null {
  const url = normalizeSocialLink(raw);
  if (!url) return null;
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
  if (host.includes("instagram.com")) return "instagram";
  if (host.includes("linkedin.com")) return "linkedin";
  if (host.includes("github.com")) return "github";
  if (/^(twitter|x)\.com$/.test(host)) return "twitter";
  if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
  if (host.includes("facebook.com") || host === "fb.com") return "facebook";
  if (host.includes("threads.net")) return "threads";
  if (host.includes("medium.com")) return "medium";
  return "website";
}
