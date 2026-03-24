import { Router } from "express";
import { addDepartment, addProgram, getAllDepartments, getAllPrograms, getAllYearLevel, getDepartmentObject, getDepartmentPrograms, getProgramSection, removeDepartment, removeProgram, setDepartmentMaxSenatorVote } from "../controllers/department";

const router = Router();

router.route('/department')
    .post(addDepartment)
    .get(getDepartmentObject)


router.put('/department/senator-max-vote', setDepartmentMaxSenatorVote);
router.put('/department/:id', removeDepartment);

router.post('/program', addProgram)
router.get('/programs', getAllPrograms)
router.delete('/program/:id', removeProgram)

router.get('/departments', getAllDepartments)
router.get('/program', getDepartmentPrograms)
router.get('/section', getProgramSection)
router.get('/year-level', getAllYearLevel)
router.get('/department/turnout', getAllYearLevel)

export default router;