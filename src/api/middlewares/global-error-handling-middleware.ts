import { Request, Response, NextFunction } from "express";

// Global error handling middleware function
const globalErrorHandlingMiddleware = (
    error: Error, // The error thrown in the application
    req: Request, // Incoming HTTP request
    res: Response, // HTTP response object
    next: NextFunction // Function to pass control to the next middleware
) => {
    // Log the error for debugging purposes
    console.log(error);

    // Handle NotFoundError - typically used when a requested resource is not found
    if (error.name === "NotFoundError") {
        res.status(404).json({ message: error.message });
        return;
    }

    // Handle ValidationError - used when request input fails validation rules
    if (error.name === "ValidationError") {
        res.status(400).json({ message: error.message });
        return;
    }

    // Handle UnauthorizedError - used when authentication fails or token is missing/invalid
    if (error.name === "UnauthorizedError") {
        res.status(401).json({ message: error.message });
        return;
    }

    // Handle ForbiddenError - used when the user does not have permission to access the resource
    if (error.name === "ForbiddenError") {
        res.status(403).json({ message: error.message });
        return;
    }

    // Catch-all for any other unhandled errors
    res.status(500).json({ message: "Internal Server Error" });
};

// Export the middleware for use in your Express application
export default globalErrorHandlingMiddleware;
