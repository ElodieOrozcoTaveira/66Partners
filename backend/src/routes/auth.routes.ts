import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import {
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
  resetPasswordLimiter,
} from "../middlewares/rateLimit.middleware.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validations/auth.validations.js";

/*
POST /register
POST /login
GET /me
POST /forgot-password
POST /reset-password
*/

const router = Router();

router.post(
  "/register",
  registerLimiter,
  validateBody(registerSchema),
  AuthController.register
);
router.post("/login", loginLimiter, validateBody(loginSchema), AuthController.login);
router.get("/me", requireAuth, AuthController.getProfile);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateBody(forgotPasswordSchema),
  AuthController.forgotPassword
);
router.post(
  "/reset-password",
  resetPasswordLimiter,
  validateBody(resetPasswordSchema),
  AuthController.resetPassword
);

export default router;
