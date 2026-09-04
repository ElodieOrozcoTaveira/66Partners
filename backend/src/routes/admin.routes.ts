import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { requireAdminAuth } from "../middlewares/adminAuth.middleware.js";
import { validateBody, validateQuery } from "../middlewares/validation.middleware.js";
import { adminLoginSchema, statsRangeQuerySchema } from "../validations/admin.validations.js";

/*
POST /admin/auth/login
GET /admin/stats/overview
GET /admin/stats/user-evolution
GET /admin/stats/territory-breakdown
*/

const router = Router();

router.post("/auth/login", validateBody(adminLoginSchema), AdminController.login);

router.get(
  "/stats/overview",
  requireAdminAuth,
  validateQuery(statsRangeQuerySchema),
  AdminController.statsOverview
);
router.get(
  "/stats/user-evolution",
  requireAdminAuth,
  validateQuery(statsRangeQuerySchema),
  AdminController.userEvolution
);
router.get(
  "/stats/territory-breakdown",
  requireAdminAuth,
  validateQuery(statsRangeQuerySchema),
  AdminController.territoryBreakdown
);

export default router;
