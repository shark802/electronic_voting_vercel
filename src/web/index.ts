import { Router } from "express";
import generalAccess from "./routes/generalAccess";
import adminRoutes from "./routes/admin";
import voterRoutes from "./routes/voter";
import programHeadRoutes from "./routes/programHead";
import reportRoutes from "./routes/reports";
import faceRecognitionRoutes from "./routes/faceRecognition";

const router = Router();

router.use(generalAccess)
router.use("/admin", adminRoutes);
router.use('/report', reportRoutes)
router.use('/program-head', programHeadRoutes);
router.use(voterRoutes);
router.use(faceRecognitionRoutes);

export default router;
