import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import Hotel from "../infrastructure/schemas/Hotel";
import ValidationError from "../domain/errors/validation-error";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getVectorCollection } from '../infrastructure/vector-collection';

type ChatRole = 'user' | 'assistant';

type ChatHistoryItem = {
    role: ChatRole;
    content: string;
};

const model = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_CHAT_MODEL ?? "gemini-3.1-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.3,
    convertSystemMessageToHumanContent: true,
});

const resolvePromptPath = () => {
    const candidates = [
        path.join(__dirname, "prompts", "chatbot.md"),
        path.join(process.cwd(), "src", "application", "prompts", "chatbot.md"),
        path.join(process.cwd(), "dist", "application", "prompts", "chatbot.md"),
    ];

    const found = candidates.find((candidate) => fs.existsSync(candidate));

    if (!found) {
        throw new Error("Chatbot prompt file not found at expected locations");
    }

    return found;
};

const chatbotSystemPrompt = fs.readFileSync(resolvePromptPath(), "utf-8");

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
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== "string") {
            throw new ValidationError("Message is required");
        }

        const embeddingsModel = new GoogleGenerativeAIEmbeddings({
            model: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
            apiKey: process.env.GEMINI_API_KEY
        });

        const nativeCollection = await getVectorCollection();

        const vectorStore = new MongoDBAtlasVectorSearch(embeddingsModel, {
            collection: nativeCollection,
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

        const geminiMessages = [
            new SystemMessage(chatbotSystemPrompt),
            ...safeHistory.map((item) =>
                item.role === "assistant"
                    ? new AIMessage(item.content)
                    : new HumanMessage(item.content)
            ),
            new HumanMessage(`
Hotel context:
${hotelContext || "No matching hotels found."}

Current user message:
${message}
            `.trim()),
        ];

        const completion = await model.invoke(geminiMessages);
        const content = Array.isArray(completion.content)
            ? completion.content
                .map((item) => {
                    if (typeof item === "string") {
                        return item;
                    }

                    return "text" in item ? item.text : "";
                })
                .join("")
            : completion.content;

        res.status(200).json({
            message: {
                role: "assistant",
                content,
            },
        });
    } catch (error) {
        next(error);
    }
}
