import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate, validateBody } from "../middlewares/validation.middleware.js";
import { uploadImage } from "../middlewares/upload.middleware.js";
import {
  setUserSportSchema,
  updateUserSchema,
  userIdParamSchema,
  userSportIdParamSchema,
} from "../validations/user.validations.js";

/*
GET /users/me
PATCH /users/me
DELETE /users/me
POST /users/me/avatar
POST /users/me/cover-photo
GET /users/me/sports
PUT /users/me/sports
DELETE /users/me/sports/:sportId
GET /users/:id
GET /users/:id/sports
*/

const router = Router();

router.get("/me", requireAuth, UserController.getMe);
router.patch("/me", requireAuth, validateBody(updateUserSchema), UserController.updateMe);
router.delete("/me", requireAuth, UserController.deleteMe);

router.post(
  "/me/avatar",
  requireAuth,
  uploadImage.single("file"),
  UserController.uploadAvatar
);
router.post(
  "/me/cover-photo",
  requireAuth,
  uploadImage.single("file"),
  UserController.uploadCoverPhoto
);

router.get("/me/sports", requireAuth, UserController.listMySports);
router.put(
  "/me/sports",
  requireAuth,
  validateBody(setUserSportSchema),
  UserController.setMySport
);
router.delete(
  "/me/sports/:sportId",
  requireAuth,
  validate({ params: userSportIdParamSchema }),
  UserController.removeMySport
);

router.get(
  "/:id",
  requireAuth,
  validate({ params: userIdParamSchema }),
  UserController.getUserById
);
router.get(
  "/:id/sports",
  requireAuth,
  validate({ params: userIdParamSchema }),
  UserController.listUserSports
);

export default router;
