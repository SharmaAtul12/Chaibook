import "dotenv/config";
import OpenAI from "openai";
import {
    CHAT_MODEL,
    EMBEDDING_DIMENSIONS,
    EMBEDDING_MODEL,
} from "./ai-config.js";

let client: OpenAI | null = null;

//! number[][] -> An array containing multiple vectors like [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6], ...]

export async function embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
        return [];
    }

    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured");
    }

    if (!client) {
        client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
        dimensions: EMBEDDING_DIMENSIONS,
    });

    //! Sort the embeddings by the same order as the texts I originally sent ,and return only the embedding vectors, discarding other metadata.
    return response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
}