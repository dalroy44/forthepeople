<div align="center">

# 🇮🇳 ForThePeople.in

### Your District. Your Data. Your Right.

**India's first free, real-time, district-level civic transparency platform.**

[Live Site](https://forthepeople.in) · [Vote for Features](https://forthepeople.in/en/features) · [Support the Project](https://forthepeople.in/support)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Districts](https://img.shields.io/badge/districts_live-7-green.svg)
![Modules](https://img.shields.io/badge/dashboards-30_per_district-orange.svg)

</div>

---

## What is ForThePeople.in?

ForThePeople.in aggregates publicly available Indian government data into clean, citizen-friendly dashboards — one for every district. Instead of navigating 50+ government portals, citizens get a single platform with real-time data on crop prices, dam levels, budget spending, school performance, infrastructure projects, and 25+ more modules.

**Currently live:** Karnataka (Mandya, Mysuru, Bengaluru Urban) |
Delhi (New Delhi) | Maharashtra (Mumbai) | West Bengal (Kolkata) | Tamil Nadu (Chennai)
**Goal:** All 780+ districts across 28 states and 8 UTs.

## 29 Dashboard Modules

| Category | Modules |
|----------|---------|
| **Live Data** | Overview, Interactive Map, Water & Dams, Crop Prices, Weather & Rainfall, Finance & Budget |
| **Governance** | Leadership, Police & Traffic, Schools, Courts, RTI Tracker, Gram Panchayat, Health |
| **Services** | Gov. Schemes, Services Guide, Elections, Transport, JJM Water Supply, Housing, Power |
| **Community** | Local Alerts, Offices, Citizen Corner, Famous Personalities, News, Data Sources |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, react-simple-maps, Recharts |
| Database | PostgreSQL (Neon), Prisma ORM (45+ models) |
| Cache | Upstash Redis |
| AI | Anthropic Claude (default), Google Gemini (fallback) |
| Scraping | Railway.app (24/7), Google News RSS, Cheerio |
| Hosting | Vercel Pro |
| Payments | Razorpay (for supporter contributions) |

## Getting Started

```bash
# Clone
git clone https://github.com/jayanthmb14/forthepeople.git
cd forthepeople

# Install
npm install

# Set up environment
cp .env.example .env.local
# Fill in your API keys in .env.local

# Database
npx prisma generate
npx prisma db push

# Run
npm run dev
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── data/[module]/  # 29-module unified data API
│   │   ├── cron/           # Scheduled jobs (news, crops, insights)
│   │   └── admin/          # Admin-only endpoints
│   └── [locale]/[state]/[district]/  # District dashboard pages
├── components/             # Reusable React components
├── lib/                    # Core utilities (DB, Redis, AI, health score)
└── scraper/                # Background data scrapers (Railway)
prisma/
├── schema.prisma           # 45+ database models
└── seed.ts                 # Seed data for Mandya district
```

## Legal

ForThePeople.in is an **independent citizen transparency initiative**. It is NOT an official government website. All data is sourced from publicly available government portals under India's Open Data Policy (NDSAP) and the Right to Information (Article 19(1)(a) of the Indian Constitution).

## Support

Running this platform for all 780+ districts costs approximately ₹12 lakh/year. You can help:

- **₹1.50/day** serves one district
- [Support page →](https://forthepeople.in/support)

## Creator

**Jayanth M B** — Solo entrepreneur from Karnataka, India.

Built with the belief that every Indian citizen deserves free, transparent access to their district's government data.

- Instagram: [@jayanth_m_b](https://www.instagram.com/jayanth_m_b/)
- Project: [forthepeople.in](https://forthepeople.in)

## License

MIT with Attribution — see [LICENSE](LICENSE) for details.

Any fork or derivative must retain attribution to the original creator (Jayanth M B).
