// Importing necessary types from Express
import { Request, Response, NextFunction } from "express";

/**
 * Middleware to handle 404 Not Found errors.
 * This function is called when no other route matches the incoming request.
 *
 * @param req - The incoming request object
 * @param res - The outgoing response object
 * @param next - The next middleware function in the stack
 */
const notFoundMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Respond with a 404 status code and a JSON error message
    res.status(404).json({ message: "Route not found" });
};

// Exporting the middleware function for use in other parts of the application
export default notFoundMiddleware;
