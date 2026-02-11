/**
 * Document Processor Service
 * Background worker for processing documents: chunking, embedding, and storage
 */
/**
 * Main worker function to process a document
 * - Fetches document
 * - Updates status to PROCESSING
 * - Chunks the text
 * - Generates embeddings
 * - Stores chunks and embeddings in database
 * - Updates status to READY or FAILED
 *
 * @param documentId - The ID of the document to process
 */
export declare function processDocument(documentId: string): Promise<void>;
/**
 * Process multiple documents in sequence
 * @param documentIds - Array of document IDs to process
 */
export declare function processDocuments(documentIds: string[]): Promise<void>;
//# sourceMappingURL=documentProcessor.d.ts.map