import "dotenv/config";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activities, participations, sportFavorites, sports } from "../db/schema.js";
import { isUniqueViolation } from "../utils/db-errors.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE SPORT
 *
 * Contient la logique métier liée à la liste de référence des sports.
 */

export type Sport = typeof sports.$inferSelect;

export type SportWithStats = Sport & {
  activitiesCount: number;
  participantsCount: number;
  favoritesCount: number;
};

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
   * Liste de tous les sports, avec le nombre d'activités et de participants
   * réels associés à chacun (calculé à la volée, pas stocké).
   */
  static async listSports(): Promise<SportWithStats[]> {
    const rows = await db
      .select({
        id: sports.id,
        name: sports.name,
        createdAt: sports.createdAt,
        activitiesCount: sql<number>`count(distinct ${activities.id})`,
        participantsCount: sql<number>`count(distinct ${participations.id})`,
        favoritesCount: sql<number>`count(distinct ${sportFavorites.userId})`,
      })
      .from(sports)
      .leftJoin(activities, eq(activities.sportId, sports.id))
      .leftJoin(participations, eq(participations.activityId, activities.id))
      .leftJoin(sportFavorites, eq(sportFavorites.sportId, sports.id))
      .groupBy(sports.id)
      .orderBy(sports.name);

    return rows.map((row) => ({
      ...row,
      activitiesCount: Number(row.activitiesCount),
      participantsCount: Number(row.participantsCount),
      favoritesCount: Number(row.favoritesCount),
    }));
  }

  /**
   * Ajoute ou retire un sport des favoris de l'utilisateur (toggle).
   * Retourne le nouvel état (favori ou non).
   */
  static async toggleFavorite(userId: string, sportId: string): Promise<boolean> {
    const [sport] = await db
      .select({ id: sports.id })
      .from(sports)
      .where(eq(sports.id, sportId))
      .limit(1);

    if (!sport) {
      throw new SportError("Sport non trouvé", "SPORT_NOT_FOUND", 404);
    }

    const deletedRows = await db
      .delete(sportFavorites)
      .where(and(eq(sportFavorites.userId, userId), eq(sportFavorites.sportId, sportId)))
      .returning({ sportId: sportFavorites.sportId });

    if (deletedRows.length > 0) {
      return false;
    }

    await db.insert(sportFavorites).values({ userId, sportId });
    return true;
  }

  /**
   * Liste des identifiants de sports mis en favori par l'utilisateur.
   */
  static async listFavoriteSportIds(userId: string): Promise<string[]> {
    const rows = await db
      .select({ sportId: sportFavorites.sportId })
      .from(sportFavorites)
      .where(eq(sportFavorites.userId, userId));

    return rows.map((row) => row.sportId);
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
