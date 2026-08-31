import "dotenv/config";
import { and, eq } from "drizzle-orm";
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
  static async listTerritories(): Promise<Territory[]> {
    return db.select().from(territories);
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
    return db.select().from(territories).where(eq(territories.isActive, true));
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
   * Rattache un nouvel utilisateur aux territoires actuellement actifs, avec
   * le premier comme territoire par défaut. Appelée uniquement à
   * l'inscription (onboarding) — jamais pour migrer des comptes existants.
   */
  static async attachUserToActiveTerritories(userId: string): Promise<void> {
    const activeTerritories = await TerritoryService.getActiveTerritories();

    for (const [index, territory] of activeTerritories.entries()) {
      await db
        .insert(userTerritories)
        .values({ userId, territoryId: territory.id, isDefault: index === 0 })
        .onConflictDoNothing({
          target: [userTerritories.userId, userTerritories.territoryId],
        });
    }
  }
}
