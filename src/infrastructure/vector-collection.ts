import mongoose from "mongoose";
import { MongoClient, type Collection, type Document } from "mongodb";

let vectorClient: MongoClient | null = null;

export const getVectorCollection = async (collectionName = "hotelVectors") => {
    const mongoUrl = process.env.MONGODB_URL;

    if (!mongoUrl) {
        throw new Error("MONGODB_URL is not set");
    }

    if (!vectorClient) {
        vectorClient = new MongoClient(mongoUrl);
        await vectorClient.connect();
    }

    const connection = mongoose.connection;

    if (!connection.db) {
        throw new Error("MongoDB connection is not ready");
    }

    return vectorClient
        .db(connection.db.databaseName)
        .collection(collectionName) as Collection<Document>;
};
