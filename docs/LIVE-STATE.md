# ForThePeople.in — Live State

_Living document. Append new sections; don't rewrite history._

---

## Tooling added 2026-04-20

- **CodeRabbit**: Installed on jayanthmb14/forthepeople repo only (not all repos). Pro tier auto-enabled (free for public repos regardless of license). Permissions: read + write on single repo for PR review comments. Action: next PR opened on main will trigger automated review comments within ~2 min of push.

---

## 2026-04-20: Database migration + Tenders module launch

### Database migration (completed)
- **NEW Neon**: ep-bitter-sea-a1n9ttad (PG 17, Launch $19/mo, AWS ap-southeast-1 Singapore, forthepeople1547@gmail.com)
- **Migrated from**: OLD Neon ep-broad-wildflower-a14s55kg on old Gmail
- **Method**: GitHub Codespace + pg_dump/pg_restore with PG 17 client tools
- **Row counts verified**: District=152, InfraProject=397, NewsItem=446, Supporter=61 (exact OLD↔NEW match)

### Upstash migration (completed)
- **NEW**: allowing-kid-70988.upstash.io (Mumbai, Pay-as-you-go, forthepeople1547@gmail.com)
- **OLD**: skilled-marten-75302.upstash.io — kept for 7-day rollback safety, decommission 2026-04-27

### Vercel
- Project still on zurvoapps-projects team (old Gmail) — migration deferred
- Env vars updated on all 3 environments — pointing to NEW Neon + NEW Upstash

### Sentry
- Fully configured: client/server/edge configs + DSN + AUTH_TOKEN on .env + Vercel
- Organization: forthepeople.in, single project: javascript-nextjs

### Tenders module (Module 30 — launched 2026-04-20)
- **Scope**: Karnataka pilot — Bengaluru, Mandya, Mysuru
- **14 Prisma models**: Tender, TenderAuthority, TenderCorrigendum, TenderAward, TenderBidder, TenderContract, TenderDocument, TenderCategory, TenderRedFlag, TenderAISummary, TenderSavedByUser, TenderScraperConfig, TenderScraperRun, TenderEducationContent
- **Data sources**: KPPP, CPPP, defproc, eprocurebel, IREPS, HAL eProc (GeM deferred due to Cloudflare Turnstile + IT Act §43 risk)
- **Red flag detection**: SQL-deterministic (never LLM) — single bidder, <21-day window, price hit rate >98%, repeat winner, re-tendered, restrictive turnover, direct nomination
- **Lint**: scripts/lint-tender-copy.sh blocks inflammatory language
- **Disclaimers**: TenderDisclaimer component on every page

### Banner
- Built but DISABLED via static fallback (enabled: false) — migration complete, no user-facing announcement needed
- Admin-controlled banner module TO BUILD — planned as new admin tab, modal-first-visit pattern, user clicks OK → site opens
- Current code can be re-used when admin module is built

### Deferred to future work
- **Neon password rotation**: Low risk (only in private chat logs), do on weekend
- **Vercel ownership migration**: ~2026-04-27, 20-min task
- **OLD Neon + OLD Upstash decommission**: 2026-04-27 (7-day rollback safety net)
- **SiteAnnouncement + missing Tender tables on NEW Neon**: Need `prisma db push` from Codespace
- **Admin banner module build**: New module under admin panel, replaces the disabled static banner

---

## 2026-04-20: Tenders module fixes (post-audit)

Phase 1 audit identified 12 issues. Fixed 10 in this session, deferred 2.

### Fixed

1. **All invented email addresses replaced** with contextual `mailto:support@forthepeople.in?subject=...` links. 6 `takedown@` references removed (1 scraper UA string, 1 component, 4 doc-file mentions). Scraper User-Agent now uses `https://forthepeople.in/contact` instead (bots can't click mailto).
2. **Sidebar reorganised by civic priority**: 7 tiers (Civic Duty → Maps & Data), numeric `priority` field replaces dead `group` enum. All 3 nav components (Sidebar, MobileSidebar, MobileTabNav) now derive categories from a single `getTieredModules()` helper — no more hardcoded slug arrays.
3. **Tenders visible on all districts with DB-driven lock state**: `District.tendersActive Boolean @default(false)`. Non-activated districts see a lock + sponsor-CTA card instead of the misleading empty-dashboard. Sidebar entry stays universal for discoverability.
4. **Per-state disclaimer route** at `/tenders/disclaimer`: reuses `TenderEducationContent` with new `docType` + `stateSlug` columns. 7 universal clauses (GFR 2017, GODL-India, RTI §4, DPDP 2023, Advocates Act §33, takedown, licence) + 2 Karnataka-specific (KTPPA 1999, portal list). Fixes the previously-broken `<Link href="/tenders/disclaimer">`.
5. **Tenders overview snippet** on every district home: matches LeadersSnippet/InfraSnippet pattern, status badge cycles LIVE/STALE/LOCKED/NO_DATA, shows live count, closing-48h callout, next-deadline strip, and time-ago.
6. **Deadline urgency indicator** on tender cards + detail hero: green border >7d, yellow 2–7d, red pulsing <48h, grey/dimmed past. Client-side from `bidSubmissionEnd`.
7. **Structured plain-English bullets** on detail page: `TenderAISummary.plainBullets Json?` with `{ what, whoCanApply, deadline }`. New 4th prompt in enrichment cron at grade-6 reading level, max 25 words/bullet. "Summary being prepared" fallback when absent.
8. **Save & Alert** on detail page now opens a mailto pre-filled with tender context (title, source URL, ID). Replaces the fake `alert()`. TODO flagged for real DPDP-compliant email collection in v2.
9. **Apply Guide / Transparency / How It Works** buttons verified live on prod — no dead buttons. Also fixed `/api/tenders/how-it-works` to filter by `docType='explainer'` so disclaimer rows don't leak into the explainer page.
10. **Activation runbook** at `docs/TENDERS-ACTIVATION.md` — SQL flip + seed pattern + state-specific gotchas.

### Deferred (not blocking Phase 2 push)

- **Scraper cron registration** (Issue #11): KPPP portal CAPTCHA / rate-limit blocker remains. Not wiring to `vercel.json` crons until the engine is proven stable from a Railway / domestic-IP environment.
- **"Crime Statistics" module** from Phase 1 Tier 4 list: module doesn't exist in codebase, silently dropped. Split `police` module remains single.

### Schema changes (additive, no data loss)

Land on Vercel's next deploy via `vercel.json` build command (`npx prisma db push`):

- `District.tendersActive Boolean @default(false)` — issue #3
- `TenderEducationContent.docType String @default("explainer")` — issue #4
- `TenderEducationContent.stateSlug String?` — issue #4
- `TenderAISummary.plainBullets Json?` — issue #7

### New files

- `src/components/district/TenderSnippet.tsx`
- `src/components/tenders/TenderLockedState.tsx`
- `src/app/api/tenders/[district]/access/route.ts`
- `src/app/api/tenders/[state]/disclaimer/route.ts`
- `src/app/api/tenders/live-districts/route.ts`
- `src/app/[locale]/[state]/[district]/tenders/disclaimer/page.tsx`
- `prisma/seed-tender-legal.ts`
- `scripts/activate-tenders-districts.ts`
- `docs/TENDERS-ACTIVATION.md`

### Enabled districts for tenders (after activation script runs)

`bengaluru-urban`, `mandya`, `mysuru` (all other districts render lock state).

### Post-push manual actions required

1. Wait for Vercel build to complete (adds the 4 schema columns via `prisma db push`).
2. Run `npx tsx scripts/activate-tenders-districts.ts` against production DB → flips `tendersActive=true` for the 3 KA pilot districts.
3. Run `npx tsx prisma/seed-tender-legal.ts` against production DB → seeds 9 disclaimer clauses.
4. (Optional) Run enrichment cron to populate `plainBullets` on the 12 stub tenders.

