import { Request, Response, NextFunction } from "express";

// Global error handling middleware function
const globalErrorHandlingMiddleware = (
    error: any, // The error thrown in the application
    req: Request, // Incoming HTTP request
    res: Response, // HTTP response object
    next: NextFunction // Function to pass control to the next middleware
) => {
    // Log the error for debugging purposes
    console.error(error);

    if (error?.name === "NotFoundError") {
        res.status(404).json({ message: error.message });
        return;
    }

    if (error?.name === "ValidationError") {
        res.status(400).json({ message: error.message });
        return;
    }

    if (error?.name === "UnauthorizedError") {
        res.status(401).json({ message: error.message });
        return;
    }

    if (error?.name === "ForbiddenError") {
        res.status(403).json({ message: error.message });
        return;
    }

    const isProviderError =
        error && typeof error === "object" &&
        ("status" in error || "code" in error || "type" in error);

    if (isProviderError) {
        const code = typeof error.code === "string" ? error.code : "";
        const message = error.message || "AI provider request failed. Please try again later.";
        const statusCode = error.status
            ? Number(error.status)
            : code === "insufficient_quota" || code.includes("rate_limit")
            ? 429
            : 502;

        res.status(statusCode).json({ message });
        return;
    }

    res.status(500).json({ message: "Internal Server Error" });
};

// Export the middleware for use in your Express application
export default globalErrorHandlingMiddleware;
