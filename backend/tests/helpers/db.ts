import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

/**
 * Connexion dédiée aux tests, pointant vers DATABASE_URL de .env.test
 * (chargé par tests/setupEnv.ts avant l'import de ce module).
 */
export const testDb = drizzle(process.env.DATABASE_URL!);

export async function resetUsers(): Promise<void> {
  await testDb.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
}

export async function closeTestDb(): Promise<void> {
  await testDb.$client.end();
}
