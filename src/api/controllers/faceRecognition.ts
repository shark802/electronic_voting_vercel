import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/customErrors';
import { insertQuery, selectQuery } from '../../data_access/query';
import { pool } from '../../config/database';
import { RegisterFaces } from '../../utils/types/RegisterFaces';
import { v4 as uuid } from 'uuid'
dotenv.config()

export async function getFaceRecognitionServiceDomain(req: Request, res: Response, next: NextFunction) {
    try {

        const faceServiceDomain = process.env.FACE_RECOGNITION_SERVICE_DOMAIN;
        if (!faceServiceDomain) throw new NotFoundError('Face recognition service domain not found!');

        res.status(200).json({ faceServiceDomain });
    } catch (error) {
        next(error)
    }
}

export async function insertUserRegisterFaceInfo(req: Request, res: Response, next: NextFunction) {
    try {

        if (!req.session) throw new UnauthorizedError('You need to login first!');

        const id = uuid()
        const userId = req.session?.user?.user_id;
        const savedFaceFilename = req.body.filename;

        if (!savedFaceFilename) throw new BadRequestError('Filename of saved face image is not provided');

        const insertResult = await insertQuery(pool, 'INSERT INTO register_faces (id, id_number, saved_face_filename, registered_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)', [id, userId, savedFaceFilename]);
        if (insertResult.affectedRows === 0) throw new Error('Registration failed!')

        res.status(201).json({ message: 'Face registered' });
    } catch (error) {
        next(error)
    }
}

export async function isClientRegisteredFace(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.session) throw new UnauthorizedError(`Request failed, You have'nt login yet! `);
        const userId = req.session.user?.user_id;

        const [RegisterFaceInfo] = await selectQuery<RegisterFaces>(pool, 'SELECT * FROM register_faces WHERE id_number = ? LIMIT 1', [userId]);

        const isRegistered = RegisterFaceInfo ? true : false;
        return res.status(200).json({ isRegistered });

    } catch (error) {
        next(error)
    }
}


export async function getClientRegisteredFaceFilename(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.session) throw new UnauthorizedError(`Request failed, You have'nt login yet!`);
        const userId = req.session.user?.user_id;

        const [RegisterFaceInfo] = await selectQuery<RegisterFaces>(pool, 'SELECT * FROM register_faces WHERE id_number = ? AND deleted_at IS NULL LIMIT 1', [userId]);

        if (!RegisterFaceInfo || !RegisterFaceInfo.saved_face_filename) throw new NotFoundError('Face Registration data not found!');
        return res.status(200).json({ filename: RegisterFaceInfo.saved_face_filename })

    } catch (error) {
        next(error)
    }
}