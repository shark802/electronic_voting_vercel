import { Router } from 'express'
import { faceAuthenticatePage, faceRegisterPage } from '../controllers/faceRecognition';
import { isAuthenticated } from '../../middlewares/authorization';

const router = Router();

router.use(isAuthenticated);

router.get('/register-face', faceRegisterPage);
router.get('/authenticate-face', faceAuthenticatePage);

export default router;