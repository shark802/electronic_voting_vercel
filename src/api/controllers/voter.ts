import { NextFunction, Request, Response } from "express";
import { selectQuery } from "../../data_access/query";
import { pool } from "../../config/database";
import { BadRequestError } from "../../utils/customErrors";

export async function getAllVoterElectionHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.id;
        if (!userId) throw new BadRequestError('User id is missing');

        const sqlQuery = `
            SELECT DISTINCT e.election_name, e.election_id, e.date_start, e.time_start, v.voted, e.date_end, v.voting_mode, e.time_end, MIN(votes.time_casted) as time_casted
            FROM voters v 
            LEFT JOIN elections e ON v.election_id = e.election_id
            LEFT JOIN votes ON votes.election_id = v.election_id AND votes.voter_id = v.id_number
            WHERE id_number = ? AND e.deleted_at IS NULL
            GROUP BY e.election_id, e.election_name, e.date_start, e.time_start, v.voted, e.date_end, e.time_end, votes.voter_id, v.voting_mode
            ORDER BY e.date_start DESC, e.time_start DESC;
        `

        const voterElectionHistory = await selectQuery(pool, sqlQuery, [userId]);
        res.status(200).json({ voterElectionHistory });

    } catch (error) {
        next(error)
    }
}