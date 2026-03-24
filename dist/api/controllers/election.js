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
exports.votingModeEngagement = exports.departmentTurnoutPercentage = exports.yearLevelTurnoutPercentage = exports.completedElectionsTotalVoted = exports.getTotalVotedInElectionByProgram = exports.getTotalPopulationByProgram = exports.getNumberOfVoted = exports.getElectionPopulation = exports.closeElectionDashboard = exports.updateElectionStatus = exports.updateElection = exports.deleteElection = exports.findElectionByID = exports.createElection = void 0;
const database_1 = require("../../config/database");
const ulid_1 = require("ulid");
const customErrors_1 = require("../../utils/customErrors");
const query_1 = require("../../data_access/query");
const checkElectionTimeStatus_1 = require("../../utils/checkElectionTimeStatus");
const globalEventEmitterInstance_1 = require("../../events/globalEventEmitterInstance");
const voterService_1 = require("../../data_access/voterService");
const election_1 = require("../../data_access/election");
function createElection(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { election_name, date_start, time_start, date_end, time_end } = req.body;
            if (!election_name || !date_start || !time_start || !date_end || !time_end) {
                return next(new customErrors_1.BadRequestError("Bad request, some required data is missing"));
            }
            const openElection = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE is_active = 1 AND (date_end > CURRENT_DATE OR (date_end = CURRENT_DATE AND time_end > CURTIME())) AND deleted_at IS NULL');
            if (openElection.length > 0)
                throw new customErrors_1.ConflictError('An active election is currently running');
            const election_id = (0, ulid_1.ulid)();
            const totalQualifiedVoter = yield (0, voterService_1.countAllQualifiedVoterForElection)();
            const connection = yield database_1.pool.getConnection();
            try {
                yield connection.beginTransaction();
                const query = "INSERT INTO elections (election_id, election_name, date_start, time_start, date_end, time_end, total_populations) VALUES (?, ?, ?, ?, ?, ?, ?)";
                const values = [election_id, election_name, date_start, time_start, date_end, time_end, totalQualifiedVoter];
                yield connection.execute(query, values);
                const departments = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
                const prgrams = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM programs WHERE deleted_at IS NULL');
                for (const department of departments) {
                    const programs = prgrams.filter(program => program.department === department.department_id).map(program => program.program_code);
                    const [countDepartmentPopulation] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT COUNT(*) as population FROM users WHERE course IN (?) AND is_active = 1', [programs]);
                    const insertProgramPopulationQuery = 'INSERT INTO program_populations (program_code, program_population, election_id) VALUES(?, ?, ?)';
                    yield connection.execute(insertProgramPopulationQuery, [department.department_code, countDepartmentPopulation.population, election_id]);
                }
                yield connection.commit();
                // Emit an event to register voters for election that just created
                globalEventEmitterInstance_1.eventEmitter.emit('addCandidateEvent', election_id);
                res.status(201).json({ message: "Election created" });
            }
            catch (error) {
                yield connection.rollback();
                next(error);
            }
            finally {
                yield connection.release();
            }
        }
        catch (error) {
            next(error);
        }
    });
}
exports.createElection = createElection;
/**
 * Function for searching specific election event based on id.
 * - assumes election_id is passed in req.query
 * - server will search election_id and response the resource back to client
 */
function findElectionByID(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const election_id = req.params.id;
            if (!election_id)
                return next(new customErrors_1.BadRequestError("Cannot find Election if election_id is missing"));
            const query = "SELECT * FROM elections WHERE election_id = ? AND deleted_at IS NULL LIMIT 1";
            const value = [election_id];
            const result = yield (0, query_1.selectQuery)(database_1.pool, query, value);
            if (result.length < 1) {
                return next(new customErrors_1.NotFoundError());
            }
            res.status(200).json({ election: result[0] });
        }
        catch (error) {
            return next(error);
        }
    });
}
exports.findElectionByID = findElectionByID;
function deleteElection(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield database_1.pool.getConnection(); // Get a connection from the pool
        try {
            const election_id = req.params.id;
            if (!election_id) {
                return next(new customErrors_1.BadRequestError("Election Id is missing"));
            }
            const [election] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE election_id = ? LIMIT 1', [election_id]);
            if ((0, checkElectionTimeStatus_1.isElectionStarted)(election))
                throw new customErrors_1.BadRequestError('Cannot delete an election that has already started.');
            if ((0, checkElectionTimeStatus_1.isElectionEnded)(election))
                throw new customErrors_1.BadRequestError('Cannot delete an election that has already ended.');
            yield connection.beginTransaction(); // Start the transaction
            // Update the election with a soft delete
            const updateQuery = "UPDATE elections SET deleted_at = CURRENT_TIMESTAMP WHERE election_id = ? LIMIT 1";
            const [updateResult] = yield connection.query(updateQuery, [election_id]);
            if (updateResult.affectedRows === 0) {
                yield connection.rollback(); // Roll back the transaction if no rows were updated
                return next(new customErrors_1.NotFoundError("No changes were made"));
            }
            // Delete voters associated with this election
            const deleteVotersQuery = 'DELETE FROM voters WHERE election_id = ?';
            yield connection.query(deleteVotersQuery, [election_id]);
            yield connection.commit();
            res.sendStatus(200);
        }
        catch (error) {
            yield connection.rollback();
            return next(error);
        }
        finally {
            connection.release();
        }
    });
}
exports.deleteElection = deleteElection;
function updateElection(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const election_id = req.params.id;
            const { election_name, date_start, time_start, date_end, time_end } = req.body;
            if (!election_name || !date_start || !time_start || !date_end || !time_end) {
                return next(new customErrors_1.BadRequestError());
            }
            const query = "UPDATE elections SET election_name = ?, date_start= ?, time_start = ?, date_end = ?, time_end = ? WHERE election_id = ? AND deleted_at IS NULL LIMIT 1";
            const parameter = [election_name, date_start, time_start, date_end, time_end, election_id];
            const result = yield (0, query_1.updateQuery)(database_1.pool, query, parameter);
            if (result.affectedRows < 1) {
                return next(new customErrors_1.NotFoundError("No changes were made"));
            }
            res.status(200).end();
        }
        catch (error) {
            next(error);
        }
    });
}
exports.updateElection = updateElection;
function updateElectionStatus(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const electionID = req.params.id;
            const electionStatus = req.query.status;
            if (!electionID || !electionStatus)
                return next(new customErrors_1.BadRequestError());
            const [election] = yield (0, query_1.selectQuery)(database_1.pool, 'SELECT * FROM elections WHERE election_id = ?', [electionID]);
            const isElectionEnd = (0, checkElectionTimeStatus_1.isElectionEnded)(election);
            // if request is to activate the election, check first if there is active election running before allowing to activate the election except for active election but already ended.
            if (electionStatus === '1' && !isElectionEnd) {
                const activeElection = yield (0, query_1.selectQuery)(database_1.pool, `SELECT * FROM elections WHERE is_active = 1 AND (date_end > CURDATE() OR (date_end = CURDATE() AND time_end > CURTIME())) AND deleted_at IS NULL`);
                if (activeElection.length > 0)
                    throw new customErrors_1.BadRequestError('An active election is currently running');
            }
            const query = "UPDATE elections SET is_active = ? WHERE election_id = ? AND deleted_at IS NULL";
            const sqlParams = [electionStatus, electionID];
            const result = yield (0, query_1.updateQuery)(database_1.pool, query, sqlParams);
            if (result.affectedRows < 1)
                return next(new customErrors_1.NotFoundError(`Updating election ${electionID} dont affect, Resource may not found`));
            return res.status(200).json({ result });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.updateElectionStatus = updateElectionStatus;
function closeElectionDashboard(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const electionId = req.params.id;
            if (!electionId)
                throw new customErrors_1.BadRequestError('Election Id is missing!');
            const updateResult = yield (0, query_1.updateQuery)(database_1.pool, 'UPDATE elections SET is_close = 1 WHERE election_id = ?', [electionId]);
            if (updateResult.affectedRows === 0)
                throw new customErrors_1.BadRequestError('No changes were made, election not found');
            return res.status(200).json({ message: 'Election successfully closed' });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.closeElectionDashboard = closeElectionDashboard;
function getElectionPopulation(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const electionIdQueryParams = req.query.election_id;
            if (!electionIdQueryParams)
                throw new customErrors_1.BadRequestError('No election id provided');
            const electionIdArray = Array.isArray(electionIdQueryParams) ? electionIdQueryParams : [electionIdQueryParams];
            const sqlQuery = `SELECT election_id, total_populations FROM elections WHERE election_id IN (?)`;
            const elections = yield (0, query_1.selectQuery)(database_1.pool, sqlQuery, [electionIdArray]);
            return res.status(200).json({ elections });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.getElectionPopulation = getElectionPopulation;
function getNumberOfVoted(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const electionIdQueryParams = req.query.election_id;
            if (!electionIdQueryParams)
                throw new customErrors_1.BadRequestError('No election id provided');
            const electionIdArray = Array.isArray(electionIdQueryParams) ? electionIdQueryParams : [electionIdQueryParams];
            const sqlQuery = `SELECT election_id, COUNT(DISTINCT voter_id) as voted FROM votes WHERE election_id IN (?) GROUP BY election_id`;
            const elections = yield (0, query_1.selectQuery)(database_1.pool, sqlQuery, [electionIdArray]);
            return res.status(200).json({ elections });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.getNumberOfVoted = getNumberOfVoted;
function getTotalPopulationByProgram(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const electionIdQueryParams = req.query.election_id;
            if (!electionIdQueryParams)
                throw new customErrors_1.BadRequestError('No election id provided');
            const electionIdArray = Array.isArray(electionIdQueryParams) ? electionIdQueryParams : [electionIdQueryParams];
            const electionsDepartmentPopulation = yield (0, election_1.getDepartmentsTotalPopulation)(electionIdArray);
            return res.status(200).json({ electionPopulationSummary: electionsDepartmentPopulation });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.getTotalPopulationByProgram = getTotalPopulationByProgram;
function getTotalVotedInElectionByProgram(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let electionIdQueryParams = req.query.election_id;
            if (!electionIdQueryParams)
                throw new customErrors_1.BadRequestError('No election id provided');
            electionIdQueryParams = Array.isArray(electionIdQueryParams) ? electionIdQueryParams : [electionIdQueryParams];
            const departmentVoteSummary = yield (0, election_1.getDepartmentsTotalVotes)(electionIdQueryParams);
            return res.status(200).json({ electionVoteSummary: departmentVoteSummary });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.getTotalVotedInElectionByProgram = getTotalVotedInElectionByProgram;
function completedElectionsTotalVoted(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const completedElections = yield (0, election_1.getAllCompleteElection)();
            const noTotalVotedElection = completedElections.filter(election => election.total_voted === null);
            if (noTotalVotedElection.length > 0) {
                const countTotalVotedQuery = `SELECT election_id, COUNT(DISTINCT voter_id) as total_voted FROM votes WHERE election_id = ?`;
                for (const election of noTotalVotedElection) {
                    const [totalVoted] = yield (0, query_1.selectQuery)(database_1.pool, countTotalVotedQuery, [election.election_id]);
                    // Set total voted in election
                    yield (0, query_1.updateQuery)(database_1.pool, 'UPDATE elections SET total_voted = ? WHERE election_id = ?', [totalVoted.total_voted, election.election_id]);
                    // Update total voted property of previous null value, in elections with no total
                    completedElections.forEach(completeElection => {
                        if (completeElection.election_id === election.election_id) {
                            completeElection.total_voted = totalVoted.total_voted;
                        }
                    });
                }
            }
            res.json({ completedElections });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.completedElectionsTotalVoted = completedElectionsTotalVoted;
function yearLevelTurnoutPercentage(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sqlQuery = `
			SELECT
				users.year_level,
				elections.election_id,
				COUNT(DISTINCT voters.id_number) AS total_voters,
				COUNT(DISTINCT CASE WHEN votes.voter_id IS NOT NULL THEN votes.voter_id END) AS total_voted
			FROM voters
			LEFT JOIN users ON voters.id_number = users.id_number
			LEFT JOIN votes ON voters.id_number = votes.voter_id AND voters.election_id = votes.election_id
			LEFT JOIN elections ON voters.election_id = elections.election_id
			WHERE (elections.date_end < CURDATE() 
				OR (elections.date_end = CURDATE() AND elections.time_end < CURTIME()))
			AND elections.deleted_at IS NULL
			AND users.is_active = 1
			GROUP BY users.year_level, elections.election_id
			ORDER BY elections.date_end ASC, elections.time_end ASC
		`;
            const result = yield (0, query_1.selectQuery)(database_1.pool, sqlQuery);
            const turnoutPerYearLevel = result.map(election => {
                const turnOutPercentage = ((election.total_voted / election.total_voters) * 100).toFixed(2);
                return {
                    electionId: election.election_id,
                    turnOutPercentage: turnOutPercentage,
                    yearLevel: election.year_level,
                    totalVoter: election.total_voters,
                    totalVoted: election.total_voted,
                };
            });
            return res.status(200).json({ turnoutPerYearLevel });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.yearLevelTurnoutPercentage = yearLevelTurnoutPercentage;
function departmentTurnoutPercentage(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sqlQuery = `
			SELECT
				departments.department_code,
				elections.election_id,
				COUNT(DISTINCT voters.id_number) AS total_voters,
				COUNT(DISTINCT CASE WHEN votes.voter_id IS NOT NULL AND votes.election_id = elections.election_id THEN votes.voter_id END) AS total_voted
			FROM voters
			LEFT JOIN users ON voters.id_number = users.id_number
			LEFT JOIN votes ON votes.voter_id = users.id_number AND votes.election_id = voters.election_id
			LEFT JOIN programs ON programs.program_code = users.course
			LEFT JOIN departments ON programs.department = departments.department_id
			LEFT JOIN elections ON elections.election_id = voters.election_id
			WHERE (elections.date_end < CURDATE()
				OR (elections.date_end = CURDATE() AND elections.time_end < CURTIME()))
			AND elections.deleted_at IS NULL
			AND programs.deleted_at IS NULL
			AND users.course IS NOT NULL
			AND users.is_active = 1
			GROUP BY elections.election_id, departments.department_code
			ORDER BY elections.date_end ASC, elections.time_end ASC, departments.department_code;
			`;
            const result = yield (0, query_1.selectQuery)(database_1.pool, sqlQuery);
            const turnoutPerDepartment = result.map(election => {
                const turnOutPercentage = ((election.total_voted / election.total_voters) * 100).toFixed(2);
                return {
                    electionId: election.election_id,
                    turnOutPercentage: turnOutPercentage,
                    department: election.department_code,
                    totalVoter: election.total_voters,
                    totalVoted: election.total_voted,
                };
            });
            return res.status(200).json({ turnoutPerDepartment });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.departmentTurnoutPercentage = departmentTurnoutPercentage;
function votingModeEngagement(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sqlQuery = `
			SELECT
				e.election_id, 
				COUNT(CASE WHEN v.voting_mode = 'ON-SITE' THEN 1 END) as voted_onsite, 
				COUNT(CASE WHEN v.voting_mode = 'ONLINE' THEN 1 END) as voted_online, 
				COUNT(DISTINCT votes.voter_id) AS total_voted
			FROM voters v
			LEFT JOIN elections e ON e.election_id = v.election_id
			LEFT JOIN (SELECT DISTINCT voter_id, election_id FROM votes) votes ON votes.voter_id = v.id_number AND votes.election_id = v.election_id
			WHERE (e.date_end < CURDATE()
				OR (e.date_end = CURDATE() AND e.time_end < CURTIME()))
				AND e.deleted_at IS NULL
			GROUP BY e.election_id
			ORDER BY e.date_end ASC, e.time_end ASC;	
		`;
            const queryResult = yield (0, query_1.selectQuery)(database_1.pool, sqlQuery);
            const votingModeSummary = queryResult.map(result => {
                const totalVoted = Number(result.total_voted) || 0;
                const voteOnsitePercentage = totalVoted > 0 && result.voted_onsite
                    ? Number(((result.voted_onsite / totalVoted) * 100).toFixed(2))
                    : 0;
                const voteOnlinePercentage = totalVoted > 0 && result.voted_online
                    ? Number(((result.voted_online / totalVoted) * 100).toFixed(2))
                    : 0;
                return Object.assign(Object.assign({}, result), { onsite_vote_percentage: voteOnsitePercentage, online_vote_percentage: voteOnlinePercentage });
            });
            res.status(200).json({ votingModeSummary });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.votingModeEngagement = votingModeEngagement;
