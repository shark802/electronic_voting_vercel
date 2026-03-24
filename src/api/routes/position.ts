import { Router } from "express";
import { addPosition, getAllPositions, removePosition } from "../controllers/position";
import { toUpperCase } from "../../middlewares/toUpperCase";

const router = Router();

router.use(toUpperCase);

router.route("/position")
    .post(addPosition)
    .get(getAllPositions)

router.delete('/position/:id', removePosition)

export default router;