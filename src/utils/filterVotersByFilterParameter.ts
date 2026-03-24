import { pool } from "../config/database";
import { selectQuery } from "../data_access/query";
import { Department } from "./types/Department";
import { Program } from "./types/Program";
import { User } from "./types/User";
import { Voter } from "./types/Voter";

export async function filterVotersByFilterParameter(
    voters: (Partial<User> & Partial<Voter>)[],
    voteStatus: number,
    department?: string,
    program?: string,
    yearLevel?: string,
    section?: string
): Promise<(Partial<User> & Partial<Voter>)[]> {

    const departmentId = department ? (await selectQuery<Department>(pool, 'SELECT * FROM departments WHERE department_code = ?', [department])).map(department => department.department_id) : [];

    let filteredVoters = [...voters];

    if (voteStatus === 0 || voteStatus === 1) {
        filteredVoters = filteredVoters.filter(voter => voter.voted === voteStatus);
    }

    if (department) {

        const departmentPrograms = await (await selectQuery<Program>(pool, 'SELECT * FROM programs WHERE department IN ( ? ) AND deleted_at IS NULL', [departmentId])).map(program => program.program_code);

        // filter each voter if their course property is part of department selected
        filteredVoters = filteredVoters.filter(voter =>
            voter.course !== undefined && departmentPrograms.includes(voter.course as typeof departmentPrograms[number])
        );
    }

    if (program) {
        filteredVoters = filteredVoters.filter(voter => voter.course === program);
    }

    if (yearLevel) {

        filteredVoters = filteredVoters.filter(voter => Number(voter?.year_level) == Number(yearLevel));
    }

    if (program && section) {
        filteredVoters = filteredVoters.filter(voter => voter.section === section);

    }

    return filteredVoters;
}
