import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { availabilities } from "../db/schema.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE AVAILABILITY
 *
 * Gère les créneaux de disponibilité récurrents affichés sur le profil
 * ("Lundi 18h-20h", ...).
 */

export type Availability = typeof availabilities.$inferSelect;

export class AvailabilityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AvailabilityError";
  }
}

const WEEKDAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export class AvailabilityService {
  static async listForUser(userId: string): Promise<Availability[]> {
    const rows = await db.select().from(availabilities).where(eq(availabilities.userId, userId));

    return rows.sort((a, b) => {
      const dayDiff = WEEKDAY_ORDER.indexOf(a.weekday) - WEEKDAY_ORDER.indexOf(b.weekday);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  static async create(
    userId: string,
    data: { weekday: Availability["weekday"]; startTime: string; endTime: string }
  ): Promise<Availability> {
    const [row] = await db
      .insert(availabilities)
      .values({ userId, ...data })
      .returning();

    if (!row) {
      throw new AvailabilityError(
        "Erreur lors de la création du créneau",
        "AVAILABILITY_CREATE_FAILED",
        500
      );
    }

    return row;
  }

  static async remove(userId: string, availabilityId: string): Promise<void> {
    const [existing] = await db
      .select({ id: availabilities.id })
      .from(availabilities)
      .where(and(eq(availabilities.id, availabilityId), eq(availabilities.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new AvailabilityError("Créneau non trouvé", "AVAILABILITY_NOT_FOUND", 404);
    }

    await db.delete(availabilities).where(eq(availabilities.id, availabilityId));
  }
}
