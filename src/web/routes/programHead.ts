import { Router } from 'express'
import { programHeadDashboardOverviewPage, programHeadDashboardVoteTallyPage } from '../controllers/programHead';
import { isAuthenticated, isProgramHead } from '../../middlewares/authorization';

const router = Router();

router.use(isAuthenticated)
router.use(isProgramHead)

router.get('/dashboard/overview', programHeadDashboardOverviewPage)
router.get('/dashboard/vote-tally', programHeadDashboardVoteTallyPage)

export default router;