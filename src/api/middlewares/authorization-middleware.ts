import { NextFunction, Request, Response } from "express";
import ForbiddenError from "../../domain/errors/forbidden-error";
import { clerkClient } from "@clerk/express";

export const isAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.auth?.sessionClaims?.sub;
        if (!userId) {
            return next(new ForbiddenError("Authentication required"));
        }

        const user = await clerkClient.users.getUser(userId);
        console.log("User Public Metadata:", user?.publicMetadata);

        if (user?.publicMetadata?.role !== "admin") {
            return next(new ForbiddenError("Admin access required"));
        }

        next();
    } catch (error) {
        console.error("Error fetching user:", error);
        next(new ForbiddenError("Failed to verify admin status"));
    }
};
