# FORTHEPEOPLE.IN — UNIFIED MASTER BLUEPRINT
# ═══════════════════════════════════════════════════════════
# SINGLE SOURCE OF TRUTH — Combines original + all addendums
# Claude Code: Read this file at the start of EVERY session.
# Generic for ANY Indian district. Pilots: Mandya, Mysuru, Bengaluru Urban (Karnataka).
# Last updated: March 31, 2026
# ═══════════════════════════════════════════════════════════

## 1. PROJECT IDENTITY

```
Name:           ForThePeople.in
Tagline:        "Your District. Your Data. Your Right."
Domain:         forthepeople.in
GitHub:         https://github.com/jayanthmb14/forthepeople (public — clean history, MIT with Attribution)
Live URL:       https://forthepeople.in
Vercel Scope:   zurvoapps-projects (zurvoapp Pro account)
Builder:        Jayanth M B, Karnataka, India
Project ID:     FTP-JMB-2026-IN
Pilot Districts: Mandya (Karnataka), Mysuru (Karnataka), Bengaluru Urban (Karnataka), New Delhi (Delhi)
Scalable To:    All 780+ districts across 28 states & 8 UTs
Languages:      English + Regional (Kannada for pilot, expandable via next-intl)
Theme:          LIGHT — minimal, clean, modern, airy
License:        MIT with Attribution (see LICENSE file — forks must retain creator credit)
Legal Status:   Uses ONLY publicly available government data
                NOT an official government website
Deploy:         git push origin main → auto-deploy via Vercel GitHub integration
                NEVER use `npx vercel --prod` directly (causes Vercel scope issues)
Git email:      jayanthmbj@gmail.com (required — Vercel rejects unknown author emails)
```

---

## 2. LEGAL PROTECTION

```
LEGALLY SAFE BECAUSE:
1. RIGHT TO INFORMATION: Article 19(1)(a) of the Indian Constitution
2. OPEN DATA POLICY: data.gov.in operates under NDSAP — designed for public reuse
3. NO COPYRIGHTED CONTENT: Government data is public domain (Copyright Act §52(1)(q))
4. NO IMPERSONATION: Site clearly states it is NOT a government website

MANDATORY DISCLAIMERS (every page):
  EN: "ForThePeople.in is an independent citizen transparency initiative.
       This is NOT an official government website. All data is sourced from
       publicly available government portals under India's Open Data Policy (NDSAP)."
  Footer: "Data sourced under NDSAP | Built with ❤️ by Jayanth M B"

NEVER DO:
  ✗ Use government logos/emblems (Ashoka emblem, state seals)
  ✗ Claim to be an official government service
  ✗ Store personal citizen data (Aadhaar, PAN, etc.)
  ✗ Display full copyrighted news articles (headlines + links only)
  ✗ Charge money for accessing government data
  ✗ Scrape faster than 1 request per 2-3 seconds
```

---

## 3. DESIGN SYSTEM

```
AESTHETIC:    Clean editorial — Linear.app, Vercel, Stripe inspired
THEME:        Light only (dark mode toggle in UI but default: light)

FONTS (Google Fonts — all free):
  English:    "Plus Jakarta Sans"
  Regional:   "Noto Sans Kannada" (pilot) — swap per state using Noto Sans family
  Monospace:  "JetBrains Mono" (data/numbers only — always use .font-data class)

COLOR PALETTE (from globals.css @theme):
  Background:     #FAFAF8  (warm off-white)
  Surface:        #FFFFFF  (cards)
  Border:         #E8E8E4  (soft warm gray)
  Text Primary:   #1A1A1A  (near-black)
  Text Secondary: #6B6B6B  (medium gray)
  Text Muted:     #9B9B9B  (light gray)
  Accent Blue:    #2563EB  (primary actions)
  Accent Green:   #16A34A  (success/positive)
  Accent Amber:   #D97706  (warning/in-progress)
  Accent Red:     #DC2626  (error/negative/wasted funds)
  Accent Purple:  #7C3AED  (planned/upcoming)
  Hover BG:       #F5F5F0
  Selected BG:    #EFF6FF

SPACING & COMPONENTS:
  Card padding: 24px | Section gap: 32px | Card radius: 16px | Small radius: 8px
  Card shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)
  Progress bars: 8px height, pill-shaped (border-radius: 99px)
  Tables: zebra-striped, no heavy borders
  Charts: accent colors only, no gradients
  Icons: Lucide React (20px default)
  Animations: subtle fade-in only (200ms ease)
  Mobile-first: works on ₹8000 phones, min tap target 44×44px
  Numbers: ALWAYS in JetBrains Mono (.font-data class)
  Font weights: max 2 per section (400 regular + 600 semibold)
```

Tailwind v4 — all tokens in `src/app/globals.css` `@theme {}` block.
NO tailwind.config.ts exists (it's Tailwind v4 CSS-based config).

---

## 4. TECH STACK

```
Framework:    Next.js 16.1.7 (App Router, TypeScript, src/ directory)
React:        19.2.3
CSS:          Tailwind CSS v4 (CSS-based config, tokens in globals.css @theme)
ORM:          Prisma 7.5.0 with prisma-client-js generator, output ../src/generated/prisma
DB adapter:   @prisma/adapter-pg (PrismaPg class — required for Prisma 7)
Database:     Neon PostgreSQL (production) / local Postgres via Prisma dev proxy (dev)
Cache:        @upstash/redis REST client (production Vercel — NOT ioredis)
              ioredis used ONLY in Railway scraper container
State:        @tanstack/react-query v5 + zustand v5
Charts:       recharts v3 (lazy loaded)
Maps:         react-simple-maps + topojson-client (India SVG map — FINAL, do not change)
              TalukMap.tsx uses react-simple-maps for taluk drill-down
Icons:        lucide-react
i18n:         next-intl v4
Payments:     razorpay SDK + Razorpay Live checkout
Email:        resend v6 (2FA recovery emails + admin alert emails)
AI provider:  OpenRouter (unified gateway — tiered model routing)
              Tier 1 (free): google/gemma-4-26b-a4b-it:free (classify, summarize)
              Tier 2 (scale): google/gemini-2.5-pro (insights, news, documents)
              Tier 3 (premium): anthropic/claude-sonnet-4 (fact-check only)
Monitoring:   @sentry/nextjs (error tracking, production only)
Alerts:       src/lib/admin-alerts.ts (email + DB alerts for scrapers, feedback, payments)
Analytics:    Plausible (cookieless, DPDP-friendly, one script tag)
2FA:          otpauth + qrcode (Google Authenticator TOTP)
Scraping:     cheerio + puppeteer + node-cron (scraper container)
AI providers: @anthropic-ai/sdk + @google/generative-ai
Encryption:   AES-256-CBC (Node.js crypto) via src/lib/encryption.ts
Date:         date-fns v4
```

### VERIFIED vs SPECULATIVE

```
VERIFIED (code confirmed):
  - Next.js 16.1.7, React 19, Tailwind v4 CSS-based config
  - Prisma 7.5.0 with @prisma/adapter-pg
  - @upstash/redis (NOT ioredis) on Vercel serverless
  - react-simple-maps for India map + taluk map
  - recharts (lazy loaded with next/dynamic)
  - Razorpay Live keys configured
  - next-intl v4 for English + Kannada
  - @anthropic-ai/sdk for Claude Opus
  - @google/generative-ai for Gemini
  - AES-256-CBC encryption for stored API keys + TOTP secrets

SPECULATIVE (assumed from dependencies, not fully verified):
  - zustand v5 store usage in specific components
  - puppeteer usage in scraper jobs
  - bullmq (listed as dep but may be unused currently)
```

### Critical Library Notes
- `@upstash/redis` (NOT ioredis) on Vercel — ioredis requires persistent TCP, crashes serverless
- `ioredis` is used ONLY in the scraper scheduler running on Railway containers
- `recharts` Tooltip `formatter` must NOT type-param as `(v: number)` — use `(v)` + `Number(v)` cast
- `react-simple-maps` is FRAGILE — see Section 7 for fix history. Never rewrite map components.
- Budget values stored in Rupees (NOT Crores) — display always divides by 1e7 to show Crores

---

## 5. DISTRICT HIERARCHY & ROUTING

```
LEVEL 0: Country     → forthepeople.in/
LEVEL 1: State       → /en/karnataka/
LEVEL 2: District    → /en/karnataka/mandya/
LEVEL 3: Taluk/Block → /en/karnataka/mandya/srirangapatna/ (future)
LEVEL 4: Village     → /en/karnataka/mandya/srirangapatna/ganjam/ (future)

ROUTE STRUCTURE:
  /[locale]/[state]/[district]/[module]/page.tsx
  Locale: "en" | "kn" (next-intl)
  State: slug (e.g., "karnataka")
  District: slug (e.g., "mandya", "mysuru", "bengaluru-urban")
  Module: one of 30 modules (see Section 6)

LOCK BEHAVIOR:
  Active district:  Full data, clickable
  Locked district:  Grayed out, "Coming Soon"

10 ACTIVE PILOT DISTRICTS (7 states):
  Mandya (ಮಂಡ್ಯ)          — "Sugar Capital of Karnataka"
  Mysuru (ಮೈಸೂರು)         — "City of Palaces"
  Bengaluru Urban (ಬೆಂಗಳೂರು) — "Silicon Valley of India"
  New Delhi (नई दिल्ली)    — "Seat of India's Government"
  Mumbai (मुंबई)           — "Financial Capital of India"
  Kolkata (কলকাতা)         — "City of Joy"
  Chennai (சென்னை)         — "Gateway to South India"
  Hyderabad (హైదరాబాద్)    — "City of Pearls" [Added 2026-04-10]

MANDYA TALUKS (7):
  1. Mandya        — "Sugar Capital of Karnataka"
  2. Maddur        — "Gateway to Old Mysore"
  3. Malavalli     — "Land of Temples & Tanks"
  4. Srirangapatna — "Tipu Sultan's Island Fortress"
  5. Nagamangala   — "Heart of the Deccan Plateau"
  6. K R Pete      — "Jewel of the Kaveri Basin"
  7. Pandavapura   — "Where the Pandavas Rested"
```

### Sitemap & SEO
- `sitemap.ts` uses `INDIA_STATES` (NOT `INDIA_HIERARCHY`) from districts.ts
- Only active districts are included (filter: `active: true`)
- All static page canonicals → /en/ variants
- hreflang: en, kn, x-default on homepage

---

## 6. 30 DASHBOARD MODULES

All module pages at: `src/app/[locale]/[state]/[district]/[module]/page.tsx`

### DATA (10 modules)
```
overview          — District summary: alerts, live data, snapshot, leadership, projects,
                    finance, police, news, taluks, module grid (reordered post-launch)
map               — react-simple-maps India SVG + TalukMap taluk drill-down
leadership        — 10-tier org chart: MP, MLAs, DC, SP, Judge, Revenue, Block, Dept, Taluk
water             — Live KRS dam levels, inflow/outflow, canal releases
industries        — Sugar factories (Mandya-specific), crushing data
finance           — Budget breakdown (Crores), lapsed funds, revenue collection
crops             — Real-time mandi prices from AGMARKNET (DATA_GOV_API_KEY)
population        — Census 2011 data, literacy, sex ratio, urban/rural trends
weather           — Live weather (OpenWeatherMap), historical rainfall
police            — Station directory, traffic revenue, crime stats by year
```

### SERVICES (7 modules)
```
schemes           — Active central/state schemes, eligibility, apply links
citizen-corner    — Responsibility tips, helplines, RTI templates
elections         — Results by constituency, representative, turnout
transport         — Bus routes, train schedule, auto fare chart
jjm               — Jal Jeevan Mission tap connection coverage
housing           — PMAY tracker, completion rates
power             — Scheduled power cuts, BESCOM outage tracker
```

### GOVERNANCE (7 modules)
```
schools           — UDISE data, SSLC board results, staffing widget
farm              — Soil health cards, KVK crop advisory
rti               — Filing trends, department-wise response time
file-rti          — Guided wizard with pre-drafted RTI templates
gram-panchayat    — Village-level MGNREGA, fund utilization
courts            — Case pendency, disposal rates, court directory
health            — Hospital directory, bed count, doctor ratio, staffing widget
```

### CIVIC (NEW — Phase 5, March 2026)
```
exams             — Govt. exam notifications: KPSC, KAS, UPSC, SSC + staffing data
                    ExamStepper component, Apply Now button, Student Perspective fields
                    StaffingWidget (sanctioned vs filled) for health/police/schools
```

### COMMUNITY (5 modules)
```
alerts            — Real-time advisories (auto-expires after 14 days)
offices           — Govt office directory with hours, "Open Now" indicator
responsibility    — 7 citizen duty sections (has own route /responsibility)
news              — Aggregated local news (AI dedup, AI insight badge)
famous-personalities — Notable people born in the district (born-in-district rule enforced)
```

### API SLUGS (CRITICAL — do not confuse):
```
Use:    /api/data/leaders       NOT /api/data/leadership
Use:    /api/data/budget        NOT /api/data/finance
Use:    /api/data/crops         (correct)
Use:    /api/data/water         (correct)
Use:    /api/data/overview      (correct)
Use:    /api/data/weather       (correct)
Use:    /api/data/police        (correct)
Use:    /api/data/news          (correct)
Use:    /api/data/population    (correct)
Use:    /api/data/exams         (correct — new, Phase 5)
```

### Navigation
- Desktop: Sidebar with pinned modules + "Show all" toggle + emoji per module
- Mobile: Left hamburger → slide-in drawer (all 30 modules in 6 categories)
- Mobile bottom: MobileTabNav tab strip
- Breadcrumb: overflow:visible on desktop nav (not hidden — or dropdowns get clipped)
- Mobile breadcrumb strip: sticky top:56px
- Sidebar overflow:visible required (never set to hidden/overflow-x-hidden on nav)

---

## 7. INTERACTIVE MAP (FRAGILE)

### History of Map Implementation (3 attempts)
```
Attempt 1: D3.js + custom SVG — abandoned (complex, GeoJSON winding bugs, world-spanning fills)
Attempt 2: Leaflet.js + react-leaflet — abandoned (SSR issues, complex setup for India map)
Attempt 3: react-simple-maps — FINAL (works, simpler API, easier India state highlighting)
```

### Current Implementation
- Library: `react-simple-maps` + `topojson-client`
- India SVG map: portrait viewBox 800×900, scale=900, center=[82.5,23]
  - J&K at approximately y=175, south tip at approximately y=696 — fits all of India
- GeoJSON: exterior rings MUST be CW (clockwise winding)
  - Despite RFC7946 claiming CCW, d3-geo in practice needs CW for correct exterior rings
  - Zero-area rings (< 1e-10 by shoelace area) cause world-spanning fills — always remove them
- MapErrorBoundary component wraps all map renders
- Cache bust: GeoJSON served with `?v=4` query
- GeoJSON Cache-Control: 24h in response headers
- Taluk map: `TalukMap.tsx` + `public/geo/mandya-taluks.json` (approximate polygons)

### Rules (CRITICAL — never violate)
```
NEVER modify map components unless you have verified the fix in the browser.
NEVER change viewBox dimensions without testing all 36 states render correctly.
Use Playwright to inspect SVG DOM when debugging — check path `d` attribute for extreme
  coords (x > 900 or x < -100 means world-spanning bug).
Use getBoundingClientRect per path to debug individual state renders.
```

---

## 8. DATABASE SCHEMA (45+ PRISMA MODELS)

### Prisma 7 Configuration
```
Generator:  provider = "prisma-client-js", output = "../src/generated/prisma"
Imports:    from '@/generated/prisma'
Config:     prisma.config.ts at project root
            import "dotenv/config"
            defineConfig({ datasource: { url: process.env.DATABASE_URL! } })
Adapter:    new PrismaPg({ connectionString }) from @prisma/adapter-pg
            PrismaPg v7 takes pg.PoolConfig as first arg: new PrismaPg({ connectionString })
CRITICAL:   NO `url` field in datasource block of schema.prisma (Prisma 7 uses config file)
```

### Core Hierarchy
```
State       — id, name, nameLocal, slug, active, capital
District    — id, stateId(FK), name, nameLocal, slug, tagline, active, population, area,
              talukCount, villageCount, literacy, sexRatio, density, avgRainfall
              + 40 relation arrays
Taluk       — id, districtId(FK), name, nameLocal, slug, population, area, villageCount
Village     — id, talukId(FK), name, nameLocal, slug, population, households, pincode, lat, lng
```

### Data Models (per district)
```
Leader              — tier(1-10), name, role, party, constituency, phone, email, since, photoUrl
InfraProject        — name, category, budget, fundsReleased, progressPct, status, contractor, dates
BudgetEntry         — fiscalYear, sector, allocated, released, spent (values in RUPEES not Crores)
BudgetAllocation    — fiscalYear, department, scheme, category, allocated, released, spent, lapsed
RevenueEntry        — monthly revenue by category
RevenueCollection   — aggregated revenue records
CropPrice           — commodity, variety, market, minPrice, maxPrice, modalPrice, arrivalQty, date
WeatherReading      — temp, feelsLike, humidity, windSpeed, conditions, rainfall, pressure
RainfallHistory     — year, month, rainfall, normal, departure
PopulationHistory   — year, total, rural, urban, literacy, sexRatio, density
PoliceStation       — name, type, sho, phone, address, lat, lng, jurisdiction
TrafficCollection   — month, revenue, vehicles, fines
CrimeStat           — year, category, cases, solved
Scheme              — name, category, department, beneficiaries, budget, status
ServiceGuide        — service, steps, duration, fee, documents, department
GramPanchayat       — name, taluk, population, mgnregaDemand, mgnregaWorkDays, fundsReceived
RtiStat             — year, totalFiled, totalPending, avgResponseDays, departmentWise
CourtStat           — year, totalPending, totalDisposed, civilPending, criminalPending
NewsItem            — title(NOT headline), summary, url, source, category, publishedAt, aiAnalyzed
DamReading          — dam name, storageLevel, fullCapacity, inflow, outflow, rainfall
CanalRelease        — canal name, releaseDate, flowRate, reason, duration
SugarFactory        — name, capacity, crushingSeasonStart/End, cane crushed, recovery%
LocalAlert          — title, type, severity, message, active, createdAt (auto-expires >14 days)
GovOffice           — name, type, address, phone, hours, openNow, lat, lng
ElectionResult      — constituency, year, type, winnerName, winnerParty, winnerVotes, margin
                      (IMPORTANT: winner-per-constituency model, NOT per-candidate)
PollingBooth        — boothId, name, address, totalVoters, maleFemaleRatio
BusRoute / TrainSchedule — transport schedules
JJMStatus           — taluk, habitationsTotal, covered, coveragePct
HousingScheme       — scheme, category, sanctioned, completed, underConstruction
PowerOutage         — area, reason, startTime, endTime, duration, active
School / SchoolResult — UDISE data, student/teacher counts, board results
SoilHealth / AgriAdvisory — soil pH/NPK, weekly crop advisories
RtiTemplate         — topic, department, PIO address, fee, template text
FamousPersonality   — name, category, bio, photoUrl, birthYear, bornInDistrict
                      (bornInDistrict MUST be true for district's page — see Section 27)
Feedback            — type, module, subject, message, email, status, adminNote
AdminAlert          — level(critical/warning/info), title, message, details(Json),
                      module, district, read, emailed, createdAt
MarketData          — SENSEX, NIFTY, GOLD, SILVER, USD_INR, CRUDE prices
```

### AI & Intelligence Models
```
AIModuleInsight     — districtId, module (30 modules × district), headline, body, confidence,
                      aiProvider, aiModel, expiresAt, generatedAt (TTL-based, pre-computed)
AIInsight           — districtId, module, headline, summary, sentiment, confidence,
                      sourceUrls, approved (news-driven insights)
ReviewQueue         — insightId, status(pending/approved/rejected), reviewerNote
NewsIntelligenceLog — phase, status, tokensUsed, durationMs, aiProvider, aiModel
SharedAIInsight     — scope, scopeId, module, insight, variables, expiresAt
FactCheckStatus     — districtId, module, status, totalItems, issuesFound, staleItems,
                      duplicates, results(Json), aiProvider, durationMs
NewsActionQueue     — articleId, action, extractedData, confidence, status, executedAt

### Exams & Staffing (Phase 5 — March 2026)
```
GovernmentExam      — level(state|district), stateId, districtId, title, department,
                      vacancies, qualification, ageLimit, applicationFee, selectionProcess,
                      payScale, applyUrl, notificationUrl, syllabusUrl, status(upcoming|open|closed|results),
                      announcedDate, startDate, endDate, admitCardDate, examDate, resultDate
                      @@index([stateId,status]), @@index([districtId,status])

DepartmentStaffing  — districtId, module(health|police|schools), department, roleName,
                      sanctionedPosts, workingStrength, vacantPosts, asOfDate, sourceUrl
                      @@index([districtId,module])
```

### Health Score & Feature Voting
```
DistrictHealthScore — districtId, totalScore, grade, breakdown(Json) with 10 categories:
                      governance(15%), education(12%), health(12%), infrastructure(12%),
                      waterSanitation(10%), economy(10%), safety(10%), agriculture(8%),
                      digitalAccess(5%), citizenWelfare(6%) = 100%
                      Grades: A+(≥90) A(≥80) B+(≥70) B(≥60) C+(≥50) C(≥40) D(≥30) F(<30)
                      Current scores: Mandya 59/100 (C+), Mysuru 52.8 (C+), BLR Urban 55.4 (C+)

FeatureRequest      — title, description, votes, status(pending/planned/shipped), category
FeatureVote         — featureId, fingerprint(SHA-256(IP+UA).slice(0,32))
                      @@unique([featureId, fingerprint]) prevents double-voting
```

### Payments
```
Contribution        — razorpayOrderId, razorpayPaymentId, name, email, amount(paise), tier, status
Supporter           — name, email, phone, amount(₹), tier, paymentId, method, razorpayData
```

### System & Admin
```
ScraperLog          — jobName, status, recordsNew, recordsUpdated, duration, error
DataRefresh         — endpoint, lastRefreshed, nextRefresh, status
DistrictRequest     — stateName, districtName, requestCount, @@unique([stateName, districtName])
AdminAPIKey         — provider(gemini/anthropic/anthropic_official/razorpay_*), encryptedKey(AES-256), isActive
AIProviderSettings  — singleton: activeProvider, geminiModel, anthropicModel, anthropicBaseUrl,
                      anthropicSource, fallbackEnabled, totalCalls
AdminAuth           — singleton: totpSecret(encrypted), totpEnabled, totpVerifiedAt,
                      recoveryEmail, recoveryPhone, backupCodes(encrypted JSON),
                      lastLoginAt, failedAttempts, lockedUntil
```

---

## 9. 4 AI ENGINES

All AI calls go through `src/lib/ai-provider.ts` → `callAI()` and `callAIJSON()` unified gateway.
NEVER call Anthropic or Gemini APIs directly — always use callAI().

### ZERO-CREDIT RULE (CRITICAL — Backend Only)
Public API routes (`/api/ai/insight`, `/api/ai/citizen-tips`) are **READ-ONLY**.
They serve ONLY from Redis cache or DB — never call `callAI()` on public GET requests.
Returning null/empty instead of generating live AI prevents unauthorized billing.
- Cron routes (`/api/cron/generate-insights`) are protected by `x-cron-secret: CRON_SECRET`
- Admin routes require `ftp_admin_v1` cookie
- Direct AI key access is NEVER exposed to the client

### Provider Architecture
```
1. OpusCode.pro (Anthropic proxy)
   activeProvider = "anthropic", anthropicSource = "opuscode"
   Key stored: provider = "anthropic" in AdminAPIKey
   Base URL: process.env.ANTHROPIC_BASE_URL || settings.anthropicBaseUrl
   Auto-detection: if ANTHROPIC_BASE_URL contains "opuscode" → forces anthropicSource=opuscode

2. Official Anthropic
   activeProvider = "anthropic", anthropicSource = "official"
   Key stored: provider = "anthropic_official" in AdminAPIKey
   Base URL: "https://api.anthropic.com"

3. Google Gemini
   activeProvider = "gemini"
   Key stored: provider = "gemini" in AdminAPIKey
   Default model: gemini-2.5-flash
```

### Key Resolution Priority
1. DB-stored encrypted key (AdminAPIKey where provider = keyName, isActive = true)
2. Env var fallback: ANTHROPIC_API_KEY or GEMINI_API_KEY
3. Returns null → AI call fails gracefully

### Base URL Priority (CRITICAL)
```typescript
process.env.ANTHROPIC_BASE_URL || settings.anthropicBaseUrl || "https://api.anthropic.com"
// Env var MUST take priority over DB default — always
```

### Models
```
Gemini:     gemini-2.5-flash (default), gemini-2.0-flash, gemini-1.5-pro
Anthropic:  claude-opus-4-6 (default), claude-sonnet-4-6, claude-haiku-4-5-20251001
```

### Response Parsing (CRITICAL)
```typescript
// CORRECT: find the text block — do NOT assume content[0] is text
const textBlock = response.content.find(b => b.type === 'text');
// Extended thinking: maxTokens MUST be >= 2048
// Extended thinking may add thinking blocks BEFORE the text block — always use .find()
```

### Engine 1: News Intelligence Pipeline
- Location: `src/scraper/jobs/news.ts` → `src/scraper/jobs/ai-analyzer.ts`
- Flow: RSS scraping → Gemini/Opus classification → targetModule + extractedData stored in NewsItem
- Schedule: Every 1 hour (news), analysis in ai-analyzer.ts
- Stores results as AIInsight records, then queues for admin review

### Engine 2: News Action Engine
- Location: `src/lib/news-action-engine.ts`
- Functions: `classifyArticleWithAI()` extracts structured data from news
- `executeNewsAction()` auto-executes DB mutations at confidence > 0.85
- Queues for human review at confidence 0.60–0.85
- Skips (discards) at confidence < 0.60
- Stores pending actions in `NewsActionQueue` model

### Engine 3: Pre-computed AI Module Insights
- Location: `src/lib/insight-generator.ts`
- Generates insights for 30 modules × all active districts
- Stored in `AIModuleInsight` with TTL/expiry field
- Generated every 2 hours by Vercel cron (`/api/cron/generate-insights`)
- On request: Redis → DB (check expiry) → generate fresh if expired
- Shown as `AIInsightCard` on 11 module pages
- Footer shows: "Source-verified by Claude/Gemini AI" with actual provider+model

### Engine 4: Opus Fact Checker
- Location: `src/lib/fact-checker.ts`
- Runs 25+ module-level checks
- Born-in-district rule: famous personalities must be born in the specific district
- Saves results to `FactCheckStatus` table with per-module breakdown
- Admin-accessible via Dashboard tab → FactChecker component
- POST `/api/admin/fact-check` — runs checks, returns issuesFound, staleItems, duplicates

---

## 10. DISTRICT HEALTH SCORE

### Algorithm (`src/lib/health-score.ts`)
```
10 Categories with BASE weights (total = 100%):
  governance       15%  — infrastructure + budget utilization + leadership
  education        12%  — school results + student-teacher ratio + coverage
  health           12%  — hospital beds + doctor ratio + coverage
  infrastructure   12%  — project completion + road density
  waterSanitation  10%  — dam levels + JJM coverage + water supply
  economy          10%  — crop prices + industries + employment
  safety           10%  — crime rate + police coverage
  agriculture       8%  — crop diversity + soil health + advisory
  digitalAccess     5%  — internet/mobile penetration
  citizenWelfare    6%  — scheme enrollment + RTI usage

District-type aware weights (getAdjustedWeights):
  metro   (pop>5M)       — boosts infrastructure+digitalAccess, reduces agriculture
  urban   (pop>1M)       — uses base weights
  semi-urban (density>500) — uses base weights
  rural   (default)      — boosts agriculture+waterSanitation, reduces infrastructure+digitalAccess

Precision:
  Category scores: 1 decimal (e.g. 72.4)
  Overall score:   2 decimal (e.g. 68.37)

Grade thresholds:
  A+ = score >= 90  |  A = score >= 80  |  B+ = score >= 70
  B  = score >= 60  |  C+ = score >= 50 |  C  = score >= 40
  D  = score >= 30  |  F  = score < 30

Breakdown includes: districtType, trendChange, trendDetails (per-category change >0.5 points)

Pre-computed: Weekly by cron, stored in DistrictHealthScore table.
Shown on: Homepage district cards, District overview page header.
```

### Current Pilot Scores
```
Mandya:          59.0 / 100  (C+)
Mysuru:          52.8 / 100  (C+)
Bengaluru Urban: 55.4 / 100  (C+)
Delhi (New Delhi): [pending — run health score calculation after testing]
```

---

## 11. FEATURE VOTING

### Architecture
- 23 feature requests seeded via `prisma/seed-features.ts`
- Models: `FeatureRequest` (title, description, votes, status, category) + `FeatureVote`
- Fingerprint: SHA-256(IP + User-Agent).slice(0, 32) — anonymous but unique per device
- Anti-double-vote: `@@unique([featureId, fingerprint])` constraint on FeatureVote
- Vote transaction: atomic `create` vote + `increment` count (prevents race condition)
- Page: `src/app/[locale]/features/page.tsx`

### Feature Categories
- data_modules, scrapers, ui_ux, community, technical, ai_features

### Status Values
- pending → planned → shipped

---

## 12. HOMEPAGE

### Components
```
Header.tsx          — Logo (🗣️ ForThePeople.in), navigation, district selector
MarketTicker.tsx    — 40px ticker bar: SENSEX, NIFTY, Gold, Silver, Crude, USD/INR
                      5-min refresh during market hours (IST 9:15–15:30 Mon–Fri)
                      30-min refresh off-hours. Mobile: CSS scroll animation.
HomeDrilldown.tsx   — Unified scrollable homepage layout (same on desktop + mobile)
                      Desktop: 2-col grid (60% map + 40% districts), Mobile: stacked
                      Sections: Stats → Map + Districts → Live Data → How It Works → Request → Support
LiveDataPreview.tsx — Horizontally scrollable district preview cards
HomepageStats.tsx   — Animated counters (useCountUp hook): districts, modules, data points
HowItWorks.tsx      — 3-column explainer section
DistrictRequestSection.tsx — State/district dropdowns for requesting new districts
ContributorWall.tsx — Compact supporter wall (isPublic=true contributions)
FeatureVoteWidget.tsx — Top-voted feature requests widget
```

### District Cards (on homepage)
- Show DistrictHealthScore grade (A+, A, B+, B, C+, C, D, F)
- Live weather, dam storage, crop price snippets per district
- All active districts across all states (not just Karnataka)
- Link to `/en/[state]/[district]` using dynamic state slug

### Stats Bar
- Active districts: 10 (Mandya, Bengaluru Urban, Mysuru, Chennai, Mumbai, Kolkata, New Delhi, Hyderabad, Lucknow)
- Data modules: 29
- Records in DB: ~50,000+
- Contributor count from Contribution table

---

## 13. SCRAPER ARCHITECTURE

### Infrastructure
```
Container: Railway.app (Dockerfile.scraper) — runs 24/7 always-on
Scheduler: src/scraper/scheduler.ts — node-cron
Jobs dir:  src/scraper/jobs/*.ts (21 scrapers)
Logger:    src/scraper/logger.ts → ScraperLog DB table
Redis:     ioredis (NOT @upstash/redis) for Railway container
Districts: getActiveDistricts() queries prisma.district.findMany({ where: { active: true } })
           All scrapers are DB-driven — no hardcoded district arrays
```

### Dockerfile.scraper
```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install --legacy-peer-deps   # npm ci FAILS due to peer dep conflicts
COPY . .
RUN npx prisma generate
ENV NODE_ENV=production
CMD ["npx", "tsx", "src/scraper/scheduler.ts"]
```

### Scraper Schedule
```
Every 5 min:   weather.ts       — OpenWeatherMap API (uses ctx.districtName, OWM_CITY_OVERRIDE)
Every 15 min:  crops.ts         — AGMARKNET via DATA_GOV_API_KEY (AGMARKNET_DISTRICT_OVERRIDE)
               power.ts         — BESCOM power outages
Every 30 min:  dams.ts          — KRS dam levels
Every 1 h:     news.ts          — RSS feeds (3 queries per district, 50 item limit, URL dedup)
Every 2 h:     alerts.ts        — Local alerts aggregation
               insights.ts      — Pre-compute AI module insights (generate-insights cron)
Every 6 h:     police.ts        — Police data
Every 12 h:    infrastructure.ts — Project status
               exams.ts          — Govt exam notifications + staffing (Phase 5, March 2026)
Daily:         rti.ts           — RTI statistics
               courts.ts        — Court pendency
               mgnrega.ts       — MGNREGA NREGS portal
Weekly:        jjm.ts           — Jal Jeevan Mission
               housing.ts       — PMAY housing
               schools.ts       — UDISE school data
Monthly:       finance.ts       — Budget/revenue
               transport.ts     — KSRTC/railway schedules
               schemes.ts       — Central/state schemes
               soil.ts          — Soil health cards (KVK)
               elections.ts     — Election commission data
               ai-analyzer.ts   — AI news intelligence pipeline + NewsAction execution
```

### JobContext (scraper/types.ts)
```typescript
interface JobContext {
  districtId: string;
  districtSlug: string;
  districtName: string;  // Added for scalability — used by weather, crops
  stateName: string;     // Added for scalability — used by crops AGMARKNET
  stateSlug: string;
}
```

### Vercel Cron Jobs (in vercel.json)
```
/api/cron/scrape-news       — daily 6AM UTC    (news scrape + dedup + expire stale)
/api/cron/scrape-crops      — daily 3:30AM UTC (9AM IST — AGMARKNET crop prices all active districts)
/api/cron/generate-insights — every 2h         (pre-compute AI insights 30 modules × all districts)
```
Authentication: `Authorization: Bearer CRON_SECRET` header.
CRITICAL: CRON_SECRET must ONLY be read from the Authorization header — never from query params
(query params appear in server logs and browser history — security vulnerability).

---

## 14. SCRAPING SOURCES

```
Weather:       OpenWeatherMap API (OPENWEATHER_API_KEY)
Crop Prices:   data.gov.in AGMARKNET API (DATA_GOV_API_KEY)
Dam Levels:    Karnataka State Natural Disaster Monitoring Centre (KRS dam data)
News:          Google News RSS / The Hindu / Deccan Herald (cheerio HTML parsing)
MGNREGA:       nregs.nic.in (public portal scrape)
RTI Stats:     rtionline.gov.in / CIC portal
Court Stats:   eCourts portal (eCourts.gov.in)
BESCOM:        bescom.org power outage data
UDISE:         udiseplus.gov.in school data
Jal Jeevan:   ejalshakti.gov.in / JJM dashboard
Housing:       rhreporting.nic.in (PMAY data)
Transport:     KSRTC website + IRCTC train data
Elections:     Karnatak State Election Commission portal
Market Data:   Yahoo Finance v8 API (no key) + open.er-api.com (forex)
```

### Scraping Rules
- Maximum 1 request per 2-3 seconds per domain
- URL dedup in news scraper: keep newest, delete duplicate titles
- Auto-expire LocalAlert records > 14 days old (active: false)
- AI news intelligence: runs post-news-scrape to classify and generate insights

---

## 15. API DESIGN

### Module Data API
```
GET /api/data/[module]?district=mandya&state=karnataka

Caching strategy:
  Layer 1: @upstash/redis (Redis cache) with per-module TTL
  Layer 2: Prisma query to Neon PostgreSQL

Module TTLs (from src/lib/cache.ts):
  weather:      5 minutes
  crops:        15 minutes
  water/dams:   30 minutes
  news:         60 minutes
  All others:   5 minutes default

Response includes:
  data: { ...moduleData }
  meta: { lastUpdated: timestamp, source: string }
```

### Cache Keys
```typescript
// Format: ftp:{module}:{districtSlug}
cacheKey('weather', 'mandya') → "ftp:weather:mandya"
```

### ISR (Incremental Static Regeneration)
- District page: `export const revalidate = 300` (5 minutes)
- GeoJSON files: Cache-Control: public, max-age=86400 (24 hours)
- API responses: Cache-Control: public, s-maxage=300 (5 minutes)

### Full API Reference
```
DATA:
GET  /api/data/[module]            — 30-module district data with Redis cache
GET  /api/data/village             — Village data
GET  /api/data/homepage-stats      — District counts, contributor count, data stats
GET  /api/data/homepage-preview    — Live weather/dam/crop/news snippets per district
GET  /api/data/market-ticker       — SENSEX/NIFTY/Gold/Silver/Crude/USD market data
GET  /api/data/ai-insight          — AI insight for a specific module
GET  /api/insights                 — AI insights list
GET  /api/data/health-score        — District health score with breakdown

AI:
POST /api/ai/insight               — Generate/fetch AI insight for module
POST /api/ai/citizen-tips          — Generate district-specific citizen tips

PUBLIC:
GET  /api/public/district/[district] — AI-readable district summary (structured paragraphs)

ADMIN:
GET/PUT  /api/admin/ai-settings        — AI provider settings
POST/DEL /api/admin/api-keys           — Manage encrypted API keys
GET      /api/admin/scraper-logs       — Scraper job history
GET      /api/admin/payments           — All contributions (admin-gated)
GET/PATC /api/admin/supporters         — Supporters management
POST     /api/admin/sync-razorpay      — Sync last 100 payments from Razorpay API
POST     /api/admin/fact-check         — Run AI fact check (7 modules)
GET      /api/admin/fact-check         — Fact check history (last 20 runs)
POST     /api/admin/verify-data        — AI data quality verification (returns graceful 200 on AI fail)
GET      /api/admin/expire-stale       — Preview stale alerts
POST     /api/admin/expire-stale       — Expire stale alerts older than N days
POST     /api/admin/deduplicate-news   — Deduplicate news by title prefix
GET/PATC /api/admin/security           — Auth info / recovery contact update
POST     /api/admin/security/logout-all — Invalidate all sessions
POST     /api/admin/2fa/setup          — Generate TOTP secret + QR code
POST     /api/admin/2fa/verify         — Enable 2FA
POST     /api/admin/2fa/disable        — Disable 2FA
POST     /api/admin/2fa/recover        — Send recovery email via Resend
POST     /api/admin/2fa/recover/verify — Verify recovery token
GET/PATC /api/admin/review             — AI insight review queue
GET/PATC /api/admin/feedback           — Feedback management
POST     /api/admin/ai-test            — Test AI provider connection
GET      /api/admin/districts          — Active districts from DB (for admin dropdowns)

PAYMENT:
POST /api/payment/create-order     — Create Razorpay order
POST /api/payment/verify           — Verify payment signature (HMAC-SHA256 + timingSafeEqual)
GET  /api/payment/contributors     — Public contributors list (isPublic=true)
POST /api/webhooks/razorpay        — Razorpay webhook handler (timingSafeEqual sig verify)

UTILITY:
GET  /api/health                   — Health check (DB, Redis, AI provider, alert counts)
POST /api/feedback                 — Submit user feedback
POST /api/district-request         — Vote to request new district
POST /api/cron/scrape-news         — Cron: daily news scrape + dedup + expire stale
GET  /api/cron/scrape-crops        — Cron: daily 3:30AM UTC crop prices (AGMARKNET all districts)
POST /api/cron/generate-insights   — Cron: pre-compute AI insights (every 2h)
```

---

## 16. ADMIN PANEL

URL: `forthepeople.in/en/admin`

### Navigation (April 2026 overhaul)
Unified left sidebar (`src/components/admin/AdminSidebar.tsx`) replaces the old
two-layer nav (top bar + sub-tab row). All admin routes share the sidebar via
`admin/layout.tsx`. Active item is derived from `pathname + ?tab=` query param.
Mobile (<1024px): hamburger button → slide-in overlay. Unread badges fetched
from `/api/admin/nav-counts` (alerts, review queue, feedback).

### 10 Tabs (grouped)
```
OVERVIEW
 1. Dashboard         — Action Required banner, Platform Health (DB/Redis/Scrapers),
                        Revenue summary, AI Provider (OpenRouter live spend),
                        Recent Activity feed with filters
OPERATIONS
 2. System Health     — DB/Redis/Server status, Data Freshness per district with
                        per-cell popover (last run, last error, Run Now button),
                        Scraper success % + filterable log table with expandable errors
 3. Alerts & Logs     — AdminAlert feed, severity colours, source badges (scraper /
                        feedback / payment / system), email status per alert,
                        filters (level / source / date / district / unread), CSV export
AI & DATA
 4. AI Settings       — 3-provider cards (OpusCode.pro, Official Anthropic, Gemini),
                        model select, fallback toggle, test connection
 5. Review Queue      — AI Insight approve/reject (AIModuleInsight / ReviewQueue)
FINANCE
 6. Revenue & Supporters — Contributions from Razorpay, manual sync, total/weekly totals
 7. Costs & Billing   — OpenRouter live credits (usage / limit / remaining / projected),
                        per-model estimated cost breakdown (free tier reported $0),
                        subscription table with editable renewal dates + countdown
ANALYTICS
 8. Analytics         — District requests, feature votes, feedback/revenue trends
SECURITY
 9. Access & 2FA      — 2FA setup, backup codes, recovery email, last login
COMMUNITY
10. Feedback          — User feedback feed, AI classification, inline reply
```

### URL / routing
```
/en/admin                     — default tab (dashboard)
/en/admin?tab=system-health   — in-page switch (SystemHealth, AlertsAndLogs,
/en/admin?tab=alerts            AnalyticsDashboard, CostsTab render under AdminClient)
/en/admin?tab=analytics
/en/admin?tab=costs
/en/admin/ai-settings         — full-route pages (separate Next.js routes)
/en/admin/review
/en/admin/supporters          — Revenue & Supporters
/en/admin/feedback
/en/admin/security            — Access & 2FA
```

### New API Routes (April 2026)
```
GET  /api/admin/nav-counts        — Unread badge counts for sidebar
GET  /api/admin/dashboard-summary — Roll-up powering the Dashboard (30s Redis cache)
GET  /api/admin/openrouter-usage  — Real credit spend from OpenRouter /auth/key (5min cache)
POST /api/admin/run-scraper       — Manual scraper trigger per district + job
                                    ({ district: slug, job: "weather"|"news"|"crops"|"insights" })
DELETE /api/admin/scraper-logs    — Purge ScraperLog entries older than N days
```

### AI Settings Page (`/admin/ai-settings`)
```
3 provider cards with single-select "Activate" button
Active card: colored border + "ACTIVE" badge
Expandable API key input per card (hidden by default)

Provider mapping:
  OpusCode.pro     → activeProvider="anthropic", anthropicSource="opuscode", key="anthropic"
  Official Anthropic → activeProvider="anthropic", anthropicSource="official", key="anthropic_official"
  Google Gemini    → activeProvider="gemini", key="gemini"

API routes: GET/PUT /api/admin/ai-settings, POST/DELETE /api/admin/api-keys
            GET /api/admin/system-health (DB/Redis status, data freshness, scrapers, pending items)
            GET/PATCH/DELETE /api/admin/alerts (AdminAlert CRUD with filters)
            GET /api/admin/analytics (district requests, feature votes, trends, totals)
```

### Fact Checker (`FactChecker.tsx`)
```
Runs: POST /api/admin/fact-check
Modules: leadership, budget, infrastructure, demographics, courts, news/alerts, all
Returns: totalItems, issuesFound, staleItems, duplicates, per-module results
Stored: FactCheckStatus table with durationMs, aiProvider, aiModel
GET returns last 20 checks
District selector: cascading State→District dropdown from /api/admin/districts
```

### Data Verifier
```
POST /api/admin/verify-data — AI QA of a specific module
Returns: issues[], suggestions[], confidence(0-100), status(ok/warning/error)
Graceful error: returns status:"error" NOT a 500 on AI failure
```

### Stale Data Management
```
GET  /api/admin/expire-stale    — preview stale alerts (shows count + oldest)
POST /api/admin/expire-stale    — expire alerts older than N days
POST /api/admin/deduplicate-news — dedup by normalized title prefix (keep newest)
POST /api/admin/cleanup-news    — comprehensive cleanup (x-admin-password header):
   1. Delete NewsItems older than 7 days
   2. Delete future-dated NewsItems (RSS parse errors)
   3. Delete duplicate articles by title prefix (keeps oldest per district+prefix)
   4. Delete auto-generated LocalAlerts older than 7 days
   5. Clear NewsActionQueue (pending + skipped items)
   6. Delete stale AIInsight records (module=alerts or createdAt >7 days)

GET /api/data/freshness?district=<slug> — traffic-light data freshness per module:
   Returns: { status: "green"|"amber"|"red"|"unknown", age, lastUpdated } per module
   Expected intervals: weather=10min, dam=60min, news/alerts/insights=120min, crops=1440min
```

### News Pipeline Quality Gates
```
isArticleFresh(): Reject if >3 days old, future-dated, or year < current-1
  - Google News RSS returns by relevance not recency; old articles silently reappear

isTitleDuplicate(): Normalize → first 5 words (len>3) → in-memory Set + DB lookup
  - Google News uses different redirect URLs for the same article (URL dedup alone insufficient)

classifyArticleWithAI(publishedAt): Injects article age into AI prompt
  - CRITICAL DATE RULE: events >2 days old → module=news, confidence ≤ 0.4, no alerts
```

---

## 17. SECURITY

### Admin Authentication
```
Cookie: ftp_admin_v1 = "ok" (HttpOnly, set by /admin login)
Password: ADMIN_PASSWORD env var (verified using timingSafeEqual — constant-time compare)
All admin API routes check isAuthed() which reads cookie
Alternative: x-admin-secret header (for direct API calls)
```

### 2FA (Google Authenticator TOTP)
```
Library: otpauth + qrcode
Secret: stored AES-256-CBC encrypted in AdminAuth.totpSecret
Setup: /api/admin/2fa/setup → scan QR → /api/admin/2fa/verify
Disable: /api/admin/2fa/disable
Recovery: /api/admin/2fa/recover → Resend email → /api/admin/2fa/recover/verify
Backup codes: 8 codes, stored encrypted JSON in AdminAuth.backupCodes
Rate limiting: failedAttempts counter, lockedUntil timestamp in AdminAuth
```

### Encryption (`src/lib/encryption.ts`)
```
Algorithm: AES-256-CBC
Key: ENCRYPTION_SECRET env var (32+ char random string)
Used for: AdminAPIKey.encryptedKey, AdminAuth.totpSecret, AdminAuth.backupCodes
Format: encrypt(plaintext) → "iv:ciphertext" (base64 encoded)
```

### Payment Security
```
Razorpay signature: HMAC-SHA256(orderId + "|" + paymentId, RAZORPAY_KEY_SECRET)
Comparison: timingSafeEqual (prevents timing attacks)
Webhook: same HMAC-SHA256 with RAZORPAY_WEBHOOK_SECRET
```

### NEXT_PUBLIC Rules
```
ONLY these two keys may be NEXT_PUBLIC:
  NEXT_PUBLIC_SITE_URL         — https://forthepeople.in
  NEXT_PUBLIC_RAZORPAY_KEY_ID  — Razorpay key ID (needed for client-side checkout)
No other secrets in NEXT_PUBLIC — they ship to the browser
```

### Cron Authentication
```
Header: Authorization: Bearer CRON_SECRET
Env var: CRON_SECRET (set in Vercel dashboard)
Applies to: /api/cron/scrape-news, /api/cron/scrape-crops, /api/cron/generate-insights, /api/cron/news-intelligence
```
SECURITY RULE: Read CRON_SECRET from Authorization header ONLY.
Never accept it as a URL query param — URL params appear in server access logs and browser history.

### Rate Limiting
```
Library: src/lib/rate-limit.ts (Upstash Redis incr + expire)
Usage: await rateLimit(identifier, limit=60, window=60)
Fallback: if Redis unavailable, gracefully allows all requests (no crash)
Apply to: public API routes that could be abused
```

---

## 17B. CREATOR WATERMARKING

Deep watermarking to prove original authorship. Removing all marks requires touching 100+ files.

### Layers
```
1. Source code headers (219 source files):
   /**
    * ForThePeople.in — Your District. Your Data. Your Right.
    * © 2026 Jayanth M B. MIT License with Attribution.
    * https://github.com/jayanthmb14/forthepeople
    */

2. HTML <head> meta tags (src/app/layout.tsx metadata.other):
   original-author, project-inception, x-created-by, x-project-id, x-repository

3. JSON-LD WebApplication schema (layout.tsx):
   "@type": "WebApplication", "author": { "name": "Jayanth M B" }, "dateCreated": "2026-03-17"

4. HTTP Response headers (src/middleware.ts — every response):
   X-Powered-By: ForThePeople.in
   X-Creator: Jayanth M B
   X-Project-ID: FTP-JMB-2026-IN
   X-License: MIT with Attribution — github.com/jayanthmb14/forthepeople

5. package.json: author, repository, homepage, keywords, description

6. LICENSE file: MIT with Attribution (requires keeping original creator attribution)

7. public/humans.txt: Creator attribution for humans.txt standard

8. watermark.ts: CREATOR constant exported with projectId, inception date
```

### Watermark Utility (`src/lib/watermark.ts`)
```typescript
import { CREATOR, addWatermarkHeaders, getWatermarkMeta } from '@/lib/watermark';
// CREATOR.projectId = "FTP-JMB-2026-IN"
// CREATOR.inception = "2026-03-17"
// CREATOR.repository = "github.com/jayanthmb14/forthepeople"
```

### GitHub Repo
```
URL:     https://github.com/jayanthmb14/forthepeople (public after clean push)
History: Fresh single commit (no leaked secrets in history)
License: MIT with Attribution — requires creator credit in any fork
```

---

## 18. PERFORMANCE

### Lazy Loading
```typescript
// All heavy components use next/dynamic with ssr:false
const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });
const RechartChart = dynamic(() => import('./ChartComponent'), { ssr: false });
```

### Redis Caching Strategy
```
@upstash/redis REST client (not TCP — works in Vercel serverless)
TTLs:
  weather:   300s (5 min)
  crops:     900s (15 min)
  dams:      1800s (30 min)
  news:      3600s (1 h)
  default:   300s (5 min)
  ai insights: 21600s (6 h)
```

### Static & ISR
```
Homepage: fully static (getStaticProps equivalent)
District page: ISR revalidate=300 (5 minutes)
Module pages: ISR revalidate=300
GeoJSON: static files with Cache-Control: public, max-age=86400 (24h)
Sitemap: auto-generated from active districts (DB-driven)
```

### Mobile Performance
- Target: works on ₹8000 Android phones on 4G
- Min tap target: 44×44px (enforced in mobile sidebar and dropdowns)
- No heavy animations — only 200ms fade-in
- Recharts charts lazy-loaded to avoid SSR bundle size

---

## 19. PAYMENTS (RAZORPAY LIVE)

```
Keys: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET (all in Vercel env)

4 Support Tiers on /en/support:
  Chai           (₹99)   — one-time
  Supporter      (₹499)  — one-time
  District Champion (₹1999) — one-time
  State Patron   (₹4999) — one-time

Payment Flow:
  1. POST /api/payment/create-order → creates Razorpay order, returns orderId
  2. Razorpay checkout modal on frontend (uses NEXT_PUBLIC_RAZORPAY_KEY_ID)
  3. POST /api/payment/verify → HMAC-SHA256 sig verify, save to Contribution table
  4. POST /api/webhooks/razorpay → webhook backup (timingSafeEqual sig verify)
  5. GET  /api/payment/contributors → public contributor wall (isPublic=true only)

Admin Sync:
  POST /api/admin/sync-razorpay → fetch last 100 captured payments from Razorpay API
    - Skip captured=false payments
    - Dedup by paymentId
    - Upsert into Supporter table
    - After sync: SyncButton calls router.refresh() to update Server Component stats

Contributor Wall: shown on /support + compact version on homepage
```

---

## 19B. FINANCE SYSTEM (April 2026)

Three admin tabs under 💰 FINANCE, all backed by database queries — zero hardcoded values:

**Revenue & Supporters** (`/admin/supporters` — full route)
- Summary cards: total revenue, this month/week, supporter count, weekly trend %
- Monthly breakdown chart (last 12 months, revenue only)
- "Add Manual Supporter" modal: name, email, amount, tier, payment method, reference, date,
  sponsored district/state, social link, message, public toggle.
- Click any supporter row → inline edit modal (tier, district, state, message, public)
- Source badge: `MANUAL` pill on manually-added supporters vs Razorpay webhook rows
- Razorpay sync + CSV export (preserved from earlier iteration)
- Cache invalidation: `ftp:contributors:v1|all|leaderboard|district-rankings` are set to null with
  1s TTL on every manual add / edit so the public Wall refreshes immediately.

**Expenditure** (`/admin?tab=expenditure` — in-page tab)
- Summary cards: total expense, this month, net P&L (month), recurring monthly total
- Add/edit/delete expenses (modal): date, category, description, INR + USD amount with
  exchange rate snapshot, payment method, reference, invoice link, recurring interval, notes
- List view with category + recurring filter + search
- **P&L view** — monthly table comparing revenue vs expenses for last 12 months with Profit/Loss status
- CSV export of filtered rows
- **Invoice attachment: link-only for now.** `Expense.invoiceBlobUrl` reserved for future
  Vercel Blob upload — not wired (would need `@vercel/blob` + `BLOB_READ_WRITE_TOKEN`).

**Costs & Billing** (`/admin?tab=costs` — in-page tab)
- Top summary: Monthly Cost (INR + USD), Yearly Cost, Expiring Soon count
- OpenRouter live credit spend card (from Prompt 1)
- AI usage + per-model estimated cost
- Subscription table with: displayName, plan, account email, INR+USD cost, purchase date,
  expiry countdown (red <7d, yellow ≤30d, red if past due), inline renewal date edit

### Models (prisma/schema.prisma)

**Subscription** (extended from Prompt 1; `ServiceSubscription` merged in):
  id, name, displayName, serviceName @unique, provider, category, plan,
  costINR, costUSD, currency, costOriginal, exchangeRate,
  billingCycle, purchaseDate, expiryDate, renewalDate (legacy), status,
  autoRenew, accountEmail, apiKeyEnvVar, dashboardUrl, notes

**Expense** (new):
  id, date, category, description, amountINR, amountUSD, exchangeRate,
  paymentMethod, referenceNumber, invoiceUrl, invoiceBlobUrl,
  isRecurring, recurringInterval, notes, createdBy

**Supporter** (extended): + `source "razorpay"|"manual"`, `referenceNumber`

### API Routes

```
GET    /api/admin/expenses?category=&from=&to=&recurring=  — list
POST   /api/admin/expenses                                   — create
PATCH  /api/admin/expenses/[id]                              — update
DELETE /api/admin/expenses/[id]                              — delete

GET    /api/admin/subscriptions                              — list (existing)
POST   /api/admin/subscriptions                              — create (existing)
PATCH  /api/admin/subscriptions/[id]                         — update (new, REST-style)
DELETE /api/admin/subscriptions/[id]                         — hard delete (new)

POST   /api/admin/manual-supporter                           — create offline supporter +
                                                               invalidate contributor caches
PATCH  /api/admin/supporters/[id]                            — edit (tier/district/msg/public)

GET    /api/admin/finance-summary                            — combined revenue + expenses +
                                                               subscriptions (5min Redis cache)
```

### Seed

`prisma/seed-subscriptions.ts` — upserts 9 default services (OpenRouter, Upstash, Neon,
Domain, Resend, Vercel Pro, Plausible, Sentry, Razorpay) idempotently keyed on `serviceName`.
Run with: `npx tsx prisma/seed-subscriptions.ts`

---

## 20. ENVIRONMENT VARIABLES

### Required — Production (Vercel)
```
DATABASE_URL              — Neon PostgreSQL connection string
REDIS_URL                 — Upstash Redis REST URL
REDIS_TOKEN               — Upstash Redis REST token
GEMINI_API_KEY            — Google Gemini API key (fallback AI)
ANTHROPIC_API_KEY         — Anthropic/OpusCode API key (primary AI)
ANTHROPIC_BASE_URL        — OpusCode.pro proxy base URL (if using OpusCode)
ENCRYPTION_SECRET         — 32+ char random string for AES-256 encryption
ADMIN_PASSWORD            — Admin panel password (strong password required)
CRON_SECRET               — Bearer token for cron endpoint authentication
RAZORPAY_KEY_ID           — Razorpay live key ID
RAZORPAY_KEY_SECRET       — Razorpay live key secret (NEVER NEXT_PUBLIC)
RAZORPAY_WEBHOOK_SECRET   — Razorpay webhook signature secret
RESEND_API_KEY            — Resend email API key (for 2FA recovery emails + admin alerts)
ADMIN_EMAIL               — Admin email for alert notifications
NEXT_PUBLIC_PLAUSIBLE_DOMAIN — Plausible analytics domain (cookieless)
ADMIN_ALLOWED_IPS         — Comma-separated IPs for admin access (optional, empty = disabled)
NEXT_PUBLIC_SENTRY_DSN    — Sentry DSN for error tracking (client + server)
SENTRY_AUTH_TOKEN         — Sentry auth token (for source maps upload during build)
NEXT_PUBLIC_SITE_URL      — https://forthepeople.in
NEXT_PUBLIC_RAZORPAY_KEY_ID — Razorpay key ID (client-side checkout only)
DATA_GOV_API_KEY          — data.gov.in API key (AGMARKNET crop prices)
OPENWEATHER_API_KEY       — OpenWeatherMap API key (weather module)
ADMIN_RECOVERY_EMAIL      — Recovery email address (set in Vercel env vars)
ADMIN_RECOVERY_PHONE      — Recovery phone (set in Vercel env vars)
```

### Required — Railway (Scraper Container)
```
DATABASE_URL              — Same Neon PostgreSQL connection string
REDIS_URL                 — ioredis-format Redis URL (redis://... NOT upstash REST format)
GEMINI_API_KEY            — Google Gemini API key
ANTHROPIC_API_KEY         — Anthropic/OpusCode API key
ANTHROPIC_BASE_URL        — OpusCode proxy URL
ENCRYPTION_SECRET         — Same as Vercel (needed for DB-stored key decryption)
DATA_GOV_API_KEY          — AGMARKNET crops data
OPENWEATHER_API_KEY       — Weather data
```

### Local Dev (.env or .env.local)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:51214/template1?sslmode=disable
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
ANTHROPIC_BASE_URL=https://api.anthropic.com  (or OpusCode URL)
ENCRYPTION_SECRET=...  (any 32+ char string locally)
ADMIN_PASSWORD=...
```

NEVER commit .env, .env.local, .env.prod to git. Listed in .gitignore.

---

## 21. DEPLOYMENT

### Frontend — Vercel (CURRENT CORRECT METHOD)
```bash
git push origin main   # AUTO-DEPLOYS via GitHub integration
# NEVER use: npx vercel --prod (causes Vercel scope/account issues)
```
- Vercel account: zurvoapp Pro (scope: zurvoapps-projects)
- GitHub: jayanthmb14/forthepeople (private)
- Domain: forthepeople.in (Hostinger DNS → Vercel)
- Git email MUST be jayanthmbj@gmail.com:
  git config user.email "jayanthmbj@gmail.com"

### Scraper — Railway
```
Service: Docker container from Dockerfile.scraper
Runs: 24/7 always-on container
Connects: directly to Neon PostgreSQL
Auto-restarts on crash
Env vars: set in Railway dashboard
```

### Local Dev
```bash
# Terminal 1 — Start Prisma dev proxy (KEEP RUNNING)
cd forthepeople && npx prisma dev

# Terminal 2 — Start Next.js
npm run dev

# Access: http://localhost:3000/en/karnataka/mandya
```
- Prisma proxy: port 51213 (prisma+postgres://)
- Actual Postgres: port 51214 (direct postgresql://)
- DATABASE_URL must use template1 db with port 51214 locally

### Database Commands
```bash
npx prisma db push              # Apply schema changes (no migration files)
npx prisma generate             # Regenerate Prisma client
npx tsx prisma/seed.ts          # Re-seed Mandya data
npx tsx prisma/seed-hierarchy.ts  # Seed State→District→Taluk hierarchy
npx tsx prisma/seed-features.ts   # Seed 23 feature requests

# Force reset (DANGEROUS):
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes" npx prisma db push --force-reset
```

### Cron Configuration (vercel.json)
```json
{
  "crons": [
    { "path": "/api/cron/scrape-news",       "schedule": "0 6 * * *"   },
    { "path": "/api/cron/scrape-crops",      "schedule": "30 3 * * *"  },
    { "path": "/api/cron/generate-insights", "schedule": "0 */2 * * *" }
  ]
}
```

---

## 22. SCALING — HOW TO ADD A NEW DISTRICT

### Step-by-Step Checklist

#### Step 1: Add to Hierarchy Seeder
```bash
# Edit prisma/seed-hierarchy.ts — add new State (if new) + District + Taluks
# Run against production Neon DB:
npx tsx prisma/seed-hierarchy.ts
```

#### Step 2: Add to Static Constants
```typescript
// Edit src/lib/constants/districts.ts
// Add to INDIA_STATES array (used for static routing + compare page)
// District becomes available in all DB-driven APIs automatically
```

#### Step 3: Handle Name Overrides (if needed)
```typescript
// src/scraper/jobs/weather.ts — add to OWM_CITY_OVERRIDE if OpenWeatherMap
// uses a different name than the district slug
OWM_CITY_OVERRIDE['new-district-slug'] = 'City Name For OWM';

// src/scraper/jobs/crops.ts — add to AGMARKNET_DISTRICT_OVERRIDE if needed
AGMARKNET_DISTRICT_OVERRIDE['new-district-slug'] = 'AGMARKNET Name';
```

#### Step 4: Seed Initial Data
```bash
# Create a seed file: prisma/seed-newdistrict.ts
# Seed: leadership, budget, demographics, infrastructure projects
npx tsx prisma/seed-newdistrict.ts
```

#### Step 5: Activate the District
```sql
-- In Neon DB console or via prisma:
UPDATE "District" SET active = true WHERE slug = 'new-district-slug';
```

#### Step 6: Automatic — Nothing Else Needed
After `active: true`, the following work automatically:
- All 30 module API routes (DB-driven by districtSlug)
- Scraper jobs (queries active districts from DB)
- Admin dropdowns (FactChecker, VerifySection)
- Homepage preview cards
- Sitemap generation
- District health score calculation
- AI insight generation (next cron run)
- News intelligence pipeline

### Future Schema Enhancements (tracked in SCALING-CHECKLIST.md)
```
[ ] Add owmCityName field to District model (replace OWM_CITY_OVERRIDE dict)
[ ] Add agmarknetName field to District model (replace AGMARKNET_DISTRICT_OVERRIDE dict)
[ ] Full State→District cascading in admin panel (currently flat district list)
[ ] TalukSelector component on district overview page
```

### How to Add a New State
1. Add State + Districts + Taluks to `prisma/seed-hierarchy.ts` → run it
2. Add to `src/lib/constants/districts.ts` INDIA_STATES array
3. Add any regional font to `src/app/globals.css` @import (Noto Sans for the language)
4. Update OWM_CITY_OVERRIDE and AGMARKNET_DISTRICT_OVERRIDE as needed
5. Activate districts → everything else is automatic

---

## 23. KNOWN CONSTRAINTS

### Vercel Limits
```
Function timeout: 5 minutes max (AI calls must complete within this)
Hobby plan crons: 1 cron job per day (we use Pro which allows multiple)
Background jobs: NOT supported — use Railway for always-on scrapers
Serverless: no persistent TCP connections → must use @upstash/redis REST (not ioredis)
```

### Railway
```
Scraper container: always-on Docker container (node-cron scheduler)
Not Vercel-compatible: uses ioredis which needs persistent TCP
Railway free tier: may sleep after inactivity — use paid tier for production
```

### Neon PostgreSQL
```
Free tier: 0.5GB storage limit
Connection pooling: Neon handles pooling; use adapter-pg, not direct pool management
Scale tier: needed once >3 active districts with real-time scraping
```

### Upstash Redis
```
Free tier: 10,000 requests/day limit
Production: needs paid tier once daily cron runs × active districts exceed limit
REST API only (no TCP): compatible with Vercel serverless
```

### AI Calls
```
OpusCode proxy: higher rate limits than official Anthropic API
Extended thinking: maxTokens MUST be >= 2048 for thinking to work
Response parsing: ALWAYS use content.find(b => b.type === 'text') — never content[0]
Gemini free tier: sufficient for current load (3 districts)
Cost scales: linearly with active districts × modules × cron frequency
```

---

## 24. PROGRESS TRACKER

```
Section 1:  Foundation           COMPLETE
  - Next.js 16 + TypeScript + Tailwind v4 setup
  - Design system (fonts, colors, tokens in globals.css)
  - District routing: /[locale]/[state]/[district]/[module]
  - Prisma 7 with PrismaPg adapter + Neon PostgreSQL

Section 2:  District Dashboard   COMPLETE (30 modules)
  - All 30 module pages built
  - Sidebar navigation with pinned modules + "Show all" + emoji
  - Mobile sidebar: left hamburger → slide-in drawer
  - MobileTabNav: bottom tab strip
  - AIInsightCard on 11 module pages

Section 3:  Interactive Map      COMPLETE
  - Full India SVG map (react-simple-maps, 800×900 portrait)
  - CW winding fix on GeoJSON exterior rings
  - Zero-area ring removal
  - MapErrorBoundary component
  - Mandya Taluk drill-down: TalukMap.tsx

Section 4:  Leadership           COMPLETE
  - 10-tier org chart for all Mandya officials
  - 2024 MP: Nikhil Kumaraswamy (JD(S))
  - 7 MLAs: INC 6, BJP 2, JD(S) 1

Section 5:  Finance & Budget     COMPLETE
  - Budget values stored in Rupees, display ÷1e7 → Crores
  - Full budget breakdown with lapsed funds tracker

Section 6:  Real-time Data       COMPLETE
  - Weather (5min), Crops (15min), Dams (30min) scrapers running

Section 7:  Citizen Features     COMPLETE
  - RTI Tracker + File RTI wizard
  - Gram Panchayat MGNREGA data
  - Citizen Corner + Responsibility page
  - Services Guide + Government Offices directory

Section 8:  Scrapers             COMPLETE (21 jobs)
  - All jobs running on Railway
  - ScraperLog written to DB after each job
  - All scrapers DB-driven (no hardcoded districts)

Section 9:  Admin Panel          COMPLETE
  - 9-tab admin dashboard (added System Health, Alerts & Logs, Analytics)
  - AI Settings: 3-provider cards, model selection, test
  - 2FA: Google Authenticator setup/disable/recovery
  - Fact Checker: AI verification across 7 modules
  - Data Verifier: AI QA per module
  - Review Queue: approve/reject AI insights
  - Feedback management + Payments tab

Section 10: Launch               COMPLETE
  - Support page with 4 Razorpay tiers
  - Contributor Wall (public + compact homepage)
  - Public API: /api/public/district/[district]
  - Health check endpoint
  - Feedback system (floating button + modal + DB)
  - Sitemap + robots.txt
  - NDSAP disclaimer on every page
  - README.md
  - Deployed at https://forthepeople.in

Post-launch: AI Intelligence     COMPLETE
  - 4 AI engines implemented
  - News Action Engine with confidence thresholds
  - Pre-computed insights (30 modules × all districts, every 2h)
  - Fact Checker with 25+ checks

Post-launch: Security (2FA)      COMPLETE
  - TOTP via otpauth, AES-256 encryption
  - 8 backup codes, recovery email via Resend

Post-launch: Payments            COMPLETE
  - Razorpay Live keys, webhook, sync
  - Contributor wall

Post-launch: Feedback            COMPLETE
  - FeedbackModal + floating button + admin management

Post-launch: Scale               COMPLETE
  - 9 pilot districts active (Karnataka: Mandya, Mysuru, Bengaluru Urban; Delhi: New Delhi;
    Maharashtra: Mumbai; West Bengal: Kolkata; Tamil Nadu: Chennai; Telangana: Hyderabad)
  - 10 additional Delhi districts ready to activate
  - All scrapers DB-driven (not hardcoded)
  - Health scores pre-computed for all 3 Karnataka districts

Post-launch: Feature Voting      COMPLETE
  - 23 feature requests seeded
  - Fingerprint-based anonymous voting
  - Features page + vote widget on homepage

Post-launch: District Health Score  COMPLETE
  - 10-category algorithm in src/lib/health-score.ts
  - Pre-computed weekly, stored in DistrictHealthScore
  - Shown on homepage district cards + district overview

OpenRouter Migration + Admin Upgrade COMPLETE (2026-04-12)
  - OpenRouter replaces OpusCode.pro as sole AI provider
  - Tiered routing: Gemma 4 free → Gemini 2.5 Pro → Claude Sonnet 4
  - AI feedback classifier with legal guardrails (DPDP, defamation, PII)
  - Feedback reply system via Resend email
  - AI usage tracking (AIUsageLog) + subscription manager (Subscription)
  - Admin panel: 10 tabs (added Costs), AI Settings shows OpenRouter
  - Feedback tab: AI classification, flags, warnings, inline reply
  - All OpusCode.pro references removed from codebase

Bug Fixes from User Feedback        COMPLETE (2026-04-12)
  - Schools: student:teacher ratio color INVERTED (green=good, red=bad)
  - Population: grid minmax reduced 150→130px for mobile
  - Overview: responsive grid uses min(240px, 100%) to prevent overflow
  - Water & Dams: tooltips on Level, Inflow, Outflow, Storage with info icons
  - Weather: NoDataCard added when no readings available
  - Crops: NoDataCard for empty crop data (metro districts like Chennai)
  - Market Ticker: USD/INR now uses Yahoo Finance (USDINR=X) as primary source
  - Market Ticker: "Last updated" timestamp shown on desktop
  - Data fix script: scripts/fix-data-april-2026.ts (TN Governor + Bengaluru elections)

Error Monitoring + Alerts           COMPLETE (2026-04-11)
  - @sentry/nextjs for automatic error catching in production
  - AdminAlert model for storing alerts in DB
  - src/lib/admin-alerts.ts: email + DB alert system via Resend
  - Alerts wired into scrapers, feedback, and payments
  - Global error page: src/app/global-error.tsx

Analytics + Privacy + Security      COMPLETE (2026-04-11)
  - Plausible Analytics (cookieless, one script tag in layout.tsx)
  - DPDP Act 2023 compliant privacy policy at /privacy (10 sections)
  - Homepage stat counters: fallback values 10/29/50000 instead of "–"
  - npm audit: 12 → 3 vulnerabilities (d3-color override, next-intl fixed, next updated)
  - Admin IP restriction middleware (optional, ADMIN_ALLOWED_IPS env var)

Admin Panel Expansion (6→9 tabs)    COMPLETE (2026-04-11)
  - System Health tab: DB/Redis status, data freshness, scraper logs, pending items
  - Alerts & Logs tab: AdminAlert feed with filters, mark-as-read, email status
  - Analytics tab: district requests, feature votes, feedback/revenue trends
  - Tab navigation via AdminClient wrapper with unread badge on Alerts tab
  - 3 new API routes: system-health, alerts, analytics

Security + Performance Audit       COMPLETE (2026-03-29 commit a999b28)
Exams & Jobs (Phase 5)              COMPLETE (2026-03-30)
  - CRON_SECRET: query param fallback removed from generate-insights (security)
  - 2FA recovery token: crypto.timingSafeEqual comparison added (timing attack)
  - useDistrictData: "dam" added to LIVE_MODULES list (cache TTL sync with cache.ts)
  - schools query: take: 200 added (unbounded query fix)
  - elections query: take: 100 added (unbounded query fix)
  - scrape-crops: hardcoded "karnataka" fallback removed, null-guard + continue added
  - scrape-crops: Vercel cron route created (GET /api/cron/scrape-crops, 3:30AM UTC)
  - Vote on Features: links added to Sidebar (collapsed 🗳️ icon + expanded label),
    MobileTabNav drawer, Footer (purple), DistrictRequestSection href fixed

Leadership Fix + Zero-Credit AI Lockdown  COMPLETE (2026-03-31)
  - leaders API: DISTINCT ON (name+role) deduplication — API-level clean data always
  - scripts/cleanup-leaders.ts: raw SQL dedup for all active districts
  - news-action-engine: leader dedup check before insert (name+role)
  - /api/ai/insight: READ-ONLY (Redis cache only, never live AI on public GET)
  - /api/ai/citizen-tips: READ-ONLY (Redis cache only, never live AI on public GET)
  - cron routes: protected by x-cron-secret: CRON_SECRET header

Open Source & Community Setup  COMPLETE (2026-04-08)
  - CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md created
  - GitHub repo made contributor-friendly (labels, starter issues, branch protection)
  - Instagram walkthrough reel linked in README
  - Broken GitHub links fixed on contribute page
  - 15 npm dependency vulnerabilities fixed

Gold/Silver Prices Fix  COMPLETE (2026-04-08)
  - Switched from Yahoo Finance conversion to IBJA (India Bullion Association) scraping
  - Gold shown per gram (not per 10g)
  - Daily change calculated from IBJA historical data

Multi-State Scalability Overhaul  COMPLETE (2026-04-09/10)
  NEW FILES:
    src/lib/constants/state-config.ts    — Per-state config (DISCOM, transport, water, board exam, RTI, data sources)
    src/components/common/DataSourceBanner.tsx — Data source attribution banner on every module page
    src/components/common/NoDataCard.tsx  — Universal empty state component with module-specific messages
  CHANGES:
    - DataSourceBanner added to all 28 module pages
    - State-config created for 6 states (Karnataka, Telangana, Delhi, Maharashtra, WB, TN)
    - All "scrape"/"scraped" removed from user-facing text → "collected"/"sourced"
    - Industries page: dynamic mode (sugar/tech/heritage/general) based on data
    - Data sources page: dynamic per-state sources
    - Water/weather/schools descriptions: removed Karnataka-specific hardcoding
    - Scrapers made state-aware (power, dams, transport — graceful skip for non-Karnataka)
    - Map page: GeoJSON fallback when file missing
    - District counter: dynamic from INDIA_STATES (not hardcoded "3")
    - layout.tsx JSON-LD: FAQ updated to list all 6 states
    - llms.txt: updated with all active states/districts
    - AI insight card: shows "Analysis from Xh ago · Updated every 2 hours" footer

Hyderabad (Telangana) Expansion  COMPLETE (2026-04-10)
  NEW FILES:
    prisma/seed-hyderabad-data.ts        — Full Hyderabad district data seed
    scripts/activate-telangana-districts.ts — Future district activation script
    scripts/fix-hyderabad-data.ts        — Budget expenditure + crime + traffic fix
  CHANGES:
    - Telangana state added (6th active state) with 5 districts (1 active, 4 inactive)
    - Hyderabad district: 16 mandals, full data seeded (leadership, budget, infra, schools,
      police, offices, schemes, elections, RTI, famous personalities, industries, transport,
      service guides, court stats)
    - seed-hierarchy.ts: Telangana + Hyderabad + 16 mandals
    - districts.ts: HYDERABAD_DISTRICT constant with all mandals + localities
    - Telugu font (Noto Sans Telugu) imported in globals.css
    - README.md updated with Telangana

Exams Dedup & State Filtering Fix  COMPLETE (2026-04-10)
  - 50 duplicate exam records removed (114 → 64)
  - National exams (UPSC/SSC/IBPS/RBI/RRB/SBI) set to level='national', stateId=null
  - Karnataka exams (KSP/KEA) restricted to Karnataka stateId only
  - API: queries national + state-specific exams separately (no cross-state leaking)
  - Scraper: upsertNationalExam() for central exams, Karnataka scraper gated by state

Data Quality & Empty State Fix  COMPLETE (2026-04-10)
  - NoDataCard shows for water, power, farm, gram-panchayat, jjm, news when empty
  - Finance: "₹0Cr" → "Data pending", "0%" → "Pending" when expenditure missing
  - Police: "0" → "No data", "₹0.0L" → "—" when traffic data missing
  - Hyderabad: crime stats (18 records), traffic revenue (12 records), budget expenditure seeded

Favicon Replacement  COMPLETE (2026-04-10)
  - New FTP logo favicon.ico, apple-touch-icon, android-chrome icons deployed
  - manifest.ts updated, sw.js updated, dynamic icon.tsx disabled

National Scraper Integration  COMPLETE (2026-04-10)
  NEW FILES:
    src/lib/constants/dam-config.ts         — Dam-to-district mapping for all 8 districts
    src/scraper/jobs/budget.ts              — National budget data collector (PFMS/data.gov.in)
    src/app/api/cron/scrape-budget/route.ts — Vercel cron route (Monday 6 AM UTC)
  CHANGES:
    - Dam scraper (dams.ts): Rewritten with national architecture
      Karnataka: uses working state portal API (water.karnataka.gov.in)
      Other states: graceful skip with documented research findings
      (India-WRIS has no public REST API — confirmed 2026-04-10)
    - Power scraper (power.ts): DISCOM plugin architecture
      DISCOMParser interface — each state has its own parser function
      Currently: BESCOM (Karnataka). Adding new DISCOMs = add parser to array.
    - Transport scraper (transport.ts): already state-aware from earlier session
    - Budget scraper registered in scheduler.ts (Monday 6 AM, weekly)
    - vercel.json: scrape-budget cron added
  RESEARCH NOTES:
    - India-WRIS: No public REST API. GIS-based internal queries only.
    - CWC RSMS: Old ASP portal with TLS issues. Daily bulletin as PDF/HTML.
    - PFMS: No public API. ASP.NET forms behind session cookies.
    - data.gov.in: No live reservoir or district expenditure datasets found.
    - Karnataka water portal: ONLY working live state portal (POST API, GeoJSON)
  - New FTP logo favicon.ico, apple-touch-icon, android-chrome icons deployed
  - manifest.ts updated to reference new icon paths
  - sw.js updated to cache new icon paths
  - Dynamic icon.tsx disabled (renamed to .bak)

Hyderabad Audit & State-Aware Fixes  COMPLETE (2026-04-11)
  SESSION 1 — Hardcoded Karnataka Backend Fixes:
    - state-config.ts: Added subDistrictUnitPlural, healthSubLabel, villageLabel,
      showVillages, gramPanchayatApplicable, jjmApplicable, municipalBody, waterBoard,
      stateHealthScheme, lastElectionYear, lastElectionType for all 6 states
    - OverviewClient.tsx: Dynamic Taluks→Mandals/Blocks/Tehsils label, hide Villages for urban
    - map/page.tsx: Dynamic sub-district labels, hide villages column for urban districts
    - health/page.tsx: State-aware health schemes (Aarogyasri for Telangana, not Arogya Karnataka),
      iCALL national helpline (replaced NIMHANS), dynamic hospital type labels
    - elections/page.tsx: State-aware "most recent election" text
    - gram-panchayat/page.tsx: Municipal Governance content for urban districts (GHMC, HMWSSB)
    - jjm/page.tsx: Urban water supply messaging with municipal water board name
    - Header.tsx: Dynamic "Select Mandal/Taluk/Tehsil" dropdown label
    - citizen-corner/page.tsx: Ward Committee instead of Gram Sabha for urban districts
    - transport/page.tsx: Fixed "Every Every" frequency display bug
    - news/page.tsx: HTML entity stripping (cleanHtml for &nbsp; etc.)
    - responsibility-content.ts: Added Hyderabad-specific urban responsibility content
  SESSION 2 — Hyderabad Data Quality:
    NEW FILES:
      scripts/fix-hyderabad-crops.ts    — Delete Apple/Avocado, round prices to integers
    UPDATED:
      scripts/fix-hyderabad-data.ts     — Population history (4 census years), dam readings
        (Osmansagar + Himayatsagar), crime stats, traffic revenue, leader VERIFY placeholders
        filled (Collector: Dasari Harichandana, CP: V.C. Sajjanar, CJ: Aparesh Kumar Singh),
        10 missing assembly constituencies added, RTI statistics, HMWSSB alert fix
  SESSION 3 — Cross-Cutting Features:
    NEW FILES:
      src/components/district/ModuleNews.tsx  — Related news at bottom of module pages
      scripts/generate-hyderabad-insights.ts  — AI insight generation for Hyderabad only
    CHANGES:
      - ModuleNews added to 10 module pages (health, elections, finance, transport, exams,
        water, police, infrastructure, crops, population, schemes)
      - Exams page: Central/State/Banking category filter tabs
      - Finance page: State-specific data source attribution text
  SESSION 4 — District Polish (2026-04-11):
    NEW FILES:
      scripts/seed-subdistrict-populations.ts  — Updates population+area on all Taluk DB records
      src/components/district/DistrictBadges.tsx — Achievement badge pills with per-district color avoidance
      src/components/district/DistrictHeroIllustration.tsx — SVG hero with per-district palette + landmark
    CHANGES:
      - districts.ts: Added DistrictBadge interface + badges for all 9 active districts
      - OverviewClient.tsx: Replaced plain header with SVG hero illustration + gradient overlay
      - Sponsor CTA: Toned down from hot pink gradient to plain subtle bar (#FFF on #FAFAF8)
      - HomeDrilldown.tsx: District cards show badges instead of crop prices/dam levels
      - Each district has unique palette (Mandya=sage green, Mysuru=gold, Bengaluru=teal,
        Hyderabad=terracotta, Chennai=ocean teal, Delhi=sandstone, Mumbai=steel blue, Kolkata=ochre)
      - Badge colors avoid clashing with district palette via badgeAvoid mapping
      - SVG approach: 3-5KB inline SVGs, no external images, zero 404 risk

Lucknow (#10) Full Data Seeding  COMPLETE (2026-04-11)
  NEW FILES:
    prisma/seed-lucknow-data.ts              — Full Lucknow seed (19 modules)
    scripts/fix-lucknow-crops.ts             — Round crop price decimals
  CHANGES:
    - state-config.ts: Added Uttar Pradesh (7th active state) with Tehsil labels,
      UPPCL/LESA power, Jal Kal Vibhag water, UPSRTC/LMRC transport, UP Board exams
    - districts.ts: Lucknow badges (City of Nawabs, Chikankari, Kebab Capital, State Capital)
    - DistrictHeroIllustration.tsx: Lucknow mauve palette + Rumi Darwaza SVG
    - DistrictBadges.tsx: Lucknow badge avoidance (no pink/purple)
    - health/page.tsx: Added Ayushman Bharat UP to state health schemes
    - seed-subdistrict-populations.ts: Added Lucknow 4 tehsils
  Mobile Optimization + AI Insight Timing (2026-04-11):
    - globals.css: mobile breakpoint (max-width:767px) with responsive rules
    - Hero illustration: min-height reduced on mobile
    - Stats strip: 2x2 on mobile (no border-left separators)
    - Sponsor bar: column layout on mobile
    - DataTable: horizontal scroll wrapper on mobile
    - Crop toggle: min tap target 36px
    - AI insight: human-readable timing ("13 days ago" not "313h ago")
    - AI insight: shows "Next refresh in Xh" from expiresAt field
    - Removed hardcoded "Updated every 2 hours" — uses dynamic timing

  Cross-District Fixes (2026-04-11):
    - Budget consistency: overview filters to latest FY only (matches finance page)
    - Schemes: Apply Online button green (#0f6e56), grey fallback for missing URLs
    - Scheme eligibility + benefit amounts updated for 20 records across all districts
    - Hyderabad housing: PMAY-U + 2BHK seeded (was all zeros)
    - Health scores recalculated for all 10 districts
    - Crop price Kg/Quintal toggle: default per Kg, AGMARKNET data stays per quintal in DB
    - Overview mandi preview: shows per-kg prices

    - Seeded: leadership (MP, 9 MLAs, Governor, CM, DM, CP), budget (10 sectors),
      infrastructure (8 projects), police (15 stations), schools (15 institutions),
      offices (10), schemes (10), elections (2024 LS + 2022 Assembly 9 constituencies),
      RTI (templates + stats), famous personalities, industries, transport (bus + train),
      services, courts, crime stats, traffic revenue, alerts, population history
```

---

## 25. COST ANALYSIS

```
Vercel Pro (zurvoapp):    ~$20/month (includes cron + preview deployments)
Neon PostgreSQL:          Free tier (0.5GB) — sufficient for 3 districts
                          Scale tier ~$20/month if >10 districts
Upstash Redis:            Free tier (10K req/day) — upgrade to $10/month at scale
Railway (scraper):        ~$5/month (always-on container, minimal CPU)
Razorpay:                 2% per transaction (no monthly fee)
Resend:                   Free (100 emails/day)
Gemini API:               Free tier sufficient for current load
Anthropic/OpusCode:       ~$10-20/month (Claude Opus calls for insights + fact-check)
Domain (forthepeople.in): ~₹800/year (~₹67/month)

CURRENT TOTAL:            ~₹2,500-3,500/month (~₹108/district/month for 3 districts)
AT SCALE (780 districts): ~₹108/district/year if infra scales linearly
                          Realistically ~₹5,000/month for 100 districts
```

---

## 26. MEMORY MANAGEMENT

### Claude Code Skills Location
```
/Users/jayanth/Documents/For The People/forthepeople/.claude/skills/forthepeople/SKILL.md
```

### Key Reference Files
```
/Users/jayanth/Documents/For The People/BLUEPRINT-UNIFIED.md          — This file (master reference)
/Users/jayanth/Documents/For The People/FORTHEPEOPLE-SKILL-UPDATED.md — Skill reference for Claude
/Users/jayanth/Documents/For The People/forthepeople/README.md         — GitHub landing page
/Users/jayanth/Documents/For The People/forthepeople/SCALING-CHECKLIST.md — How to add districts/states
/Users/jayanth/.claude/projects/.../memory/MEMORY.md                  — Session memory (auto-updated)
```

### Session Start Protocol
1. Read BLUEPRINT-UNIFIED.md (this file) at the start of each session
2. Check MEMORY.md for latest updates since blueprint was last written
3. For map work: read Section 7 carefully before touching any map file
4. For AI work: read Section 9 carefully before calling any AI function

---

## 27. ANTI-PATTERNS (Things That Don't Work And Why)

### Libraries to Never Use on Vercel
```
ioredis        — Requires persistent TCP connection. Crashes Vercel serverless functions.
                 Use @upstash/redis (REST-based) instead.
bullmq         — Also requires ioredis. Do not use in Next.js API routes.
node-cron      — Does not work in Vercel serverless. Use Vercel cron + /api/cron/ routes.
puppeteer      — Too heavy for Vercel (memory limit). Use only in Railway scraper container.
```

### Map Anti-Patterns
```
Never: Change react-simple-maps viewBox without testing all 36 states
Never: Use CCW winding for GeoJSON exterior rings (d3-geo needs CW despite RFC7946)
Never: Forget to remove zero-area rings (area < 1e-10) — they cause world-spanning fills
Never: Use D3.js for the India map (too complex, was abandoned)
Never: Use Leaflet for the main India map (SSR issues, was abandoned)
```

### AI Anti-Patterns
```
Never: Call Anthropic or Gemini APIs directly — always use callAI() from ai-provider.ts
Never: Assume content[0] is the text block — use content.find(b => b.type === 'text')
Never: Set maxTokens < 2048 when using extended thinking
Never: Let ANTHROPIC_BASE_URL default to DB value — env var MUST take priority
Never: Hardcode "gemini" as the AI provider — read from AIProviderSettings in DB
```

### Database Anti-Patterns
```
Never: Store budget values in Crores — always store in Rupees, display ÷1e7
Never: Overwrite previous leadership records — ADD only, never delete historical leaders
Never: Add famous personality without verifying bornInDistrict = true for their district
       Example: Dr. Rajkumar was born in Erode, TN — NOT in Mandya (removed after error)
Never: Use `headline` field on NewsItem — the field is `title` (was a bug)
Never: Assume ElectionResult is per-candidate — it's per-constituency (winnerName/winnerParty)
```

### Deployment Anti-Patterns
```
Never: Run `npx vercel --prod` directly (causes Vercel scope switching issues)
       Always: git push origin main → auto-deploy
Never: Commit with git user.email != jayanthmbj@gmail.com (Vercel rejects deployment)
Never: Use `git commit --amend` after a failed pre-commit hook (amends PREVIOUS commit)
       Always: Fix the issue, re-stage, create a NEW commit
Never: Use `npm ci` in Dockerfile.scraper (peer dep conflicts — use npm install --legacy-peer-deps)
```

### Code Pattern Anti-Patterns
```
Never: recharts Tooltip formatter typed as (v: number) → TypeScript error
       Always: (v) + Number(v) cast
Never: Set overflow:hidden on the nav element (clips dropdown menus)
       Always: overflow:visible on Header nav
Never: Hardcode district or state names in API routes (use dynamic DB queries)
Never: Put secrets in NEXT_PUBLIC_ vars except NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_RAZORPAY_KEY_ID
Never: Accept CRON_SECRET as a URL query param (leaks in server logs/browser history)
       Always: read from Authorization: Bearer header only
Never: Use unbounded findMany() on high-cardinality tables (schools, elections)
       Always: add take: N (schools take:200, elections take:100)
```

---

## 28. KEY FILES REFERENCE

```
ENTRY POINTS:
src/app/layout.tsx                              — Root layout (fonts, providers)
src/app/globals.css                             — Tailwind v4 @theme design tokens
src/app/[locale]/layout.tsx                     — Header + RefreshIndicator + disclaimer
src/app/[locale]/[state]/[district]/layout.tsx  — Sidebar + MobileTabNav + FeedbackFloatingButton
src/app/[locale]/[state]/[district]/page.tsx    — District overview page (ISR)

ADMIN PAGES:
src/app/[locale]/admin/page.tsx                 — Admin dashboard (9 tabs)
src/app/[locale]/admin/AdminClient.tsx          — Client-side tab navigation wrapper
src/app/[locale]/admin/SystemHealth.tsx         — System health monitoring tab
src/app/[locale]/admin/AlertsAndLogs.tsx        — Admin alert feed + filters tab
src/app/[locale]/admin/AnalyticsDashboard.tsx   — Analytics dashboard tab
src/app/[locale]/admin/ai-settings/page.tsx     — AI Settings with 3-provider cards
src/app/[locale]/admin/security/page.tsx        — 2FA setup, backup codes
src/app/[locale]/admin/review/page.tsx          — AI insight review queue
src/app/[locale]/admin/feedback/page.tsx        — Feedback management
src/app/[locale]/admin/supporters/page.tsx      — Contributors/payments
src/app/[locale]/support/page.tsx               — Contribution/support page (Razorpay)
src/app/[locale]/features/page.tsx              — Feature voting page

CORE LIBRARY:
src/lib/ai-provider.ts                          — Unified AI gateway (callAI, callAIJSON)
src/lib/encryption.ts                           — AES-256-CBC encrypt/decrypt
src/lib/db.ts                                   — Prisma singleton (PrismaPg adapter)
src/lib/redis.ts                                — @upstash/redis singleton (Vercel)
src/lib/cache.ts                                — cacheGet, cacheSet, cacheKey, getModuleTTL
src/lib/constants/districts.ts                  — INDIA_STATES hierarchy (all 28 states)
src/lib/health-score.ts                         — District health score algorithm
src/lib/insight-generator.ts                    — Pre-compute AI module insights
src/lib/news-action-engine.ts                   — News action classification + execution
src/lib/admin-alerts.ts                         — Email + DB alert system (Resend + AdminAlert model)

MONITORING:
sentry.client.config.ts                         — Sentry browser init (production only)
sentry.server.config.ts                         — Sentry server init (production only)
sentry.edge.config.ts                           — Sentry edge init (production only)
src/app/global-error.tsx                        — Global error boundary (reports to Sentry)
src/app/privacy/page.tsx                        — DPDP Act 2023 compliant privacy policy
src/middleware.ts                               — Admin IP restriction (optional, ADMIN_ALLOWED_IPS)
src/lib/fact-checker.ts                         — AI fact checking (25+ checks)

COMPONENTS:
src/components/common/FeedbackModal.tsx         — Feedback modal (type/subject/message)
src/components/common/FeedbackFloatingButton.tsx — Floating button (uses usePathname)
src/components/common/AIInsightCard.tsx         — AI insight badge per module
src/components/ui.tsx                           — EmptyBlock, ProgressBar, LastUpdatedBadge, etc.

SCRAPER:
src/scraper/scheduler.ts                        — node-cron job scheduler (getActiveDistricts)
src/scraper/jobs/                               — 20 scraper job files
src/scraper/jobs/weather.ts                     — OWM_CITY_OVERRIDE dict
src/scraper/jobs/crops.ts                       — AGMARKNET_DISTRICT_OVERRIDE dict
src/scraper/logger.ts                           — ScraperLog DB logger
src/scraper/types.ts                            — JobContext (districtName, stateName added)

DATABASE:
prisma/schema.prisma                            — 45+ models
prisma/seed.ts                                  — Full Mandya seed (30 tables, deleteMany cleanup)
prisma/seed-hierarchy.ts                        — State→District→Taluk hierarchy (upsert only)
prisma/seed-features.ts                         — 23 feature requests seed
prisma.config.ts                                — Prisma 7 config (DATABASE_URL from env)
Dockerfile.scraper                              — Railway scraper container
```

---

## 29. EXTERNAL INTEGRATIONS (April 2026)

### Sentry Error API
Reads unresolved issues and surfaces them inside Alerts & Logs tab + Dashboard banner.
- `src/lib/sentry-api.ts` — REST client (sentry.io/api/0)
- `src/app/api/admin/sentry-errors/route.ts` — cookie-auth endpoint, 5min Redis cache
- `src/components/admin/SentryErrorsSection.tsx` — rendered at top of Alerts & Logs
- Env: `SENTRY_API_TOKEN` (not SENTRY_AUTH_TOKEN — that's build-time), `SENTRY_ORG`,
  `SENTRY_PROJECT`. Token requires `event:read` + `project:read` scopes.
- Graceful: shows setup instructions when unconfigured.

### Plausible Stats API
Powers the Traffic tab with real-time visitors, top pages, referrers, devices, countries.
- `src/lib/plausible-api.ts` — `fetchAllPlausibleData(period)` returns all blocks in one go
- `src/app/api/admin/traffic/route.ts` — cookie-auth, 3min cache, supports 7d/30d/90d/month/year
- `src/app/[locale]/admin/TrafficTab.tsx` — in-page tab (`?tab=traffic`)
- Env: `PLAUSIBLE_API_KEY`, `PLAUSIBLE_SITE_ID` (default: forthepeople.in)
- Graceful: setup instructions when unconfigured.
- "View Full Analytics" button links to plausible.io dashboard.

### API Key Vault (April 2026)
- Models: `AdminAPIKey` (extended: envVarName, maskedKey, notes, lastAccessedAt, lastAccessedBy, addedBy)
- Gate: separate TOTP verification (`ftp_vault_session` cookie, 10-min Redis TTL, bound to admin
  cookie hash so the session can't be replayed from another browser)
- Reveal: POST `/api/admin/vault/[id]/reveal` — decrypts via `src/lib/encryption.ts`, rate limited
  to 5 reveals per session, auto-hidden after 30s client-side
- `/api/admin/vault` GET (list masked + env reference), POST (add/upsert)
- `/api/admin/vault/[id]` GET, PATCH, DELETE
- `/api/admin/vault/unlock` POST, `/api/admin/vault/session` GET/DELETE
- Seed: `scripts/seed-vault-keys.ts` — reads known env vars + stores encrypted. Idempotent.
- Every vault action writes an AdminAuditLog entry.

### Multi-user Admin (Foundation — future work)
- Models: `AdminUser` (username, passwordHash [bcryptjs], role, permissions, totpSecret),
  `AdminAuditLog` (actorLabel, action, resource, resourceId, details, ipAddress, userAgent)
- Roles: `owner` (full access), `admin` (no vault/users), `viewer` (Dashboard/Health/Analytics/Traffic)
- `/api/admin/users` GET/POST, `/api/admin/users/[id]` PATCH/DELETE (soft delete → isActive=false)
- Scaffolding only: ADMIN_PASSWORD cookie still gates all admin routes. Per-user login remains
  a future task — the table is populated so role-based UI filtering can be wired later.

### Audit Logging
- `src/lib/audit-log.ts`: `logAudit()` + `logAuditAuto()` (auto-extracts IP + UA from headers).
- Never throws — audit write failures are logged to stderr but don't break the main operation.
- Viewer: `/api/admin/audit-log` with filters (action, adminUserId, resource, date range),
  rendered as paginated table on Security page with CSV export.
- Instrumented: vault ops, manual-supporter, supporter edit, expense add/edit/delete,
  platform-report manual generation, user create/update/deactivate.

### AI Platform Analysis
Weekly AI-generated platform health report with action items + cost tips.
- Model: `PlatformReport` (type, summary, actionItems, metrics, costTips, growthNotes,
  aiModel, aiProvider, aiCostUSD, generatedAt)
- `src/lib/platform-analysis.ts` — gathers 7-day snapshot + calls Gemini 2.5 Pro via callAIJSON
- `src/app/api/admin/platform-report/route.ts` — GET latest + estimate, POST with
  `?confirm=true` to generate
- `src/app/api/cron/platform-report/route.ts` — Sundays 00:00 UTC via vercel.json
- `src/components/admin/PlatformReportCard.tsx` — Dashboard card with two-step generate flow
- Approx cost: $0.002 (~₹0.20) per report. Cheaper than the prompt's ~$0.01 estimate because
  the actual prompt fits in ~1.7K tokens.
- Weekly cron needs `CRON_SECRET` set; manual trigger from Dashboard works independently.
```
