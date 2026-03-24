import { Router } from "express";
import { addCandidateFunction, deleteCandidateFunction, getAllcandidatesInActiveElection, getCandidateById, getManageCandidates, getUserCandidateData, updateCandidateFunction, updateCandidateStatus } from "../controllers/candidate";
import { toUpperCase } from "../../middlewares/toUpperCase";
import upload from "../../config/multerConfig";

const router = Router();

router.use(toUpperCase);

router.route('/candidate')
    .post(upload.single('candidate_profile'), addCandidateFunction)

router.route('/candidate/data')
    .get(getAllcandidatesInActiveElection)

router
    .route("/candidate/:id")
    .put(upload.single('candidate_profile'), updateCandidateFunction)
    .delete(deleteCandidateFunction)
    .get(getCandidateById)

router.get("/candidate", getManageCandidates);
router.get('/candidate-info', getUserCandidateData);
router.put("/candidate/status/:id", updateCandidateStatus);
export default router;