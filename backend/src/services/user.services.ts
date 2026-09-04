import "dotenv/config";
import { and, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activities, activityPhotos, sportLevelEnum, sports, userSports, users } from "../db/schema.js";
import { deleteUploadedFileIfUnreferenced } from "../utils/uploadedFiles.js";

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
  headline: string | null;
  lookingFor: string | null;
  openTo: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Profil visible par un AUTRE utilisateur (GET /users/:id).
 * Ne doit jamais contenir l'email ni la géolocalisation exacte du
 * titulaire du compte — voir audit RGPD, chantier F-01.
 */
export interface PublicUserProfile {
  id: string;
  pseudo: string;
  city: string | null;
  headline: string | null;
  lookingFor: string | null;
  openTo: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpdateInput {
  pseudo?: string;
  city?: string | null;
  headline?: string | null;
  lookingFor?: string | null;
  openTo?: string | null;
  avatar?: string | null;
  coverPhoto?: string | null;
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
    headline: user.headline,
    lookingFor: user.lookingFor,
    openTo: user.openTo,
    avatar: user.avatar,
    coverPhoto: user.coverPhoto,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toPublicProfile(user: typeof users.$inferSelect): PublicUserProfile {
  return {
    id: user.id,
    pseudo: user.pseudo,
    city: user.city,
    headline: user.headline,
    lookingFor: user.lookingFor,
    openTo: user.openTo,
    avatar: user.avatar,
    coverPhoto: user.coverPhoto,
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
   * Récupération du profil PUBLIC d'un utilisateur par son ID, tel que
   * visible par un autre utilisateur (sans email ni géolocalisation).
   */
  static async getPublicUserById(userId: string): Promise<PublicUserProfile | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    return toPublicProfile(user);
  }

  /**
   * Mise à jour du profil d'un utilisateur
   */
  static async updateUser(
    userId: string,
    data: UserUpdateInput
  ): Promise<UserProfile> {
    const [previousUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new UserError("Utilisateur non trouvé", "USER_NOT_FOUND", 404);
    }

    // Remplacement d'avatar/couverture : l'ancien fichier n'est plus utile,
    // on le nettoie du disque (sauf s'il reste référencé ailleurs) —
    // cf. chantier RGPD F-03.
    if (previousUser) {
      if (data.avatar !== undefined && previousUser.avatar !== updatedUser.avatar) {
        await deleteUploadedFileIfUnreferenced(previousUser.avatar);
      }
      if (data.coverPhoto !== undefined && previousUser.coverPhoto !== updatedUser.coverPhoto) {
        await deleteUploadedFileIfUnreferenced(previousUser.coverPhoto);
      }
    }

    return toProfile(updatedUser);
  }

  /**
   * Suppression d'un utilisateur
   */
  static async deleteUser(userId: string): Promise<void> {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      throw new UserError("Utilisateur non trouvé", "USER_NOT_FOUND", 404);
    }

    // Photos qui vont disparaître en cascade (uploadées par lui, ou
    // appartenant à une activité qu'il a créée) : à capturer AVANT la
    // suppression, sans quoi les lignes ne seront plus interrogeables —
    // cf. chantier RGPD F-04.
    const relatedPhotos = await db
      .selectDistinct({ url: activityPhotos.url })
      .from(activityPhotos)
      .leftJoin(activities, eq(activities.id, activityPhotos.activityId))
      .where(
        or(eq(activityPhotos.uploaderId, userId), eq(activities.creatorId, userId))
      );

    await db.delete(users).where(eq(users.id, userId));

    await deleteUploadedFileIfUnreferenced(existingUser.avatar);
    await deleteUploadedFileIfUnreferenced(existingUser.coverPhoto);
    await Promise.all(
      relatedPhotos.map((photo) => deleteUploadedFileIfUnreferenced(photo.url))
    );
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
