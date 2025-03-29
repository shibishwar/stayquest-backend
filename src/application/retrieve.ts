import { Request, Response, NextFunction } from "express";
import Hotel from "../infrastructure/schemas/Hotel";
import mongoose from "mongoose";
import { Collection, Document } from "mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";

export const retrieve = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { query } = req.query;
        console.log(query);

        if (!query || query === "") {
            const hotels = (await Hotel.find()).map((hotel) => ({
                hotel: hotel,
                confidence: 1,
            }));

            res.status(200).json(hotels);
            return;
        }

        const embeddingsModel = new OpenAIEmbeddings({
            model: "text-embedding-ada-002",
            apiKey: process.env.OPENAI_API_KEY,
        });

        const vectorIndex = new MongoDBAtlasVectorSearch(embeddingsModel, {
            collection: mongoose.connection.collection(
                "hotelVectors"
            ) as unknown as Collection<Document>,
            indexName: "vector_index",
        });

        const results = await vectorIndex.similaritySearchWithScore(
            query as string
        );

        const matchedHotels = await Promise.all(
            results.map(async (result) => {
                const hotel = await Hotel.findById(result[0].metadata._id);
                return {
                    hotel: hotel,
                    confidence: result[1],
                };
            })
        );

        res.status(200).json(
            matchedHotels.length > 3 ? matchedHotels.slice(0, 4) : matchedHotels
            // matchedHotels.filter((hotel) => hotel.confidence > 0.9)
        );
        return;
    } catch (error) {
        next(error);
    }
};
