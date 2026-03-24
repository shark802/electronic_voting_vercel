"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reports_1 = require("../controllers/reports");
const router = (0, express_1.default)();
router.get('/pdf-report/voter/:id', reports_1.generateVoterReportInPdf);
router.get('/pdf-report/election-result/:id', reports_1.generatePdfElectionResult);
exports.default = router;
