import "dotenv/config";
import { Request, Response, NextFunction } from "express";
import Hotel from "../infrastructure/schemas/Hotel";
import mongoose from "mongoose";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { getVectorCollection } from "../infrastructure/vector-collection";

export const retrieve = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { query } = req.query;
        if (!query || query === "") {
            const hotels = (await Hotel.find()).map((hotel) => ({
                hotel: hotel,
                confidence: 1,
            }));

            res.status(200).json(hotels);
            return;
        }

        const embeddingsModel = new GoogleGenerativeAIEmbeddings({
            model: "gemini-embedding-001",
            apiKey: process.env.GEMINI_API_KEY
        });

        const nativeCollection = await getVectorCollection();

        const vectorIndex = new MongoDBAtlasVectorSearch(embeddingsModel, {
            collection: nativeCollection,
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
        );
        return;
    } catch (error) {
        next(error);
    }
};
