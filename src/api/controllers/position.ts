import { Request, Response, NextFunction } from "express";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/customErrors";
import { deleteQuery, insertQuery, selectQuery } from "../../data_access/query";
import { Position } from "../../utils/types/Positions";
import { pool } from "../../config/database";

export async function addPosition(req: Request, res: Response, next: NextFunction) {
    try {
        const { position } = req.body;
        if (!position || position === "") throw new BadRequestError("Position is required");

        const existPosition = await selectQuery<Position>(pool, 'SELECT * FROM positions WHERE position = ? AND deleted_at IS NULL', [position]);
        if (existPosition.length > 0) throw new ConflictError("Position already exists");

        await insertQuery(pool, 'INSERT INTO positions (position) VALUES (?)', [position]);

        res.status(201).json({ message: "Position added successfully" });

    } catch (error) {
        next(error);
    }
}

export async function getAllPositions(req: Request, res: Response, next: NextFunction) {
    try {
        const positions = await selectQuery<Position>(pool, 'SELECT * FROM positions WHERE deleted_at IS NULL');
        res.status(200).json({ positions });

    } catch (error) {
        next(error);
    }
}

export async function removePosition(req: Request, res: Response, next: NextFunction) {
    try {
        const positionId = req.params.id;

        const deletePosition = await deleteQuery(pool, 'UPDATE positions SET deleted_at = NOW() WHERE position_id = ?', [positionId]);
        if (deletePosition.affectedRows === 0) throw new NotFoundError("Position not found");

        res.status(200).json({ message: "Position removed successfully" });

    } catch (error) {
        next(error);
    }
}
