import { Router } from "express";
import { updateRegisterStatusFunction, declineRequestFunction, requestUuidFunction, checkUuidStatus, validateUuid } from "../controllers/registerDevice";

const router = Router();

router.route('/uuid')
    .post(requestUuidFunction)

router.post('/uuid-validation', validateUuid)

router.route('/uuid/:id')
    .get(checkUuidStatus)
    .delete(declineRequestFunction)
    .put(updateRegisterStatusFunction)


export default router;