import { NextFunction, Request, Response } from "express";
import { customError } from "../utils/customErrors";

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  if (error instanceof customError) {
    res.status(error.statusCode).json({ name: error.name, message: error.message });
  } else {
    // console.error(`${error.name}: ${error.message}`);
    console.error(`${error.stack}`)
    res.status(500).render('error', {
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
}
