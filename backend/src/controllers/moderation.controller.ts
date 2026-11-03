import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { BlockError, BlockService } from "../services/block.services.js";
import { ReportError, ReportService, type CreateReportInput } from "../services/report.services.js";

/**
 * CONTRÔLEUR MODÉRATION (membres)
 *
 * Signalements et blocages. L'espace admin a ses propres routes
 * (cf. AdminController.listReports / updateReport).
 */
function handleError(error: unknown, res: Response, label: string): void {
  if (error instanceof ReportError || error instanceof BlockError) {
    res.status(error.statusCode).json({ success: false, message: error.message, code: error.code });
    return;
  }
  console.error(`Erreur ${label}:`, error);
  res.status(500).json({ success: false, message: `Erreur interne (${label})` });
}

export class ModerationController {
  /** POST /api/reports */
  static async report(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = await ReportService.create(req.userId!, req.body as CreateReportInput);
      res.status(201).json({ success: true, reportId: id, message: "Merci, ton signalement a bien été envoyé." });
    } catch (error) {
      handleError(error, res, "signalement");
    }
  }

  /** GET /api/users/me/blocks */
  static async listBlocks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const blocks = await BlockService.listBlockedBy(req.userId!);
      res.status(200).json({ success: true, blocks });
    } catch (error) {
      handleError(error, res, "liste des blocages");
    }
  }

  /** POST /api/users/:id/block */
  static async block(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await BlockService.block(req.userId!, req.params.id as string);
      res.status(200).json({ success: true, message: "Membre bloqué" });
    } catch (error) {
      handleError(error, res, "blocage");
    }
  }

  /** DELETE /api/users/:id/block */
  static async unblock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await BlockService.unblock(req.userId!, req.params.id as string);
      res.status(200).json({ success: true, message: "Membre débloqué" });
    } catch (error) {
      handleError(error, res, "déblocage");
    }
  }
}
