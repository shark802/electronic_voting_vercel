import { Request, Response, NextFunction } from "express";
import { selectQuery } from "../../data_access/query";
import { Election } from "../../utils/types/Election";
import { pool } from "../../config/database";
import { RegisterDevice } from "../../utils/types/RegisterDevice";
import { findOneUserVotedInElection, getAllRecentUsersVoted, getAllRecentUsersVotedInElection, getAllUserElectionParticipatedIn } from "../../data_access/voterService";
import { getElectionInfoById, getElectionResult, generateElectionResult, getDepartmentsTotalVotes } from "../../data_access/election";
import { isElectionEnded } from "../../utils/checkElectionTimeStatus";
import { BadRequestError, NotFoundError } from "../../utils/customErrors";
import { Department } from "../../utils/types/Department";
import { Position } from "../../utils/types/Positions";
import { Program } from "../../utils/types/Program";
import { Candidate } from "../../utils/types/Candidate";
import { CryptoService } from "../../utils/cryptoService";


export async function dashboardOverview(req: Request, res: Response, next: NextFunction) {
    try {

        const elections = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE is_close = 0 AND deleted_at IS NULL ORDER BY date_start DESC, time_start DESC');

        const electionIdList = elections.map(election => election.election_id);
        let populationPerProgram: unknown[] = []

        if (electionIdList.length > 0) {
            populationPerProgram = await selectQuery(pool, 'SELECT * FROM program_populations WHERE election_id IN ( ? ) ORDER BY program_code', [electionIdList])
        }

        res.render("admin/dashboard_overview", { elections, populationPerProgram })
    } catch (error) {
        next(error)
    }
}

export async function dashboardVoteTally(req: Request, res: Response, next: NextFunction) {
    try {
        const elections = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE is_close = 0 AND deleted_at IS NULL ORDER BY date_start DESC, time_start DESC');

        // get all positions
        const positions = await selectQuery<Position>(pool, 'SELECT * FROM positions WHERE deleted_at IS NULL');
        const candidatePosition = positions.map(position => position.position);

        // get all departments
        const departments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
        const programs = departments.map(department => department.department_code);

        const electionIdList = elections.map(election => election.election_id);
        let candidates: unknown[] = []

        if (electionIdList.length > 0) {
            candidates = await selectQuery(pool, 'SELECT * FROM candidates WHERE election_id IN ( ? ) AND deleted IS NULL', [electionIdList])
        }

        res.render("admin/dashboard_vote_tally", { elections, candidatePosition, programs, candidates })
    } catch (error) {
        next(error)
    }
}

export async function electionAnalytics(req: Request, res: Response, next: NextFunction) {
    try {

        res.render("admin/dashboard_analytics")

    } catch (error) {
        next(error)
    }
}

// Election
export async function viewElection(req: Request, res: Response, next: NextFunction) {
    try {
        const query = "SELECT * FROM elections WHERE deleted_at IS NULL AND (date_end > CURDATE() OR (date_end = CURDATE() AND time_end > CURTIME())) ORDER BY created_at DESC";
        const elections = await selectQuery<Election>(pool, query)

        let candidates: Candidate[] = [];
        let positionName: string[] = []

        if (elections.length > 0) {
            candidates = await selectQuery<Candidate>(pool, 'SELECT * FROM candidates WHERE election_id IN(?) AND deleted IS NULL AND enabled = 1', [elections.map(election => election.election_id)])
            const positions = await selectQuery<Position>(pool, 'SELECT * FROM positions WHERE deleted_at IS NULL');
            positionName = positions.map(position => position.position);
        }
        res.render("admin/election_view", { elections, candidates, positions: positionName })
    } catch (error) {
        next(error);
    }
}

export function newElection(req: Request, res: Response, next: NextFunction) {
    try {
        res.render("admin/election_create")
    } catch (error) {
        next(error);
    }
}

export async function editElection(req: Request, res: Response, next: NextFunction) {
    try {
        const election_id = req.params.id;
        const query = "SELECT * FROM elections WHERE election_id = ?";
        const election = await selectQuery<Election>(pool, query, [election_id]);
        res.render("admin/election_edit", { election: election[0] });
    } catch (error) {
        next(error);
    }
};

export async function commpleteElectionResult(req: Request, res: Response, next: NextFunction) {
    try {
        const electionId = req.params.id;

        const election = await getElectionInfoById(electionId);
        const departments = await selectQuery<Program>(pool, 'SELECT * FROM program_populations WHERE election_id = ? ORDER BY program_code', [electionId]);

        res.render('admin/complete_election_report', { election, departments });
    } catch (error) {
        next(error)
    }
}

export async function viewElectionHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const query = "SELECT * FROM elections WHERE (date_end < CURDATE() OR (date_end = CURDATE() AND time_end < CURTIME())) AND deleted_at IS NULL ORDER BY date_end DESC, time_end DESC";
        const elections = await selectQuery<Election>(pool, query);

        let candidates: Candidate[] = [];
        let positionName: string[] = []

        if (elections.length > 0) {
            candidates = await selectQuery<Candidate>(pool, 'SELECT * FROM candidates WHERE election_id IN(?) AND deleted IS NULL AND enabled = 1', [elections.map(election => election.election_id)])
            const positions = await selectQuery<Position>(pool, 'SELECT * FROM positions WHERE deleted_at IS NULL');
            positionName = positions.map(position => position.position);
        }
        res.render("admin/election_history", { elections, candidates, positions: positionName });
    } catch (error) {
        next(error);
    }
}

export async function renderAdminElectionResult(req: Request, res: Response, next: NextFunction) {
    try {
        const electionId = req.params.id;

        if (!electionId) throw new BadRequestError('Election id is missing');

        // Single query to get election info and check if it exists
        const electionInfo = await getElectionInfoById(electionId);
        if (!electionInfo) throw new NotFoundError('Election not exist');

        if (!isElectionEnded(electionInfo)) {
            return res.redirect('/election?redirectMessage=Result Not Available Yet');
        }

        // Batch all static data queries that don't depend on electionId
        const [positions, departmentData] = await Promise.all([
            selectQuery<Position>(pool, 'SELECT * FROM positions WHERE deleted_at IS NULL'),
            selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL')
        ]);

        // Extract the data we need
        const positionList = positions.map(position => position.position);

        const departments = departmentData.map(department => department.department_code);

        // Batch all election-specific queries
        const [
            departmentsPopulation,
            totalVotedResult,
            departmentVoteSummary,
            electionResult
        ] = await Promise.all([
            selectQuery(pool, 'SELECT * FROM program_populations WHERE election_id = ?', [electionId]),
            selectQuery(pool, 'SELECT COUNT(DISTINCT voter_id) as total_voted FROM votes WHERE election_id = ?', [electionId]),
            getDepartmentsTotalVotes([electionId]),
            getElectionResult(electionId)
        ]);

        // Extract the data from query results
        const totalVoted = totalVotedResult[0] as any;
        const departmentVoteSummaryData = departmentVoteSummary[0] as any;

        // Handle election result decryption or generation
        let candidatesVoteTally;
        if (!electionResult) {
            candidatesVoteTally = await generateElectionResult(electionId);
        } else {
            const secretKey = CryptoService.secretKey();
            const iv = CryptoService.stringToBuffer(electionResult.encryption_iv);
            const decryptResult = CryptoService.decrypt(electionResult.result, secretKey, iv);
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
    } catch (error) {
        next(error);
    }
}

// Candidate
export async function manageCandidate(req: Request, res: Response, next: NextFunction) {
    try {
        const candidatePositions = await selectQuery<Position>(pool, 'SELECT * FROM positions WHERE deleted_at IS NULL');
        const positions = candidatePositions.map(position => position.position);

        const selectElectioQuery = "SELECT * FROM elections WHERE deleted_at IS NULL AND is_close = 0  ORDER BY created_at DESC";
        const elections = await selectQuery<Election>(pool, selectElectioQuery);

        res.render("admin/candidate_manage", { elections, positions })
    } catch (error) {
        next(error)
    }
}

export async function addCandidate(req: Request, res: Response, next: NextFunction) {
    try {
        const query = "SELECT * FROM elections WHERE deleted_at IS NULL AND (date_start > CURDATE() OR (date_start = CURDATE() AND time_start > CURTIME())) ORDER BY created_at DESC";
        const electionList = await selectQuery<Election>(pool, query);
        const candidatePositions = await selectQuery<Position>(pool, 'SELECT * FROM positions WHERE deleted_at IS NULL');

        const positions = candidatePositions.map(position => position.position);
        const departments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
        const programs = departments.map(department => department.department_code);

        res.render("admin/candidate_add", { electionList, positions, programs })
    } catch (error) {
        next(error)
    }
}

// Voter
export async function manageVoter(req: Request, res: Response, next: NextFunction) {
    try {
        const { election, user_id, page } = req.query;
        const currentPage = parseInt(page as string) || 1;
        const limit = 30;

        let result: { voters: unknown[], total: number };

        // Fetch all voted users based on filters with pagination
        if (election && user_id) {
            const voters = await findOneUserVotedInElection(election as string, user_id as string);
            result = { voters, total: voters.length };
        } else if (election && !user_id) {
            result = await getAllRecentUsersVotedInElection(election as string, currentPage, limit);
        } else if (user_id && !election) {
            result = await getAllUserElectionParticipatedIn(user_id as string, currentPage, limit);
        } else {
            result = await getAllRecentUsersVoted(currentPage, limit);
        }

        const totalPages = Math.ceil(result.total / limit);

        const availableElectionQuery = "SELECT * FROM elections WHERE (date_start < NOW() OR (date_start = CURDATE() AND time_start < CURTIME())) AND deleted_at IS NULL ORDER BY date_end DESC, time_end DESC";
        const availableElections = await selectQuery(pool, availableElectionQuery);

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
    } catch (error) {
        next(error);
    }
}

// Department
export async function manageDepartment(req: Request, res: Response, next: NextFunction) {
    try {
        const departments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
        res.render("admin/department_manage", { departments })
    } catch (error) {
        next(error)
    }
}

export async function departmentPrograms(req: Request, res: Response, next: NextFunction) {
    try {

        const departments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
        const programs = await selectQuery<Program>(pool, 'SELECT * FROM programs WHERE deleted_at IS NULL');

        res.render("admin/department_programs", { departments, programs })
    } catch (error) {
        next(error)
    }
}

// Register device
export async function reviewRegisterDevice(req: Request, res: Response, next: NextFunction) {
    try {
        const devices = await selectQuery<RegisterDevice>(pool, "SELECT * FROM register_devices WHERE is_registered = 0 AND deleted_at IS NULL ORDER BY date_created DESC")

        res.render("admin/register_device_review", { devices })
    } catch (error) {
        next(error)
    }
}

export async function viewRegisterDevice(req: Request, res: Response, next: NextFunction) {
    try {
        const registeredDevices = await selectQuery<RegisterDevice>(pool, 'SELECT * FROM register_devices WHERE is_registered = 1 AND deleted_at IS NULL ORDER BY updated_at DESC');
        res.render("admin/register_device_registered", { registeredDevices })
    } catch (error) {
        next(error)
    }
}

// Control Panel
export async function fetchUser(req: Request, res: Response, next: NextFunction) {

    try {
        const departmentData = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
        const programs = departmentData.map(department => department.department_code);

        const import_records = await selectQuery(pool, 'SELECT * FROM users_import_records ORDER BY import_date DESC');

        res.render("admin/control-panel-user", { programs, import_records })
    } catch (error) {
        next(error)
    }
}

export async function generalSettings(req: Request, res: Response, next: NextFunction) {
    try {

        const departments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
        res.render("admin/control-panel-general-settings", { departments })
    } catch (error) {
        next(error)
    }
}

export async function editCertification(req: Request, res: Response, next: NextFunction) {
    try {
        const election_id = req.params.id;
        // Get election details to verify it exists
        const query = "SELECT * FROM elections WHERE election_id = ?";
        const election = await selectQuery<Election>(pool, query, [election_id]);

        if (!election || election.length === 0) {
            throw new Error('Election not found');
        }

        res.render('admin/editCertification', {
            electionId: election_id
        });
    } catch (error) {
        next(error);
    }
}
