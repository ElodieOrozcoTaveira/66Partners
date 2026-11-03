import { Router } from "express";
import { ModerationController } from "../controllers/moderation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { reportLimiter } from "../middlewares/rateLimit.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { createReportSchema } from "../validations/moderation.validations.js";

/*
POST /reports — signaler un profil, un message, une activité ou une photo
*/

const router = Router();

router.post("/", requireAuth, reportLimiter, validateBody(createReportSchema), ModerationController.report);

export default router;
