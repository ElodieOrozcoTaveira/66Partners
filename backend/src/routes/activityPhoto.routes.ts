import { Router } from "express";
import { ActivityPhotoController } from "../controllers/activityPhoto.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { uploadImage } from "../middlewares/upload.middleware.js";
import {
  activityIdParamSchema,
  photoIdParamSchema,
} from "../validations/activityPhoto.validations.js";

/*
GET    /api/activities/:activityId/photos  — photos d'une activité
POST   /api/activities/:activityId/photos  — ajouter une photo (activité terminée)
DELETE /api/activity-photos/:photoId       — supprimer une de ses photos
*/

const activityPhotoRouter = Router({ mergeParams: true });
const photoRouter = Router();

// Monté sur /api/activities
activityPhotoRouter.get(
  "/:activityId/photos",
  requireAuth,
  validate({ params: activityIdParamSchema }),
  ActivityPhotoController.list
);

activityPhotoRouter.post(
  "/:activityId/photos",
  requireAuth,
  validate({ params: activityIdParamSchema }),
  uploadImage.single("file"),
  ActivityPhotoController.upload
);

// Monté sur /api/activity-photos
photoRouter.delete(
  "/:photoId",
  requireAuth,
  validate({ params: photoIdParamSchema }),
  ActivityPhotoController.remove
);

export { activityPhotoRouter, photoRouter };
