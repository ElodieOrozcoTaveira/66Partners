import { Router } from "express";
import { StravaController } from "../controllers/strava.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createAuthRateLimiter } from "../middlewares/rateLimit.middleware.js";
import { idParamSchema, validateParams } from "../middlewares/validation.middleware.js";

/*
GET    /strava/status                   — compte Strava relié ou non
GET    /strava/connect                  — URL d'autorisation Strava
GET    /strava/callback                 — retour OAuth de Strava (public, state signé)
DELETE /strava                          — délie le compte Strava
POST   /strava/activities/:id/validate  — « Valider notre rencontre »
*/

const stravaLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Trop de demandes vers Strava. Réessaie plus tard.",
});

const router = Router();

router.get("/status", requireAuth, StravaController.status);
router.get("/connect", requireAuth, stravaLimiter, StravaController.connect);
router.get("/callback", stravaLimiter, StravaController.callback);
router.delete("/", requireAuth, StravaController.disconnect);
router.post(
  "/activities/:id/validate",
  requireAuth,
  stravaLimiter,
  validateParams(idParamSchema),
  StravaController.validateMeeting,
);

export default router;
