import { Request, Response, NextFunction } from "express";
import { selectQuery } from "../data_access/query";
import { User } from "../utils/types/User";
import { pool } from "../config/database";

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.session.user || !req.session) {
            return res.redirect("/?redirectMessage=\"You need to login first\"");
        };

        return next();

    } catch (error) {
        next(error);
    }
}

export async function isValidVoter(req: Request, res: Response, next: NextFunction) {
    try {
        const user_id = req.session.user!.user_id
        const [user] = await selectQuery<User>(pool, "SELECT * FROM users WHERE id_number = ?", [user_id]);

        if (user.is_active === 0 || user.user_group !== "STUDENT") {
            return res.redirect('/?redirectMessage=\"You dont have right to vote on this election\"');
        }

        return next();
    } catch (error) {
        next(error);
    }
}

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        const isAdmin = req.session.user!.roles?.admin

        if (!isAdmin) {
            return res.redirect('/?redirectMessage=Access Denied: You do not have the necessary permissions');
        }

        return next();
    } catch (error) {
        next(error);
    }
}

export async function isProgramHead(req: Request, res: Response, next: NextFunction) {
    try {
        const isProgramHead = req.session.user!.roles?.program_head

        if (!isProgramHead) {
            return res.redirect('/?redirectMessage=Access Denied: You do not have the necessary permissions');
        }

        return next();
    } catch (error) {
        next(error);
    }
}