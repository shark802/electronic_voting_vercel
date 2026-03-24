import { NextFunction, Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../../utils/customErrors";
import { pool } from "../../config/database";
import { ResultSetHeader } from "mysql2";


export async function updateVoterPopulationFunction(req: Request, res: Response, next: NextFunction) {
    try {
        const electionId = req.params.id;
        const { total, populationPerProgram } = req.body;

        if (!electionId) throw new BadRequestError('Cannot find election id');
        // if (populationPerProgram instanceof Object || Object.keys(populationPerProgram).length === 0) throw new BadRequestError('Invalid data for population');

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [updateTotalPopulation] = await connection.execute<ResultSetHeader>('UPDATE elections SET total_populations = ? WHERE election_id = ?', [total, electionId]);
            if (updateTotalPopulation.affectedRows === 0) throw new NotFoundError('No changes applied to total populations for election');

            for (const [key, value] of Object.entries(populationPerProgram)) {
                const [updatePopulationPerProgram] = await connection.execute<ResultSetHeader>('UPDATE program_populations SET program_population = ? WHERE election_id = ? AND program_code = ?', [value, electionId, key]);
                if (updatePopulationPerProgram.affectedRows === 0) throw new NotFoundError(`No changes applied to update ${key} population`);
            }

            await connection.commit();
            res.status(200).json({ message: "Update successful" })
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            await connection.release()
        }

    } catch (error) {
        next(error);
    }
}