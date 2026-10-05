import "dotenv/config";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activityPhotos, users } from "../src/db/schema.js";
import { deleteUploadedFileIfUnreferenced } from "../src/utils/uploadedFiles.js";

/**
 * NETTOYAGE STAGING — base communautaire vierge (Étape 7)
 *
 * Supprime tous les comptes utilisateurs et, par cascade FK (ON DELETE
 * CASCADE déjà défini dans schema.ts), tout ce qui en dépend : activités,
 * participations, photos d'activité, conversations, messages, notifications,
 * user_sports, sport_favorites, user_territories, disponibilités, push
 * subscriptions, avis. `sports` et `territories` ne sont jamais touchés :
 * aucune cascade ne part de "users" vers ces deux tables (seules les lignes
 * de jointure, ex. user_sports, disparaissent — les sports/territoires
 * eux-mêmes restent).
 *
 * Sécurité :
 * - refuse systématiquement, sans dérogation possible, si DATABASE_URL
 *   pointe vers une base dont le nom contient "test" (jamais partners_test) ;
 * - refuse de s'exécuter sans le flag --yes, après avoir affiché la cible
 *   (hôte + nom de base) pour vérification humaine — ce script ne devine
 *   jamais qu'une base est "staging", c'est à l'opérateur de l'y pointer
 *   explicitement via son propre DATABASE_URL (ex. un futur .env.staging) ;
 * - capture les fichiers uploadés (avatars, couvertures, photos d'activité)
 *   AVANT le TRUNCATE pour pouvoir ensuite les supprimer physiquement via le
 *   mécanisme existant (deleteUploadedFileIfUnreferenced), sans jamais
 *   toucher aveuglément à tout le dossier uploads/.
 *
 * État à l'Étape 7 : aucun environnement staging distinct n'existe encore
 * dans ce projet (aucun docker-compose.staging.yml, aucun .env.staging,
 * aucune mention dans package.json ou une CI) — ce script n'a donc jamais
 * été exécuté. Il est prêt à l'être dès qu'une vraie base staging existera :
 *
 *   DOTENV_CONFIG_PATH=.env.staging npx tsx scripts/clean-staging.ts --yes
 */

const dbUrl = process.env.DATABASE_URL ?? "";
const dbName = dbUrl.split("/").pop()?.split("?")[0] ?? "";
const dbHost = dbUrl.match(/@([^/:]+)/)?.[1] ?? "inconnu";

if (!dbName || dbName.toLowerCase().includes("test")) {
  throw new Error(
    `Refus de nettoyer : DATABASE_URL pointe vers une base de test (nom détecté : "${dbName || "inconnu"}"). ` +
      `Ce script ne doit jamais s'exécuter contre partners_test.`
  );
}

if (!process.argv.includes("--yes")) {
  console.log(`Cible détectée : hôte="${dbHost}", base="${dbName}".`);
  console.log(
    "Aucune action effectuée. Vérifie que cette cible est bien la base STAGING " +
      "(jamais partners ni partners_test), puis relance avec --yes pour confirmer."
  );
  process.exit(1);
}

const db = drizzle(dbUrl);

interface Inventory {
  users: number;
  activities: number;
  participations: number;
  conversations: number;
  messages: number;
  notifications: number;
  photos: number;
  sports: number;
  territories: number;
}

async function inventory(): Promise<Inventory> {
  const result = await db.execute(sql`
    select
      (select count(*)::int from users) as users,
      (select count(*)::int from activities) as activities,
      (select count(*)::int from participations) as participations,
      (select count(*)::int from conversations) as conversations,
      (select count(*)::int from messages) as messages,
      (select count(*)::int from notifications) as notifications,
      (select count(*)::int from activity_photos) as photos,
      (select count(*)::int from sports) as sports,
      (select count(*)::int from territories) as territories
  `);
  return result.rows[0] as unknown as Inventory;
}

async function clean() {
  console.log(`Cible confirmée : hôte="${dbHost}", base="${dbName}".`);
  console.log("Inventaire avant nettoyage :", await inventory());

  // Capturé AVANT le TRUNCATE : c'est la seule façon de retrouver ensuite
  // les fichiers physiques (uploads/) qui ne seront plus référencés par
  // personne une fois les lignes supprimées.
  const photoUrls = (await db.select({ url: activityPhotos.url }).from(activityPhotos)).map(
    (row) => row.url
  );
  const userFiles = await db
    .select({ avatar: users.avatar, coverPhoto: users.coverPhoto })
    .from(users);
  const candidateUrls = [
    ...photoUrls,
    ...userFiles.map((u) => u.avatar),
    ...userFiles.map((u) => u.coverPhoto),
  ].filter((url): url is string => Boolean(url));

  // TRUNCATE ... CASCADE plutôt que des DELETE table par table : les FK
  // ON DELETE CASCADE déjà définies dans schema.ts garantissent qu'aucune
  // ligne dépendante ne peut rester orpheline. Ni `sports` ni `territories`
  // ne sont dans la trajectoire de cascade depuis `users` : ils restent
  // intacts, avec toutes leurs lignes.
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);

  console.log(`${candidateUrls.length} fichier(s) uploadé(s) à vérifier/supprimer...`);
  for (const url of candidateUrls) {
    await deleteUploadedFileIfUnreferenced(url);
  }

  const after = await inventory();
  console.log("Inventaire après nettoyage :", after);

  if (after.users !== 0 || after.activities !== 0) {
    throw new Error("Nettoyage incomplet : des utilisateurs ou activités subsistent.");
  }

  console.log(
    `Staging prêt pour le lancement : 0 utilisateur, 0 activité, ` +
      `${after.sports} sport(s) et ${after.territories} territoire(s) conservés.`
  );
}

clean()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Échec du nettoyage staging :", error);
    process.exit(1);
  });
