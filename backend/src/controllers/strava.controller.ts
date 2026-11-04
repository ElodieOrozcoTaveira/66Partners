import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { StravaError, StravaService } from "../services/strava.services.js";

function sendError(res: Response, error: unknown, context: string): void {
  if (error instanceof StravaError) {
    res.status(error.status).json({ success: false, code: error.code, message: error.message });
    return;
  }
  console.error(`Erreur Strava (${context}):`, error);
  res.status(500).json({ success: false, message: "Erreur interne" });
}

function frontendUrl(): string {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value.length <= 2048 ? value : undefined;
}

export class StravaController {
  /** GET /api/strava/status */
  static async status(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const status = await StravaService.getStatus(req.userId!);
      res.status(200).json({ success: true, ...status });
    } catch (error) {
      sendError(res, error, "status");
    }
  }

  /** GET /api/strava/users/:id/status : seulement « relié ou non », jamais de donnée Strava. */
  static async memberStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { linked } = await StravaService.getStatus(req.params.id as string);
      res.status(200).json({ success: true, linked });
    } catch (error) {
      sendError(res, error, "member status");
    }
  }

  /** GET /api/strava/connect : renvoie l'URL d'autorisation Strava. */
  static connect(req: AuthenticatedRequest, res: Response): void {
    try {
      res.status(200).json({ success: true, url: StravaService.getAuthorizeUrl(req.userId!) });
    } catch (error) {
      sendError(res, error, "connect");
    }
  }

  /**
   * GET /api/strava/callback : appelée par Strava (navigateur du membre),
   * sans jeton 66Partners ; l'identité vient du state signé.
   */
  static async callback(req: Request, res: Response): Promise<void> {
    const target = new URL("/profile", frontendUrl());
    try {
      await StravaService.handleCallback({
        code: queryString(req.query.code),
        state: queryString(req.query.state),
        scope: queryString(req.query.scope),
        error: queryString(req.query.error),
      });
      target.searchParams.set("strava", "connected");
    } catch (error) {
      if (!(error instanceof StravaError)) console.error("Erreur Strava (callback):", error);
      target.searchParams.set("strava", "error");
      target.searchParams.set("reason", error instanceof StravaError ? error.code : "INTERNAL");
    }
    res.redirect(302, target.toString());
  }

  /** DELETE /api/strava */
  static async disconnect(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await StravaService.disconnect(req.userId!);
      res.status(204).send();
    } catch (error) {
      sendError(res, error, "disconnect");
    }
  }

  /** GET /api/strava/activities/:id/validation */
  static async meetingValidation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await StravaService.getMeetingValidation(req.userId!, req.params.id as string);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      sendError(res, error, "validation");
    }
  }

  /** POST /api/strava/activities/:id/validate : « Valider notre rencontre ». */
  static async validateMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await StravaService.validateMeeting(req.userId!, req.params.id as string);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      sendError(res, error, "validate");
    }
  }
}
