import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { loginSchema, registerSchema } from "../validations/auth.validations.js";
/*
POST /register
POST /login
GET /me
*/
const router = Router();
router.post("/register", validateBody(registerSchema), AuthController.register);
router.post("/login", validateBody(loginSchema), AuthController.login);
router.get("/me", requireAuth, AuthController.getProfile);
export default router;
//# sourceMappingURL=auth.routes.js.map