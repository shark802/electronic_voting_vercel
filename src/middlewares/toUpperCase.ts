import { NextFunction, Request, Response } from "express";

export async function toUpperCase(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.body) return next();

        Object.entries(req.body).forEach(([key, value]) => {
            if (typeof value === 'string') {
                req.body[key] = value.toUpperCase();
            }
        })
        return next();
    } catch (error) {
        next(error)
    }
}
