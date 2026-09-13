# StayQuest Backend

The REST API backend for **StayQuest** — an AI-powered hotel booking platform. Built with Node.js, Express, TypeScript, and MongoDB, it integrates LangChain with Google Gemini and OpenAI to deliver semantic hotel search and an intelligent chatbot.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | MongoDB (Mongoose) |
| Authentication | Clerk |
| AI / LLM | LangChain, Google Gemini, OpenAI |
| Vector Search | MongoDB Atlas Vector Search |
| Validation | Zod |
| API Docs | OpenAPI 3.1 + Scalar |

## API Documentation

Interactive API reference powered by **[Scalar](https://scalar.com/)** — explore, try out, and test all endpoints directly from your browser.

| Resource | URL |
|---|---|
| **Interactive UI (Scalar)** | `http://localhost:3000/api-docs` |
| **Raw OpenAPI 3.1 JSON** | `http://localhost:3000/api-docs/openapi.json` |

For authenticated endpoints, click **Authorize** in the Scalar UI and paste your **Clerk session token** as a Bearer token.

## Getting Started

### Prerequisites

- Node.js v18+
- A MongoDB Atlas cluster with **Vector Search** enabled
- Clerk account (for auth)
- Google Gemini API key
- OpenAI API key

### Installation

1. **Clone the repository and install dependencies**

```bash
npm install
```

2. **Set up environment variables**

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URL=your_mongodb_connection_string
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
```

3. **Start the development server**

```bash
npm run dev
```

The server starts on `http://localhost:3000` by default.

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm run dev` | Start with Nodemon (hot reload) |
| Build | `npm run build` | Compile TypeScript to `dist/` |
| Production | `npm start` | Run compiled JS from `dist/` |

## AI Features

### 🔍 Semantic Search
Hotels are embedded using **Google Gemini Embeddings** (`gemini-embedding-001`) and stored in a MongoDB Atlas Vector Search index. The `/search/retrieve` endpoint performs cosine similarity search to return the most relevant hotels for a natural language query.

### 🤖 AI Chatbot (RAG)
The `/chatbot` endpoint implements a **Retrieval-Augmented Generation (RAG)** pipeline:
1. Embeds the user's message
2. Retrieves the top 4 semantically similar hotels from the vector store
3. Injects hotel context into the prompt
4. Streams a response from **Gemini** (`gemini-3.1-flash-lite`) with conversation history support (last 10 messages)

### ✨ LLM Response Generation
The `/llm` endpoint uses **OpenAI** to generate rich, descriptive responses about hotels based on structured hotel data.

## Authentication & Authorization

Authentication is handled by **[Clerk](https://clerk.com/)** via the `@clerk/express` middleware.

- **Public routes**: Hotel listing, hotel details, chatbot, semantic search
- **Authenticated routes**: Create/cancel bookings, view own bookings
- **Admin routes**: Create, update, and delete hotels; view all bookings for a hotel

## Deployment

The backend is configured to allow cross-origin requests from the production frontend:
```
https://aidf-stayquest-frontend-shibishwar.netlify.app
```

Update the `cors` origin in `src/index.ts` if you deploy to a different domain.

To deploy to a Node.js host (e.g. Railway, Render):

```bash
npm run build
npm start
```
