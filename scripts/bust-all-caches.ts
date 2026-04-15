/**
 * ForThePeople.in — Comprehensive Redis cache buster.
 * Run: npx tsx scripts/bust-all-caches.ts
 *
 * Walks every key matching the patterns we care about and DELs them.
 * Use after schema/data changes that need to invalidate everything.
 */

import "./_env";
import redis from "../src/lib/redis";

const PATTERNS = [
  "ftp:*:infrastructure*",
  "ftp:*:leaders*",
  "ftp:*:overview*",
  "ftp:*:elections*",
  "ftp:*:insight*",
  "ftp:*:news*",
  "ftp:*:exams*",
  "ftp:*:budget*",
  "ftp:contributors:*",
  "ftp:freshness:*",
  "ftp:infra-analysis:*",
];

async function scanAndDelete(pattern: string): Promise<number> {
  if (!redis) return 0;
  let cursor: string | number = 0;
  let deleted = 0;
  do {
    const result = (await redis.scan(cursor, { match: pattern, count: 200 })) as unknown as [string | number, string[]];
    cursor = result[0];
    const keys = result[1];
    if (keys.length > 0) {
      const removed = await redis.del(...keys);
      deleted += removed;
    }
  } while (String(cursor) !== "0");
  return deleted;
}

async function main() {
  if (!redis) { console.log("No Redis configured."); return; }
  console.log("🧹 Comprehensive cache bust\n");
  let total = 0;
  for (const p of PATTERNS) {
    const n = await scanAndDelete(p);
    console.log(`  ${p.padEnd(28)} → ${n}`);
    total += n;
  }
  console.log(`\nBusted ${total} cache keys.`);
}

main().catch(console.error);
