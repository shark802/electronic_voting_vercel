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
exports.getAllcandidatesInActiveElection = exports.getUserCandidateData = exports.updateCandidateStatus = exports.getCandidateById = exports.getManageCandidates = exports.deleteCandidateFunction = exports.updateCandidateFunction = exports.addCandidateFunction = void 0;
const customErrors_1 = require("../../utils/customErrors");
const database_1 = require("../../config/database");
const query_1 = require("../../data_access/query");
const ulid_1 = require("ulid");
const candidateService_1 = require("../../data_access/candidateService");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function addCandidateFunction(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            Object.entries(req.body).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    req.body[key] = value.toUpperCase();
                }
            });
            let { election_id, id_number, firstname, lastname, course, party, position } = req.body;
            const candidate_profile = req.file ? req.file.filename : null;
            if (!election_id || !id_number || !firstname || !lastname || !party || !position || !course)
                return next(new customErrors_1.BadRequestError("Cannot proceed adding candidate due to missing info"));
            const findCandidateAccount = yield (0, query_1.selectQuery)(database_1.pool, "SELECT * FROM users WHERE id_number = ?", [id_number]);
            if (findCandidateAccount.length < 1) {
                // create account for candidate
                const connection = yield database_1.pool.getConnection();
                try {
                    yield connection.beginTransaction();
                    yield connection.execute("INSERT INTO users (id_number, firstname, lastname, course) VALUES(?, ?, ?, ?)", [id_number, firstname, lastname, course]);
                    yield connection.execute("INSERT INTO roles (id_number, voter) VALUES(?, ?)", [id_number, 1]);
                    yield connection.commit();
                }
                catch (error) {
                    yield connection.rollback();
                    return next(error);
                }
                finally {
                    yield connection.release();
                }
            }
            const findCandidateIfExist = yield (0, query_1.selectQuery)(database_1.pool, "SELECT * FROM candidates WHERE id_number = ? AND election_id = ? AND deleted IS NULL", [id_number, election_id]);
            if (findCandidateIfExist.length > 0)
                return next(new customErrors_1.ConflictError(`Unable to add ${id_number} in election due to conflict, candidate already exist`));
            const candidate_id = (0, ulid_1.ulid)();
            const addNewCandidateQuery = "INSERT INTO candidates (candidate_id, id_number, position, party, election_id, candidate_profile, department) VALUES (?, ?, ?, ?, ?, ?, ?)";
            const candidateParameter = [candidate_id, id_number, position, party, election_id, candidate_profile, course];
            const newCandidate = yield (0, query_1.insertQuery)(database_1.pool, addNewCandidateQuery, candidateParameter);
            if (newCandidate.affectedRows > 0) {
                return res.status(201).json({ message: "New candidate successfully added" });
            }
        }
        catch (error) {
            next(error);
        }
    });
}
exports.addCandidateFunction = addCandidateFunction;
function updateCandidateFunction(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const candidate_id = req.params.id;
            if (!candidate_id)
                return next(new customErrors_1.BadRequestError("Election Id is missing"));
            let { party, position } = req.body;
            const candidateProfile = req.file ? req.file.filename : null;
            if (!party || !position)
                return next(new customErrors_1.BadRequestError("Candidate is lacking some information to proceed update"));
            // if the request comes with to update candidate profile. check if there is already a candidate profile set then delete the old profile
            if (candidateProfile) {
                const [candidate] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM candidates WHERE candidate_id = ?', [candidate_id]);
                if (candidate.candidate_profile) {
                    const oldProfilePath = path_1.default.join(__dirname, `./../../../public/img/candidate_profiles/${candidate.candidate_profile}`);
                    fs_1.default.unlink(oldProfilePath, (error) => {
                        if ((error === null || error === void 0 ? void 0 : error.code) === 'ENOENT') {
                            console.log(`Could'nt find file ${candidate.candidate_profile}, delete attempt failed`);
                        }
                    });
                }
            }
            const updateSqlQuery = "UPDATE candidates SET party = ?, position = ?, candidate_profile = ? WHERE candidate_id = ? AND deleted IS NULL";
            const updateParameter = [party, position, candidateProfile, candidate_id];
            const updateResult = yield (0, query_1.updateQuery)(database_1.pool, updateSqlQuery, updateParameter);
            if (updateResult.affectedRows < 0)
                return next(new customErrors_1.NotFoundError('Resource not found or no changes were made'));
            return res.status(200).json({ message: 'Candidate updated successfully' });
        }
        catch (error) {
            console.log('invalid image');
            return next(error);
        }
    });
}
exports.updateCandidateFunction = updateCandidateFunction;
function deleteCandidateFunction(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const candidate_id = req.params.id;
            if (!candidate_id)
                throw new customErrors_1.BadRequestError("Failed to delete candidate due to missing candidate's id");
            const deleteQuery = 'UPDATE candidates SET deleted = CURDATE() WHERE candidate_id = ? AND deleted IS NULL';
            const deleteResult = yield (0, query_1.updateQuery)(database_1.pool, deleteQuery, [candidate_id]);
            if (deleteResult.affectedRows < 1)
                throw new customErrors_1.NotFoundError('Deletion failed, no changes were made');
            return res.status(200).json({ message: `Candidate deleted successfully` });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.deleteCandidateFunction = deleteCandidateFunction;
function getManageCandidates(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const position = req.query.position;
            const electionIds = req.query.election_id;
            if (!position)
                throw new customErrors_1.BadRequestError('No election Available');
            if (!electionIds)
                throw new customErrors_1.BadRequestError('Atleast 1 election Id is required');
            const electionList = Array.isArray(electionIds) ? electionIds : [electionIds];
            const sqlSelectUserCandidateQuery = `
        SELECT u.id_number, u.firstname, u.lastname, u.course, u.year_level, u.section, c.candidate_id, c.election_id, c.position, c.enabled, c.party, c.added_at
        FROM users u JOIN candidates c
        ON u.id_number = c.id_number
        WHERE c.position = ?
        AND c.election_id IN (?)
        AND c.deleted IS NULL
        ORDER BY u.lastname;
        `;
            const userCandidateResult = yield (0, query_1.selectQuery)(database_1.pool, sqlSelectUserCandidateQuery, [position, electionList]);
            return res.status(200).json(userCandidateResult);
        }
        catch (error) {
            next(error);
        }
    });
}
exports.getManageCandidates = getManageCandidates;
;
function getCandidateById(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const candidate_id = req.params.id;
            if (!candidate_id)
                throw new customErrors_1.BadRequestError("Candidate Id is missing");
            const sqlQuery = `SELECT u.firstname, u.lastname, u.course, c.* FROM candidates c JOIN users u  ON c.id_number = u.id_number WHERE c.candidate_id = ? AND c.deleted IS NULL`;
            const candidate = yield (0, query_1.selectQuery)(database_1.pool, sqlQuery, [candidate_id]);
            if (candidate.length < 1)
                throw new customErrors_1.NotFoundError("Candidate Not Found");
            res.status(200).send(candidate[0]);
        }
        catch (error) {
            next(error);
        }
    });
}
exports.getCandidateById = getCandidateById;
function updateCandidateStatus(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const candidate_id = req.params.id;
            const status = req.body.status;
            if (!status || !candidate_id)
                throw new customErrors_1.BadRequestError("Required value is missing can't update candidate");
            const sqlQuery = "UPDATE candidates SET enabled = ? WHERE candidate_id = ?";
            const parameter = [status, candidate_id];
            const result = yield (0, query_1.updateQuery)(database_1.pool, sqlQuery, parameter);
            if (result.affectedRows < 1)
                throw new customErrors_1.NotFoundError('No resource updated');
            res.status(200).json({ message: `Candidate status updated` });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.updateCandidateStatus = updateCandidateStatus;
// Will response the candidate information according to candidates id_number parse in url query params
function getUserCandidateData(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const electionId = req.query.electionId;
            const candidateIdNumberList = req.query.id_number;
            if (!electionId)
                throw new customErrors_1.BadRequestError("Election Id is not provided");
            if (!candidateIdNumberList)
                throw new customErrors_1.BadRequestError('Please select a candidate!');
            const candidateIdList = Array.isArray(candidateIdNumberList) ? candidateIdNumberList : [candidateIdNumberList];
            const userCandidate = yield (0, candidateService_1.getUserCandidate)(candidateIdList, electionId);
            return res.status(200).send(userCandidate);
        }
        catch (error) {
            next(error);
        }
    });
}
exports.getUserCandidateData = getUserCandidateData;
//! TODO dashboard vote tally
function getAllcandidatesInActiveElection(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sqlQuery = `
            SELECT u.id_number, u.firstname, u.lastname, u.course, c.position, c.department, e.election_id, c.vote_count
            FROM candidates c
            JOIN elections e ON c.election_id = e.election_id
            LEFT JOIN users u ON c.id_number = u.id_number
            LEFT JOIN votes v ON c.id_number = v.candidate_id AND e.election_id = v.election_id
            WHERE e.deleted_at IS NULL AND e.is_close = 0 AND c.deleted IS NULL AND c.enabled = 1
            GROUP BY c.election_id, u.id_number, c.position, v.election_id, c.department, c.vote_count
            ORDER BY lastname
        `;
            const candidatesData = yield (0, query_1.selectQuery)(database_1.pool, sqlQuery);
            res.status(200).json({ candidatesData });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.getAllcandidatesInActiveElection = getAllcandidatesInActiveElection;
