import Router from "express";
import { isFaceVerified, loginFunction, logoutFunction } from "../controllers/auth";

const router = Router();

router.post("/login", loginFunction);
router.post("/logout", logoutFunction);
router.post("/verified-face/status", isFaceVerified);

export default router;