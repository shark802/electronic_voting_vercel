import { Request, Response, NextFunction } from "express";
import { pool } from "../config/database";
import { selectQuery } from "../data_access/query";
import { UnauthorizedError } from "./customErrors";
import { Role } from "./types/Role";
import { User } from "./types/User";


export async function handleLocalLogin(id_number: string, password: string, req: Request, res: Response, next: NextFunction) {
    try {
        const [user] = await selectQuery<User>(pool, 'SELECT password FROM users WHERE id_number = ?', [id_number]);

        if (!user || !user.password) {
            return next(new UnauthorizedError("Login Failed!"));
        }

        const isPasswordMatch = user.password === password;

        if (!isPasswordMatch) throw new UnauthorizedError("Login Failed!");

        const [userRoleRow] = await selectQuery<Role>(pool, "SELECT * FROM roles WHERE id_number = ?", [id_number]);
        req.session.user = {
            user_id: id_number,
            roles: {
                admin: userRoleRow.admin,
                program_head: userRoleRow.program_head,
                voter: userRoleRow.voter
            }
        };

        if (userRoleRow.admin) return res.redirect('/admin/dashboard/overview');
        if (userRoleRow.program_head) return res.redirect('/program-head/dashboard/overview');
        return res.redirect('/election');

    } catch (error) {
        next(error);
    }
}