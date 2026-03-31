import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    // Check all schemas
    const schemas = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')`
    );
    console.log("Schemas:", schemas.rows.map(r => r.schema_name).join(", "));

    // Check if there's a "public" schema with leaders
    const count = await client.query(
      `SELECT COUNT(*) as total FROM "Leader" WHERE "districtId" = 'cmmv9n6cq0001ubxntuw11cty'`
    );
    console.log("Total Mandya leaders in this DB:", count.rows[0].total);
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(console.error);
