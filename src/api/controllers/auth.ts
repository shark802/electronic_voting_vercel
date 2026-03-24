import { Request, Response, NextFunction } from "express";
import { BadRequestError, UnauthorizedError } from "../../utils/customErrors";
import { TechnopalApiObject } from "../../utils/types/TechnopalApiObject";
import { convertApiObjectToUser } from "../../utils/convertApiObjectToUser";
import { pool } from "../../config/database";
import { createUser } from "../../utils/createUser";
import { Role } from "../../utils/types/Role";
import { selectQuery } from "../../data_access/query";
import { RowDataPacket } from 'mysql2/promise';
import { handleLocalLogin } from "../../utils/handleLocalLogin";
import { User } from "../../utils/types/User";
import session from "express-session";

export async function loginFunction(req: Request, res: Response, next: NextFunction) {
    const { id_number, password } = req.body;
    try {
        if (!id_number || !password) throw new BadRequestError("Missing credentials!");

        // const response = await fetch(`https://bagocitycollege.com/BCCWeb/TPLoginAPI?txtUserName=${id_number}&txtPassword=${password}`, {
        //     method: 'GET',
        //     headers: {
        //         'Accept': 'application/json; charset=utf-8',
        //     }
        // });

        // const arrayBuffer = await response.arrayBuffer();
        // const decoder = new TextDecoder('iso-8859-1');
        // const decodedText = decoder.decode(arrayBuffer);
        // const apiResponseObject = JSON.parse(decodedText);

        // if (!apiResponseObject.is_valid) throw new UnauthorizedError("Login Failed!");

        // // Login successful
        // let user = convertApiObjectToUser(apiResponseObject);

        // const connection = await pool.getConnection();
        // try {
        //     await connection.beginTransaction();

        //     await createUser(connection, user); // save user info in database.
        //     const [rowResult] = await connection.execute<RowDataPacket[]>("SELECT * FROM roles WHERE id_number = ?", [user.id_number]);

        //     // If user don't have role yet, add role
        //     if (rowResult.length === 0) {
        //         const voterRole = apiResponseObject.user_group === "STUDENT" ? 1 : 0; // assign the voter role if the user is student.
        //         await connection.execute("INSERT INTO roles (voter, id_number) VALUES (?, ?)", [voterRole, user.id_number]);
        //     }
        //     await connection.commit();

        // } catch (error) {
        //     await connection.rollback()
        //     return next(error);
        // } finally {
        //     await connection.release();
        // }

        // attach this role result to user session
        const [user] = await selectQuery<User & Role>(
            pool,
            `SELECT * FROM users
             LEFT JOIN roles
             ON roles.id_number = users.id_number
             WHERE users.id_number = ?`,
            [id_number]
        )

        if (!user || !user?.password) {
            throw new UnauthorizedError('Login failed!')
        }

        // const isPasswordMatch = await bcrypt.compare(password, user.password);
        const isPasswordMatch = user.password === password;
        if (!isPasswordMatch) throw new UnauthorizedError("Login Failed!");


        // const [userRoleRow] = await selectQuery<Role>(pool, "SELECT * FROM roles WHERE id_number = ?", [user.id_number]);
        req.session.user = {
            user_id: user.id_number,
            roles: {
                admin: user.admin,
                program_head: user.program_head,
                voter: user.voter
            }
        }

        if (user.admin) return res.status(302).redirect('/admin/dashboard/overview');
        if (user.program_head) return res.status(302).redirect('/program-head/dashboard/overview');

        return res.status(302).redirect('/election');

    } catch (error) {
        if (error instanceof Error && error.name === 'TypeError' && error.message === 'fetch failed') {
            await handleLocalLogin(id_number, password, req, res, next);
        } else {

            next(error);
        }
    }

}

export async function logoutFunction(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.session) return next(new Error('No session found'));

        req.session.destroy((error) => {
            if (error) {
                return next(error);
            }

            res.clearCookie("connect.sid");
            res.status(200).json({ message: 'Logged out successfully' });
        });
    } catch (error) {
        console.error('Unexpected error during logout:', error);
        next(error);
    }
}

export async function isFaceVerified(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.session || !req.session?.user) throw new UnauthorizedError('Login Required');

        const faceVerified: boolean = req.body?.faceVerified;
        if (faceVerified === undefined || faceVerified === null) throw new BadRequestError('Face verified status is missing');

        req.session.faceVerified = faceVerified;
        return res.status(200).end();

    } catch (error) {
        next(error)
    }
}