import { Router } from "express";
import { updateVoterPopulationFunction } from "../controllers/population";

const router = Router();

router.put('/population/:id', updateVoterPopulationFunction);

export default router;