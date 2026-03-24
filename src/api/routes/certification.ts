import { Router } from "express";
import { getCertificationDetails, updateCertificationDetails } from "../controllers/certification";

const router = Router();

// Get certification details
router.get("/certification", getCertificationDetails);

// Update certification details
router.post("/certification", updateCertificationDetails);

export default router; 