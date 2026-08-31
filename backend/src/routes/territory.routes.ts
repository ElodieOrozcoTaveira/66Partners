import { Router } from "express";
import { TerritoryController } from "../controllers/territory.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { territoryCodeParamSchema } from "../validations/territory.validations.js";

/*
GET /territories
GET /territories/:code
*/

const router = Router();

router.get("/", TerritoryController.list);
router.get(
  "/:code",
  validate({ params: territoryCodeParamSchema }),
  TerritoryController.getByCode
);

export default router;
