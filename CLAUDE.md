# CLAUDE.md — ForThePeople.in Project Instructions

## Project
ForThePeople.in — Free, open-source citizen transparency platform for Indian districts.
Built by Jayanth M B. Next.js 16 + TypeScript + Tailwind v4 + Prisma 7.5 + Neon PostgreSQL.

## Documentation Location
ALL documentation lives inside `docs/` folder:
```
docs/BLUEPRINT-UNIFIED.md          ← Master document (read this FIRST always)
docs/FORTHEPEOPLE-SKILL-UPDATED.md ← Tech stack, file paths, patterns
docs/FORTHEPEOPLE-SKILL.md         ← Original skill reference
docs/DISTRICT-EXPANSION-SKILL.md   ← District expansion guide
docs/AI-NEWS-INTELLIGENCE-SKILL.md ← AI pipeline docs
docs/INDIAN-DISTRICT-HIERARCHY-SKILL.md ← District data reference
docs/PRICING-ALL-INDIA.md          ← Infrastructure pricing
docs/SCALING-CHECKLIST.md          ← Performance scaling guide
docs/GEO-AUDIT-REPORT.md           ← SEO/GEO audit results
```

## Completed Prompts Archive
`prompts/completed/` — prompts that have already been run. Reference only.

## Pending Prompts
`prompts/pending/` — prompts ready to run but not yet executed.

## Before Every Task
1. Read `docs/BLUEPRINT-UNIFIED.md` for current state
2. Read `docs/FORTHEPEOPLE-SKILL-UPDATED.md` for tech stack and patterns
3. Read any module-specific docs relevant to the task

## After Every Task
1. Update `docs/BLUEPRINT-UNIFIED.md` with changes made
2. Update any other relevant docs in `docs/`
3. Verify docs are tracked by git: `git ls-files docs/`
4. Commit and push: `git add -A && git commit -m "..." && git push origin main`
5. Documentation files must NEVER live outside this repo

## Key Rules
- NEVER use "scraper/scraping/scraped" in user-facing text
- NEVER hardcode district data — everything from DB
- NEVER use ioredis on Vercel — use @upstash/redis (REST)
- NEVER store budget values in Crores — always Rupees
- NEVER deploy with `npx vercel --prod` — use `git push origin main`
- NEVER use `npm ci` in Dockerfile.scraper — use `npm install --legacy-peer-deps`
- NEVER use middleware.ts — Next.js 16 uses proxy.ts
- NEVER commit .env.local or any real secrets
- AI calls: always use callAI()/callAIJSON() from src/lib/ai-provider.ts
- Admin auth: cookie ftp_admin_v1, ADMIN_PASSWORD with timingSafeEqual

## Current State (April 13, 2026)
- 10 live districts, 7 states
- Admin: unified left sidebar (13 tabs grouped: Overview, Operations, AI & Data, Finance,
  Analytics [Analytics + Traffic], Security [Access & 2FA + API Vault], Community).
  URL `?tab=` routing for in-page sub-tabs.
- API Key Vault: encrypted key storage with separate 10-min TOTP session (Redis-backed).
  Reveals are rate-limited + audit logged.
- Multi-user admin: foundation only (AdminUser + AdminAuditLog tables, user management UI).
  ADMIN_PASSWORD cookie still gates login — per-user auth is future work.
- Audit logging: src/lib/audit-log.ts instrumented across vault ops, supporters, expenses,
  platform reports, user management.
- Sentry errors pulled directly into Alerts & Logs via REST API (SENTRY_API_TOKEN).
- Plausible Stats API powers the Traffic tab (live visitors, pages, referrers, devices, countries).
- AI Platform Report: weekly Gemini 2.5 Pro analysis with action items + cost tips
  (Sundays midnight UTC cron + manual dashboard trigger). ~$0.002 per report.
- Analytics tab: week-over-week deltas on totals + feedback-by-type breakdown.
- Graceful degradation: all external-API tabs show setup instructions when keys missing.
- Admin dashboard: Action Required banner, Platform Health cards, Revenue + OpenRouter
  live credit tracking, filterable Recent Activity feed.
- System Health: per-district "Run Now" scraper trigger, expandable error details,
  filterable scraper log table.
- Alerts: severity colours, source badges (scraper/feedback/payment/system), email
  status, CSV export, email-config warning banner when RESEND_API_KEY/ADMIN_EMAIL missing.
- Finance system: Revenue tab (manual supporter add, inline edit, revenue chart),
  Expenditure tab (add/edit/delete expenses, invoice links, P&L view, CSV export),
  Costs tab (real OpenRouter spend, subscription renewal countdowns, monthly/yearly totals).
- Prisma models extended: Subscription (+serviceName, plan, costUSD, expiryDate, autoRenew,
  accountEmail, purchaseDate, exchangeRate), Supporter (+source, referenceNumber).
  New: Expense model. 9 default services seeded via prisma/seed-subscriptions.ts.
- Invoice uploads: link-only (paste URL). Vercel Blob wiring deferred.
- Sentry error monitoring active
- Email alerts via Resend
- Plausible analytics (conditional on env var)
- DPDP privacy policy at /privacy
