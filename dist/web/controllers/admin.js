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
exports.editCertification = exports.generalSettings = exports.fetchUser = exports.viewRegisterDevice = exports.reviewRegisterDevice = exports.departmentPrograms = exports.manageDepartment = exports.manageVoter = exports.addCandidate = exports.manageCandidate = exports.renderAdminElectionResult = exports.viewElectionHistory = exports.commpleteElectionResult = exports.editElection = exports.newElection = exports.viewElection = exports.electionAnalytics = exports.dashboardVoteTally = exports.dashboardOverview = void 0;
const query_1 = require("../../data_access/query");
const database_1 = require("../../config/database");
const voterService_1 = require("../../data_access/voterService");
const election_1 = require("../../data_access/election");
const checkElectionTimeStatus_1 = require("../../utils/checkElectionTimeStatus");
const customErrors_1 = require("../../utils/customErrors");
const cryptoService_1 = require("../../utils/cryptoService");
function dashboardOverview(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const elections = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE is_close = 0 AND deleted_at IS NULL ORDER BY date_start DESC, time_start DESC');
            const electionIdList = elections.map(election => election.election_id);
            let populationPerProgram = [];
            if (electionIdList.length > 0) {
                populationPerProgram = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM program_populations WHERE election_id IN ( ? ) ORDER BY program_code', [electionIdList]);
            }
            res.render("admin/dashboard_overview", { elections, populationPerProgram });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.dashboardOverview = dashboardOverview;
function dashboardVoteTally(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const elections = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE is_close = 0 AND deleted_at IS NULL ORDER BY date_start DESC, time_start DESC');
            // get all positions
            const positions = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM positions WHERE deleted_at IS NULL');
            const candidatePosition = positions.map(position => position.position);
            // get all departments
            const departments = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
            const programs = departments.map(department => department.department_code);
            const electionIdList = elections.map(election => election.election_id);
            let candidates = [];
            if (electionIdList.length > 0) {
                candidates = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM candidates WHERE election_id IN ( ? ) AND deleted IS NULL', [electionIdList]);
            }
            res.render("admin/dashboard_vote_tally", { elections, candidatePosition, programs, candidates });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.dashboardVoteTally = dashboardVoteTally;
function electionAnalytics(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            res.render("admin/dashboard_analytics");
        }
        catch (error) {
            next(error);
        }
    });
}
exports.electionAnalytics = electionAnalytics;
// Election
function viewElection(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const query = "SELECT * FROM elections WHERE deleted_at IS NULL AND (date_end > CURDATE() OR (date_end = CURDATE() AND time_end > CURTIME())) ORDER BY created_at DESC";
            const elections = yield (0, query_1.selectQuery)(database_1.pool, query);
            let candidates = [];
            let positionName = [];
            if (elections.length > 0) {
                candidates = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM candidates WHERE election_id IN(?) AND deleted IS NULL AND enabled = 1', [elections.map(election => election.election_id)]);
                const positions = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM positions WHERE deleted_at IS NULL');
                positionName = positions.map(position => position.position);
            }
            res.render("admin/election_view", { elections, candidates, positions: positionName });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.viewElection = viewElection;
function newElection(req, res, next) {
    try {
        res.render("admin/election_create");
    }
    catch (error) {
        next(error);
    }
}
exports.newElection = newElection;
function editElection(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const election_id = req.params.id;
            const query = "SELECT * FROM elections WHERE election_id = ?";
            const election = yield (0, query_1.selectQuery)(database_1.pool, query, [election_id]);
            res.render("admin/election_edit", { election: election[0] });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.editElection = editElection;
;
function commpleteElectionResult(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const electionId = req.params.id;
            const election = yield (0, election_1.getElectionInfoById)(electionId);
            const departments = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM program_populations WHERE election_id = ? ORDER BY program_code', [electionId]);
            res.render('admin/complete_election_report', { election, departments });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.commpleteElectionResult = commpleteElectionResult;
function viewElectionHistory(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const query = "SELECT * FROM elections WHERE (date_end < CURDATE() OR (date_end = CURDATE() AND time_end < CURTIME())) AND deleted_at IS NULL ORDER BY date_end DESC, time_end DESC";
            const elections = yield (0, query_1.selectQuery)(database_1.pool, query);
            let candidates = [];
            let positionName = [];
            if (elections.length > 0) {
                candidates = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM candidates WHERE election_id IN(?) AND deleted IS NULL AND enabled = 1', [elections.map(election => election.election_id)]);
                const positions = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM positions WHERE deleted_at IS NULL');
                positionName = positions.map(position => position.position);
            }
            res.render("admin/election_history", { elections, candidates, positions: positionName });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.viewElectionHistory = viewElectionHistory;
function renderAdminElectionResult(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const electionId = req.params.id;
            if (!electionId)
                throw new customErrors_1.BadRequestError('Election id is missing');
            // Single query to get election info and check if it exists
            const electionInfo = yield (0, election_1.getElectionInfoById)(electionId);
            if (!electionInfo)
                throw new customErrors_1.NotFoundError('Election not exist');
            if (!(0, checkElectionTimeStatus_1.isElectionEnded)(electionInfo)) {
                return res.redirect('/election?redirectMessage=Result Not Available Yet');
            }
            // Batch all static data queries that don't depend on electionId
            const [positions, departmentData] = yield Promise.all([
                (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM positions WHERE deleted_at IS NULL'),
                (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL')
            ]);
            // Extract the data we need
            const positionList = positions.map(position => position.position);
            const departments = departmentData.map(department => department.department_code);
            // Batch all election-specific queries
            const [departmentsPopulation, totalVotedResult, departmentVoteSummary, electionResult] = yield Promise.all([
                (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM program_populations WHERE election_id = ?', [electionId]),
                (0, query_1.selectQuery)(database_1.pool, 'SELECT COUNT(DISTINCT voter_id) as total_voted FROM votes WHERE election_id = ?', [electionId]),
                (0, election_1.getDepartmentsTotalVotes)([electionId]),
                (0, election_1.getElectionResult)(electionId)
            ]);
            // Extract the data from query results
            const totalVoted = totalVotedResult[0];
            const departmentVoteSummaryData = departmentVoteSummary[0];
            // Handle election result decryption or generation
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
            return res.render('admin/electionResultForAdmin', {
                candidatesVoteTally,
                positionList,
                departments,
                electionInfo,
                departmentsPopulation,
                totalVoted,
                departmentVoteSummary: departmentVoteSummaryData,
                departmentData
            });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.renderAdminElectionResult = renderAdminElectionResult;
// Candidate
function manageCandidate(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const candidatePositions = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM positions WHERE deleted_at IS NULL');
            const positions = candidatePositions.map(position => position.position);
            const selectElectioQuery = "SELECT * FROM elections WHERE deleted_at IS NULL AND is_close = 0  ORDER BY created_at DESC";
            const elections = yield (0, query_1.selectQuery)(database_1.pool, selectElectioQuery);
            res.render("admin/candidate_manage", { elections, positions });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.manageCandidate = manageCandidate;
function addCandidate(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const query = "SELECT * FROM elections WHERE deleted_at IS NULL AND (date_start > CURDATE() OR (date_start = CURDATE() AND time_start > CURTIME())) ORDER BY created_at DESC";
            const electionList = yield (0, query_1.selectQuery)(database_1.pool, query);
            const candidatePositions = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM positions WHERE deleted_at IS NULL');
            const positions = candidatePositions.map(position => position.position);
            const departments = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
            const programs = departments.map(department => department.department_code);
            res.render("admin/candidate_add", { electionList, positions, programs });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.addCandidate = addCandidate;
// Voter
function manageVoter(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { election, user_id, page } = req.query;
            const currentPage = parseInt(page) || 1;
            const limit = 30;
            let result;
            // Fetch all voted users based on filters with pagination
            if (election && user_id) {
                const voters = yield (0, voterService_1.findOneUserVotedInElection)(election, user_id);
                result = { voters, total: voters.length };
            }
            else if (election && !user_id) {
                result = yield (0, voterService_1.getAllRecentUsersVotedInElection)(election, currentPage, limit);
            }
            else if (user_id && !election) {
                result = yield (0, voterService_1.getAllUserElectionParticipatedIn)(user_id, currentPage, limit);
            }
            else {
                result = yield (0, voterService_1.getAllRecentUsersVoted)(currentPage, limit);
            }
            const totalPages = Math.ceil(result.total / limit);
            const availableElectionQuery = "SELECT * FROM elections WHERE (date_start < NOW() OR (date_start = CURDATE() AND time_start < CURTIME())) AND deleted_at IS NULL ORDER BY date_end DESC, time_end DESC";
            const availableElections = yield (0, query_1.selectQuery)(database_1.pool, availableElectionQuery);
            res.render("admin/voter_manage", {
                votedUsers: result.voters,
                totalUsers: result.total,
                election,
                user_id,
                availableElections,
                currentPage,
                totalPages,
                limit
            });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.manageVoter = manageVoter;
// Department
function manageDepartment(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const departments = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
            res.render("admin/department_manage", { departments });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.manageDepartment = manageDepartment;
function departmentPrograms(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const departments = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
            const programs = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM programs WHERE deleted_at IS NULL');
            res.render("admin/department_programs", { departments, programs });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.departmentPrograms = departmentPrograms;
// Register device
function reviewRegisterDevice(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const devices = yield (0, query_1.selectQuery)(database_1.pool, "SELECT * FROM register_devices WHERE is_registered = 0 AND deleted_at IS NULL ORDER BY date_created DESC");
            res.render("admin/register_device_review", { devices });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.reviewRegisterDevice = reviewRegisterDevice;
function viewRegisterDevice(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const registeredDevices = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM register_devices WHERE is_registered = 1 AND deleted_at IS NULL ORDER BY updated_at DESC');
            res.render("admin/register_device_registered", { registeredDevices });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.viewRegisterDevice = viewRegisterDevice;
// Control Panel
function fetchUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const departmentData = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
            const programs = departmentData.map(department => department.department_code);
            const import_records = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM users_import_records ORDER BY import_date DESC');
            res.render("admin/control-panel-user", { programs, import_records });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.fetchUser = fetchUser;
function generalSettings(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const departments = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
            res.render("admin/control-panel-general-settings", { departments });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.generalSettings = generalSettings;
function editCertification(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const election_id = req.params.id;
            // Get election details to verify it exists
            const query = "SELECT * FROM elections WHERE election_id = ?";
            const election = yield (0, query_1.selectQuery)(database_1.pool, query, [election_id]);
            if (!election || election.length === 0) {
                throw new Error('Election not found');
            }
            res.render('admin/editCertification', {
                electionId: election_id
            });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.editCertification = editCertification;
