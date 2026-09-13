import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { getVectorCollection } from "../infrastructure/vector-collection";

const getVectorStore = async () => {
    const embeddingsModel = new GoogleGenerativeAIEmbeddings({
        model: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
        apiKey: process.env.GEMINI_API_KEY,
    });

    const nativeCollection = await getVectorCollection();

    return new MongoDBAtlasVectorSearch(embeddingsModel, {
        collection: nativeCollection,
        indexName: "vector_index",
    });
};

const buildDocument = (hotel: {
    _id: unknown;
    name: string;
    location: string;
    description: string;
}) =>
    new Document({
        pageContent: `${hotel.name} is a hotel located in ${hotel.location}. ${hotel.description}`,
        metadata: { _id: hotel._id },
    });

export const syncAddEmbedding = async (hotel: {
    _id: unknown;
    name: string;
    location: string;
    description: string;
}) => {
    try {
        const vectorStore = await getVectorStore();
        await vectorStore.addDocuments([buildDocument(hotel)]);
    } catch (error) {
        console.error("[sync-embedding] Failed to add embedding:", error);
    }
};

export const syncUpdateEmbedding = async (
    id: string,
    hotel: { _id: unknown; name: string; location: string; description: string }
) => {
    try {
        const nativeCollection = await getVectorCollection();
        await nativeCollection.deleteOne({ "metadata._id": id });

        const vectorStore = await getVectorStore();
        await vectorStore.addDocuments([buildDocument(hotel)]);
    } catch (error) {
        console.error("[sync-embedding] Failed to update embedding:", error);
    }
};

export const syncDeleteEmbedding = async (id: string) => {
    try {
        const nativeCollection = await getVectorCollection();
        await nativeCollection.deleteOne({ "metadata._id": id });
    } catch (error) {
        console.error("[sync-embedding] Failed to delete embedding:", error);
    }
};
