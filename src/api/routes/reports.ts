import Router from 'express';
import { generatePdfElectionResult, generateVoterReportInPdf } from '../controllers/reports';

const router = Router();

router.get('/pdf-report/voter/:id', generateVoterReportInPdf);
router.get('/pdf-report/election-result/:id', generatePdfElectionResult);

export default router