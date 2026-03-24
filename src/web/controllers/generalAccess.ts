import { Request, Response, NextFunction } from "express";

export async function landingPage(req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.session.user;

        res.render("landingPage", { user })
    } catch (error) {
        return next(error)
    }

}