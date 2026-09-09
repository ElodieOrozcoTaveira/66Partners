import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import {
  facebookAuthLimiter,
  forgotPasswordLimiter,
  googleAuthLimiter,
  loginLimiter,
  registerLimiter,
  resetPasswordLimiter,
} from "../middlewares/rateLimit.middleware.js";
import {
  facebookAuthSchema,
  facebookCompleteSchema,
  facebookLinkSchema,
  forgotPasswordSchema,
  googleAuthSchema,
  googleCompleteSchema,
  googleLinkSchema,
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
POST /google
POST /google/complete
POST /google/link
POST /facebook
POST /facebook/complete
POST /facebook/link
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
router.post(
  "/google",
  googleAuthLimiter,
  validateBody(googleAuthSchema),
  AuthController.googleAuth
);
router.post(
  "/google/complete",
  googleAuthLimiter,
  validateBody(googleCompleteSchema),
  AuthController.googleComplete
);
router.post(
  "/google/link",
  requireAuth,
  googleAuthLimiter,
  validateBody(googleLinkSchema),
  AuthController.googleLink
);
router.post(
  "/facebook",
  facebookAuthLimiter,
  validateBody(facebookAuthSchema),
  AuthController.facebookAuth
);
router.post(
  "/facebook/complete",
  facebookAuthLimiter,
  validateBody(facebookCompleteSchema),
  AuthController.facebookComplete
);
router.post(
  "/facebook/link",
  requireAuth,
  facebookAuthLimiter,
  validateBody(facebookLinkSchema),
  AuthController.facebookLink
);

export default router;
