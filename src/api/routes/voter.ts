import Router from 'express';
import { getAllVoterElectionHistory } from '../controllers/voter';

const router = Router();

router.get('/voter/voter-history/:id', getAllVoterElectionHistory)

export default router;