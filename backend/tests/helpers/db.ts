import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { users, sports, territories, userTerritories } from "../../src/db/schema.js";
import { signToken } from "../../src/utils/jwt.js";
import { TerritoryService } from "../../src/services/territory.services.js";

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

  // Reproduit le comportement de AuthService.registerUser : tout compte est
  // rattaché aux territoires actifs (le 66 en V1) dès sa création.
  await TerritoryService.attachUserToActiveTerritories(user.id);

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

let territoryCounter = 0;

/**
 * Crée un territoire de test. Idempotent sur `code` (onConflictDoNothing) :
 * la table `territories` n'est pas tronquée par resetAll (elle est partagée
 * avec les données réelles, notamment le 66), donc rejouer les tests ne doit
 * jamais échouer sur une contrainte unique.
 */
export async function createTerritory(overrides: {
  code?: string;
  name?: string;
  slug?: string;
  brandName?: string;
  isActive?: boolean;
} = {}): Promise<{ id: string; code: string }> {
  territoryCounter++;
  const code = overrides.code ?? `T${territoryCounter}`;

  await testDb
    .insert(territories)
    .values({
      code,
      name: overrides.name ?? `Territoire ${territoryCounter}`,
      slug: overrides.slug ?? `territoire-${territoryCounter}`,
      brandName: overrides.brandName ?? `Territoire${territoryCounter}Partners`,
      isActive: overrides.isActive ?? false,
    })
    .onConflictDoNothing({ target: territories.code });

  const [territory] = await testDb
    .select({ id: territories.id, code: territories.code })
    .from(territories)
    .where(eq(territories.code, code))
    .limit(1);

  if (!territory) throw new Error("createTerritory: insert failed");
  return territory;
}

export async function attachUserToTerritory(
  userId: string,
  territoryId: string,
  isDefault = false
): Promise<void> {
  await testDb
    .insert(userTerritories)
    .values({ userId, territoryId, isDefault })
    .onConflictDoNothing({
      target: [userTerritories.userId, userTerritories.territoryId],
    });
}
