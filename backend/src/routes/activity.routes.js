import { Router } from "express";
import { ActivityController } from "../controllers/activity.controller.js";
import { ParticipationController } from "../controllers/participation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { activityFiltersSchema, activityIdParamSchema, createActivitySchema, updateActivitySchema, } from "../validations/activity.validations.js";
/*
GET /activities
GET /activities/:id
POST /activities
PATCH /activities/:id
DELETE /activities/:id
POST /activities/:id/join
*/
const router = Router();
router.get("/", validate({ query: activityFiltersSchema }), ActivityController.list);
router.get("/:id", validate({ params: activityIdParamSchema }), ActivityController.getById);
router.post("/", requireAuth, validate({ body: createActivitySchema }), ActivityController.create);
router.patch("/:id", requireAuth, validate({ params: activityIdParamSchema, body: updateActivitySchema }), ActivityController.update);
router.delete("/:id", requireAuth, validate({ params: activityIdParamSchema }), ActivityController.remove);
router.post("/:id/join", requireAuth, validate({ params: activityIdParamSchema }), ParticipationController.join);
export default router;
//# sourceMappingURL=activity.routes.js.map