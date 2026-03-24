import { Router } from "express";
import { addIpAddress, getIpAddress, getAllIpAddress, removeIpAddress, validateIpAddress } from "../controllers/ipAddress";
import { toUpperCase } from "../../middlewares/toUpperCase";

const router = Router();
router.use(toUpperCase)

router.route('/ip-address')
    .post(addIpAddress)
    .get(getIpAddress)
    .put(removeIpAddress);

router.route('/ip-address/all')
    .get(getAllIpAddress);


router.post('/ip-address/validate', validateIpAddress)

export default router;
