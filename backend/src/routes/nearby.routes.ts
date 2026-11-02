import { Router } from "express";
import { NearbyController } from "../controllers/nearby.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createAuthRateLimiter } from "../middlewares/rateLimit.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { nearbySchema } from "../validations/nearby.validations.js";

/*
POST /nearby — enregistre sa position approximative, renvoie le nombre de sportifs autour
DELETE /nearby/me — oublie sa position
*/

// Large pour un usage normal (ouverture de la carte, bouton « Me localiser »),
// mais empêche de balayer la carte point par point pour localiser quelqu'un.
const nearbyLimiter = createAuthRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  message: "Trop de requêtes. Réessaie plus tard.",
});

const router = Router();

router.post("/", requireAuth, nearbyLimiter, validateBody(nearbySchema), NearbyController.count);
router.delete("/me", requireAuth, NearbyController.forget);

export default router;
