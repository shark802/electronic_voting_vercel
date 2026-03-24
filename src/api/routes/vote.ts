import { Router } from "express";
import { saveVoteFunction } from "../controllers/vote";

const router = Router();

router
    .route('/vote')
    .post(saveVoteFunction)


export default router;