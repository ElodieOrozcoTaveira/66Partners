import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../.env.test"), override: true, quiet: true });

// Garde-fou : si .env.test est absent/mal configuré, DATABASE_URL retomberait
// silencieusement sur la base de dev (dangereux : resetAll() fait des
// TRUNCATE). On préfère un échec bruyant et immédiat.
const dbUrl = process.env.DATABASE_URL ?? "";
const dbName = dbUrl.split("/").pop()?.split("?")[0];

if (!dbName || !dbName.includes("test")) {
  throw new Error(
    `Refus de lancer les tests : DATABASE_URL ne pointe pas vers une base de test ` +
    `(nom de base détecté : "${dbName ?? "inconnu"}"). Vérifie backend/.env.test.`
  );
}
