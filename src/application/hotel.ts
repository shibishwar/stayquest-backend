import { Request, Response, NextFunction } from "express";
import Hotel from "../infrastructure/schemas/Hotel";
import { CreateHotelDTO } from "../domain/dtos/hotel";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import OpenAI from "openai";

// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getAllHotels = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { location, minPrice, maxPrice, sort } = req.query;

        let query: any = {};

        // Filter by location
        // if (location) query.$text = { $search: location };
        if (typeof location === "string") {
            query.location = { $regex: new RegExp(location, "i") };
        }

        // Filter by price
        if (minPrice || maxPrice) {
            query.price = {
                ...(minPrice && { $gte: Number(minPrice) }),
                ...(maxPrice && { $lte: Number(maxPrice) }),
            };
        }

        let sortOption = {};

        // Sorting
        if (sort === "price_asc") sortOption = { price: 1 };
        if (sort === "price_desc") sortOption = { price: -1 };
        if (sort === "alphabetical_asc") sortOption = { name: 1 };
        if (sort === "alphabetical_desc") sortOption = { name: -1 };

        const hotels = await Hotel.find(query).sort(sortOption);

        res.status(200).json(hotels);
    } catch (error) {
        next(error);
    }
};

export const getHotelById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const hotelId = req.params.id;
        const hotel = await Hotel.findById(hotelId);

        if (!hotel) {
            throw new NotFoundError("Hotel not found");
        }

        res.status(200).json(hotel);
        return;
    } catch (error) {
        next(error);
    }
};

export const generateResponse = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { prompt } = req.body;

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        store: true,
    });

    res.status(200).json({
        message: {
            role: "assistant",
            content: completion.choices[0].message.content,
        },
    });
    return;
};

export const createHotel = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const hotel = CreateHotelDTO.safeParse(req.body);

        if (!hotel.success) {
            throw new ValidationError(hotel.error.message);
        }

        await Hotel.create({
            name: hotel.data.name,
            location: hotel.data.location,
            image: hotel.data.image,
            price: hotel.data.price,
            description: hotel.data.description,
            amenities: hotel.data.amenities || [],
        });

        res.status(201).json({ message: "Hotel created successfully" });
    } catch (error) {
        next(error);
    }
};

export const deleteHotel = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const hotelId = req.params.id;
        const hotel = await Hotel.findByIdAndDelete(hotelId);

        if (!hotel) {
            throw new NotFoundError("Hotel not found");
        }

        res.status(200).json({ message: "Hotel deleted successfully", hotel });
        return;
    } catch (error) {
        next(error);
    }
};

export const updateHotel = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const hotelId = req.params.id;
        const updatedHotel = req.body;

        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            throw new NotFoundError("Hotel not found");
        }

        const validation = CreateHotelDTO.safeParse(updatedHotel);
        if (!validation.success) {
            throw new ValidationError(validation.error.message);
        }

        const updated = await Hotel.findByIdAndUpdate(hotelId, updatedHotel, {
            new: true,
        });

        res.status(200).json({
            message: "Hotel updated successfully",
            hotel: updated,
        });
        return;
    } catch (error) {
        next(error);
    }
};
