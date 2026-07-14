import express from "express";
import {
    createHotel,
    deleteHotel,
    generateResponse,
    getAllHotels,
    getHotelById,
    updateHotel,
} from "./../application/hotel";
import { isAuthenticated } from "./middlewares/authentication-middleware";
import { isAdmin } from "./middlewares/authorization-middleware";
import { createEmbeddings } from "../application/embedding";
import { retrieve } from "../application/retrieve";
import { chatbotResponse } from "../application/chatbot";

const hotelsRouter = express.Router();

hotelsRouter
    .route("/")
    .get(getAllHotels)
    .post(isAuthenticated, isAdmin, createHotel);

hotelsRouter.route("/search/retrieve").get(retrieve);
hotelsRouter.route("/chatbot").post(chatbotResponse);
hotelsRouter.route("/llm").post(generateResponse);
hotelsRouter.route("/embeddings/create").post(createEmbeddings);

hotelsRouter
    .route("/:id")
    .get(getHotelById)
    .put(isAuthenticated, isAdmin, updateHotel)
    .delete(isAuthenticated, isAdmin, deleteHotel);

export default hotelsRouter;
