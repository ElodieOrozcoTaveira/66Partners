import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { notificationIdParamSchema } from "../validations/notification.validations.js";

/*
GET /notifications
PATCH /notifications/read-all
PATCH /notifications/:id/read
*/

const router = Router();

router.get("/", requireAuth, NotificationController.list);
router.patch("/read-all", requireAuth, NotificationController.markAllAsRead);
router.patch(
  "/:id/read",
  requireAuth,
  validate({ params: notificationIdParamSchema }),
  NotificationController.markAsRead
);

export default router;
