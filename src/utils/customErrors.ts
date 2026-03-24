/**
 * to extends by custom error classes to provide custom property for error
 */
export abstract class customError extends Error {
	abstract statusCode: number;
	abstract name: string;

	constructor(errorMessasge?: string) {
		super(errorMessasge);
	}
}

/**
 * Represents Unauthorized access error
 * This error is thrown when a client attempts to perform action but requires authentication
 */
export class UnauthorizedError extends customError {
	statusCode = 401;
	name = "Unauthorized Error";

	constructor(errorMessage?: string) {
		super(errorMessage || "User don't have access");
	}
}

/**
 * Represents error if resource not found
 * This error is thrown when attempts to access a resource but not exist
 */
export class NotFoundError extends customError {
	statusCode = 404;
	name = "Not Found Error"

	constructor(errorMessage?: string) {
		super(errorMessage || "Resource not found, Action failed due to resource not exist");
	}
}

/**
 * Represents an error when the client sends a bad request.
 * This error is thrown when the server cannot process the request due to client-side errors.
 */
export class BadRequestError extends customError {
	statusCode = 400;
	name = "Bad Request Error";

	constructor(errorMessage?: string) {
		super(errorMessage || "Bad Request, Server cannot process the request due to client side error.")
	}
}

/**
 * Represents a forbidden error.
 * This error is thrown when the server understands the request but the resource is restricted and cannot be accessed.
 */
export class ForbiddenError extends customError {
	statusCode = 403;
	name = "Rorbidden Error";

	constructor(errorMessasge?: string) {
		super(errorMessasge || "Forbidden: Access to the requested resource is denied.");
	}
}

/**
 * Represents conflict error
 * This error is thrown when attempting to create a new resource but already exist.
 */
export class ConflictError extends customError {
	statusCode = 409;
	name = "Conflict Error";

	constructor(errorMessage?: string) {
		super(errorMessage || "Conflict, resource already exist");
	}
}