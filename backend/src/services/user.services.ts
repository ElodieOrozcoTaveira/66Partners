import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { sportLevelEnum, sports, userSports, users } from "../db/schema.js";

const db = drizzle(process.env.DATABASE_URL!);

export type SportLevel = (typeof sportLevelEnum.enumValues)[number];

export interface UserSportEntry {
  sportId: string;
  sportName: string;
  level: SportLevel;
}

/**
 * SERVICE UTILISATEUR
 *
 * Contient la logique métier liée à la gestion du profil utilisateur
 * (lecture, mise à jour, suppression). L'inscription/connexion reste
 * gérée par AuthService.
 */

export interface UserProfile {
  id: string;
  email: string;
  pseudo: string;
  city: string | null;
  bio: string | null;
  avatar: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpdateInput {
  pseudo?: string;
  city?: string | null;
  bio?: string | null;
  avatar?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

// Erreurs métier personnalisées
export class UserError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "UserError";
  }
}

function toProfile(user: typeof users.$inferSelect): UserProfile {
  return {
    id: user.id,
    email: user.email,
    pseudo: user.pseudo,
    city: user.city,
    bio: user.bio,
    avatar: user.avatar,
    latitude: user.latitude,
    longitude: user.longitude,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UserService {
  /**
   * Récupération du profil d'un utilisateur par son ID
   */
  static async getUserById(userId: string): Promise<UserProfile | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    return toProfile(user);
  }

  /**
   * Mise à jour du profil d'un utilisateur
   */
  static async updateUser(
    userId: string,
    data: UserUpdateInput
  ): Promise<UserProfile> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new UserError("Utilisateur non trouvé", "USER_NOT_FOUND", 404);
    }

    return toProfile(updatedUser);
  }

  /**
   * Suppression d'un utilisateur
   */
  static async deleteUser(userId: string): Promise<void> {
    const deletedRows = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (deletedRows.length === 0) {
      throw new UserError("Utilisateur non trouvé", "USER_NOT_FOUND", 404);
    }
  }

  /**
   * Liste des sports pratiqués par un utilisateur, avec leur niveau
   */
  static async listUserSports(userId: string): Promise<UserSportEntry[]> {
    const rows = await db
      .select({
        sportId: userSports.sportId,
        sportName: sports.name,
        level: userSports.level,
      })
      .from(userSports)
      .innerJoin(sports, eq(userSports.sportId, sports.id))
      .where(eq(userSports.userId, userId));

    return rows;
  }

  /**
   * Ajout ou mise à jour du niveau d'un sport pratiqué par l'utilisateur
   */
  static async setUserSport(
    userId: string,
    sportId: string,
    level: SportLevel
  ): Promise<UserSportEntry> {
    const [sport] = await db
      .select({ id: sports.id, name: sports.name })
      .from(sports)
      .where(eq(sports.id, sportId))
      .limit(1);

    if (!sport) {
      throw new UserError("Sport non trouvé", "SPORT_NOT_FOUND", 404);
    }

    await db
      .insert(userSports)
      .values({ userId, sportId, level })
      .onConflictDoUpdate({
        target: [userSports.userId, userSports.sportId],
        set: { level },
      });

    return { sportId: sport.id, sportName: sport.name, level };
  }

  /**
   * Retrait d'un sport pratiqué par l'utilisateur
   */
  static async removeUserSport(userId: string, sportId: string): Promise<void> {
    const deletedRows = await db
      .delete(userSports)
      .where(and(eq(userSports.userId, userId), eq(userSports.sportId, sportId)))
      .returning({ sportId: userSports.sportId });

    if (deletedRows.length === 0) {
      throw new UserError(
        "Ce sport n'est pas associé à cet utilisateur",
        "USER_SPORT_NOT_FOUND",
        404
      );
    }
  }
}
