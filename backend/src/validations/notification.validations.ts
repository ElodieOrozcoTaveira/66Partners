import { z } from "zod";

/**
 * PATCH /notifications/:id/read
 */
export const notificationIdParamSchema = z.object({
  id: z.uuid("Identifiant de notification invalide"),
});
