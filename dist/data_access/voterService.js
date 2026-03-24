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
exports.getAllNotVotedInElection = exports.countAllQualifiedVoterForElection = exports.getAllUserElectionParticipatedIn = exports.findOneUserVotedInElection = exports.getAllRecentUsersVotedInElection = exports.getAllRecentUsersVoted = exports.getAllVoterInElection = void 0;
const database_1 = require("../config/database");
const query_1 = require("./query");
function getAllVoterInElection(electionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const selectAllVoterQuery = `
        SELECT u.id_number, u.firstname, u.lastname, u.course, u.year_level, u.section, v.election_id, v.voted
        FROM users u
        JOIN voters v
        ON u.id_number = v.id_number
        WHERE v.election_id = ?
        AND u.is_active = 1
        ORDER BY u.lastname
        `;
        const voters = yield (0, query_1.selectQuery)(database_1.pool, selectAllVoterQuery, [electionId]);
        return voters;
    });
}
exports.getAllVoterInElection = getAllVoterInElection;
// Select all recent log of user voted in the system with pagination
function getAllRecentUsersVoted() {
    return __awaiter(this, arguments, void 0, function* (page = 1, limit = 30) {
        var _a;
        const offset = (page - 1) * limit;
        const selectAllVotedQuery = `
        SELECT 
            u.id_number, 
            u.firstname, 
            u.lastname, 
            u.course, 
            u.year_level, 
            u.section, 
            v.election_id, 
            MIN(v.time_casted) AS time_casted, 
            e.election_name
        FROM users u
        JOIN votes v ON u.id_number = v.voter_id
        JOIN elections e ON v.election_id = e.election_id
        WHERE e.deleted_at IS NULL
        GROUP BY v.election_id, u.id_number
        ORDER BY time_casted DESC
        LIMIT ? OFFSET ?`;
        const countQuery = `
        SELECT COUNT(DISTINCT CONCAT(v.election_id, u.id_number)) as total
        FROM users u
        JOIN votes v ON u.id_number = v.voter_id
        JOIN elections e ON v.election_id = e.election_id
        WHERE e.deleted_at IS NULL`;
        const [voters, totalCount] = yield Promise.all([
            (0, query_1.selectQuery)(database_1.pool, selectAllVotedQuery, [limit, offset]),
            (0, query_1.selectQuery)(database_1.pool, countQuery)
        ]);
        const total = ((_a = totalCount[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        return {
            voters,
            total
        };
    });
}
exports.getAllRecentUsersVoted = getAllRecentUsersVoted;
// Select all recent user voted in one specific election with pagination
function getAllRecentUsersVotedInElection(electionId_1) {
    return __awaiter(this, arguments, void 0, function* (electionId, page = 1, limit = 30) {
        var _a;
        const offset = (page - 1) * limit;
        const selectAllVotedByElectionQuery = `
        SELECT 
            u.id_number, 
            u.firstname, 
            u.lastname, 
            u.course, 
            u.year_level, 
            u.section, 
            v.election_id, 
            MIN(v.time_casted) AS time_casted, 
            e.election_name
        FROM users u
        JOIN votes v ON u.id_number = v.voter_id
        JOIN elections e ON v.election_id = e.election_id
        WHERE v.election_id = ? AND e.deleted_at IS NULL
        GROUP BY v.election_id, u.id_number
        ORDER BY time_casted DESC
        LIMIT ? OFFSET ?`;
        const countQuery = `
        SELECT COUNT(DISTINCT u.id_number) as total
        FROM users u
        JOIN votes v ON u.id_number = v.voter_id
        JOIN elections e ON v.election_id = e.election_id
        WHERE v.election_id = ? AND e.deleted_at IS NULL`;
        const [voters, totalCount] = yield Promise.all([
            (0, query_1.selectQuery)(database_1.pool, selectAllVotedByElectionQuery, [electionId, limit, offset]),
            (0, query_1.selectQuery)(database_1.pool, countQuery, [electionId])
        ]);
        const total = ((_a = totalCount[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        return {
            voters,
            total
        };
    });
}
exports.getAllRecentUsersVotedInElection = getAllRecentUsersVotedInElection;
// function for finding voter base on id_number and election_id provided
function findOneUserVotedInElection(electionId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const findOneUserVotedInElectionQuery = `
        SELECT 
            u.id_number, 
            u.firstname, 
            u.lastname, 
            u.course, 
            u.year_level, 
            u.section, 
            v.election_id, 
            MIN(v.time_casted) AS time_casted, 
            e.election_name
        FROM users u
        JOIN votes v ON u.id_number = v.voter_id
        JOIN elections e ON v.election_id = e.election_id
        WHERE v.election_id = ? AND u.id_number = ? AND e.deleted_at IS NULL
        GROUP BY v.election_id, u.id_number
        ORDER BY time_casted DESC`;
        return yield (0, query_1.selectQuery)(database_1.pool, findOneUserVotedInElectionQuery, [electionId, userId]);
    });
}
exports.findOneUserVotedInElection = findOneUserVotedInElection;
// Select all election that user participated or voted in with pagination
function getAllUserElectionParticipatedIn(userId_1) {
    return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 30) {
        var _a;
        const offset = (page - 1) * limit;
        const getAllUserElectionParticipatedQuery = `
        SELECT 
            u.id_number, 
            u.firstname, 
            u.lastname, 
            u.course, 
            u.year_level, 
            u.section, 
            v.election_id, 
            MIN(v.time_casted) AS time_casted, 
            e.election_name
        FROM users u
        JOIN votes v ON u.id_number = v.voter_id
        JOIN elections e ON v.election_id = e.election_id
        WHERE u.id_number = ? AND e.deleted_at IS NULL
        GROUP BY v.election_id, u.id_number
        ORDER BY time_casted DESC
        LIMIT ? OFFSET ?`;
        const countQuery = `
        SELECT COUNT(DISTINCT v.election_id) as total
        FROM users u
        JOIN votes v ON u.id_number = v.voter_id
        JOIN elections e ON v.election_id = e.election_id
        WHERE u.id_number = ? AND e.deleted_at IS NULL`;
        const [voters, totalCount] = yield Promise.all([
            (0, query_1.selectQuery)(database_1.pool, getAllUserElectionParticipatedQuery, [userId, limit, offset]),
            (0, query_1.selectQuery)(database_1.pool, countQuery, [userId])
        ]);
        const total = ((_a = totalCount[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        return {
            voters,
            total
        };
    });
}
exports.getAllUserElectionParticipatedIn = getAllUserElectionParticipatedIn;
// Count all total voter for election
function countAllQualifiedVoterForElection() {
    return __awaiter(this, void 0, void 0, function* () {
        const [totalPopulation] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT COUNT(*) as total_population FROM users WHERE is_active = 1');
        return totalPopulation.total_population;
    });
}
exports.countAllQualifiedVoterForElection = countAllQualifiedVoterForElection;
// select all voters not voted in specific election
function getAllNotVotedInElection(electionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const sqlQuery = `
        SELECT u.id_number, u.firstname, u.lastname, u.course, u.year_level, u.section 
        FROM voters v
        JOIN users u
        ON v.id_number = u.id_number
        WHERE v.election_id = ? AND v.voted = 0
        ORDER BY u.lastname
    `;
        const voters = yield (0, query_1.selectQuery)(database_1.pool, sqlQuery, [electionId]);
        return voters;
    });
}
exports.getAllNotVotedInElection = getAllNotVotedInElection;
