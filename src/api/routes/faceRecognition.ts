import { Router } from 'express';
import { getClientRegisteredFaceFilename, getFaceRecognitionServiceDomain, insertUserRegisterFaceInfo, isClientRegisteredFace } from '../controllers/faceRecognition';

const router = Router();

router.get('/face-service-domain', getFaceRecognitionServiceDomain);

router.post('/register-face', insertUserRegisterFaceInfo);
router.get('/register-face-status', isClientRegisteredFace);
router.get('/save-face-filename', getClientRegisteredFaceFilename);

export default router;