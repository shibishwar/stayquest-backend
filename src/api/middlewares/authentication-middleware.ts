import { Request, Response, NextFunction } from "express";
import UnauthorizedError from "../../domain/errors/unauthorized-error";

/**
 * Middleware to check if the user is authenticated.
 * It assumes that authentication information (e.g., userId) is already attached to req.auth by a previous middleware.
 */
export const isAuthenticated = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Check if req.auth and req.auth.userId exist.
    // If not, the user is considered unauthenticated.
    if (!req?.auth.userId) {
        // Throw a custom UnauthorizedError to indicate the user is not authenticated.
        throw new UnauthorizedError("Unauthenticated");
    }
    // If the user is authenticated, continue to the next middleware or route handler.
    next();
};
