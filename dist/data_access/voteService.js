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
exports.getVoterDepartment = exports.updateVoterVoteStatus = exports.incrementCandidateVoteCount = exports.saveVote = exports.checkIfUserHasVoted = void 0;
const query_1 = require("./query");
const database_1 = require("../config/database");
const customErrors_1 = require("../utils/customErrors");
const cryptoService_1 = require("../utils/cryptoService");
const ulid_1 = require("ulid");
function checkIfUserHasVoted(userId, electionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const getUserVoteHistory = yield (0, query_1.selectQuery)(database_1.pool, "SELECT * FROM votes WHERE voter_id = ? AND election_id = ?", [userId, electionId]);
        return getUserVoteHistory.length > 0; // return true if the result is not zero, false otherwise
    });
}
exports.checkIfUserHasVoted = checkIfUserHasVoted;
function saveVote(connection, selectedCandidateObject, userId, electionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const placeholders = selectedCandidateObject.map(() => "(?, ?, ?, ?, ?)").join(", ");
        const insertParameters = selectedCandidateObject.reduce((params, candidate) => {
            const secretKey = cryptoService_1.CryptoService.secretKey();
            const iv = cryptoService_1.CryptoService.generateIv();
            const bufferIv = cryptoService_1.CryptoService.stringToBuffer(iv);
            const decryptVote = cryptoService_1.CryptoService.encrypt(candidate.id_number, secretKey, bufferIv);
            params.push(userId, decryptVote, candidate.position, iv, electionId);
            return params;
        }, []);
        const prepareStatement = `INSERT INTO votes (voter_id, candidate_id, position, encryption_iv, election_id) VALUES ${placeholders}`;
        yield connection.execute(prepareStatement, insertParameters);
        return;
    });
}
exports.saveVote = saveVote;
function incrementCandidateVoteCount(connection, selectedCandidates, electionId) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const candidate of selectedCandidates) {
            const [selectResult] = yield connection.execute("SELECT * FROM candidates WHERE id_number = ? AND election_id = ? FOR UPDATE", [candidate.id_number, electionId]);
            if (selectResult.length === 0)
                throw new Error(`Candidate with id ${candidate.id_number} and election id ${electionId} not found`);
            const [updateResult] = yield connection.execute("UPDATE candidates SET vote_count = vote_count + 1 WHERE id_number = ? AND election_id = ?", [candidate.id_number, electionId]);
            if (updateResult.affectedRows === 0)
                throw new Error(`Failed to update vote count for candidate id ${candidate.id_number} and election id ${electionId}`);
        }
    });
}
exports.incrementCandidateVoteCount = incrementCandidateVoteCount;
function updateVoterVoteStatus(connection, userId, electionId, isFaceVerified) {
    return __awaiter(this, void 0, void 0, function* () {
        const votingMode = isFaceVerified ? 'ONLINE' : 'ON-SITE';
        const voterId = (0, ulid_1.ulid)();
        try {
            // First try to update existing voter
            const [updateVoteStatusResult] = yield connection.execute('UPDATE voters SET voted = 1, voting_mode = ? WHERE id_number = ? AND election_id = ?', [votingMode, userId, electionId]);
            // If no voter exists, create a new one
            if (updateVoteStatusResult.affectedRows === 0) {
                // Create new voter record
                yield connection.execute('INSERT INTO voters (voter_id, id_number, election_id, voted, voting_mode) VALUES (?, ?, ?, 1, ?)', [voterId, userId, electionId, votingMode]);
            }
            return;
        }
        catch (error) {
            if (error instanceof customErrors_1.NotFoundError) {
                throw error;
            }
            throw new Error('Failed to update or create voter status');
        }
    });
}
exports.updateVoterVoteStatus = updateVoterVoteStatus;
function getVoterDepartment(user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
        SELECT departments.department_code
        FROM users
        LEFT JOIN programs ON programs.program_code = users.course
        LEFT JOIN departments ON departments.department_id = programs.department
        WHERE users.id_number = ?
        LIMIT 1
    `;
        const [department] = yield (0, query_1.selectQuery)(database_1.pool, query, [user_id]);
        return department.department_code;
    });
}
exports.getVoterDepartment = getVoterDepartment;
