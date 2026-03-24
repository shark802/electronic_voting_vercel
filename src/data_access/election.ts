import { QueryResult, RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import { Election } from "../utils/types/Election";
import { insertQuery, selectQuery } from "./query";
import { ProgramPopulations } from "../utils/types/ProgramPopulations";
import { Department } from "../utils/types/Department";
import { Program } from "../utils/types/Program";
import { Vote } from "../utils/types/Votes";
import { Worker } from "worker_threads";
import path from "path";
import { CryptoService } from "../utils/cryptoService";
import { ElectionResult } from "../utils/types/ElectionResult";

export async function getElectionInfoById(electionId: string) {
    const [election] = await selectQuery<Election>(pool, 'SELECT * FROM elections WHERE election_id = ? AND deleted_at IS NULL', [electionId]);
    return election;
}

export async function getElectionResult(electionId: string) {
    const [result] = await selectQuery<ElectionResult>(pool, 'SELECT * FROM election_results WHERE election_id = ?', [electionId]);
    return result ? result : null;
}

import { once } from 'events';

export async function generateElectionResult(electionId: string) {
    const votes = await selectQuery<Vote>(pool, 'SELECT * FROM votes WHERE election_id = ?', [electionId]);
    const secretKey = CryptoService.secretKey();

    const insertResultQuery = `
        INSERT INTO election_results (election_id, result, encryption_iv) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE result = VALUES(result), encryption_iv = VALUES(encryption_iv);
    `;

    // Helper to encrypt and insert results
    const encryptAndInsert = async (data: any): Promise<void> => {
        const iv = CryptoService.generateIv();
        const encryptionIv = CryptoService.stringToBuffer(iv);
        const dataToEncrypt = JSON.stringify(data);
        const encryptedResult = CryptoService.encrypt(dataToEncrypt, secretKey, encryptionIv);

        await insertQuery(pool, insertResultQuery, [electionId, encryptedResult, iv]);
    };

    const candidatesData = await getCandidatesTotalTally(electionId);

    if (votes.length === 0) {
        const voteTally = candidatesData.map(candidate => {
            return { ...candidate, vote_count: 0 }
        });
        await encryptAndInsert(voteTally); // No votes, just insert an candidates data with 0 votes
        return voteTally;
    }

    // Use Worker to decrypt votes
    const worker = new Worker(path.join(__dirname, '../utils/workerFiles/decryptVoteWorker.js'));

    try {
        worker.postMessage(votes);

        // Wait for decrypted votes from the worker
        const [decryptedVotes] = await once(worker, 'message') as [Vote[]];

        // Tally the votes for each candidate
        const voteTally = candidatesData.map(candidate => {
            const vote_count = decryptedVotes.filter(vote => Number(vote.candidate_id) === Number(candidate.id_number)).length;
            return { ...candidate, vote_count }
        });

        // Encrypt and insert the tally result
        await encryptAndInsert(voteTally);

        return voteTally;
    } catch (error) {
        console.error('Error in generateElectionResult:', error);
        throw error;
    } finally {
        worker.terminate();
    }
}



export async function getCandidatesTotalTally(electionId: string) {

    type CandidateData = {
        position: string;
        party: string;
        department_name: string;
        candidate_profile: string;
        id_number: number;
        lastname: string;
        firstname: string;
        course: string;
        election_id: string;
    }

    const sqlQuery = `
        SELECT 
            c.position, 
            c.party, 
            d.department_code AS department_name, 
            MAX(c.candidate_profile) AS candidate_profile, 
            u.id_number, 
            u.lastname, 
            u.firstname, 
            u.course, 
            c.election_id
        FROM candidates c
        LEFT JOIN users u ON u.id_number = c.id_number
        LEFT JOIN programs p ON u.course = p.program_code
        LEFT JOIN departments d ON p.department = d.department_id
        WHERE c.election_id = ? AND c.deleted IS NULL
        GROUP BY c.position, u.id_number, u.lastname, u.firstname, u.course, c.party, d.department_code;
    `;

    const candidatesVoteTally = await selectQuery<CandidateData>(pool, sqlQuery, [electionId]);
    return candidatesVoteTally;
}

export async function getAllCandidatesInElection(electionId: string) {
    const sqlQuery = `
        SELECT u.id_number, u.firstname, u.lastname, u.course, c.position
        FROM users u
        JOIN candidates c ON u.id_number = c.id_number
        WHERE election_id = ? AND c.deleted IS NULL AND c.enabled = 1
    `

    const candidates = await selectQuery(pool, sqlQuery, [electionId]); // Assuming selectQuery automatically binds parameters
    return candidates;
}

export async function totalUserVotedPerElection() {
    const sqlQuery = `
        SELECT e.election_id, COUNT(DISTINCT v.voter_id) AS total_voted
        FROM elections e
        JOIN votes v ON e.election_id = v.election_id
        WHERE e.is_close = 0
        GROUP BY e.election_id;
    `
    const totalVoted = await selectQuery<RowDataPacket[]>(pool, sqlQuery);
    return totalVoted
}

export async function getDepartmentsTotalPopulation(electionIdArray: string[]) {

    const departments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');

    // shape of object that summarize all department votes per election
    type ElectionDepartmentTotalPopulation = {
        election_id: string;
        department_total_population: Record<string, number>;
    };

    const electionDepartmentTotalPopulation: ElectionDepartmentTotalPopulation[] = []; // will accumulate all elections vote summary per department

    for (const electionId of electionIdArray) {

        const departmentTotalPopulation: ElectionDepartmentTotalPopulation = {
            election_id: electionId,
            department_total_population: {} as Record<string, number>
        }

        for (const department of departments) {
            const [result] = await selectQuery<ProgramPopulations>(pool, `SELECT * FROM program_populations WHERE election_id = ? AND program_code = ?`, [electionId, department.department_code]);

            departmentTotalPopulation.department_total_population[department.department_code] = (result ? result.program_population : 0);
        }

        electionDepartmentTotalPopulation.push(departmentTotalPopulation);
    }
    return electionDepartmentTotalPopulation;
}

export async function getDepartmentsTotalVotes(electionIdArray: string[]) {

    const departments = await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE deleted_at IS NULL');
    const programs = await selectQuery<Program>(pool, 'SELECT * FROM programs WHERE deleted_at IS NULL');

    // type for select query return result
    type queryResultType = {
        total_voted: number;
        election_id: string;
    };

    // shape of object that summarize all department votes per election
    type ElectionDepartmentVoteSummary = {
        election_id: string;
        department_votes: Record<string, number>;
    };

    const sqlQuery = `
        SELECT COUNT(DISTINCT v.voter_id) as total_voted, v.election_id
        FROM votes v
        LEFT JOIN users u
        ON v.voter_id = u.id_number
        WHERE u.course IN (?) AND v.election_id = ?
        GROUP BY v.election_id
    `;

    const departmentVotesSummary: ElectionDepartmentVoteSummary[] = []; // will accumulate all elections vote summary per department

    for (const electionId of electionIdArray) {

        const electionDepartmentVoteSummary: ElectionDepartmentVoteSummary = {
            election_id: electionId as string,
            department_votes: {} as Record<string, number> // Initialized as an empty object with correct type
        };

        for (const department of departments) {

            const programList = programs.filter(program => program.department === department.department_id).map(program => program.program_code);
            if (programList.length === 0) {

                electionDepartmentVoteSummary.department_votes[department.department_code] = 0;
            } else {

                const [result] = await selectQuery<queryResultType>(pool, sqlQuery, [programList, electionId]);

                // Cast departmentCode to DepartmentCode type
                electionDepartmentVoteSummary.department_votes[department.department_code] = result ? result.total_voted : 0;
            }

        }

        departmentVotesSummary.push(electionDepartmentVoteSummary);
    }
    return departmentVotesSummary;
}

export async function getAllCompleteElection() {
    const selectSqlQuery = 'SELECT * FROM elections WHERE (date_end < CURDATE() OR (date_end = CURDATE() AND time_end < CURTIME())) AND deleted_at IS NULL ORDER BY date_end DESC, time_end DESC';
    const elections = await selectQuery<Election>(pool, selectSqlQuery);
    return elections;
}