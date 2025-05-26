import { NextFunction, Request, Response } from "express";
import ForbiddenError from "../../domain/errors/forbidden-error"; // Custom error class for handling forbidden access
import { clerkClient } from "@clerk/express"; // Clerk SDK client to interact with user data

// Middleware to check if the authenticated user has admin privileges
export const isAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract the user ID from Clerk's session claims
        const userId = req.auth?.sessionClaims?.sub;

        // If user ID is not present, authentication is required
        if (!userId) {
            return next(new ForbiddenError("Authentication required"));
        }

        // Fetch the user data from Clerk using the user ID
        const user = await clerkClient.users.getUser(userId);

        // Log the user's public metadata for debugging purposes
        console.log("User Public Metadata:", user?.publicMetadata);

        // Check if the user's role in public metadata is 'admin'
        if (user?.publicMetadata?.role !== "admin") {
            return next(new ForbiddenError("Admin access required"));
        }

        // If the user is an admin, proceed to the next middleware or route handler
        next();
    } catch (error) {
        // Log any error that occurs while fetching user data
        console.error("Error fetching user:", error);

        // Forward a generic ForbiddenError if user verification fails
        next(new ForbiddenError("Failed to verify admin status"));
    }
};
