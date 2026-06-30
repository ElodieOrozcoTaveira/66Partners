import { Router } from "express";
import { SportController } from "../controllers/sport.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createSportSchema,
  sportIdParamSchema,
  updateSportSchema,
} from "../validations/sport.validations.js";

/*
GET /sports
GET /sports/:id
POST /sports
PATCH /sports/:id
DELETE /sports/:id
*/

const router = Router();

router.get("/", SportController.list);
router.get("/:id", validate({ params: sportIdParamSchema }), SportController.getById);
router.post(
  "/",
  requireAuth,
  validate({ body: createSportSchema }),
  SportController.create
);
router.patch(
  "/:id",
  requireAuth,
  validate({ params: sportIdParamSchema, body: updateSportSchema }),
  SportController.update
);
router.delete(
  "/:id",
  requireAuth,
  validate({ params: sportIdParamSchema }),
  SportController.remove
);

export default router;
