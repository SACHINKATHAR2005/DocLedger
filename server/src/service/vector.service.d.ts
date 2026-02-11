/**
 * Vector Service
 * Database operations for pgvector embeddings
 */
interface InsertEmbeddingsParams {
    documentId: string;
    orgId: string;
    embeddings: number[][];
}
interface SearchSimilarChunksParams {
    orgId: string;
    projectId?: string;
    queryEmbedding: number[];
    limit?: number;
    documentIds?: string[];
}
interface SimilarChunk {
    document_id: string;
    chunk_index: number;
    chunk_text: string;
    distance: number;
    similarity_score: number;
    file_name: string;
}
/**
 * Insert document embeddings into the database
 */
export declare function insertDocumentEmbeddings(params: InsertEmbeddingsParams): Promise<void>;
/**
 * Search for similar document chunks using cosine similarity
 */
export declare function searchSimilarChunks(params: SearchSimilarChunksParams): Promise<SimilarChunk[]>;
/**
 * Delete all embeddings for a specific document
 */
export declare function deleteDocumentEmbeddings(documentId: string): Promise<number>;
export {};
//# sourceMappingURL=vector.service.d.ts.map