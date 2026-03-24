"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdfElectionResult = exports.generateVoterReportInPdf = void 0;
const voterService_1 = require("../../data_access/voterService");
const query_1 = require("../../data_access/query");
const database_1 = require("../../config/database");
const generateTablePdf_1 = require("../../utils/reportUtils/generateTablePdf");
const customErrors_1 = require("../../utils/customErrors");
const filterVotersByFilterParameter_1 = require("../../utils/filterVotersByFilterParameter");
const createVoterReportTitle_1 = require("../../utils/createVoterReportTitle");
const election_1 = require("../../data_access/election");
const cryptoService_1 = require("../../utils/cryptoService");
const generateElectionResultPdf_1 = require("../../utils/reportUtils/generateElectionResultPdf");
require("jspdf-autotable");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function generateVoterReportInPdf(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const election_id = req.params.id;
            if (!election_id)
                throw new customErrors_1.BadRequestError('Missing required election id');
            let voteStatus = req.query.voteStatus || 'voted'; // if voteStatus request query is falsy, assign default 'voted' value;
            const { department, program, year_level, section } = req.query;
            const selectedVoteStatus = voteStatus === 'voted' ? 1 : 0;
            const selectedDepartment = department === null || department === void 0 ? void 0 : department.toString();
            const selectedProgram = program === null || program === void 0 ? void 0 : program.toString();
            const selectedYearLevel = year_level === null || year_level === void 0 ? void 0 : year_level.toString();
            const selectedSection = section === null || section === void 0 ? void 0 : section.toString();
            const [election] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE election_id = ? LIMIT 1', [election_id]);
            const voters = yield (0, voterService_1.getAllVoterInElection)(election_id);
            // filter voters
            const filteredVoters = yield (0, filterVotersByFilterParameter_1.filterVotersByFilterParameter)(voters, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
            const reportTitle = (0, createVoterReportTitle_1.createVoterReportTitle)(selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
            const pdfBuffer = yield (0, generateTablePdf_1.genereateTablePdf)(filteredVoters, reportTitle, election.election_name);
            const filename = reportTitle
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "_");
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
            // Send the PDF as a response
            res.send(pdfBuffer);
        }
        catch (error) {
            console.error('Error generating PDF:', error);
            next(error);
        }
    });
}
exports.generateVoterReportInPdf = generateVoterReportInPdf;
function generatePdfElectionResult(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const electionId = req.params.id;
            const [election] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE election_id = ?', [electionId]);
            const departments = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT department_code FROM departments WHERE deleted_at IS NULL ORDER BY department_code');
            let positions = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT position FROM positions WHERE deleted_at IS NULL');
            const programPopulation = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM program_populations WHERE election_id = ?', [electionId]);
            const departmentArray = departments.map(department => department.department_code);
            const positionArray = positions.map(position => position.position);
            const electionResult = yield (0, election_1.getElectionResult)(electionId);
            let candidatesVoteTally;
            if (!electionResult) {
                candidatesVoteTally = yield (0, election_1.generateElectionResult)(electionId);
            }
            else {
                const secretKey = cryptoService_1.CryptoService.secretKey();
                const iv = cryptoService_1.CryptoService.stringToBuffer(electionResult.encryption_iv);
                const decryptResult = cryptoService_1.CryptoService.decrypt(electionResult.result, secretKey, iv);
                candidatesVoteTally = JSON.parse(decryptResult);
            }
            candidatesVoteTally.sort((a, b) => Number(b.vote_count) - Number(a.vote_count));
            // Read certification details
            let certificationDetails;
            try {
                const filePath = path_1.default.join(__dirname, './../../../public/docs/certification-details.json');
                if (fs_1.default.existsSync(filePath)) {
                    const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
                    certificationDetails = JSON.parse(fileContent);
                }
            }
            catch (error) {
                console.error('Error reading certification details:', error);
            }
            // Generate PDF with certification details
            const pdfBuffer = yield (0, generateElectionResultPdf_1.generateElectionResultPdf)({
                candidatesVoteTally,
                election: election,
                departmentArray,
                positionArray,
                programPopulation,
                certificationDetails
            });
            const pdfFilename = election.election_name.replace(/\s+/g, '-').toLocaleLowerCase();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${pdfFilename}-result.pdf`);
            res.send(pdfBuffer);
        }
        catch (error) {
            next(error);
        }
    });
}
exports.generatePdfElectionResult = generatePdfElectionResult;
