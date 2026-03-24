import { pool } from "../config/database";
import { Candidate } from "../utils/types/Candidate";
import { User } from "../utils/types/User";
import { selectQuery } from "./query";

export async function getUserCandidate(candidateIdList: string[], electionId: string) {
    type userCandidate = Pick<User, "id_number" | 'firstname' | 'lastname' | 'year_level' | 'section' | 'course'> & Pick<Candidate, 'candidate_id' | 'election_id' | 'position' | 'enabled' | 'alias' | 'party'>;

    const sqlSelectUserCandidateQuery = `
        SELECT u.id_number, u.firstname, u.lastname, u.course, u.year_level, u.section, c.candidate_id, c.election_id, c.position, c.enabled, c.party, c.added_at
        FROM users u JOIN candidates c
        ON u.id_number = c.id_number
        WHERE u.id_number IN (?)
        AND election_id = ?
        AND c.deleted IS NULL
        ORDER BY u.lastname;
        `
    const userCandidateResult = await selectQuery<userCandidate>(pool, sqlSelectUserCandidateQuery, [candidateIdList, electionId]);
    return userCandidateResult
}