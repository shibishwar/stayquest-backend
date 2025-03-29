import { isAuthenticated } from "./middlewares/authentication-middleware";
import { isAdmin } from "./middlewares/authorization-middleware";
import express from "express";
import {
    createBooking,
    getAllBookingsForHotel,
    getUserBookings,
    deleteBooking,
} from "../application/booking";

const bookingsRouter = express.Router();

bookingsRouter.route("/").post(isAuthenticated, createBooking);
bookingsRouter.route("/user").get(isAuthenticated, getUserBookings);
bookingsRouter
    .route("/hotels/:hotelId")
    .get(isAuthenticated, isAdmin, getAllBookingsForHotel);
bookingsRouter.route("/:bookingId").delete(isAuthenticated, deleteBooking);

export default bookingsRouter;
