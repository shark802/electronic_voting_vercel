import { Router } from "express";
import { getAllImportUserRecords, getUserByIdNumber, importUsers, newUserFunction, updateUserFunction } from "../controllers/user";
import { toUpperCase } from "../../middlewares/toUpperCase";
import upload from "../../config/multerConfig";

const router = Router();
router.use(toUpperCase);

router.route('/user/:id')
    .get(getUserByIdNumber)
    .put(updateUserFunction)

router.post('/user-new', newUserFunction);
router.post('/import-user', upload.single('userFile'), importUsers);
router.get('/import-records', getAllImportUserRecords);

export default router;