import { z } from "zod";

export const activityIdParamSchema = z.object({
  activityId: z.uuid("Identifiant d'activité invalide"),
});

export const photoIdParamSchema = z.object({
  photoId: z.uuid("Identifiant de photo invalide"),
});
