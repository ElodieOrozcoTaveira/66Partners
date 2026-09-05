import { Router } from "express";
import { ActivityController } from "../controllers/activity.controller.js";
import { ParticipationController } from "../controllers/participation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  activityFiltersSchema,
  activityIdParamSchema,
  createActivitySchema,
  updateActivitySchema,
} from "../validations/activity.validations.js";

/*
GET /activities
GET /activities/:id
POST /activities
PATCH /activities/:id
DELETE /activities/:id
POST /activities/:id/join
GET /activities/:id/my-participation
GET /activities/:id/participations
*/

const router = Router();

router.get("/", validate({ query: activityFiltersSchema }), ActivityController.list);
router.get(
  "/:id",
  requireAuth,
  validate({ params: activityIdParamSchema }),
  ActivityController.getById
);
router.post(
  "/",
  requireAuth,
  validate({ body: createActivitySchema }),
  ActivityController.create
);
router.patch(
  "/:id",
  requireAuth,
  validate({ params: activityIdParamSchema, body: updateActivitySchema }),
  ActivityController.update
);
router.delete(
  "/:id",
  requireAuth,
  validate({ params: activityIdParamSchema }),
  ActivityController.remove
);
router.post(
  "/:id/join",
  requireAuth,
  validate({ params: activityIdParamSchema }),
  ParticipationController.join
);
router.get(
  "/:id/my-participation",
  requireAuth,
  validate({ params: activityIdParamSchema }),
  ParticipationController.getMine
);
router.get(
  "/:id/participations",
  requireAuth,
  validate({ params: activityIdParamSchema }),
  ParticipationController.listForActivity
);

export default router;
