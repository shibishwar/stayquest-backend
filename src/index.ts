import "dotenv/config";
import express from "express";
import connectDB from "./infrastructure/db";
import { clerkMiddleware } from "@clerk/express";
import globalErrorHandlingMiddleware from "./api/middlewares/global-error-handling-middleware";
import notFoundMiddleware from "./api/middlewares/notfound-middleware";
import cors from "cors";
import bookingsRouter from "./api/booking";
import hotelsRouter from "./api/hotel";

// Create an instance of Express application
const app = express();

// Apply Clerk middleware for authentication & authorization
app.use(clerkMiddleware());

// Middleware to parse incoming JSON requests
app.use(express.json());

// Enable CORS to allow requests from the origin
// app.use(
//     cors({ origin: "https://aidf-stayquest-frontend-shibishwar.netlify.app" })
// );
app.use(cors());

// Connect to the database
connectDB();

// Define routes for hotels and bookings
app.use("/api/hotels", hotelsRouter);
app.use("/api/bookings", bookingsRouter);

// Middleware to handle all unmatched routes
app.use(notFoundMiddleware);

// Middleware for centralized error handling
app.use(globalErrorHandlingMiddleware);

// Define the port number
const PORT = process.env.PORT || 8000;

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
