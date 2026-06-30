import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { sports } from "../db/schema.js";
import { isUniqueViolation } from "../utils/db-errors.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE SPORT
 *
 * Contient la logique métier liée à la liste de référence des sports.
 */

export type Sport = typeof sports.$inferSelect;

export interface SportCreateInput {
  name: string;
}

export interface SportUpdateInput {
  name?: string;
}

// Erreurs métier personnalisées
export class SportError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "SportError";
  }
}

export class SportService {
  /**
   * Liste de tous les sports
   */
  static async listSports(): Promise<Sport[]> {
    return db.select().from(sports);
  }

  /**
   * Récupération d'un sport par son ID
   */
  static async getSportById(sportId: string): Promise<Sport | null> {
    const [sport] = await db
      .select()
      .from(sports)
      .where(eq(sports.id, sportId))
      .limit(1);

    return sport ?? null;
  }

  /**
   * Création d'un nouveau sport
   */
  static async createSport(data: SportCreateInput): Promise<Sport> {
    const [existingSport] = await db
      .select({ id: sports.id })
      .from(sports)
      .where(eq(sports.name, data.name))
      .limit(1);

    if (existingSport) {
      throw new SportError(
        "Un sport avec ce nom existe déjà",
        "SPORT_ALREADY_EXISTS",
        409
      );
    }

    let newSport: Sport | undefined;
    try {
      [newSport] = await db.insert(sports).values(data).returning();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new SportError(
          "Un sport avec ce nom existe déjà",
          "SPORT_ALREADY_EXISTS",
          409
        );
      }
      throw error;
    }

    if (!newSport) {
      throw new SportError(
        "Erreur lors de la création du sport",
        "SPORT_CREATION_FAILED",
        500
      );
    }

    return newSport;
  }

  /**
   * Mise à jour d'un sport
   */
  static async updateSport(
    sportId: string,
    data: SportUpdateInput
  ): Promise<Sport> {
    const [updatedSport] = await db
      .update(sports)
      .set(data)
      .where(eq(sports.id, sportId))
      .returning();

    if (!updatedSport) {
      throw new SportError("Sport non trouvé", "SPORT_NOT_FOUND", 404);
    }

    return updatedSport;
  }

  /**
   * Suppression d'un sport
   */
  static async deleteSport(sportId: string): Promise<void> {
    const deletedRows = await db
      .delete(sports)
      .where(eq(sports.id, sportId))
      .returning({ id: sports.id });

    if (deletedRows.length === 0) {
      throw new SportError("Sport non trouvé", "SPORT_NOT_FOUND", 404);
    }
  }
}
