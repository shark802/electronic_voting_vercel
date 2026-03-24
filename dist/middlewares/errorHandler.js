"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const customErrors_1 = require("../utils/customErrors");
function errorHandler(error, req, res, next) {
    if (error instanceof customErrors_1.customError) {
        res.status(error.statusCode).json({ name: error.name, message: error.message });
    }
    else {
        // console.error(`${error.name}: ${error.message}`);
        console.error(`${error.stack}`);
        res.status(500).render('error', {
            error: {
                name: error.name,
                message: error.message
            }
        });
    }
}
exports.errorHandler = errorHandler;
