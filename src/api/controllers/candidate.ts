import { Request, Response, NextFunction } from "express";
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/customErrors';
import { pool } from "../../config/database";
import { insertQuery, selectQuery, updateQuery } from "../../data_access/query";
import { Candidate } from "../../utils/types/Candidate";
import { ulid } from "ulid";
import { User } from "../../utils/types/User";
import { getUserCandidate } from "../../data_access/candidateService";
import fs from 'fs';
import path from "path";

export async function addCandidateFunction(req: Request, res: Response, next: NextFunction) {
    try {

        Object.entries(req.body).forEach(([key, value]) => {
            if (typeof value === 'string') {
                req.body[key] = value.toUpperCase();
            }
        });

        let { election_id, id_number, firstname, lastname, course, party, position } = req.body;
        const candidate_profile = req.file ? req.file.filename : null;

        if (!election_id || !id_number || !firstname || !lastname || !party || !position || !course) return next(new BadRequestError("Cannot proceed adding candidate due to missing info"));

        const findCandidateAccount = await selectQuery<Candidate>(pool, "SELECT * FROM users WHERE id_number = ?", [id_number]);
        if (findCandidateAccount.length < 1) {
            // create account for candidate
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                await connection.execute("INSERT INTO users (id_number, firstname, lastname, course) VALUES(?, ?, ?, ?)", [id_number, firstname, lastname, course]);
                await connection.execute("INSERT INTO roles (id_number, voter) VALUES(?, ?)", [id_number, 1])
                await connection.commit();
            } catch (error) {
                await connection.rollback();
                return next(error);
            } finally {
                await connection.release();
            }
        }
        const findCandidateIfExist = await selectQuery<Candidate>(pool, "SELECT * FROM candidates WHERE id_number = ? AND election_id = ? AND deleted IS NULL", [id_number, election_id]);
        if (findCandidateIfExist.length > 0) return next(new ConflictError(`Unable to add ${id_number} in election due to conflict, candidate already exist`));

        const candidate_id = ulid();

        const addNewCandidateQuery = "INSERT INTO candidates (candidate_id, id_number, position, party, election_id, candidate_profile, department) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const candidateParameter = [candidate_id, id_number, position, party, election_id, candidate_profile, course];
        const newCandidate = await insertQuery(pool, addNewCandidateQuery, candidateParameter);

        if (newCandidate.affectedRows > 0) {
            return res.status(201).json({ message: "New candidate successfully added" });
        }
    } catch (error) {
        next(error);
    }
}

export async function updateCandidateFunction(req: Request, res: Response, next: NextFunction) {
    try {
        const candidate_id = req.params.id;
        if (!candidate_id) return next(new BadRequestError("Election Id is missing"));

        let { party, position } = req.body;
        const candidateProfile = req.file ? req.file.filename : null;
        if (!party || !position) return next(new BadRequestError("Candidate is lacking some information to proceed update"));

        // if the request comes with to update candidate profile. check if there is already a candidate profile set then delete the old profile
        if (candidateProfile) {
            const [candidate] = await selectQuery<Candidate>(pool, 'SELECT * FROM candidates WHERE candidate_id = ?', [candidate_id]);

            if (candidate.candidate_profile) {

                const oldProfilePath = path.join(__dirname, `./../../../public/img/candidate_profiles/${candidate.candidate_profile}`);

                fs.unlink(oldProfilePath, (error) => {
                    if (error?.code === 'ENOENT') {
                        console.log(`Could'nt find file ${candidate.candidate_profile}, delete attempt failed`);
                    }
                })
            }
        }

        const updateSqlQuery = "UPDATE candidates SET party = ?, position = ?, candidate_profile = ? WHERE candidate_id = ? AND deleted IS NULL";
        const updateParameter = [party, position, candidateProfile, candidate_id];

        const updateResult = await updateQuery(pool, updateSqlQuery, updateParameter);
        if (updateResult.affectedRows < 0) return next(new NotFoundError('Resource not found or no changes were made'));

        return res.status(200).json({ message: 'Candidate updated successfully' });

    } catch (error) {
        console.log('invalid image');
        return next(error);
    }
}

export async function deleteCandidateFunction(req: Request, res: Response, next: NextFunction) {
    try {
        const candidate_id = req.params.id;
        if (!candidate_id) throw new BadRequestError("Failed to delete candidate due to missing candidate's id");

        const deleteQuery = 'UPDATE candidates SET deleted = CURDATE() WHERE candidate_id = ? AND deleted IS NULL';

        const deleteResult = await updateQuery(pool, deleteQuery, [candidate_id]);
        if (deleteResult.affectedRows < 1) throw new NotFoundError('Deletion failed, no changes were made');

        return res.status(200).json({ message: `Candidate deleted successfully` });

    } catch (error) {
        next(error);
    }
}

export async function getManageCandidates(req: Request, res: Response, next: NextFunction) {
    try {
        const position = req.query.position;
        const electionIds = req.query.election_id;

        if (!position) throw new BadRequestError('No election Available');
        if (!electionIds) throw new BadRequestError('Atleast 1 election Id is required');

        const electionList = Array.isArray(electionIds) ? electionIds : [electionIds];

        type userCandidate = Pick<User, "id_number" | 'firstname' | 'lastname' | 'year_level' | 'section' | 'course'> & Pick<Candidate, 'candidate_id' | 'election_id' | 'position' | 'enabled' | 'party'>;

        const sqlSelectUserCandidateQuery = `
        SELECT u.id_number, u.firstname, u.lastname, u.course, u.year_level, u.section, c.candidate_id, c.election_id, c.position, c.enabled, c.party, c.added_at
        FROM users u JOIN candidates c
        ON u.id_number = c.id_number
        WHERE c.position = ?
        AND c.election_id IN (?)
        AND c.deleted IS NULL
        ORDER BY u.lastname;
        `
        const userCandidateResult = await selectQuery<userCandidate>(pool, sqlSelectUserCandidateQuery, [position, electionList]);
        return res.status(200).json(userCandidateResult);

    } catch (error) {
        next(error)
    }
};

export async function getCandidateById(req: Request, res: Response, next: NextFunction) {
    try {
        const candidate_id = req.params.id;
        if (!candidate_id) throw new BadRequestError("Candidate Id is missing");

        const sqlQuery = `SELECT u.firstname, u.lastname, u.course, c.* FROM candidates c JOIN users u  ON c.id_number = u.id_number WHERE c.candidate_id = ? AND c.deleted IS NULL`
        const candidate = await selectQuery<Candidate>(pool, sqlQuery, [candidate_id]);

        if (candidate.length < 1) throw new NotFoundError("Candidate Not Found");
        res.status(200).send(candidate[0]);
    } catch (error) {
        next(error)
    }
}

export async function updateCandidateStatus(req: Request, res: Response, next: NextFunction) {
    try {
        const candidate_id = req.params.id
        const status = req.body.status;
        if (!status || !candidate_id) throw new BadRequestError("Required value is missing can't update candidate");

        const sqlQuery = "UPDATE candidates SET enabled = ? WHERE candidate_id = ?";
        const parameter = [status, candidate_id];
        const result = await updateQuery(pool, sqlQuery, parameter);

        if (result.affectedRows < 1) throw new NotFoundError('No resource updated');

        res.status(200).json({ message: `Candidate status updated` });
    } catch (error) {
        next(error)
    }
}

// Will response the candidate information according to candidates id_number parse in url query params
export async function getUserCandidateData(req: Request, res: Response, next: NextFunction) {
    try {
        const electionId = req.query.electionId as string;
        const candidateIdNumberList = req.query.id_number;

        if (!electionId) throw new BadRequestError("Election Id is not provided");
        if (!candidateIdNumberList) throw new BadRequestError('Please select a candidate!');

        const candidateIdList = Array.isArray(candidateIdNumberList) ? candidateIdNumberList as string[] : [candidateIdNumberList] as string[];

        const userCandidate = await getUserCandidate(candidateIdList, electionId);
        return res.status(200).send(userCandidate);

    } catch (error) {
        next(error);
    }
}

//! TODO dashboard vote tally
export async function getAllcandidatesInActiveElection(req: Request, res: Response, next: NextFunction) {
    try {
        const sqlQuery = `
            SELECT u.id_number, u.firstname, u.lastname, u.course, c.position, c.department, e.election_id, c.vote_count
            FROM candidates c
            JOIN elections e ON c.election_id = e.election_id
            LEFT JOIN users u ON c.id_number = u.id_number
            LEFT JOIN votes v ON c.id_number = v.candidate_id AND e.election_id = v.election_id
            WHERE e.deleted_at IS NULL AND e.is_close = 0 AND c.deleted IS NULL AND c.enabled = 1
            GROUP BY c.election_id, u.id_number, c.position, v.election_id, c.department, c.vote_count
            ORDER BY lastname
        `

        const candidatesData = await selectQuery(pool, sqlQuery);

        res.status(200).json({ candidatesData })

    } catch (error) {
        next(error);
    }
}