import { Router } from "express";
import electionRouter from "./routes/election";
import authRouter from "./routes/auth";
import candidateRouter from "./routes/candidate";
import voteRouter from "./routes/vote";
import registerDeviceRouter from "./routes/registerDevice";
import populationRouter from "./routes/population";
import userRouter from "./routes/user";
import departmentRouter from "./routes/department";
import reportRouter from "./routes/reports";
import voterRouter from "./routes/voter";
import ipAddressRouter from "./routes/ipAddress";
import positionRouter from "./routes/position";
import faceRecognitionRouter from './routes/faceRecognition';
import certificationRoutes from './routes/certification';

const router = Router();

// API Routes
router.use(faceRecognitionRouter);
router.use(electionRouter);
router.use(authRouter);
router.use(candidateRouter);
router.use(voteRouter);
router.use(registerDeviceRouter);
router.use(populationRouter);
router.use(userRouter);
router.use(departmentRouter);
router.use(reportRouter);
router.use(voterRouter);
router.use(ipAddressRouter);
router.use(positionRouter);
router.use(certificationRoutes);

export default router;
