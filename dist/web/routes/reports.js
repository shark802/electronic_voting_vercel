"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_1 = require("../controllers/report");
const router = (0, express_1.Router)();
router.get('/voter/:id', report_1.previewVoterParticipationReports);
router.get('/complete/voter/:id', report_1.completeVoterParticipationReports);
router.get('/program/voter/:id', report_1.programHeadVoterParticipationReport);
exports.default = router;
