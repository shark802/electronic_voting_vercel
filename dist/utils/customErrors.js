"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.ForbiddenError = exports.BadRequestError = exports.NotFoundError = exports.UnauthorizedError = exports.customError = void 0;
/**
 * to extends by custom error classes to provide custom property for error
 */
class customError extends Error {
    constructor(errorMessasge) {
        super(errorMessasge);
    }
}
exports.customError = customError;
/**
 * Represents Unauthorized access error
 * This error is thrown when a client attempts to perform action but requires authentication
 */
class UnauthorizedError extends customError {
    constructor(errorMessage) {
        super(errorMessage || "User don't have access");
        this.statusCode = 401;
        this.name = "Unauthorized Error";
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * Represents error if resource not found
 * This error is thrown when attempts to access a resource but not exist
 */
class NotFoundError extends customError {
    constructor(errorMessage) {
        super(errorMessage || "Resource not found, Action failed due to resource not exist");
        this.statusCode = 404;
        this.name = "Not Found Error";
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Represents an error when the client sends a bad request.
 * This error is thrown when the server cannot process the request due to client-side errors.
 */
class BadRequestError extends customError {
    constructor(errorMessage) {
        super(errorMessage || "Bad Request, Server cannot process the request due to client side error.");
        this.statusCode = 400;
        this.name = "Bad Request Error";
    }
}
exports.BadRequestError = BadRequestError;
/**
 * Represents a forbidden error.
 * This error is thrown when the server understands the request but the resource is restricted and cannot be accessed.
 */
class ForbiddenError extends customError {
    constructor(errorMessasge) {
        super(errorMessasge || "Forbidden: Access to the requested resource is denied.");
        this.statusCode = 403;
        this.name = "Rorbidden Error";
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * Represents conflict error
 * This error is thrown when attempting to create a new resource but already exist.
 */
class ConflictError extends customError {
    constructor(errorMessage) {
        super(errorMessage || "Conflict, resource already exist");
        this.statusCode = 409;
        this.name = "Conflict Error";
    }
}
exports.ConflictError = ConflictError;
