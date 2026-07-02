import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { join } from "node:path";

const db = drizzle(process.env.DATABASE_URL!);

const migrationsFolder = join(process.cwd(), "drizzle");

console.log(`Applying migrations from: ${migrationsFolder}`);

await migrate(db, { migrationsFolder });

console.log("Migrations appliquées avec succès.");
process.exit(0);
