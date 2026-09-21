import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activityPhotos, users } from "../db/schema.js";
import { deleteUploadedFileIfUnreferenced } from "../utils/uploadedFiles.js";
import { sendAccountDeletedEmail } from "./mail.services.js";
import { UserError } from "./user.services.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE DE SUPPRESSION DE COMPTE
 *
 * Point d'entrée UNIQUE pour supprimer un compte, que ce soit l'utilisateur
 * lui-même (DELETE /api/users/me) ou une administratrice depuis l'espace
 * admin (DELETE /api/admin/users/:userId) — jamais deux logiques distinctes,
 * pour éviter toute divergence entre les deux parcours. L'autorisation
 * (qui a le droit d'appeler quoi) reste entièrement de la responsabilité des
 * routes/contrôleurs appelants (requireAuth + req.userId d'un côté,
 * requireAdminAuth de l'autre) : ce service ne fait que la suppression elle-
 * même, en confiance sur l'userId reçu.
 *
 * Comportement des données liées (cf. schema.ts, toutes les FK vers `users`
 * sont ON DELETE CASCADE sauf activities.creatorId qui est ON DELETE SET
 * NULL) :
 * - tout ce qui appartient EN PROPRE à l'utilisateur (participations,
 *   messages, notifications, sports favoris, disponibilités, territoires,
 *   photos qu'il a lui-même uploadées, abonnements push, comptes sociaux,
 *   avis) disparaît avec lui, via les cascades déjà définies dans le schéma ;
 * - les activités qu'il a créées SURVIVENT : leur creatorId passe à null
 *   (jamais réassigné à un compte système artificiel), elles restent
 *   visibles et fonctionnelles pour les autres participants, avec toutes
 *   leurs participations, messages, photos et notifications intacts.
 */

export type DeletionActor = "USER" | "ADMIN";

export class AccountDeletionService {
  static async deleteAccount(userId: string, actor: DeletionActor): Promise<void> {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      throw new UserError("Utilisateur non trouvé", "USER_NOT_FOUND", 404);
    }

    // Photos personnellement uploadées par cet utilisateur (peu importe
    // l'activité, y compris celles des autres) : capturées AVANT suppression
    // car la ligne activity_photos disparaît en cascade (uploaderId) et ne
    // serait plus interrogeable ensuite. Les photos d'une activité qu'il a
    // créée mais uploadées par quelqu'un d'autre NE sont PAS concernées —
    // l'activité survit (creatorId -> null), ces photos restent intactes.
    const ownUploadedPhotos = await db
      .select({ url: activityPhotos.url })
      .from(activityPhotos)
      .where(eq(activityPhotos.uploaderId, userId));

    await db.delete(users).where(eq(users.id, userId));

    // Best-effort, jamais bloquant : le compte est déjà supprimé en base à
    // ce stade (l'opération critique/irréversible a réussi) — un échec de
    // nettoyage physique d'un fichier ne doit jamais faire remonter une
    // erreur 500 pour une suppression de compte en réalité déjà effective.
    try {
      await deleteUploadedFileIfUnreferenced(existingUser.avatar);
      await deleteUploadedFileIfUnreferenced(existingUser.coverPhoto);
      await Promise.all(
        ownUploadedPhotos.map((photo) => deleteUploadedFileIfUnreferenced(photo.url)),
      );
    } catch (err) {
      console.error("Erreur lors du nettoyage des fichiers du compte supprimé:", err);
    }

    console.log(`Compte supprimé (${actor}) : ${userId}`);

    // Best-effort, jamais bloquant : le compte est déjà supprimé à ce stade,
    // un échec d'envoi ne doit jamais remettre en cause la suppression.
    sendAccountDeletedEmail({ email: existingUser.email, pseudo: existingUser.pseudo }).catch(
      (err) => console.error("Erreur envoi email de suppression de compte:", err),
    );
  }
}
