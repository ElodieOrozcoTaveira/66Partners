import "dotenv/config";
import { and, eq, gte, lt, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { userLocations } from "../db/schema.js";

const db = drizzle(process.env.DATABASE_URL!);

/** Rayon fixe (non choisi par l'appelant, pour limiter la triangulation). */
export const NEARBY_RADIUS_KM = 15;
/** Au-delà, un membre qui n'a plus ouvert la carte n'est plus compté. */
export const NEARBY_FRESHNESS_DAYS = 30;

const KM_PER_LATITUDE_DEGREE = 111.32;

/** ~1 km : on n'enregistre jamais la position exacte. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Sportifs autour de soi. La position est arrondie avant tout usage (stockage
 * et calcul) ; seule une quantité de membres sort de ce service.
 */
export const NearbyService = {
  /**
   * Enregistre (ou remplace) la position approximative du membre, puis compte
   * les autres membres vus récemment dans un rayon de NEARBY_RADIUS_KM.
   */
  async updateAndCount(userId: string, latitude: number, longitude: number) {
    const lat = roundCoordinate(latitude);
    const lon = roundCoordinate(longitude);

    await db
      .insert(userLocations)
      .values({ userId, latitude: lat, longitude: lon, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userLocations.userId,
        set: { latitude: lat, longitude: lon, updatedAt: new Date() },
      });

    const since = new Date(Date.now() - NEARBY_FRESHNESS_DAYS * 24 * 60 * 60 * 1000);
    // Les positions périmées ne servent plus : on les supprime au passage.
    await db.delete(userLocations).where(lt(userLocations.updatedAt, since));
    // Pré-filtre en latitude (indexé), puis distance exacte (haversine).
    const latDelta = NEARBY_RADIUS_KM / KM_PER_LATITUDE_DEGREE;
    const distanceKm = sql`2 * 6371 * asin(sqrt(
      power(sin(radians(${userLocations.latitude} - ${lat}) / 2), 2)
      + cos(radians(${lat})) * cos(radians(${userLocations.latitude}))
      * power(sin(radians(${userLocations.longitude} - ${lon}) / 2), 2)
    ))`;

    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userLocations)
      .where(
        and(
          ne(userLocations.userId, userId),
          gte(userLocations.updatedAt, since),
          sql`${userLocations.latitude} between ${lat - latDelta} and ${lat + latDelta}`,
          sql`${distanceKm} <= ${NEARBY_RADIUS_KM}`
        )
      );

    return { count: row?.count ?? 0, radiusKm: NEARBY_RADIUS_KM };
  },

  /** Oublie la position du membre (il n'est plus compté autour des autres). */
  async forget(userId: string) {
    await db.delete(userLocations).where(eq(userLocations.userId, userId));
  },
};
