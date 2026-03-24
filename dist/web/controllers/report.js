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
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeVoterParticipationReports = exports.programHeadVoterParticipationReport = exports.previewVoterParticipationReports = void 0;
const customErrors_1 = require("../../utils/customErrors");
const query_1 = require("../../data_access/query");
const database_1 = require("../../config/database");
const voterService_1 = require("../../data_access/voterService");
const filterVotersByFilterParameter_1 = require("../../utils/filterVotersByFilterParameter");
const getPaginatedUsers_1 = require("../../utils/getPaginatedUsers");
const createVoterReportTitle_1 = require("../../utils/createVoterReportTitle");
function previewVoterParticipationReports(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const election_id = req.params.id;
            if (!election_id)
                throw new customErrors_1.BadRequestError('Missing required election id');
            // query parameters
            const page = req.query.page || 1;
            let voteStatus = req.query.voteStatus || 'voted'; // if voteStatus request query is falsy, assign default 'voted' value;
            const { department, program, year_level, section } = req.query;
            const selectedVoteStatus = voteStatus === 'voted' ? 1 : 0;
            const selectedDepartment = department === null || department === void 0 ? void 0 : department.toString();
            const selectedProgram = program === null || program === void 0 ? void 0 : program.toString();
            const selectedYearLevel = year_level === null || year_level === void 0 ? void 0 : year_level.toString();
            const selectedSection = section === null || section === void 0 ? void 0 : section.toString();
            // get available departments and map to array of department codes
            const availableDepartments = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
            const departments = availableDepartments.map(department => department.department_code);
            // get programs based on selected department
            const departmentId = (_a = availableDepartments.find(department => department.department_code === selectedDepartment)) === null || _a === void 0 ? void 0 : _a.department_id;
            const programs = departmentId ? (yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM programs WHERE department = ? AND deleted_at IS NULL', [departmentId])).map(program => program.program_code) : [];
            // get year levels
            const yearLevels = [1, 2, 3, 4];
            const sqlSectionResult = program ? yield (0, query_1.selectQuery)(database_1.pool, `SELECT DISTINCT users.section
            FROM voters JOIN users ON voters.id_number = users.id_number 
            WHERE voters.election_id = ?
            AND course = ?
            ORDER BY users.section`, [election_id, program]) : [];
            const sections = sqlSectionResult.map(section => Object.values(section)).flat();
            const [election] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE election_id = ? LIMIT 1', [election_id]);
            const voters = yield (0, voterService_1.getAllVoterInElection)(election_id);
            // filter voters
            const filteredVoters = yield (0, filterVotersByFilterParameter_1.filterVotersByFilterParameter)(voters, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
            const reportTitle = (0, createVoterReportTitle_1.createVoterReportTitle)(selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
            const users = (0, getPaginatedUsers_1.getPaginatedUsers)(filteredVoters, page);
            const usersSize = filteredVoters.length;
            res.render('report/preview-voter-report', { election, departments, programs, yearLevels, sections, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection, users, page, usersSize, reportTitle });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.previewVoterParticipationReports = previewVoterParticipationReports;
function programHeadVoterParticipationReport(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const election_id = req.params.id;
            if (!election_id)
                throw new customErrors_1.BadRequestError('Missing required election id');
            // query parameters
            const page = req.query.page || 1;
            let voteStatus = req.query.voteStatus || 'voted'; // if voteStatus request query is falsy, assign default 'voted' value;
            const { department, program, year_level, section } = req.query;
            const selectedVoteStatus = voteStatus === 'voted' ? 1 : 0;
            const selectedDepartment = department === null || department === void 0 ? void 0 : department.toString();
            const selectedProgram = program === null || program === void 0 ? void 0 : program.toString();
            const selectedYearLevel = year_level === null || year_level === void 0 ? void 0 : year_level.toString();
            const selectedSection = section === null || section === void 0 ? void 0 : section.toString();
            // get available departments and map to array of department codes
            const availableDepartments = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
            const departments = availableDepartments.map(department => department.department_code);
            // get programs based on selected department
            const departmentId = (_a = availableDepartments.find(department => department.department_code === selectedDepartment)) === null || _a === void 0 ? void 0 : _a.department_id;
            const programs = departmentId ? (yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM programs WHERE department = ? AND deleted_at IS NULL', [departmentId])).map(program => program.program_code) : [];
            // get year levels
            const yearLevels = [1, 2, 3, 4];
            const sqlSectionResult = program ? yield (0, query_1.selectQuery)(database_1.pool, `SELECT DISTINCT users.section
            FROM voters JOIN users ON voters.id_number = users.id_number 
            WHERE voters.election_id = ?
            AND course = ?
            ORDER BY users.section`, [election_id, program]) : [];
            const sections = sqlSectionResult.map(section => Object.values(section)).flat();
            const [election] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE election_id = ? LIMIT 1', [election_id]);
            const voters = yield (0, voterService_1.getAllVoterInElection)(election_id);
            // filter voters
            const filteredVoters = yield (0, filterVotersByFilterParameter_1.filterVotersByFilterParameter)(voters, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
            const reportTitle = (0, createVoterReportTitle_1.createVoterReportTitle)(selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
            const users = (0, getPaginatedUsers_1.getPaginatedUsers)(filteredVoters, page);
            const usersSize = filteredVoters.length;
            res.render('report/program-head-voter-report', { election, departments, programs, yearLevels, sections, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection, users, page, usersSize, reportTitle });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.programHeadVoterParticipationReport = programHeadVoterParticipationReport;
function completeVoterParticipationReports(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const election_id = req.params.id;
            if (!election_id)
                throw new customErrors_1.BadRequestError('Missing required election id');
            // query parameters
            const page = req.query.page || 1;
            let voteStatus = req.query.voteStatus || 'voted'; // if voteStatus request query is falsy, assign default 'voted' value;
            const { department, program, year_level, section } = req.query;
            const selectedVoteStatus = voteStatus === 'voted' ? 1 : 0;
            const selectedDepartment = department === null || department === void 0 ? void 0 : department.toString();
            const selectedProgram = program === null || program === void 0 ? void 0 : program.toString();
            const selectedYearLevel = year_level === null || year_level === void 0 ? void 0 : year_level.toString();
            const selectedSection = section === null || section === void 0 ? void 0 : section.toString();
            // get available departments and map to array of department codes
            const availableDepartments = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
            const departments = availableDepartments.map(department => department.department_code);
            // get programs based on selected department
            const departmentId = (_a = availableDepartments.find(department => department.department_code === selectedDepartment)) === null || _a === void 0 ? void 0 : _a.department_id;
            const programs = departmentId ? (yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM programs WHERE department = ? AND deleted_at IS NULL', [departmentId])).map(program => program.program_code) : [];
            // get year levels
            const yearLevels = [1, 2, 3, 4];
            const sqlSectionResult = program ? yield (0, query_1.selectQuery)(database_1.pool, `SELECT DISTINCT users.section
            FROM voters JOIN users ON voters.id_number = users.id_number 
            WHERE voters.election_id = ?
            AND course = ?
            ORDER BY users.section`, [election_id, program]) : [];
            const sections = sqlSectionResult.map(section => Object.values(section)).flat();
            const [election] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE election_id = ? LIMIT 1', [election_id]);
            const voters = yield (0, voterService_1.getAllVoterInElection)(election_id);
            // filter voters
            const filteredVoters = yield (0, filterVotersByFilterParameter_1.filterVotersByFilterParameter)(voters, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
            const reportTitle = (0, createVoterReportTitle_1.createVoterReportTitle)(selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection);
            const users = (0, getPaginatedUsers_1.getPaginatedUsers)(filteredVoters, page);
            const usersSize = filteredVoters.length;
            res.render('report/voter-complete-report', { election, departments, programs, yearLevels, sections, selectedVoteStatus, selectedDepartment, selectedProgram, selectedYearLevel, selectedSection, users, page, usersSize, reportTitle });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.completeVoterParticipationReports = completeVoterParticipationReports;
