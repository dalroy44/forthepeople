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

## Current State (April 11, 2026)
- 10 live districts, 7 states
- 9 admin tabs (Dashboard, System Health, Alerts, AI, Security, Review, Feedback, Supporters, Analytics)
- Sentry error monitoring active
- Email alerts via Resend
- Plausible analytics (conditional on env var)
- DPDP privacy policy at /privacy
