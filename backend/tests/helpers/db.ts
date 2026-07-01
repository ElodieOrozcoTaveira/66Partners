import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { users, sports } from "../../src/db/schema.js";
import { signToken } from "../../src/utils/jwt.js";

export const testDb = drizzle(process.env.DATABASE_URL!);

/** Tronque uniquement les utilisateurs (cascade vers activities, participations, user_sports). */
export async function resetUsers(): Promise<void> {
  await testDb.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
}

/** Tronque uniquement les sports (cascade vers user_sports et activities). */
export async function resetSports(): Promise<void> {
  await testDb.execute(sql`TRUNCATE TABLE sports RESTART IDENTITY CASCADE`);
}

/** Tronque toutes les données applicatives (users + sports en cascade). */
export async function resetAll(): Promise<void> {
  await testDb.execute(
    sql`TRUNCATE TABLE users, sports RESTART IDENTITY CASCADE`
  );
}

export async function closeTestDb(): Promise<void> {
  await testDb.$client.end();
}

// ─── Helpers de création directe (sans argon2 ni appel HTTP) ───────────────

let userCounter = 0;

export async function createUser(overrides: {
  email?: string;
  pseudo?: string;
} = {}): Promise<{ userId: string; token: string }> {
  userCounter++;
  const [user] = await testDb
    .insert(users)
    .values({
      email: overrides.email ?? `user${userCounter}@test.com`,
      password: "placeholder_hash",
      pseudo: overrides.pseudo ?? `user${userCounter}`,
    })
    .returning({ id: users.id });

  if (!user) throw new Error("createUser: insert failed");
  const token = signToken({ id: user.id });
  return { userId: user.id, token };
}

export async function createSport(name = "TestSport"): Promise<string> {
  const [sport] = await testDb
    .insert(sports)
    .values({ name })
    .returning({ id: sports.id });

  if (!sport) throw new Error("createSport: insert failed");
  return sport.id;
}
