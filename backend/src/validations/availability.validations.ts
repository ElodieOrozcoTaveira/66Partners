import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const weekdaySchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

/**
 * POST /users/me/availabilities
 */
export const createAvailabilitySchema = z
  .object({
    weekday: weekdaySchema,
    startTime: z.string().regex(timeRegex, "Heure de début invalide (HH:mm)"),
    endTime: z.string().regex(timeRegex, "Heure de fin invalide (HH:mm)"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["endTime"],
  });

export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;

/**
 * DELETE /users/me/availabilities/:availabilityId
 */
export const availabilityIdParamSchema = z.object({
  availabilityId: z.uuid("ID doit être un UUID valide"),
});
