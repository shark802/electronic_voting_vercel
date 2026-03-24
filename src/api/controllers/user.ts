import { NextFunction, Request, Response } from "express";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/customErrors";
import { insertQuery, selectQuery, updateQuery } from "../../data_access/query";
import { User } from "../../utils/types/User";
import { pool } from "../../config/database";
import { ResultSetHeader } from "mysql2";
import csv from 'csvtojson';
import fs from "fs";
import { CsvUserObject } from "../../utils/types/CsvUserObject";
import { importUsersToDatabase } from "../../utils/importUserToDatabase";
import { v4 as uuidV4 } from "uuid";
import { errorMonitor } from "events";

export async function newUserFunction(req: Request, res: Response, next: NextFunction) {
    try {
        const { userObject, userRoles } = req.body;
        if (!userObject) throw new BadRequestError('Missing object of user data');
        if (!userRoles) throw new BadRequestError('Missing object of user roles');

        Object.keys(userObject).forEach(key => {
            if (typeof userObject[key] === 'string') {
                userObject[key] = userObject[key].toUpperCase();
            }
        });

        const { id_number, firstname, lastname, course } = userObject;
        const { voter, program_head, admin } = userRoles

        if (!id_number) throw new BadRequestError('Missing user id number');
        if (!firstname) throw new BadRequestError('Missing user firstname');
        if (!lastname) throw new BadRequestError('Missing user lastname');
        if (!course) throw new BadRequestError('Missing user course');
        if (!('voter' in userRoles)) throw new BadRequestError('Missing user voter role');
        if (!('program_head' in userRoles)) throw new BadRequestError('Missing user program head role');
        if (!('admin' in userRoles)) throw new BadRequestError('Missing user admin role');


        const [user] = await selectQuery<User>(pool, 'SELECT * FROM users WHERE id_number = ? LIMIT 1', [id_number]);
        if (user) throw new ConflictError(`${userObject.id_number} already exist`);

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute('INSERT INTO users (id_number, firstname, lastname, course) VALUES(?, ?, ?, ?)', [id_number, firstname, lastname, course]);
            await connection.execute('INSERT INTO roles (id_number, voter, program_head, admin) VALUES(?, ?, ?, ?)', [id_number, voter, program_head, admin]);
            await connection.commit();

            return res.status(200).json({ message: 'Succesfully added new user' });
        } catch (error) {
            await connection.rollback();
        } finally {
            await connection.release();
        }

    } catch (error) {
        next(error)
    }
}

export async function updateUserFunction(req: Request, res: Response, next: NextFunction) {
    try {
        const idNumber = req.params.id;
        const { userObject, userRoles } = req.body;
        if (!userObject) throw new BadRequestError('Missing object of user data');
        if (!userRoles) throw new BadRequestError('Missing object of user roles');

        Object.keys(userObject).forEach(key => {
            if (typeof userObject[key] === 'string') {
                userObject[key] = userObject[key].toUpperCase();
            }
        });

        const { id_number, firstname, lastname, course } = userObject;
        const { voter, program_head, admin } = userRoles

        if (!id_number) throw new BadRequestError('Missing user id number');
        if (!firstname) throw new BadRequestError('Missing user firstname');
        if (!lastname) throw new BadRequestError('Missing user lastname');
        if (!course) throw new BadRequestError('Missing user course');
        if (!('voter' in userRoles)) throw new BadRequestError('Missing user voter role');
        if (!('program_head' in userRoles)) throw new BadRequestError('Missing user program head role');
        if (!('admin' in userRoles)) throw new BadRequestError('Missing user admin role');

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [userUpdateResult] = await connection.execute<ResultSetHeader>('UPDATE users SET firstname = ?, lastname = ?, course = ? WHERE id_number = ?', [firstname, lastname, course, idNumber]);
            const [userRolesUpdateResult] = await connection.execute<ResultSetHeader>('UPDATE roles SET voter = ?, program_head = ?, admin = ? WHERE id_number = ?', [voter, program_head, admin, idNumber]);
            await connection.commit();

            if (userUpdateResult.affectedRows <= 0 || userRolesUpdateResult.affectedRows <= 0) throw new NotFoundError('No user updated, please check if user exist');

            return res.status(200).json({ message: 'Update successfull' });
        } catch (error) {
            await connection.rollback();
        } finally {
            await connection.release();
        }

    } catch (error) {
        next(error)
    }
}

export async function getUserByIdNumber(req: Request, res: Response, next: NextFunction) {
    try {
        const idNumber = req.params.id;
        if (!idNumber) throw new BadRequestError('Id number is missing');

        const sqlQuery = 'SELECT * FROM users JOIN roles ON users.id_number = roles.id_number WHERE users.id_number = ? LIMIT 1'
        const [user] = await selectQuery<User>(pool, sqlQuery, [idNumber]);

        if (!user) throw new NotFoundError('User Not Found!');

        return res.status(200).json({ user });
    } catch (error) {
        next(error)
    }
}

export async function importUsers(req: Request, res: Response, next: NextFunction) {
    try {
        const socket = res.locals.io;
        const connection = await pool.getConnection();
        try {
            const usersFile = req.file;
            if (!usersFile) {
                throw new BadRequestError('No file uploaded. Please upload a CSV file to import users into the database.');
            }

            const importId = uuidV4();
            const userCsvFile: CsvUserObject[] = await csv().fromFile(usersFile.path);
            const filename = usersFile.filename;
            fs.unlinkSync(usersFile.path);

            // Validate that all required fields are present in the CSV data
            const requiredFields = ['ID NUMBER', 'LAST NAME', 'FIRST NAME', 'MIDDLE NAME', 'COURSE', 'YEAR', 'SECTION', 'PASSWORD'];
            requiredFields.forEach(fieldname => {
                if (!Object.keys(userCsvFile[0]).includes(fieldname)) {
                    throw new BadRequestError(`Error importing users: Missing required field "${fieldname}".`)
                }
            })

            await insertQuery(pool, 'INSERT INTO users_import_records (id, import_size) VALUES(?, ?)', [importId, userCsvFile.length])

            await connection.beginTransaction();
            await connection.execute('UPDATE users SET is_active = 0 WHERE is_active = 1');

            await connection.commit();
            const result = await importUsersToDatabase(userCsvFile, importId, filename, connection, socket);
            await updateQuery(pool, 'UPDATE users_import_records SET time_taken = ?, import_size = ?, status = ? WHERE id = ?', [result.importTimeInMinutes, result.importSize, 'Successful', importId])

            socket.emit('user-import-success', {
                status: 'SUCCESSFUL',
                message: 'Import completed successfully!',
                importId: importId,
                importSize: result.importSize,
                percentage: 100,
                timeTaken: result.importTimeInMinutes
            });

            res.status(200).json({ import_date: new Date().toLocaleDateString(), message: 'Importing started' })

        } catch (error) {
            if (connection) await connection.rollback();
            next(error);
        } finally {
            if (connection) await connection.release();
        }

    } catch (error) {
        next(error)
    }
}

export async function getAllImportUserRecords(req: Request, res: Response, next: NextFunction) {
    try {

        const import_records = await selectQuery(pool, 'SELECT * FROM users_import_records');
        res.status(200).json({ import_records });
    } catch (error) {
        next(errorMonitor)
    }
}