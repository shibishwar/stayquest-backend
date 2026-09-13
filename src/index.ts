import "dotenv/config";
import express from "express";
import connectDB from "./infrastructure/db";
import { clerkMiddleware } from "@clerk/express";
import globalErrorHandlingMiddleware from "./api/middlewares/global-error-handling-middleware";
import notFoundMiddleware from "./api/middlewares/notfound-middleware";
import cors from "cors";
import bookingsRouter from "./api/booking";
import hotelsRouter from "./api/hotel";
import { apiReference } from "@scalar/express-api-reference";
import openApiSpec from "./docs/openapi";

// Create an instance of Express application
const app = express();

// Apply Clerk middleware for authentication & authorization
app.use(clerkMiddleware());

// Middleware to parse incoming JSON requests
app.use(express.json());

// Enable CORS to allow requests from the origin
app.use(
    cors({ origin: "https://aidf-stayquest-frontend-shibishwar.netlify.app" })
);

// Connect to the database
connectDB();

// Define routes for hotels and bookings
app.use("/api/hotels", hotelsRouter);
app.use("/api/bookings", bookingsRouter);

// Serve raw OpenAPI JSON spec
app.get("/api-docs/openapi.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json(openApiSpec);
});

// Serve Scalar interactive API reference UI
app.use(
    "/api-docs",
    apiReference({
        spec: { url: "/api-docs/openapi.json" },
        theme: "deepSpace",
    })
);

// Middleware to handle all unmatched routes
app.use(notFoundMiddleware);

// Middleware for centralized error handling
app.use(globalErrorHandlingMiddleware);

// Define the port number
const PORT = process.env.PORT || 8000;

// Handle unexpected runtime errors and avoid crashing on unhandled promise rejections
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
