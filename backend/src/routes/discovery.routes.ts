import { Router, type Request } from "express";
import { DiscoveryController } from "../controllers/discovery.controller.js";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { createAuthRateLimiter } from "../middlewares/rateLimit.middleware.js";
import { validate, validateBody } from "../middlewares/validation.middleware.js";
import { mapVisibilitySchema } from "../validations/discovery.validations.js";
import { userIdParamSchema } from "../validations/user.validations.js";

/*
GET /discovery/me — son réglage de visibilité
PUT /discovery/me — apparaître sur la carte / changer de secteur
DELETE /discovery/me — disparaître de la carte
GET /discovery/members — sportifs visibles autour de soi
GET /discovery/members/:id — secteur, âge et activités à venir d'un membre visible
*/

// Limites par compte (requireAuth passe avant) : une IP partagée ne pénalise
// personne, et un compte ne peut ni aspirer les profils ni changer de secteur
// en boucle pour balayer la carte.
const byUser = (req: Request) => (req as AuthenticatedRequest).userId!;

const membersLimiter = createAuthRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  message: "Trop de requêtes. Réessaie plus tard.",
  keyGenerator: byUser,
});

const memberLimiter = createAuthRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 120,
  message: "Trop de requêtes. Réessaie plus tard.",
  keyGenerator: byUser,
});

const sectorLimiter = createAuthRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 10,
  message: "Tu as changé de secteur trop souvent. Réessaie demain.",
  keyGenerator: byUser,
  skipFailedRequests: true,
});

const router = Router();

router.get("/me", requireAuth, DiscoveryController.getVisibility);
router.put("/me", requireAuth, sectorLimiter, validateBody(mapVisibilitySchema), DiscoveryController.enable);
router.delete("/me", requireAuth, DiscoveryController.disable);
router.get("/members", requireAuth, membersLimiter, DiscoveryController.listMembers);
router.get(
  "/members/:id",
  requireAuth,
  memberLimiter,
  validate({ params: userIdParamSchema }),
  DiscoveryController.getMember
);

export default router;
