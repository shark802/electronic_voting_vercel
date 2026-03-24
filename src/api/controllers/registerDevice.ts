import { NextFunction, Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../../utils/customErrors";
import { v4 as uuidV4 } from "uuid";
import { insertQuery, selectQuery, updateQuery } from "../../data_access/query";
import { pool } from "../../config/database";
import { RegisterDevice } from "../../utils/types/RegisterDevice";
import { Server } from "socket.io";

export async function requestUuidFunction(req: Request, res: Response, next: NextFunction) {
    try {
        const { codeName } = req.body;
        if (!codeName) throw new BadRequestError("Please preovide code name");

        const uuid = uuidV4();
        const result = await insertQuery(pool, "INSERT INTO register_devices (uuid, codename) VALUES(?, ?)", [uuid, codeName]);
        if (result.affectedRows < 1) throw new NotFoundError('No record added');

        const socket: Server = res.locals.io;

        socket.emit('new-register-device-request', codeName, uuid);
        res.status(201).json({ codeName, uuid, status: 'pending' });
    } catch (error) {
        next(error);
    }
}

export async function declineRequestFunction(req: Request, res: Response, next: NextFunction) {
    try {
        const uuid = req.params.id;
        if (!uuid) throw new BadRequestError("Missing UUID");

        const deleteResult = await updateQuery(pool, 'UPDATE register_devices SET deleted_at = CURDATE() WHERE uuid = ? AND deleted_at IS NULL', [uuid]);
        if (deleteResult.affectedRows < 1) throw new NotFoundError('No resource modified, check the uuid if correct');
        return res.status(200).json({ message: 'Request declined' });

    } catch (error) {
        next(error);
    }
}

export async function updateRegisterStatusFunction(req: Request, res: Response, next: NextFunction) {
    try {

        const uuid = req.params.id;
        const isToRegister = req.body.isToRegister;

        if (!uuid) throw new BadRequestError('UUID is missing');
        if (isToRegister === undefined) throw new BadRequestError('Provide action to perform update register status');

        const registerQuery = await updateQuery(pool, "UPDATE register_devices SET is_registered = ?, updated_at = NOW() WHERE uuid = ? AND deleted_at IS NULL", [isToRegister, uuid]);
        if (registerQuery.affectedRows < 1) throw new NotFoundError('No resource modified, check UUID if correct');

        // const socket = res.locals.socket;
        // const status = Number(isToRegister) === 1 ? 'REGISTERED' : 'PENDING';
        // socket.emit(uuid, status); // emit the event to client with uuid

        const responseMessage = isToRegister === true ? 'Device successfully registered' : 'Device unregistered'
        return res.status(200).json({ message: responseMessage });

    } catch (error) {
        next(error)
    }
}

export async function checkUuidStatus(req: Request, res: Response, next: NextFunction) {
    try {
        const uuid = req.params.id;
        if (!uuid) throw new BadRequestError('Please provide UUID');

        const [uuidFound] = await selectQuery<RegisterDevice>(pool, 'SELECT * FROM register_devices WHERE uuid = ? LIMIT 1', [uuid]);
        if (!uuidFound) throw new NotFoundError('Device UUID not found');

        let status: string;
        if (uuidFound.deleted_at) {
            status = "DELETED";
        } else if (uuidFound.is_registered === 1) {
            status = "REGISTERED";
        } else {
            status = "PENDING";
        }

        return res.status(200).json({ status })

    } catch (error) {
        next(error)
    }
}

export async function validateUuid(req: Request, res: Response, next: NextFunction) {
    try {
        const uuid = req.body.uuid;
        if (!uuid) throw new BadRequestError('Uuid is undefined');

        const [uuidRow] = await selectQuery<RegisterDevice>(pool, 'SELECT * FROM register_devices WHERE uuid = ? AND deleted_at IS NULL', [uuid]);
        if (!uuidRow) throw new NotFoundError('Uuid not found!');

        const isUuidRegistered = uuidRow.is_registered === 1 ? "REGISTERED" : "UNREGISTERED";
        req.session.deviceRegistrationStatus = isUuidRegistered;

        return res.status(200).end();
    } catch (error) {
        next(error)
    }
}