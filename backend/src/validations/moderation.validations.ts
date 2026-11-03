import { z } from "zod";

export const createReportSchema = z.object({
  context: z.enum(["PROFILE", "MESSAGE", "ACTIVITY", "PHOTO"], "Type de contenu invalide"),
  targetId: z.uuid("Identifiant du contenu invalide"),
  reason: z.enum(["HARASSMENT", "INAPPROPRIATE", "SPAM", "DANGEROUS", "OTHER"], "Motif invalide"),
  details: z.string().trim().max(1000, "1000 caractères maximum").optional(),
});

export const adminReportsQuerySchema = z.object({
  status: z.enum(["OPEN", "RESOLVED"]).optional(),
});

export const adminReportIdParamSchema = z.object({
  reportId: z.uuid("Identifiant de signalement invalide"),
});

export const adminReportStatusSchema = z.object({
  status: z.enum(["OPEN", "RESOLVED"], "Statut invalide"),
});
