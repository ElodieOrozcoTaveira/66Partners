import "dotenv/config";
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

const migrationsFolder = join(process.cwd(), "drizzle");
console.log(`Migrations folder: ${migrationsFolder}`);

try {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS drizzle;
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT,
      name TEXT NOT NULL UNIQUE
    );
  `);

  const folders = readdirSync(migrationsFolder, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "meta")
    .map((d) => d.name)
    .sort();

  for (const folder of folders) {
    const { rows } = await client.query(
      "SELECT 1 FROM drizzle.__drizzle_migrations WHERE name = $1 LIMIT 1",
      [folder],
    );

    if (rows.length > 0) {
      console.log(`  ↳ ${folder} (déjà appliquée)`);
      continue;
    }

    const sqlContent = readFileSync(
      join(migrationsFolder, folder, "migration.sql"),
      "utf8",
    );

    console.log(`Applying: ${folder}`);
    await client.query(sqlContent);
    await client.query(
      "INSERT INTO drizzle.__drizzle_migrations (hash, created_at, name) VALUES ($1, $2, $3)",
      ["manual", Date.now(), folder],
    );
    console.log(`  ✓ OK`);
  }

  console.log("Migrations terminées avec succès.");
} finally {
  client.release();
  await pool.end();
  process.exit(0);
}
