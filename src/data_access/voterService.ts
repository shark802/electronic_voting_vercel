import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import { selectQuery } from "./query";
import { User } from "../utils/types/User";
import { Voter } from "../utils/types/Voter";

export async function getAllVoterInElection(electionId: string) {
    const selectAllVoterQuery = `
        SELECT u.id_number, u.firstname, u.lastname, u.course, u.year_level, u.section, v.election_id, v.voted
        FROM users u
        JOIN voters v
        ON u.id_number = v.id_number
        WHERE v.election_id = ?
        AND u.is_active = 1
        ORDER BY u.lastname
        `;

    type voterUser = Partial<User> & Partial<Voter>
    const voters = await selectQuery<voterUser>(pool, selectAllVoterQuery, [electionId]);

    return voters;
}

interface CountResult extends RowDataPacket {
    total: number;
}

// Select all recent log of user voted in the system with pagination
export async function getAllRecentUsersVoted(page: number = 1, limit: number = 30) {
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

    const [voters, totalCount] = await Promise.all([
        selectQuery(pool, selectAllVotedQuery, [limit, offset]),
        selectQuery<CountResult>(pool, countQuery)
    ]);

    const total = totalCount[0]?.total || 0;

    return {
        voters,
        total
    };
}

// Select all recent user voted in one specific election with pagination
export async function getAllRecentUsersVotedInElection(electionId: string, page: number = 1, limit: number = 30) {
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

    const [voters, totalCount] = await Promise.all([
        selectQuery(pool, selectAllVotedByElectionQuery, [electionId, limit, offset]),
        selectQuery<CountResult>(pool, countQuery, [electionId])
    ]);

    const total = totalCount[0]?.total || 0;

    return {
        voters,
        total
    };
}

// function for finding voter base on id_number and election_id provided
export async function findOneUserVotedInElection(electionId: string, userId: string) {
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

    return await selectQuery(pool, findOneUserVotedInElectionQuery, [electionId, userId]);
}

// Select all election that user participated or voted in with pagination
export async function getAllUserElectionParticipatedIn(userId: string, page: number = 1, limit: number = 30) {
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

    const [voters, totalCount] = await Promise.all([
        selectQuery(pool, getAllUserElectionParticipatedQuery, [userId, limit, offset]),
        selectQuery<CountResult>(pool, countQuery, [userId])
    ]);

    const total = totalCount[0]?.total || 0;

    return {
        voters,
        total
    };
}

// Count all total voter for election
export async function countAllQualifiedVoterForElection() {

    interface TotalPopulation extends RowDataPacket {
        total_population: number
    }

    const [totalPopulation] = await selectQuery<TotalPopulation>(pool, 'SELECT COUNT(*) as total_population FROM users WHERE is_active = 1',);
    return totalPopulation.total_population;

}

// select all voters not voted in specific election
export async function getAllNotVotedInElection(electionId: string) {

    const sqlQuery = `
        SELECT u.id_number, u.firstname, u.lastname, u.course, u.year_level, u.section 
        FROM voters v
        JOIN users u
        ON v.id_number = u.id_number
        WHERE v.election_id = ? AND v.voted = 0
        ORDER BY u.lastname
    `
    type voterUser = Pick<User, 'firstname' | 'lastname' | 'id_number' | 'course' | 'year_level' | 'section'>

    const voters = await selectQuery<voterUser>(pool, sqlQuery, [electionId]);

    return voters;
}