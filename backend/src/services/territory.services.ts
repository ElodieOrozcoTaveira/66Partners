import "dotenv/config";
import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { territories, userTerritories } from "../db/schema.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE TERRITORY
 *
 * Gère les territoires (déclinaisons de la plateforme Partners) et le
 * rattachement many-to-many des comptes utilisateurs à ces territoires.
 * Un compte utilisateur reste global : ce service ne fait jamais du
 * territoire une propriété unique/obligatoire du compte.
 */

export type Territory = typeof territories.$inferSelect;

export class TerritoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "TerritoryError";
  }
}

export class TerritoryService {
  // Ordonné par ancienneté : sert aussi de règle "premier territoire actif"
  // (fallback visiteur / inscription sans choix) sans aucun code en dur.
  static async listTerritories(): Promise<Territory[]> {
    return db.select().from(territories).orderBy(asc(territories.createdAt));
  }

  static async getByCode(code: string): Promise<Territory> {
    const [territory] = await db
      .select()
      .from(territories)
      .where(eq(territories.code, code))
      .limit(1);

    if (!territory) {
      throw new TerritoryError("Territoire non trouvé", "TERRITORY_NOT_FOUND", 404);
    }

    return territory;
  }

  /**
   * Territoires actuellement proposés aux nouveaux inscrits. Ne concerne que
   * l'onboarding — ne rattache jamais rétroactivement les comptes existants
   * quand un nouveau territoire passe à isActive=true plus tard.
   */
  static async getActiveTerritories(): Promise<Territory[]> {
    return db
      .select()
      .from(territories)
      .where(eq(territories.isActive, true))
      .orderBy(asc(territories.createdAt));
  }

  static async isUserMemberOf(userId: string, territoryId: string): Promise<boolean> {
    const [membership] = await db
      .select({ userId: userTerritories.userId })
      .from(userTerritories)
      .where(
        and(
          eq(userTerritories.userId, userId),
          eq(userTerritories.territoryId, territoryId)
        )
      )
      .limit(1);

    return Boolean(membership);
  }

  /**
   * Tous les territoires auxquels l'utilisateur appartient (pour le
   * sélecteur de territoire actif côté frontend).
   */
  static async listForUser(userId: string): Promise<Territory[]> {
    const rows = await db
      .select({ territory: territories })
      .from(userTerritories)
      .innerJoin(territories, eq(territories.id, userTerritories.territoryId))
      .where(eq(userTerritories.userId, userId));

    return rows.map((row) => row.territory);
  }

  /**
   * Rattache l'utilisateur à un territoire supplémentaire (idempotent, ne
   * modifie jamais isDefault et ne rattache jamais aux autres territoires).
   */
  static async joinTerritory(userId: string, code: string): Promise<Territory> {
    const territory = await TerritoryService.getByCode(code);

    if (!territory.isActive) {
      throw new TerritoryError(
        "Ce territoire n'est pas encore ouvert",
        "TERRITORY_NOT_ACTIVE",
        403
      );
    }

    await db
      .insert(userTerritories)
      .values({ userId, territoryId: territory.id, isDefault: false })
      .onConflictDoNothing({
        target: [userTerritories.userId, userTerritories.territoryId],
      });

    return territory;
  }

  static async getDefaultTerritoryForUser(userId: string): Promise<Territory | null> {
    const [row] = await db
      .select({ territory: territories })
      .from(userTerritories)
      .innerJoin(territories, eq(territories.id, userTerritories.territoryId))
      .where(
        and(eq(userTerritories.userId, userId), eq(userTerritories.isDefault, true))
      )
      .limit(1);

    return row?.territory ?? null;
  }

  /**
   * Territoire choisi à l'inscription. `code` absent (ancien client, PWA en
   * cache) : premier territoire actif. `code` fourni : doit exister ET être
   * actif — un territoire inactif n'est jamais proposé ni accepté.
   */
  static async resolveSignupTerritory(code?: string): Promise<Territory> {
    if (code) {
      const territory = await TerritoryService.getByCode(code);
      if (!territory.isActive) {
        throw new TerritoryError(
          "Ce territoire n'est pas encore ouvert",
          "TERRITORY_NOT_ACTIVE",
          400
        );
      }
      return territory;
    }

    const [first] = await TerritoryService.getActiveTerritories();
    if (!first) {
      throw new TerritoryError("Aucun territoire actif", "NO_ACTIVE_TERRITORY", 500);
    }
    return first;
  }

  /**
   * Rattache un nouvel utilisateur à UN seul territoire, son territoire
   * principal (isDefault). Appelée uniquement à l'inscription — jamais pour
   * migrer des comptes existants, jamais vers d'autres territoires.
   */
  static async attachUserToTerritory(userId: string, territoryId: string): Promise<void> {
    await db
      .insert(userTerritories)
      .values({ userId, territoryId, isDefault: true })
      .onConflictDoNothing({
        target: [userTerritories.userId, userTerritories.territoryId],
      });
  }

  /**
   * Identité (marque + nom) utilisée dans les emails/notifications d'un
   * utilisateur : son territoire par défaut, sinon le premier territoire
   * actif. Jamais de valeur en dur : sans aucun territoire, marque neutre.
   */
  static async getBrandForUser(userId: string): Promise<TerritoryBrand> {
    const territory = await TerritoryService.getDefaultTerritoryForUser(userId);
    return territory ? toBrand(territory) : TerritoryService.getDefaultBrand();
  }

  /** Marque du premier territoire actif (emails sans utilisateur, ex. admin). */
  static async getDefaultBrand(): Promise<TerritoryBrand> {
    const [first] = await TerritoryService.getActiveTerritories();
    return first ? toBrand(first) : { brandName: "Partners", territoryName: "" };
  }
}

export interface TerritoryBrand {
  brandName: string;
  territoryName: string;
}

function toBrand(territory: Territory): TerritoryBrand {
  return { brandName: territory.brandName, territoryName: territory.name };
}
