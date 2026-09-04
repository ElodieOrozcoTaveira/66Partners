import { Router } from "express";
import { PushController } from "../controllers/push.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { pushSubscribeSchema, pushUnsubscribeSchema } from "../validations/push.validations.js";

/*
GET  /push/vapid-public-key
POST /push/subscribe
POST /push/unsubscribe
*/

const router = Router();

router.get("/vapid-public-key", PushController.getVapidPublicKey);
router.post("/subscribe", requireAuth, validateBody(pushSubscribeSchema), PushController.subscribe);
router.post(
  "/unsubscribe",
  requireAuth,
  validateBody(pushUnsubscribeSchema),
  PushController.unsubscribe
);

export default router;
