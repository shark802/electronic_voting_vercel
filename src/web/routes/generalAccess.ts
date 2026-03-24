import { Router } from "express";
import { landingPage } from "../controllers/generalAccess";

const router = Router();

router.get("/", landingPage)

export default router