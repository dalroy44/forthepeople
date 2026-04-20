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
