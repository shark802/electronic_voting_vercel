"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const department_1 = require("../controllers/department");
const router = (0, express_1.Router)();
router.route('/department')
    .post(department_1.addDepartment)
    .get(department_1.getDepartmentObject);
router.put('/department/senator-max-vote', department_1.setDepartmentMaxSenatorVote);
router.put('/department/:id', department_1.removeDepartment);
router.post('/program', department_1.addProgram);
router.get('/programs', department_1.getAllPrograms);
router.delete('/program/:id', department_1.removeProgram);
router.get('/departments', department_1.getAllDepartments);
router.get('/program', department_1.getDepartmentPrograms);
router.get('/section', department_1.getProgramSection);
router.get('/year-level', department_1.getAllYearLevel);
router.get('/department/turnout', department_1.getAllYearLevel);
exports.default = router;
