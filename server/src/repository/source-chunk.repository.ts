import type { Prisma } from "../generated/prisma/client.js";
import prisma from "../lib/db.js";
import { stripNullBytes } from "../utils/sanitize.js";

/**
 * ! Why This File ? 

 * Source stores the original document; SourceChunk stores the processed pieces used by your RAG pipeline.
   We store chunks in PostgreSQL so we retain the actual text, source relationship, ordering, token count, and metadata.
   The vector DB is optimized for semantic similarity, while PostgreSQL is your application's reliable relational source of chunk data.
   $transaction() makes inserting all chunks atomic — either all chunks are created or none are.
   The transaction protects PostgreSQL only; PostgreSQL and your vector DB are separate systems, 
   so cross-system consistency requires additional processing/retry logic.
 */

export const sourceChunkSelect = {
    id: true,
    sourceId: true,
    index: true,
    content: true,
    tokenCount: true,
    metadata: true,
    createdAt: true,
} as const;

export type SourceChunkRecord = Prisma.SourceChunkGetPayload<{
    select: typeof sourceChunkSelect;
}>;

export type CreateSourceChunkData = {
    sourceId: string;
    index: number;
    content: string;
    tokenCount?: number | null;
    metadata?: Prisma.InputJsonValue;
};

export function deleteChunksBySourceId(sourceId: string) {
    return prisma.sourceChunk.deleteMany({
        where: { sourceId },
    });
}

export function createSourceChunks(chunks: CreateSourceChunkData[]) {
    if (chunks.length === 0) {
        return Promise.resolve([]);
    }

    //! Create all these SourceChunk records as one database transaction.
    return prisma.$transaction(
        chunks.map((chunk) =>
            prisma.sourceChunk.create({
                data: {
                    sourceId: chunk.sourceId,
                    index: chunk.index,
                    content: stripNullBytes(chunk.content),
                    tokenCount: chunk.tokenCount ?? null,
                    metadata: chunk.metadata,
                },
                select: sourceChunkSelect,
            }),
        ),
    );
}

export function findChunksBySourceId(sourceId: string) {
    return prisma.sourceChunk.findMany({
        where: { sourceId },
        select: sourceChunkSelect,
        orderBy: { index: "asc" },
    });
}