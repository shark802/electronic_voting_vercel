import { NextFunction, Request, Response } from "express";
import { selectQuery } from "../../data_access/query";
import { RegisterFaces } from "../../utils/types/RegisterFaces";
import { pool } from "../../config/database";

export async function faceRegisterPage(req: Request, res: Response, next: NextFunction) {
    try {

        res.render('face-recognition/face-register')

    } catch (error) {
        next(error)
    }
}

export async function faceAuthenticatePage(req: Request, res: Response, next: NextFunction) {
    const id_number = req.session.user?.user_id;
    const electionId = req.query.election;

    const [registerFace] = await selectQuery<RegisterFaces>(pool, 'SELECT * FROM register_faces WHERE id_number = ? LIMIT 1', [id_number]);

    if (!registerFace) return res.redirect('/election?redirectMessage=No face registered found for this user!');

    res.render('face-recognition/face-authenticate', { electionId })
}