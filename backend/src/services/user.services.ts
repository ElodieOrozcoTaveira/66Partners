import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { sportLevelEnum, sports, userSports, users } from "../db/schema.js";
import { deleteUploadedFileIfUnreferenced } from "../utils/uploadedFiles.js";
import { TerritoryService } from "./territory.services.js";

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
 * Territoire d'inscription / principal (user_territories.isDefault = true)
 * exposé sur le profil public — jamais la liste complète des territoires de
 * l'utilisateur, jamais lié au territoire actif du visiteur qui consulte.
 */
export interface PublicUserTerritory {
  code: string;
  name: string;
  brandName: string;
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
  // null si le compte n'a pas (ou plus) de territoire principal — jamais un
  // territoire inventé/choisi arbitrairement (cf. chantier territoire d'inscription).
  territory: PublicUserTerritory | null;
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

function toPublicProfile(
  user: typeof users.$inferSelect,
  territory: PublicUserTerritory | null
): PublicUserProfile {
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
    territory,
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
   *
   * Le territoire exposé est toujours le territoire d'inscription/principal
   * (user_territories.isDefault = true), jamais le territoire actuellement
   * actif du visiteur qui consulte ce profil ni la liste complète des
   * territoires du compte — cf. TerritoryService.getDefaultTerritoryForUser,
   * déjà la source de vérité utilisée pour le branding des emails.
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

    // Un territoire par défaut manquant/orphelin ne doit jamais faire
    // échouer l'affichage du profil (cf. cas particuliers du chantier) :
    // getDefaultTerritoryForUser renvoie proprement null via sa jointure,
    // jamais une exception.
    const defaultTerritory = await TerritoryService.getDefaultTerritoryForUser(userId);
    const territory: PublicUserTerritory | null = defaultTerritory
      ? {
          code: defaultTerritory.code,
          name: defaultTerritory.name,
          brandName: defaultTerritory.brandName,
        }
      : null;

    return toPublicProfile(user, territory);
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

  // Suppression d'un compte : voir AccountDeletionService.deleteAccount,
  // point d'entrée unique partagé avec le parcours admin (cf. chantier
  // suppression de compte — éviter toute divergence entre les deux).

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
