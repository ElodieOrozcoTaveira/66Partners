import "dotenv/config";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

/**
 * BOOTSTRAP DE LA BASE DE TEST
 *
 * Appliqué automatiquement avant `npm test` (hook "pretest"). Cible
 * exclusivement DATABASE_URL défini dans backend/.env.test (jamais la base
 * de dev) : applique les migrations Drizzle, puis crée le territoire 66 de
 * référence (idempotent) — nécessaire à toute création d'activité/inscription
 * même dans une base de test vierge.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.test"), override: true });

const dbUrl = process.env.DATABASE_URL ?? "";
const dbName = dbUrl.split("/").pop()?.split("?")[0];

if (!dbName || !dbName.includes("test")) {
  throw new Error(
    `Refus de migrer : DATABASE_URL ne pointe pas vers une base de test ` +
    `(nom de base détecté : "${dbName ?? "inconnu"}"). Vérifie backend/.env.test.`
  );
}

// Crée la base de test si elle n'existe pas encore (ex : volume Postgres
// recréé de zéro) — self-healing, pour ne jamais dépendre d'une étape
// manuelle. On se connecte à "postgres" (base d'administration toujours
// présente) car on ne peut pas créer une base depuis une connexion à
// elle-même.
const adminUrl = dbUrl.replace(/\/[^/]+$/, "/postgres");
const adminClient = new Client({ connectionString: adminUrl });
await adminClient.connect();
try {
  await adminClient.query(`CREATE DATABASE "${dbName}"`);
  console.log(`Base de test "${dbName}" créée.`);
} catch (error) {
  const pgError = error as { code?: string };
  if (pgError.code !== "42P04") throw error; // 42P04 = database already exists
} finally {
  await adminClient.end();
}

const db = drizzle(dbUrl);

await migrate(db, { migrationsFolder: "./drizzle" });

// Import dynamique et non statique : seed-territories.ts construit sa propre
// connexion à partir de process.env.DATABASE_URL au moment où le module est
// évalué. Un import statique serait hissé (hoisting ESM) et s'exécuterait
// avant l'override de DATABASE_URL ci-dessus, connectant le seed à la
// mauvaise base (celle du conteneur, la base de dev).
const { seedTerritory66 } = await import("../src/db/seed-territories.js");
await seedTerritory66();

console.log(`Base de test (${dbName}) migrée et territoire 66 vérifié.`);
process.exit(0);
