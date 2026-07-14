import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import OpenAI from 'openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import Hotel from "../infrastructure/schemas/Hotel";
import ValidationError from "../domain/errors/validation-error";

type ChatRole = 'user' | 'assistant';

type ChatHistoryItem = {
    role: ChatRole;
    content: string;
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const chatbotPromptPath = path.join(
    __dirname,
    "prompts",
    "chatbot.md"
);

const chatbotSystemPrompt = fs.readFileSync(chatbotPromptPath, "utf-8");

const sanitizeHistory = (history: unknown): ChatHistoryItem[] => {
    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .filter((item) => {
            return (
                item &&
                typeof item === "object" &&
                "role" in item &&
                "content" in item &&
                (item.role === "user" || item.role === "assistant") &&
                typeof item.content === "string"
            );
        })
        .slice(-10)
        .map((item) => ({
            role: item.role,
            content: item.content.slice(0, 1000), 
        }));
};

export const chatbotResponse = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try{
        const { message, history } = req.body;

        if (!message || typeof message !== "string") {
            throw new ValidationError("Message is required");
        }

        const embeddingsModel = new OpenAIEmbeddings({
            model: "text-embedding-3-large",
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        const { connection } = require("mongoose");

        const vectorStore = new MongoDBAtlasVectorSearch(embeddingsModel, {
            collection: connection.collection("hotelVectors"),
            indexName: "vector_index",
        });

        const results = await vectorStore.similaritySearchWithScore(message, 4);

        const matchedHotels = await Promise.all(
            results.map(async ([doc, score]) => {
                const hotel = await Hotel.findById(doc.metadata._id);

                return {
                    hotel, 
                    confidence: score,
                    content: doc.pageContent,
                };
            })
        );

        const hotelContext = matchedHotels
            .filter((item) => item.hotel)
            .map((item, index) => {
                const hotel = item.hotel as any;

                return `
Hotel ${index + 1}:
Name: ${hotel.name}
Location: ${hotel.location}
Price per night: ${hotel.price}
Description: ${hotel.description}
Rating: ${hotel.rating}/5
Reviews: ${hotel.reviews}
Amenities: ${hotel.amenities?.join(", ")}
                `.trim();
            })
            .join("\n\n");

        const safeHistory = sanitizeHistory(history);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: chatbotSystemPrompt,
                },
                ...safeHistory,
                {
                    role: "user",
                    content: `
Hotel context:
${hotelContext || "No matching hotels found."}

Current user message:
${message}
                    `.trim(),
                },
            ],
        });

        res.status(200).json({
            message: {
                role: "assistant",
                content: completion.choices[0].message.content,
            },
            matchedHotels,
        });
    } catch (error) {
        next(error);
    }
}