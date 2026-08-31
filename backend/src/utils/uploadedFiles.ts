import "dotenv/config";
import fs from "node:fs/promises";
import { eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activityPhotos, users } from "../db/schema.js";
import { resolveUploadPath } from "../middlewares/upload.middleware.js";

const db = drizzle(process.env.DATABASE_URL!);

const UPLOAD_URL_PREFIX = "/uploads/";

/**
 * Supprime physiquement un fichier uploadé, UNIQUEMENT s'il n'est plus
 * référencé par aucune autre ligne (avatar, couverture, ou photo
 * d'activité) — cf. chantier RGPD F-03/F-04.
 *
 * Idempotent : un fichier déjà absent du disque n'est jamais une erreur.
 * Ignore silencieusement toute URL qui ne pointe pas vers /uploads/ (ex.
 * anciennes données de démo) ou qui sortirait de UPLOAD_DIR.
 *
 * Appeler APRÈS avoir supprimé/mis à jour la ligne qui référençait ce
 * fichier, afin que la vérification "encore référencé ?" reflète l'état
 * réel de la base.
 */
export async function deleteUploadedFileIfUnreferenced(
  url: string | null | undefined
): Promise<void> {
  if (!url || !url.startsWith(UPLOAD_URL_PREFIX)) return;

  const filename = url.slice(UPLOAD_URL_PREFIX.length);
  const filePath = resolveUploadPath(filename);
  if (!filePath) return;

  const [referencedByPhoto] = await db
    .select({ id: activityPhotos.id })
    .from(activityPhotos)
    .where(eq(activityPhotos.url, url))
    .limit(1);

  if (referencedByPhoto) return;

  const [referencedByUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.avatar, url), eq(users.coverPhoto, url)))
    .limit(1);

  if (referencedByUser) return;

  try {
    await fs.unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}
