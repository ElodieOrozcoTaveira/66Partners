import { Router } from "express";
import { SportController } from "../controllers/sport.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createSportSchema,
  sportIdParamSchema,
  updateSportSchema,
} from "../validations/sport.validations.js";
import { userIdParamSchema } from "../validations/user.validations.js";

/*
GET /sports
GET /sports/favorites/mine
GET /sports/favorites/:userId
GET /sports/:id
POST /sports
POST /sports/:id/favorite
PATCH /sports/:id
DELETE /sports/:id
*/

const router = Router();

router.get("/", SportController.list);
router.get("/favorites/mine", requireAuth, SportController.listMyFavorites);
router.get(
  "/favorites/:id",
  requireAuth,
  validate({ params: userIdParamSchema }),
  SportController.listFavoritesForUser
);
router.get("/:id", validate({ params: sportIdParamSchema }), SportController.getById);
router.post(
  "/:id/favorite",
  requireAuth,
  validate({ params: sportIdParamSchema }),
  SportController.toggleFavorite
);
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
