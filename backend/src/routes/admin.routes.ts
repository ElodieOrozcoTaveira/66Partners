import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { requireAdminAuth } from "../middlewares/adminAuth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation.middleware.js";
import {
  adminForgotPasswordLimiter,
  adminResetPasswordLimiter,
} from "../middlewares/rateLimit.middleware.js";
import {
  adminLoginSchema,
  adminResetPasswordSchema,
  adminUserIdParamSchema,
  statsRangeQuerySchema,
} from "../validations/admin.validations.js";

/*
POST /admin/auth/login
POST /admin/auth/forgot-password
POST /admin/auth/reset-password
GET /admin/stats/overview
GET /admin/stats/user-evolution
GET /admin/stats/territory-breakdown
GET /admin/users
DELETE /admin/users/:userId
GET /admin/activities
*/

const router = Router();

router.post("/auth/login", validateBody(adminLoginSchema), AdminController.login);
router.post("/auth/forgot-password", adminForgotPasswordLimiter, AdminController.forgotPassword);
router.post(
  "/auth/reset-password",
  adminResetPasswordLimiter,
  validateBody(adminResetPasswordSchema),
  AdminController.resetPassword
);

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

router.get("/users", requireAdminAuth, AdminController.listUsers);
router.delete(
  "/users/:userId",
  requireAdminAuth,
  validateParams(adminUserIdParamSchema),
  AdminController.deleteUser
);
router.get("/activities", requireAdminAuth, AdminController.listActivities);

export default router;
