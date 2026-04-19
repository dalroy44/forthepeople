// Cron entry for tender ingestion.
// Vercel cron hits an API route that imports this; or run locally:
//   npx tsx src/cron/tenders-scrape.ts

import "dotenv/config";
import { runTenderOrchestrator } from "@/scraper/tender-orchestrator";

export async function runTenderScrape() {
  return runTenderOrchestrator({});
}

if (typeof require !== "undefined" && require.main === module) {
  runTenderScrape()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
