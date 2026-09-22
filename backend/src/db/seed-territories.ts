import "dotenv/config";
import { eq, notExists } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { territories, userTerritories, users } from "./schema.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * Référentiel des territoires (déclinaisons de la plateforme Partners). UNE
 * seule liste pilote tous les territoires : ajouter un territoire = ajouter
 * une entrée ici (et ses assets sous frontend/public/<assetsPath>), jamais
 * du code dupliqué. Le premier de la liste est le territoire par défaut du
 * backfill. Un territoire `isActive: false` existe en base mais n'est
 * jamais proposé aux utilisateurs (inscription, rejoindre).
 */
export const TERRITORY_SEEDS = [
  {
    code: "66",
    name: "Pyrénées-Orientales",
    slug: "pyrenees-orientales",
    brandName: "66Partners",
    inseeDepartmentCode: "66",
    tagline: "Ton sport. Ton partenaire. Ton 66.",
    assetsPath: null,
    isActive: true,
  },
  {
    code: "34",
    name: "Hérault",
    slug: "herault",
    brandName: "34Partners",
    inseeDepartmentCode: "34",
    tagline: "Ton sport. Ton partenaire. Ton 34.",
    assetsPath: "/34partners",
    isActive: false,
  },
] as const;

/**
 * SEED / MIGRATION DE DONNÉES — TERRITOIRES
 *
 * Idempotent : crée les territoires de TERRITORY_SEEDS s'ils n'existent pas
 * (jamais de mise à jour d'un territoire existant), puis rattache au
 * territoire par défaut UNIQUEMENT les utilisateurs qui n'ont encore aucun
 * territoire — un utilisateur déjà rattaché (par exemple au 34 seulement)
 * n'est jamais rattaché à un autre territoire.
 *
 * Appelée par `seed-reference.ts` / `seed.ts` et exécutable seule via
 * `tsx src/db/seed-territories.ts`.
 */
export async function seedTerritories() {
  await db
    .insert(territories)
    .values(TERRITORY_SEEDS.map((seed) => ({ ...seed })))
    .onConflictDoNothing({ target: territories.code });

  const defaultCode = TERRITORY_SEEDS[0].code;
  const [defaultTerritory] = await db
    .select()
    .from(territories)
    .where(eq(territories.code, defaultCode))
    .limit(1);

  if (!defaultTerritory) {
    throw new Error(`Le territoire ${defaultCode} n'a pas pu être créé/récupéré.`);
  }

  const usersWithoutTerritory = await db
    .select({ id: users.id })
    .from(users)
    .where(
      notExists(
        db
          .select({ one: userTerritories.userId })
          .from(userTerritories)
          .where(eq(userTerritories.userId, users.id))
      )
    );

  for (const user of usersWithoutTerritory) {
    await db
      .insert(userTerritories)
      .values({ userId: user.id, territoryId: defaultTerritory.id, isDefault: true })
      .onConflictDoNothing({
        target: [userTerritories.userId, userTerritories.territoryId],
      });
  }

  console.log(
    `Territoires prêts (${TERRITORY_SEEDS.map((t) => t.code).join(", ")}) : ${usersWithoutTerritory.length} utilisateur(s) sans territoire rattaché(s) au ${defaultCode}.`,
  );

  return { defaultTerritory };
}

// Exécutable seul : `tsx src/db/seed-territories.ts`
const isMainModule = process.argv[1]?.endsWith("seed-territories.ts")
  || process.argv[1]?.endsWith("seed-territories.js");

if (isMainModule) {
  seedTerritories()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Erreur lors du seed des territoires :", error);
      process.exit(1);
    });
}
