import "dotenv/config";
import { eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activities, territories, userTerritories, users } from "./schema.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SEED / MIGRATION DE DONNÉES — TERRITOIRE 66
 *
 * Idempotent : crée le territoire 66 (Pyrénées-Orientales) s'il n'existe pas
 * déjà, puis rattache toutes les activités et tous les utilisateurs qui n'ont
 * pas encore de territoire. Peut être exécuté plusieurs fois sans effet de
 * bord (onConflictDoNothing partout où c'est pertinent).
 *
 * Appelée par `seed.ts` (à la fin, une fois sports/users/activities en
 * place) et exécutable seule via `tsx src/db/seed-territories.ts`.
 */
export async function seedTerritory66() {
  await db
    .insert(territories)
    .values({
      code: "66",
      name: "Pyrénées-Orientales",
      slug: "pyrenees-orientales",
      brandName: "66Partners",
      isActive: true,
    })
    .onConflictDoNothing({ target: territories.code });

  const [territory66] = await db
    .select()
    .from(territories)
    .where(eq(territories.code, "66"))
    .limit(1);

  if (!territory66) {
    throw new Error("Le territoire 66 n'a pas pu être créé/récupéré.");
  }

  const activitiesWithoutTerritory = await db
    .select({ id: activities.id })
    .from(activities)
    .where(isNull(activities.territoryId));

  if (activitiesWithoutTerritory.length > 0) {
    await db
      .update(activities)
      .set({ territoryId: territory66.id })
      .where(isNull(activities.territoryId));
  }

  const allUsers = await db.select({ id: users.id }).from(users);

  for (const user of allUsers) {
    await db
      .insert(userTerritories)
      .values({ userId: user.id, territoryId: territory66.id, isDefault: true })
      .onConflictDoNothing({
        target: [userTerritories.userId, userTerritories.territoryId],
      });
  }

  console.log(
    `Territoire 66 prêt : ${activitiesWithoutTerritory.length} activité(s) rattachée(s), ${allUsers.length} utilisateur(s) vérifié(s).`,
  );

  return territory66;
}

// Exécutable seul : `tsx src/db/seed-territories.ts`
const isMainModule = process.argv[1]?.endsWith("seed-territories.ts")
  || process.argv[1]?.endsWith("seed-territories.js");

if (isMainModule) {
  seedTerritory66()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Erreur lors du seed du territoire 66 :", error);
      process.exit(1);
    });
}
