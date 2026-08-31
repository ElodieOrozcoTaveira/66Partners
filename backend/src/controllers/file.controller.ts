import "dotenv/config";
import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activityPhotos } from "../db/schema.js";
import { resolveUploadPath } from "../middlewares/upload.middleware.js";
import { verifyFileToken } from "../utils/fileAccessToken.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * CONTRÔLEUR DE SERVICE DE FICHIERS UPLOADÉS
 *
 * Remplace l'ancien `express.static('/uploads', ...)`, qui servait tout
 * fichier sans aucune vérification (cf. chantier RGPD F-02). Comportement :
 *  - fichier correspondant à une photo d'activité → jeton signé obligatoire
 *    (`?token=`), généré uniquement pour les participants par
 *    ActivityPhotoService ;
 *  - tout autre fichier (avatar, couverture, ou fichier non référencé) →
 *    servi tel quel, ces données étant déjà publiques dans le profil.
 */
export class FileController {
  static async serve(req: Request, res: Response): Promise<void> {
    const filenameParam = req.params.filename;
    const filename = typeof filenameParam === "string" ? filenameParam : undefined;
    const filePath = resolveUploadPath(filename);

    if (!filePath || !filename) {
      res.status(400).json({
        success: false,
        message: "Nom de fichier invalide",
        code: "INVALID_FILENAME",
      });
      return;
    }

    try {
      const url = `/uploads/${filename}`;
      const [photo] = await db
        .select({ id: activityPhotos.id })
        .from(activityPhotos)
        .where(eq(activityPhotos.url, url))
        .limit(1);

      if (photo) {
        const token = typeof req.query.token === "string" ? req.query.token : undefined;

        if (!verifyFileToken(filename, token)) {
          res.status(403).json({
            success: false,
            message: "Accès refusé : lien invalide ou expiré",
            code: "FORBIDDEN",
          });
          return;
        }
      }

      res.sendFile(filePath, (err) => {
        if (err && !res.headersSent) {
          res.status(404).end();
        }
      });
    } catch (error) {
      console.error("Erreur lors du service d'un fichier uploadé:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Erreur interne lors de l'accès au fichier",
        });
      }
    }
  }
}
