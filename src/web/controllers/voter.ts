import { Request, Response, NextFunction } from "express";
import { selectQuery } from "../../data_access/query";
import { Election } from "../../utils/types/Election";
import { pool } from "../../config/database";
import { User } from "../../utils/types/User";
import { isValidTimeToVote } from "../../utils/isValidTimeToVote";
import { checkIfUserHasVoted } from "../../data_access/voteService";
import { hasUserRegisterFaceImage } from "../../utils/hasUserRegisterFaceImage";
import { generateElectionResult, getCandidatesTotalTally, getElectionInfoById, getElectionResult } from "../../data_access/election";
import { BadRequestError, NotFoundError } from "../../utils/customErrors";
import { isElectionEnded } from "../../utils/checkElectionTimeStatus";
import { Position } from "../../utils/types/Positions";
import { Department } from "../../utils/types/Department";
import { RegisterFaces } from "../../utils/types/RegisterFaces";
import { CryptoService } from "../../utils/cryptoService";
import { IpAddress } from "../../utils/types/IpAddress";

export async function electionPage(req: Request, res: Response, next: NextFunction) {
    try {
        req.session.faceVerified = false;

        const user_id = req.session.user!.user_id;
        const [register_face] = await selectQuery<RegisterFaces>(pool, 'SELECT * FROM register_faces WHERE id_number = ? AND deleted_at IS NULL LIMIT 1', [user_id]);

        const face_registered = register_face ? true : false;

        const query = "SELECT * FROM elections WHERE deleted_at IS NULL AND is_active = 1 ORDER BY date_start DESC";
        const electionList = await selectQuery<Election>(pool, query);
        const [user] = await selectQuery<User>(pool, 'SELECT * FROM users WHERE id_number = ?', [user_id])

        res.render("voter/electionPage", { electionList, user, face_registered });
    } catch (error) {
        next(error)
    }
}

export async function renderElectionBallot(req: Request, res: Response, next: NextFunction) {
    try {
        const id_number = req.session.user!.user_id;
        const election_id = req.params.electionId;
        const isIpRegistered = req.session?.ipRegistered;
        const faceVerified = req.session?.faceVerified;

        // Check if the user has already voted
        const hasVoted = await checkIfUserHasVoted(id_number, election_id);
        if (hasVoted) return res.redirect('/election?redirectMessage=You have already voted');

        // If the device is not registered, check if user is available for face authentication.
        if (!isIpRegistered && !faceVerified) {
            const isUserRegisteredFaceImage = await hasUserRegisterFaceImage(id_number);
            if (!isUserRegisteredFaceImage) return res.redirect("/election?redirectMessage=Please register your face for authentication to continue.");

            // redirect user to face authentication
            return res.redirect(`/authenticate-face?election=${election_id}`)
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
        `

        const userQuery = `
            SELECT u.*, p.program_code, d.department_id, d.department_code AS department_name
            FROM users u
            LEFT JOIN programs p ON u.course = p.program_code
            LEFT JOIN departments d ON p.department = d.department_id
            WHERE u.id_number = ?
        `

        const [[user], [election], candidateList] = await Promise.all([
            selectQuery<User>(pool, userQuery, [id_number]),
            selectQuery<Election>(pool, "SELECT * FROM elections WHERE election_id = ? AND deleted_at IS NULL", [election_id]),
            selectQuery(pool, sqlQuery, [election_id])
        ]);
        if (!election) return res.redirect('/election?redirectMessage=Election Not Available')

        const candidatePositionList = (await selectQuery<Position>(pool, 'SELECT * FROM positions WHERE deleted_at IS NULL')).map(position => position.position);
        const departmentsMaximumSenatorVote = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');

        const departmentMaxSenatorVote = departmentsMaximumSenatorVote.reduce((acc: Record<string, number>, department) => {
            acc[department.department_code] = department.max_select_senator;
            return acc;
        }, {});

        if (!isValidTimeToVote(election)) return res.redirect("/election?redirectMessage=Voting is currently closed")

        const shuffledCandidateList = candidateList.sort(() => Math.random() - 0.5);

        return res.render('voter/voteBallot', { user, candidatePositionList, shuffledCandidateList, election, departmentMaxSenatorVote });
    } catch (error) {
        next(error);
    }
}


export async function renderElectionResult(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.session.user!.user_id;
        const electionId = req.params.id;

        if (!electionId) throw new BadRequestError('Election id is missing');

        // retrieve election here
        const electionInfo = await getElectionInfoById(electionId);
        if (!electionInfo) throw new NotFoundError('Election not exist');

        // check if the election has ended
        if (!isElectionEnded(electionInfo)) return res.redirect('/election?redirectMessage=Result Not Available Yet');

        const [positions, departmentData] = await Promise.all([
            selectQuery<Position>(pool, 'SELECT * FROM positions WHERE deleted_at IS NULL'),
            selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL')
        ]);
        const positionList = (await selectQuery<Position>(pool, 'SELECT * FROM positions WHERE deleted_at IS NULL')).map(position => position.position);

        // Get user with department information
        const [user] = await selectQuery<User>(pool, `
            SELECT u.*, p.program_code, d.department_code AS department_name
            FROM users u
            LEFT JOIN programs p ON u.course = p.program_code
            LEFT JOIN departments d ON p.department = d.department_id
            WHERE u.id_number = ? 
            LIMIT 1`, [userId]);

        // Batch all election-specific queries
        const [
            departmentsPopulation
        ] = await Promise.all([
            selectQuery(pool, 'SELECT * FROM program_populations WHERE election_id = ?', [electionId])
        ]);

        const electionResult = await getElectionResult(electionId);
        let candidatesVoteTally;

        if (!electionResult) {
            // If no election result exists yet, generate it with department information
            candidatesVoteTally = await generateElectionResult(electionId);
        } else {
            // Decrypt the existing election result
            const secretKey = CryptoService.secretKey();
            const iv = CryptoService.stringToBuffer(electionResult.encryption_iv);
            const decryptResult = CryptoService.decrypt(electionResult.result, secretKey, iv);
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
    } catch (error) {
        next(error);
    }
}
