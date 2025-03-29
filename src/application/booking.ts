import { NextFunction, Request, Response } from "express";
import Booking from "../infrastructure/schemas/Booking";
import Hotel from "../infrastructure/schemas/Hotel";
import { CreateBookingDTO } from "../domain/dtos/booking";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import { clerkClient } from "@clerk/express";

export const createBooking = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const booking = CreateBookingDTO.safeParse(req.body);

        if (!booking.success) {
            throw new ValidationError(booking.error.message);
        }

        const user = req.auth;

        // Check if the check-in date is before the check-out date
        const checkInDate = new Date(booking.data.checkIn);
        const checkOutDate = new Date(booking.data.checkOut);

        if (checkInDate >= checkOutDate) {
            throw new NotFoundError(
                "Check-in date must be before check-out date"
            );
        }

        // Check if the check-in date is in the past
        const today = new Date();
        const todayAtMidnight = new Date(today.setHours(0, 0, 0, 0));
        if (checkInDate < todayAtMidnight) {
            throw new NotFoundError("Check-in date must be in the future");
        }

        // Fetch hotel details to get price per night
        const hotel = await Hotel.findById(booking.data.hotelId);
        if (!hotel) {
            throw new NotFoundError("Hotel not found");
        }

        // Calculate total price
        const totalNights = Math.max(
            Math.ceil(
                (checkOutDate.getTime() - checkInDate.getTime()) /
                    (1000 * 60 * 60 * 24)
            ),
            1
        );
        const totalPrice = totalNights * hotel.price;

        await Booking.create({
            hotelId: booking.data.hotelId,
            userId: user.userId,
            checkIn: booking.data.checkIn,
            checkOut: booking.data.checkOut,
            price: totalPrice,
        });

        res.status(201).send();
        return;
    } catch (error) {
        next(error);
    }
};

export const getAllBookingsForHotel = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const hotelId = req.params.hotelId;
        const bookings = await Booking.find({ hotelId: hotelId });
        const bookingsWithUser = await Promise.all(
            bookings.map(async (el) => {
                const user = await clerkClient.users.getUser(el.userId);
                return {
                    _id: el._id,
                    hotelId: el.hotelId,
                    checkIn: el.checkIn,
                    checkOut: el.checkOut,
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                    },
                };
            })
        );

        res.status(200).json(bookingsWithUser);
        return;
    } catch (error) {
        next(error);
    }
};

export const getUserBookings = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.auth;

        const bookings = await Booking.find({ userId: user.userId }).populate(
            "hotelId"
        );

        res.status(200).json(bookings);
    } catch (error) {
        next(error);
    }
};

export const deleteBooking = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.auth;

        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            throw new NotFoundError("Booking not found");
        }

        if (booking.userId !== user.userId) {
            throw new NotFoundError("Cannot delete this booking");
        }

        await Booking.findByIdAndDelete(bookingId);
        res.status(200).json({
            message: "Booking deleted successfully",
            booking,
        });
    } catch (error) {
        next(error);
    }
};
