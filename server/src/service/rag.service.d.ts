/**
 * RAG Chat Service
 * Implements Retrieval Augmented Generation using Groq API
 */
interface ChatRequest {
    orgId: string;
    projectId?: string;
    query: string;
    conversationHistory?: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
    maxChunks?: number;
    documentIds?: string[];
}
interface ChatResponse {
    answer: string;
    sources: Array<{
        document_id: string;
        file_name: string;
        chunk_index: number;
        similarity_score: number;
    }>;
    model: string;
}
/**
 * Process a chat query using RAG
 * 1. Embed the user query
 * 2. Retrieve similar chunks from vector DB
 * 3. Build context from retrieved chunks
 * 4. Send to Groq LLM with context
 * 5. Return answer with sources
 */
export declare function processRagQuery(request: ChatRequest): Promise<ChatResponse>;
/**
 * Stream chat response (for real-time streaming)
 * Note: This requires streaming support - implement if needed
 */
export declare function processRagQueryStream(request: ChatRequest, onChunk: (chunk: string) => void): Promise<void>;
export {};
//# sourceMappingURL=rag.service.d.ts.map