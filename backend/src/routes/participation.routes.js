import { Router } from "express";
import { ParticipationController } from "../controllers/participation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { participationIdParamSchema } from "../validations/partictipation.validations.js";
/*
PUT /participations/:id/accept
PUT /participations/:id/refuse
DELETE /participations/:id
*/
const router = Router();
router.put("/:id/accept", requireAuth, validate({ params: participationIdParamSchema }), ParticipationController.accept);
router.put("/:id/refuse", requireAuth, validate({ params: participationIdParamSchema }), ParticipationController.refuse);
router.delete("/:id", requireAuth, validate({ params: participationIdParamSchema }), ParticipationController.cancel);
export default router;
//# sourceMappingURL=participation.routes.js.map