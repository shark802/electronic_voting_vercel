import { Request, Response, NextFunction } from "express";
import { pool } from "../../config/database";
import { ulid } from "ulid"
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/customErrors";
import { Election } from "../../utils/types/Election";
import { selectQuery, updateQuery } from "../../data_access/query";
import { isElectionEnded, isElectionStarted } from '../../utils/checkElectionTimeStatus';
import { eventEmitter } from '../../events/globalEventEmitterInstance';
import { countAllQualifiedVoterForElection } from "../../data_access/voterService";
import { getAllCompleteElection, getDepartmentsTotalPopulation, getDepartmentsTotalVotes } from "../../data_access/election";
import { ResultSetHeader } from "mysql2";
import { Department } from "../../utils/types/Department";
import { Program } from "../../utils/types/Program";


export async function createElection(req: Request, res: Response, next: NextFunction) {
	try {
		const { election_name, date_start, time_start, date_end, time_end } = req.body;
		if (!election_name || !date_start || !time_start || !date_end || !time_end) {
			return next(new BadRequestError("Bad request, some required data is missing"));
		}

		const openElection = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE is_active = 1 AND (date_end > CURRENT_DATE OR (date_end = CURRENT_DATE AND time_end > CURTIME())) AND deleted_at IS NULL');
		if (openElection.length > 0) throw new ConflictError('An active election is currently running');

		const election_id = ulid();
		const totalQualifiedVoter = await countAllQualifiedVoterForElection();

		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			const query = "INSERT INTO elections (election_id, election_name, date_start, time_start, date_end, time_end, total_populations) VALUES (?, ?, ?, ?, ?, ?, ?)";
			const values = [election_id, election_name, date_start, time_start, date_end, time_end, totalQualifiedVoter];

			await connection.execute(query, values);

			const departments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
			const prgrams = await selectQuery<Program>(pool, 'SELECT * FROM programs WHERE deleted_at IS NULL');

			for (const department of departments) {
				const programs = prgrams.filter(program => program.department === department.department_id).map(program => program.program_code);

				const [countDepartmentPopulation] = await selectQuery<{ population: number }>(pool, 'SELECT COUNT(*) as population FROM users WHERE course IN (?) AND is_active = 1', [programs])

				const insertProgramPopulationQuery = 'INSERT INTO program_populations (program_code, program_population, election_id) VALUES(?, ?, ?)';
				await connection.execute(insertProgramPopulationQuery, [department.department_code, countDepartmentPopulation.population, election_id]);
			}

			await connection.commit();

			// Emit an event to register voters for election that just created
			eventEmitter.emit('addCandidateEvent', election_id);

			res.status(201).json({ message: "Election created" });
		} catch (error) {
			await connection.rollback();
			next(error)
		} finally {
			await connection.release();
		}

	} catch (error) {
		next(error);
	}
}


/**
 * Function for searching specific election event based on id.
 * - assumes election_id is passed in req.query
 * - server will search election_id and response the resource back to client
 */
export async function findElectionByID(req: Request, res: Response, next: NextFunction) {
	try {
		const election_id = req.params.id
		if (!election_id) return next(new BadRequestError("Cannot find Election if election_id is missing"))

		const query = "SELECT * FROM elections WHERE election_id = ? AND deleted_at IS NULL LIMIT 1"
		const value = [election_id]
		const result = await selectQuery<Election>(pool, query, value)

		if (result.length < 1) {
			return next(new NotFoundError())
		}

		res.status(200).json({ election: result[0] })
	} catch (error) {
		return next(error)
	}
}

export async function deleteElection(req: Request, res: Response, next: NextFunction) {
	const connection = await pool.getConnection(); // Get a connection from the pool
	try {
		const election_id = req.params.id;

		if (!election_id) {
			return next(new BadRequestError("Election Id is missing"));
		}

		const [election] = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE election_id = ? LIMIT 1', [election_id]);
		if (isElectionStarted(election)) throw new BadRequestError('Cannot delete an election that has already started.');
		if (isElectionEnded(election)) throw new BadRequestError('Cannot delete an election that has already ended.');

		await connection.beginTransaction(); // Start the transaction

		// Update the election with a soft delete
		const updateQuery = "UPDATE elections SET deleted_at = CURRENT_TIMESTAMP WHERE election_id = ? LIMIT 1";
		const [updateResult] = await connection.query<ResultSetHeader>(updateQuery, [election_id]);

		if (updateResult.affectedRows === 0) {
			await connection.rollback(); // Roll back the transaction if no rows were updated
			return next(new NotFoundError("No changes were made"));
		}

		// Delete voters associated with this election
		const deleteVotersQuery = 'DELETE FROM voters WHERE election_id = ?';
		await connection.query(deleteVotersQuery, [election_id]);

		await connection.commit();

		res.sendStatus(200);
	} catch (error) {
		await connection.rollback();
		return next(error);
	} finally {
		connection.release();
	}
}


export async function updateElection(req: Request, res: Response, next: NextFunction) {
	try {
		const election_id = req.params.id
		const { election_name, date_start, time_start, date_end, time_end } = req.body

		if (!election_name || !date_start || !time_start || !date_end || !time_end) {
			return next(new BadRequestError())
		}

		const query = "UPDATE elections SET election_name = ?, date_start= ?, time_start = ?, date_end = ?, time_end = ? WHERE election_id = ? AND deleted_at IS NULL LIMIT 1"
		const parameter = [election_name, date_start, time_start, date_end, time_end, election_id];

		const result = await updateQuery(pool, query, parameter)

		if (result.affectedRows < 1) {
			return next(new NotFoundError("No changes were made"))
		}

		res.status(200).end()

	} catch (error) {
		next(error)
	}
}

export async function updateElectionStatus(req: Request, res: Response, next: NextFunction) {
	try {
		const electionID = req.params.id;
		const electionStatus = req.query.status
		if (!electionID || !electionStatus) return next(new BadRequestError());

		const [election] = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE election_id = ?', [electionID]);
		const isElectionEnd = isElectionEnded(election);

		// if request is to activate the election, check first if there is active election running before allowing to activate the election except for active election but already ended.
		if ((electionStatus as string) === '1' && !isElectionEnd) {
			const activeElection = await selectQuery<Election>(pool, `SELECT * FROM elections WHERE is_active = 1 AND (date_end > CURDATE() OR (date_end = CURDATE() AND time_end > CURTIME())) AND deleted_at IS NULL`);
			if (activeElection.length > 0) throw new BadRequestError('An active election is currently running')
		}

		const query = "UPDATE elections SET is_active = ? WHERE election_id = ? AND deleted_at IS NULL";
		const sqlParams = [electionStatus, electionID]
		const result = await updateQuery(pool, query, sqlParams);

		if (result.affectedRows < 1) return next(new NotFoundError(`Updating election ${electionID} dont affect, Resource may not found`));
		return res.status(200).json({ result });

	} catch (error) {
		next(error);
	}
}

export async function closeElectionDashboard(req: Request, res: Response, next: NextFunction) {
	try {
		const electionId = req.params.id;
		if (!electionId) throw new BadRequestError('Election Id is missing!');

		const updateResult = await updateQuery(pool, 'UPDATE elections SET is_close = 1 WHERE election_id = ?', [electionId]);
		if (updateResult.affectedRows === 0) throw new BadRequestError('No changes were made, election not found');

		return res.status(200).json({ message: 'Election successfully closed' })

	} catch (error) {
		next(error);
	}
}

export async function getElectionPopulation(req: Request, res: Response, next: NextFunction) {
	try {

		const electionIdQueryParams = req.query.election_id;
		if (!electionIdQueryParams) throw new BadRequestError('No election id provided');

		const electionIdArray = Array.isArray(electionIdQueryParams) ? electionIdQueryParams as string[] : [electionIdQueryParams as string];

		const sqlQuery = `SELECT election_id, total_populations FROM elections WHERE election_id IN (?)`
		const elections = await selectQuery(pool, sqlQuery, [electionIdArray]);

		return res.status(200).json({ elections })
	} catch (error) {
		next(error);
	}
}

export async function getNumberOfVoted(req: Request, res: Response, next: NextFunction) {
	try {

		const electionIdQueryParams = req.query.election_id;
		if (!electionIdQueryParams) throw new BadRequestError('No election id provided');

		const electionIdArray = Array.isArray(electionIdQueryParams) ? electionIdQueryParams as string[] : [electionIdQueryParams as string];

		const sqlQuery = `SELECT election_id, COUNT(DISTINCT voter_id) as voted FROM votes WHERE election_id IN (?) GROUP BY election_id`
		const elections = await selectQuery(pool, sqlQuery, [electionIdArray]);
		return res.status(200).json({ elections })

	} catch (error) {
		next(error)
	}
}

export async function getTotalPopulationByProgram(req: Request, res: Response, next: NextFunction) {
	try {
		const electionIdQueryParams = req.query.election_id;
		if (!electionIdQueryParams) throw new BadRequestError('No election id provided');

		const electionIdArray = Array.isArray(electionIdQueryParams) ? electionIdQueryParams as string[] : [electionIdQueryParams as string];
		const electionsDepartmentPopulation = await getDepartmentsTotalPopulation(electionIdArray);

		return res.status(200).json({ electionPopulationSummary: electionsDepartmentPopulation });
	} catch (error) {
		next(error)
	}
}

export async function getTotalVotedInElectionByProgram(req: Request, res: Response, next: NextFunction) {
	try {
		let electionIdQueryParams = req.query.election_id;

		if (!electionIdQueryParams) throw new BadRequestError('No election id provided');

		electionIdQueryParams = Array.isArray(electionIdQueryParams) ? electionIdQueryParams : [electionIdQueryParams as string];

		const departmentVoteSummary = await getDepartmentsTotalVotes(electionIdQueryParams as string[]);
		return res.status(200).json({ electionVoteSummary: departmentVoteSummary });
	} catch (error) {
		next(error);
	}
}

export async function completedElectionsTotalVoted(req: Request, res: Response, next: NextFunction) {
	try {

		const completedElections = await getAllCompleteElection()

		const noTotalVotedElection = completedElections.filter(election => election.total_voted === null);
		if (noTotalVotedElection.length > 0) {
			type voted = {
				election_id: string;
				total_voted: number;
			}

			const countTotalVotedQuery = `SELECT election_id, COUNT(DISTINCT voter_id) as total_voted FROM votes WHERE election_id = ?`

			for (const election of noTotalVotedElection) {

				const [totalVoted] = await selectQuery<voted>(pool, countTotalVotedQuery, [election.election_id]);

				// Set total voted in election
				await updateQuery(pool, 'UPDATE elections SET total_voted = ? WHERE election_id = ?', [totalVoted.total_voted, election.election_id]);

				// Update total voted property of previous null value, in elections with no total
				completedElections.forEach(completeElection => {
					if (completeElection.election_id === election.election_id) {
						completeElection.total_voted = totalVoted.total_voted
					}
				})
			}
		}

		res.json({ completedElections });
	} catch (error) {
		next(error)
	}
}

export async function yearLevelTurnoutPercentage(req: Request, res: Response, next: NextFunction) {
	try {

		type TurnoutPerYear = {
			election_id: string;
			total_voted: number;
			total_voters: number;
			year_level: number;
		}

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
		`
		const result = await selectQuery<TurnoutPerYear>(pool, sqlQuery);
		const turnoutPerYearLevel = result.map(election => {
			const turnOutPercentage = ((election.total_voted / election.total_voters) * 100).toFixed(2);

			return {
				electionId: election.election_id,
				turnOutPercentage: turnOutPercentage,
				yearLevel: election.year_level,
				totalVoter: election.total_voters,
				totalVoted: election.total_voted,
			}
		});

		return res.status(200).json({ turnoutPerYearLevel })

	} catch (error) {
		next(error);
	}
}

export async function departmentTurnoutPercentage(req: Request, res: Response, next: NextFunction) {
	try {

		type TurnoutPerYear = {
			election_id: string;
			total_voted: number;
			total_voters: number;
			department_code: string;
		}

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
			`
		const result = await selectQuery<TurnoutPerYear>(pool, sqlQuery);
		const turnoutPerDepartment = result.map(election => {
			const turnOutPercentage = ((election.total_voted / election.total_voters) * 100).toFixed(2);

			return {
				electionId: election.election_id,
				turnOutPercentage: turnOutPercentage,
				department: election.department_code,
				totalVoter: election.total_voters,
				totalVoted: election.total_voted,
			}
		});

		return res.status(200).json({ turnoutPerDepartment })

	} catch (error) {
		next(error)
	}
}

export async function votingModeEngagement(req: Request, res: Response, next: NextFunction) {
	try {

		type VoteMode = {
			election_id: string
			voted_onsite: number
			voted_online: number
			total_voted: number
		}

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
		`

		const queryResult = await selectQuery<VoteMode>(pool, sqlQuery);

		const votingModeSummary = queryResult.map(result => {
			const totalVoted = Number(result.total_voted) || 0;

			const voteOnsitePercentage = totalVoted > 0 && result.voted_onsite
				? Number(((result.voted_onsite / totalVoted) * 100).toFixed(2))
				: 0;

			const voteOnlinePercentage = totalVoted > 0 && result.voted_online
				? Number(((result.voted_online / totalVoted) * 100).toFixed(2))
				: 0;


			return {
				...result,
				onsite_vote_percentage: voteOnsitePercentage,
				online_vote_percentage: voteOnlinePercentage,
			};
		});

		res.status(200).json({ votingModeSummary });

	} catch (error) {
		next(error)
	}
}