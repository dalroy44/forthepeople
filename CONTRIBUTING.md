# Contributing to ForThePeople.in

Thank you for your interest in contributing to ForThePeople.in! This project aims to bring transparent, district-level government data to every citizen in India, and we welcome contributions from developers of all skill levels.

## Table of Contents

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Code Style](#code-style)
- [Adding a New District](#adding-a-new-district)
- [Need Help?](#need-help)

## Getting Started

1. **Fork** this repository on GitHub
2. **Clone** your fork locally
3. **Create a branch** for your changes
4. **Make your changes** and test them
5. **Submit a Pull Request** back to this repo

## Prerequisites

- **Node.js 20+** — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** — We recommend [Neon](https://neon.tech/) (free tier available) for a cloud-hosted database
- **Git** — [Download here](https://git-scm.com/)

Optional (for full functionality):
- [Upstash](https://upstash.com/) account (Redis, free tier available)
- API keys for data providers (see `.env.example` for the full list)

## Local Setup

```bash
# 1. Clone your fork
git clone https://github.com/YOUR_USERNAME/forthepeople.git
cd forthepeople

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Open .env.local and fill in your values (see below)

# 4. Set up the database
npx prisma generate
npx prisma db push

# 5. (Optional) Seed sample data
npm run db:seed

# 6. Start the dev server
npm run dev
```

The app will be running at `http://localhost:3000`.

### Environment Variables

At minimum, you need:
- `DATABASE_URL` — Your PostgreSQL connection string (get one free from [Neon](https://neon.tech/))

For full functionality, you'll also want:
- `REDIS_URL` and `REDIS_TOKEN` — From [Upstash](https://upstash.com/) (free tier)
- `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` — For AI-powered insights
- `DATA_GOV_API_KEY` — From [data.gov.in](https://data.gov.in/) (free)
- `OPENWEATHER_API_KEY` — From [OpenWeatherMap](https://openweathermap.org/api) (free tier)

See `.env.example` for the complete list with descriptions.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── data/[module]/  # Unified data API (29 modules)
│   │   ├── cron/           # Scheduled jobs
│   │   └── admin/          # Admin endpoints
│   └── [locale]/[state]/[district]/  # District dashboard pages
├── components/             # Reusable React components
├── lib/                    # Core utilities (DB, Redis, AI, scoring)
├── scraper/                # Background data scrapers
├── dictionaries/           # i18n translation files
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
prisma/
├── schema.prisma           # Database schema (45+ models)
└── seed-*.ts               # District seed data
```

## How to Contribute

### Find Something to Work On

- Look at issues labeled [`good-first-issue`](https://github.com/jayanthmb14/forthepeople/labels/good-first-issue) — great for newcomers
- Check [`help-wanted`](https://github.com/jayanthmb14/forthepeople/labels/help-wanted) for tasks where we need extra hands
- Browse open issues or suggest your own improvement

### Types of Contributions We Welcome

- **New districts** — Expand coverage to more of India's 780+ districts
- **Translations** — Help make the platform accessible in more Indian languages
- **Bug fixes** — Found something broken? Fix it!
- **UI/UX improvements** — Better design, accessibility, mobile experience
- **Data modules** — New types of government data dashboards
- **Documentation** — Improve guides, add code comments, fix typos
- **Tests** — Help us improve code reliability

## Pull Request Guidelines

1. **One PR per feature/fix** — Keep changes focused and reviewable
2. **Write clear PR descriptions** — Explain what you changed and why
3. **Test your changes** — Make sure the dev server runs without errors
4. **Follow existing patterns** — Look at how similar code is structured in the project
5. **Keep it small** — Smaller PRs are reviewed faster

### PR Checklist

- [ ] I've tested my changes locally with `npm run dev`
- [ ] My code passes linting (`npm run lint`)
- [ ] My code passes the type check (`npx tsc --noEmit`)
- [ ] I've updated documentation if needed
- [ ] My PR targets the `main` branch

## Code Style

- **TypeScript** — All code should be written in TypeScript
- **Tailwind CSS** — Use Tailwind utility classes for styling
- **React Server Components** — Prefer server components where possible (Next.js App Router)
- **Prisma** — All database access goes through Prisma ORM
- Run `npm run lint` before submitting to catch style issues

## Adding a New District

Adding a new district is one of the most impactful contributions. Here's the high-level process:

1. Add the district to the `District` model in `prisma/schema.prisma` (if not already present)
2. Create a seed file at `prisma/seed-{districtname}.ts` with district-specific data
3. Add GeoJSON boundary data to `public/geojson/`
4. Add the district to the homepage district list
5. Test all 29 modules work for the new district

Look at existing district seeds (e.g., `prisma/seed.ts` for Mandya) as a reference.

## Need Help?

- **Open an issue** — Ask questions, report bugs, or suggest features
- **Check existing issues** — Your question may already be answered
- **Read the README** — For project overview and tech stack details

---

Thank you for helping make government data accessible to every Indian citizen!
