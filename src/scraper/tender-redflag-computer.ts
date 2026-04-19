// Standalone entry for the red-flag recomputation job.
// Run manually:  npx tsx src/scraper/tender-redflag-computer.ts
// Run via cron (Vercel cron or Node scheduler): imports runRedFlagComputer().

import "dotenv/config";
import { recomputeAllFlags } from "@/lib/tenders/tender-redflags";

export async function runRedFlagComputer(): Promise<{ processed: number; written: number }> {
  const started = Date.now();
  const result = await recomputeAllFlags();
  console.log(`[red-flags] processed=${result.processed} written=${result.written} durationMs=${Date.now() - started}`);
  return result;
}

if (typeof require !== "undefined" && require.main === module) {
  runRedFlagComputer()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
