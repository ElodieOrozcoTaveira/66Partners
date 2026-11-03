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
  adminActivityIdParamSchema,
  adminTerritoryQuerySchema,
  adminUserIdParamSchema,
  statsRangeQuerySchema,
} from "../validations/admin.validations.js";
import {
  adminReportIdParamSchema,
  adminReportStatusSchema,
  adminReportsQuerySchema,
} from "../validations/moderation.validations.js";

/*
POST /admin/auth/login
POST /admin/auth/forgot-password
POST /admin/auth/reset-password
GET /admin/territories
GET /admin/stats/overview
GET /admin/stats/user-evolution
GET /admin/stats/territory-breakdown
GET /admin/stats/insights
GET /admin/users
GET /admin/users/:userId
DELETE /admin/users/:userId
GET /admin/activities
GET /admin/activities/:activityId
GET /admin/reports
PATCH /admin/reports/:reportId
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

router.get("/territories", requireAdminAuth, AdminController.listTerritories);

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

router.get(
  "/stats/insights",
  requireAdminAuth,
  validateQuery(adminTerritoryQuerySchema),
  AdminController.insights
);

router.get(
  "/users",
  requireAdminAuth,
  validateQuery(adminTerritoryQuerySchema),
  AdminController.listUsers
);
router.get(
  "/users/:userId",
  requireAdminAuth,
  validateParams(adminUserIdParamSchema),
  AdminController.userDetail
);
router.delete(
  "/users/:userId",
  requireAdminAuth,
  validateParams(adminUserIdParamSchema),
  AdminController.deleteUser
);
router.get(
  "/activities",
  requireAdminAuth,
  validateQuery(adminTerritoryQuerySchema),
  AdminController.listActivities
);
router.get(
  "/activities/:activityId",
  requireAdminAuth,
  validateParams(adminActivityIdParamSchema),
  AdminController.activityDetail
);

router.get(
  "/reports",
  requireAdminAuth,
  validateQuery(adminReportsQuerySchema),
  AdminController.listReports
);
router.patch(
  "/reports/:reportId",
  requireAdminAuth,
  validateParams(adminReportIdParamSchema),
  validateBody(adminReportStatusSchema),
  AdminController.updateReport
);

export default router;
