import { Router } from 'express';
import { completeVoterParticipationReports, previewVoterParticipationReports, programHeadVoterParticipationReport } from '../controllers/report';

const router = Router();

router.get('/voter/:id', previewVoterParticipationReports);
router.get('/complete/voter/:id', completeVoterParticipationReports);
router.get('/program/voter/:id', programHeadVoterParticipationReport);

export default router;