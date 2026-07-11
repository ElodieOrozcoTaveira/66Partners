import { Router } from "express";
import { ContactController } from "../controllers/contact.controller.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { createContactSchema } from "../validations/contact.validations.js";

/*
POST /contact
*/

const router = Router();

router.post("/", validateBody(createContactSchema), ContactController.send);

export default router;
