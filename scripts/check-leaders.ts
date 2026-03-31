import { prisma } from "@/lib/db";

async function main() {
  const leaders = await prisma.leader.findMany({
    where: { district: { slug: "mandya" } },
    orderBy: { name: "asc" },
  });
  for (const l of leaders) {
    console.log(`"${l.name}" | "${l.role}" | party: ${l.party} | tier: ${l.tier}`);
  }
  console.log(`Total: ${leaders.length}`);
}
main();
