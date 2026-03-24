import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { selectQuery } from './query';
import { Vote } from '../utils/types/Votes';
import { pool } from '../config/database';
import { Candidate } from '../utils/types/Candidate';
import { NotFoundError } from '../utils/customErrors';
import { CryptoService } from '../utils/cryptoService';
import { Department } from '../utils/types/Department';
import { ulid } from 'ulid';


export async function checkIfUserHasVoted(userId: string, electionId: string) {
    const getUserVoteHistory = await selectQuery<Vote>(pool, "SELECT * FROM votes WHERE voter_id = ? AND election_id = ?", [userId, electionId]);
    return getUserVoteHistory.length > 0; // return true if the result is not zero, false otherwise
}

export async function saveVote(connection: PoolConnection, selectedCandidateObject: Pick<Candidate, 'id_number' | 'position'>[], userId: string, electionId: string) {
    const placeholders = selectedCandidateObject.map(() => "(?, ?, ?, ?, ?)").join(", ");

    const insertParameters = selectedCandidateObject.reduce((params, candidate) => {
        const secretKey = CryptoService.secretKey()
        const iv = CryptoService.generateIv();
        const bufferIv = CryptoService.stringToBuffer(iv)
        const decryptVote = CryptoService.encrypt(candidate.id_number, secretKey, bufferIv);

        params.push(userId, decryptVote, candidate.position, iv, electionId);
        return params;
    }, [] as any[]);

    const prepareStatement = `INSERT INTO votes (voter_id, candidate_id, position, encryption_iv, election_id) VALUES ${placeholders}`;

    await connection.execute(prepareStatement, insertParameters);
    return;
}

export async function incrementCandidateVoteCount(connection: PoolConnection, selectedCandidates: Pick<Candidate, 'id_number' | 'position'>[], electionId: string) {
    for (const candidate of selectedCandidates) {

        const [selectResult] = await connection.execute<RowDataPacket[]>("SELECT * FROM candidates WHERE id_number = ? AND election_id = ? FOR UPDATE", [candidate.id_number, electionId]);
        if (selectResult.length === 0) throw new Error(`Candidate with id ${candidate.id_number} and election id ${electionId} not found`);

        const [updateResult] = await connection.execute<ResultSetHeader>("UPDATE candidates SET vote_count = vote_count + 1 WHERE id_number = ? AND election_id = ?", [candidate.id_number, electionId]);
        if (updateResult.affectedRows === 0) throw new Error(`Failed to update vote count for candidate id ${candidate.id_number} and election id ${electionId}`);

    }
}


export async function updateVoterVoteStatus(connection: PoolConnection, userId: string, electionId: string, isFaceVerified: boolean | undefined) {
    const votingMode = isFaceVerified ? 'ONLINE' : 'ON-SITE';
    const voterId = ulid();

    try {
        // First try to update existing voter
        const [updateVoteStatusResult] = await connection.execute<ResultSetHeader>(
            'UPDATE voters SET voted = 1, voting_mode = ? WHERE id_number = ? AND election_id = ?',
            [votingMode, userId, electionId]
        );

        // If no voter exists, create a new one
        if (updateVoteStatusResult.affectedRows === 0) {
            // Create new voter record
            await connection.execute(
                'INSERT INTO voters (voter_id, id_number, election_id, voted, voting_mode) VALUES (?, ?, ?, 1, ?)',
                [voterId, userId, electionId, votingMode]
            );
        }

        return;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        throw new Error('Failed to update or create voter status');
    }
}

export async function getVoterDepartment(user_id: string) {
    const query = `
        SELECT departments.department_code
        FROM users
        LEFT JOIN programs ON programs.program_code = users.course
        LEFT JOIN departments ON departments.department_id = programs.department
        WHERE users.id_number = ?
        LIMIT 1
    `

    const [department] = await selectQuery<Pick<Department, 'department_code'>>(pool, query, [user_id])
    return department.department_code
}
