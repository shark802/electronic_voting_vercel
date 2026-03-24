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
exports.renderElectionResult = exports.renderElectionBallot = exports.electionPage = void 0;
const query_1 = require("../../data_access/query");
const database_1 = require("../../config/database");
const isValidTimeToVote_1 = require("../../utils/isValidTimeToVote");
const voteService_1 = require("../../data_access/voteService");
const hasUserRegisterFaceImage_1 = require("../../utils/hasUserRegisterFaceImage");
const election_1 = require("../../data_access/election");
const customErrors_1 = require("../../utils/customErrors");
const checkElectionTimeStatus_1 = require("../../utils/checkElectionTimeStatus");
const cryptoService_1 = require("../../utils/cryptoService");
function electionPage(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            req.session.faceVerified = false;
            const user_id = req.session.user.user_id;
            const [register_face] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM register_faces WHERE id_number = ? AND deleted_at IS NULL LIMIT 1', [user_id]);
            const face_registered = register_face ? true : false;
            const query = "SELECT * FROM elections WHERE deleted_at IS NULL AND is_active = 1 ORDER BY date_start DESC";
            const electionList = yield (0, query_1.selectQuery)(database_1.pool, query);
            const [user] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM users WHERE id_number = ?', [user_id]);
            res.render("voter/electionPage", { electionList, user, face_registered });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.electionPage = electionPage;
function renderElectionBallot(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const id_number = req.session.user.user_id;
            const election_id = req.params.electionId;
            const isIpRegistered = (_a = req.session) === null || _a === void 0 ? void 0 : _a.ipRegistered;
            const faceVerified = (_b = req.session) === null || _b === void 0 ? void 0 : _b.faceVerified;
            // Check if the user has already voted
            const hasVoted = yield (0, voteService_1.checkIfUserHasVoted)(id_number, election_id);
            if (hasVoted)
                return res.redirect('/election?redirectMessage=You have already voted');
            // If the device is not registered, check if user is available for face authentication.
            if (!isIpRegistered && !faceVerified) {
                const isUserRegisteredFaceImage = yield (0, hasUserRegisterFaceImage_1.hasUserRegisterFaceImage)(id_number);
                if (!isUserRegisteredFaceImage)
                    return res.redirect("/election?redirectMessage=Please register your face for authentication to continue.");
                // redirect user to face authentication
                return res.redirect(`/authenticate-face?election=${election_id}`);
            }
            const sqlQuery = `
            SELECT DISTINCT u.id_number, u.firstname, u.lastname, u.course, p.program_code, d.department_code AS department_name, c.position, c.candidate_profile, c.party
            FROM users u
            JOIN candidates c ON u.id_number = c.id_number
            LEFT JOIN programs p ON u.course = p.program_code
            LEFT JOIN departments d ON p.department = d.department_id
            WHERE c.election_id = ?
            AND c.deleted IS NULL
            AND c.enabled = 1
        `;
            const userQuery = `
            SELECT u.*, p.program_code, d.department_id, d.department_code AS department_name
            FROM users u
            LEFT JOIN programs p ON u.course = p.program_code
            LEFT JOIN departments d ON p.department = d.department_id
            WHERE u.id_number = ?
        `;
            const [[user], [election], candidateList] = yield Promise.all([
                (0, query_1.selectQuery)(database_1.pool, userQuery, [id_number]),
                (0, query_1.selectQuery)(database_1.pool, "SELECT * FROM elections WHERE election_id = ? AND deleted_at IS NULL", [election_id]),
                (0, query_1.selectQuery)(database_1.pool, sqlQuery, [election_id])
            ]);
            if (!election)
                return res.redirect('/election?redirectMessage=Election Not Available');
            const candidatePositionList = (yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM positions WHERE deleted_at IS NULL')).map(position => position.position);
            const departmentsMaximumSenatorVote = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
            const departmentMaxSenatorVote = departmentsMaximumSenatorVote.reduce((acc, department) => {
                acc[department.department_code] = department.max_select_senator;
                return acc;
            }, {});
            if (!(0, isValidTimeToVote_1.isValidTimeToVote)(election))
                return res.redirect("/election?redirectMessage=Voting is currently closed");
            const shuffledCandidateList = candidateList.sort(() => Math.random() - 0.5);
            return res.render('voter/voteBallot', { user, candidatePositionList, shuffledCandidateList, election, departmentMaxSenatorVote });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.renderElectionBallot = renderElectionBallot;
function renderElectionResult(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.session.user.user_id;
            const electionId = req.params.id;
            if (!electionId)
                throw new customErrors_1.BadRequestError('Election id is missing');
            // retrieve election here
            const electionInfo = yield (0, election_1.getElectionInfoById)(electionId);
            if (!electionInfo)
                throw new customErrors_1.NotFoundError('Election not exist');
            // check if the election has ended
            if (!(0, checkElectionTimeStatus_1.isElectionEnded)(electionInfo))
                return res.redirect('/election?redirectMessage=Result Not Available Yet');
            const [positions, departmentData] = yield Promise.all([
                (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM positions WHERE deleted_at IS NULL'),
                (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL')
            ]);
            const positionList = (yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM positions WHERE deleted_at IS NULL')).map(position => position.position);
            // Get user with department information
            const [user] = yield (0, query_1.selectQuery)(database_1.pool, `
            SELECT u.*, p.program_code, d.department_code AS department_name
            FROM users u
            LEFT JOIN programs p ON u.course = p.program_code
            LEFT JOIN departments d ON p.department = d.department_id
            WHERE u.id_number = ? 
            LIMIT 1`, [userId]);
            // Batch all election-specific queries
            const [departmentsPopulation] = yield Promise.all([
                (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM program_populations WHERE election_id = ?', [electionId])
            ]);
            const electionResult = yield (0, election_1.getElectionResult)(electionId);
            let candidatesVoteTally;
            if (!electionResult) {
                // If no election result exists yet, generate it with department information
                candidatesVoteTally = yield (0, election_1.generateElectionResult)(electionId);
            }
            else {
                // Decrypt the existing election result
                const secretKey = cryptoService_1.CryptoService.secretKey();
                const iv = cryptoService_1.CryptoService.stringToBuffer(electionResult.encryption_iv);
                const decryptResult = cryptoService_1.CryptoService.decrypt(electionResult.result, secretKey, iv);
                candidatesVoteTally = JSON.parse(decryptResult);
            }
            return res.render('voter/electionResultForVoter', {
                user,
                candidatesVoteTally,
                positionList,
                electionInfo,
                departmentData,
                departmentsPopulation
            });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.renderElectionResult = renderElectionResult;
