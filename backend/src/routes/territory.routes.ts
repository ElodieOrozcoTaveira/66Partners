import { Router } from "express";
import { TerritoryController } from "../controllers/territory.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { territoryCodeParamSchema } from "../validations/territory.validations.js";

/*
GET /territories
GET /territories/mine
GET /territories/:code
POST /territories/:code/join
*/

const router = Router();

router.get("/", TerritoryController.list);
// Doit être déclaré avant "/:code" : sinon "/mine" serait capturé comme un code de territoire.
router.get("/mine", requireAuth, TerritoryController.listMine);
router.get(
  "/:code",
  validate({ params: territoryCodeParamSchema }),
  TerritoryController.getByCode
);
router.post(
  "/:code/join",
  requireAuth,
  validate({ params: territoryCodeParamSchema }),
  TerritoryController.join
);

export default router;
