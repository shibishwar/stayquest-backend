import { Request, Response, NextFunction } from "express";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import Hotel from "../infrastructure/schemas/Hotel";
import { getVectorCollection } from "../infrastructure/vector-collection";

export const createEmbeddings = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const embeddingsModel = new GoogleGenerativeAIEmbeddings({
            model: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
            apiKey: process.env.GEMINI_API_KEY,
        });

        const nativeCollection = await getVectorCollection();
        await nativeCollection.deleteMany({});

        const vectorIndex = new MongoDBAtlasVectorSearch(embeddingsModel, {
            collection: nativeCollection,
            indexName: "vector_index",
        });

        const hotels = await Hotel.find({});

        const docs = hotels.map((hotel) => {
            const { _id, name, location, description } = hotel;

            return new Document({
                pageContent: `${name} is a hotel located in ${location}. ${description}`,
                metadata: { _id },
            });
        });

        await vectorIndex.addDocuments(docs);

        res.status(200).json({
            message: "Embeddings created successfully",
        });
    } catch (error) {
        next(error);
    }
};
