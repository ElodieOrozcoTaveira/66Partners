import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { sports } from "./schema.js";
import { seedTerritories } from "./seed-territories.js";

const db = drizzle(process.env.DATABASE_URL!);

const sportNames = [
  "Football",
  "Basketball",
  "Tennis",
  "Running",
  "Cyclisme",
  "Natation",
  "Musculation",
  "Yoga",
  "Escalade",
  "Badminton",
  "Volleyball",
  "Randonnée",
  "Boxe",
  "Padel",
  "Golf",
  "Pétanque",
  "Gravel",
  "VTT",
  "Squash",
  "Pickleball",
  "Paddle",
  "Marche",
  "Roller",
  "Trail",
];

/**
 * DONNÉES DE RÉFÉRENCE — sports + territoire 66
 *
 * Contrairement à `seed.ts` (utilisateurs/activités factices, réservé au
 * dev), ce module ne crée que les données nécessaires au FONCTIONNEMENT de
 * l'application (le référentiel sports, le territoire 66) — jamais de faux
 * comptes ni de fausses activités. Idempotent (onConflictDoNothing partout) :
 * peut être exécuté sans risque sur un environnement déjà peuplé.
 *
 * C'est le script à utiliser pour amorcer une base staging vierge (cf.
 * Étape 7) : les vrais testeurs doivent trouver un référentiel sports complet
 * et le territoire 66 disponible, sans aucune donnée de démonstration.
 */
export async function seedReferenceData() {
  await db
    .insert(sports)
    .values(sportNames.map((name) => ({ name })))
    .onConflictDoNothing();
  const allSports = await db.select().from(sports);
  console.log(`${allSports.length} sports en base.`);

  const { defaultTerritory } = await seedTerritories();

  return { sports: allSports, defaultTerritory };
}

const isMainModule = process.argv[1]?.endsWith("seed-reference.ts")
  || process.argv[1]?.endsWith("seed-reference.js");

if (isMainModule) {
  seedReferenceData()
    .then(() => {
      console.log("Données de référence prêtes (sports + territoires).");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Erreur lors du seed des données de référence :", error);
      process.exit(1);
    });
}
