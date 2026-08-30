import "dotenv/config";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activities, activityPhotos, participations, users } from "../db/schema.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE PHOTOS D'ACTIVITÉ
 *
 * Gère les photos souvenirs ajoutées par les participants une fois
 * l'activité passée. Réservé au créateur et aux participants acceptés.
 */

export type ActivityPhoto = typeof activityPhotos.$inferSelect;
export type ActivityPhotoWithAuthor = ActivityPhoto & {
  authorPseudo: string;
  authorAvatar: string | null;
};

export class ActivityPhotoError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ActivityPhotoError";
  }
}

async function assertUserCanAccessActivity(userId: string, activityId: string) {
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);

  if (!activity) {
    throw new ActivityPhotoError("Activité non trouvée", "ACTIVITY_NOT_FOUND", 404);
  }

  if (activity.creatorId !== userId) {
    const [participation] = await db
      .select()
      .from(participations)
      .where(
        and(
          eq(participations.activityId, activityId),
          eq(participations.userId, userId),
          eq(participations.status, "ACCEPTED")
        )
      )
      .limit(1);

    if (!participation) {
      throw new ActivityPhotoError(
        "Accès refusé : vous n'êtes pas participant de cette activité",
        "FORBIDDEN",
        403
      );
    }
  }

  return activity;
}

function assertActivityHasEnded(activity: { startDate: Date }) {
  if (new Date(activity.startDate).getTime() > Date.now()) {
    throw new ActivityPhotoError(
      "Les photos ne sont disponibles qu'une fois l'activité terminée",
      "ACTIVITY_NOT_ENDED",
      403
    );
  }
}

export class ActivityPhotoService {
  static async listPhotos(
    activityId: string,
    userId: string
  ): Promise<ActivityPhotoWithAuthor[]> {
    await assertUserCanAccessActivity(userId, activityId);

    return db
      .select({
        id: activityPhotos.id,
        activityId: activityPhotos.activityId,
        uploaderId: activityPhotos.uploaderId,
        url: activityPhotos.url,
        createdAt: activityPhotos.createdAt,
        authorPseudo: users.pseudo,
        authorAvatar: users.avatar,
      })
      .from(activityPhotos)
      .innerJoin(users, eq(users.id, activityPhotos.uploaderId))
      .where(eq(activityPhotos.activityId, activityId))
      .orderBy(desc(activityPhotos.createdAt));
  }

  static async addPhoto(
    activityId: string,
    userId: string,
    url: string
  ): Promise<ActivityPhoto> {
    const activity = await assertUserCanAccessActivity(userId, activityId);
    assertActivityHasEnded(activity);

    const [created] = await db
      .insert(activityPhotos)
      .values({ activityId, uploaderId: userId, url })
      .returning();

    if (!created) {
      throw new ActivityPhotoError(
        "Erreur lors de l'ajout de la photo",
        "PHOTO_CREATION_FAILED",
        500
      );
    }

    return created;
  }

  static async deletePhoto(photoId: string, userId: string): Promise<void> {
    const [photo] = await db
      .select()
      .from(activityPhotos)
      .where(eq(activityPhotos.id, photoId))
      .limit(1);

    if (!photo) {
      throw new ActivityPhotoError("Photo non trouvée", "PHOTO_NOT_FOUND", 404);
    }

    if (photo.uploaderId !== userId) {
      throw new ActivityPhotoError(
        "Seul l'auteur de la photo peut la supprimer",
        "FORBIDDEN",
        403
      );
    }

    await db.delete(activityPhotos).where(eq(activityPhotos.id, photoId));
  }
}
