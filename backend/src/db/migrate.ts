import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const db = drizzle(process.env.DATABASE_URL!);
const init = process.argv.includes("--init");

// `init` est supporté à l'exécution par drizzle-orm mais absent du typage
// de ce package en version rc — cast nécessaire en attendant une release stable.
const result = await migrate(db, {
  migrationsFolder: "./drizzle",
  init,
} as Parameters<typeof migrate>[1] & { init: boolean });

if (result?.exitCode === "databaseMigrations") {
  console.log("Baseline déjà enregistrée, rien à faire.");
  process.exit(0);
}

if (result?.exitCode) {
  console.error(`Baseline impossible (${result.exitCode}).`);
  process.exit(1);
}

console.log(init ? "Baseline enregistrée." : "Migrations terminées avec succès.");
process.exit(0);
