const openApiSpec = {
    openapi: "3.1.0",
    info: {
        title: "StayQuest API",
        version: "1.0.0",
        description:
            "REST API for the StayQuest hotel booking platform. Includes hotel management, bookings, AI-powered search and chatbot endpoints.",
        contact: {
            name: "StayQuest Team",
        },
    },
    servers: [
        {
            url: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
            description: "Development server",
        },
    ],
    tags: [
        { name: "Hotels", description: "Hotel CRUD and management" },
        { name: "Bookings", description: "Booking management" },
        { name: "AI", description: "AI-powered search, retrieval, and chatbot" },
    ],
    components: {
        securitySchemes: {
            ClerkAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description:
                    "Clerk session token. Obtain it from your Clerk dashboard or frontend SDK.",
            },
        },
        schemas: {
            Hotel: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "664a1c2f8e3b4a001f2d3e4c" },
                    name: { type: "string", example: "The Grand Palace" },
                    location: { type: "string", example: "Paris, France" },
                    image: {
                        type: "string",
                        example: "https://example.com/hotel.jpg",
                    },
                    price: { type: "number", example: 250 },
                    description: {
                        type: "string",
                        example: "A luxurious hotel in the heart of Paris.",
                    },
                    amenities: {
                        type: "array",
                        items: { type: "string" },
                        example: ["WiFi", "Pool", "Gym"],
                    },
                },
            },
            CreateHotelBody: {
                type: "object",
                required: ["name", "location", "image", "price", "description"],
                properties: {
                    name: { type: "string", example: "The Grand Palace" },
                    location: { type: "string", example: "Paris, France" },
                    image: {
                        type: "string",
                        example: "https://example.com/hotel.jpg",
                    },
                    price: { type: "number", example: 250 },
                    description: {
                        type: "string",
                        example: "A luxurious hotel in the heart of Paris.",
                    },
                    amenities: {
                        type: "array",
                        items: { type: "string" },
                        example: ["WiFi", "Pool", "Gym"],
                    },
                },
            },
            Booking: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "664a1c2f8e3b4a001f2d3e5d" },
                    hotelId: { type: "string", example: "664a1c2f8e3b4a001f2d3e4c" },
                    userId: { type: "string", example: "user_2abc123" },
                    checkIn: {
                        type: "string",
                        format: "date",
                        example: "2025-06-01",
                    },
                    checkOut: {
                        type: "string",
                        format: "date",
                        example: "2025-06-07",
                    },
                },
            },
            CreateBookingBody: {
                type: "object",
                required: ["hotelId", "checkIn", "checkOut"],
                properties: {
                    hotelId: { type: "string", example: "664a1c2f8e3b4a001f2d3e4c" },
                    checkIn: {
                        type: "string",
                        format: "date",
                        example: "2025-06-01",
                    },
                    checkOut: {
                        type: "string",
                        format: "date",
                        example: "2025-06-07",
                    },
                },
            },
            ChatbotMessage: {
                type: "object",
                required: ["message"],
                properties: {
                    message: {
                        type: "string",
                        example: "Are there any pet-friendly hotels in Bali?",
                    },
                },
            },
            LLMQuery: {
                type: "object",
                required: ["query"],
                properties: {
                    query: {
                        type: "string",
                        example: "Find me a budget hotel in Tokyo with a gym.",
                    },
                },
            },
            Error: {
                type: "object",
                properties: {
                    message: { type: "string", example: "Resource not found" },
                    status: { type: "number", example: 404 },
                },
            },
        },
    },
    paths: {
        // ─── Hotels ──────────────────────────────────────────────
        "/api/hotels": {
            get: {
                tags: ["Hotels"],
                summary: "Get all hotels",
                description: "Returns a list of all available hotels.",
                responses: {
                    "200": {
                        description: "List of hotels",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Hotel" },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["Hotels"],
                summary: "Create a hotel (Admin only)",
                description:
                    "Creates a new hotel. Requires authentication and admin role.",
                security: [{ ClerkAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateHotelBody" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Hotel created successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Hotel" },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "403": { description: "Forbidden – admin role required" },
                },
            },
        },
        "/api/hotels/{id}": {
            get: {
                tags: ["Hotels"],
                summary: "Get hotel by ID",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        example: "664a1c2f8e3b4a001f2d3e4c",
                    },
                ],
                responses: {
                    "200": {
                        description: "Hotel details",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Hotel" },
                            },
                        },
                    },
                    "404": { description: "Hotel not found" },
                },
            },
            put: {
                tags: ["Hotels"],
                summary: "Update a hotel (Admin only)",
                security: [{ ClerkAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateHotelBody" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Hotel updated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Hotel" },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "403": { description: "Forbidden – admin role required" },
                    "404": { description: "Hotel not found" },
                },
            },
            delete: {
                tags: ["Hotels"],
                summary: "Delete a hotel (Admin only)",
                security: [{ ClerkAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": { description: "Hotel deleted" },
                    "401": { description: "Unauthorized" },
                    "403": { description: "Forbidden – admin role required" },
                    "404": { description: "Hotel not found" },
                },
            },
        },

        // ─── AI / Search ─────────────────────────────────────────
        "/api/hotels/search/retrieve": {
            get: {
                tags: ["AI"],
                summary: "Semantic vector search",
                description:
                    "Performs a vector similarity search over hotel embeddings using a natural-language query.",
                parameters: [
                    {
                        name: "query",
                        in: "query",
                        required: true,
                        schema: { type: "string" },
                        example: "beachfront hotel with spa",
                    },
                ],
                responses: {
                    "200": {
                        description: "Matching hotels",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Hotel" },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/hotels/chatbot": {
            post: {
                tags: ["AI"],
                summary: "AI chatbot",
                description:
                    "Sends a user message to the AI chatbot and receives a conversational response about available hotels.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ChatbotMessage" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Chatbot reply",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        reply: {
                                            type: "string",
                                            example:
                                                "Sure! Here are some pet-friendly options in Bali...",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/hotels/llm": {
            post: {
                tags: ["AI"],
                summary: "LLM structured query",
                description:
                    "Sends a natural-language query to the LLM and returns a structured hotel recommendation.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LLMQuery" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "LLM-generated response",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        response: {
                                            type: "string",
                                            example:
                                                "Based on your request, I recommend The Shinjuku Inn...",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/hotels/embeddings/create": {
            post: {
                tags: ["AI"],
                summary: "Generate hotel embeddings (Admin)",
                description:
                    "Generates and stores vector embeddings for all hotels in the database. Used to enable semantic search.",
                responses: {
                    "200": { description: "Embeddings created successfully" },
                    "500": { description: "Internal server error" },
                },
            },
        },

        // ─── Bookings ─────────────────────────────────────────────
        "/api/bookings": {
            post: {
                tags: ["Bookings"],
                summary: "Create a booking",
                description: "Creates a new hotel booking for the authenticated user.",
                security: [{ ClerkAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateBookingBody" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Booking created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Booking" },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/bookings/user": {
            get: {
                tags: ["Bookings"],
                summary: "Get current user's bookings",
                description: "Returns all bookings for the authenticated user.",
                security: [{ ClerkAuth: [] }],
                responses: {
                    "200": {
                        description: "List of bookings",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Booking" },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/bookings/hotels/{hotelId}": {
            get: {
                tags: ["Bookings"],
                summary: "Get all bookings for a hotel (Admin only)",
                security: [{ ClerkAuth: [] }],
                parameters: [
                    {
                        name: "hotelId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        example: "664a1c2f8e3b4a001f2d3e4c",
                    },
                ],
                responses: {
                    "200": {
                        description: "All bookings for the hotel",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Booking" },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "403": { description: "Forbidden – admin role required" },
                },
            },
        },
        "/api/bookings/{bookingId}": {
            delete: {
                tags: ["Bookings"],
                summary: "Cancel a booking",
                description: "Deletes a booking by ID. Only the booking owner can cancel it.",
                security: [{ ClerkAuth: [] }],
                parameters: [
                    {
                        name: "bookingId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        example: "664a1c2f8e3b4a001f2d3e5d",
                    },
                ],
                responses: {
                    "200": { description: "Booking cancelled" },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Booking not found" },
                },
            },
        },
    },
};

export default openApiSpec;
