/**
 * Embedding Service
 * Generates embeddings using OpenAI API (fallback to HuggingFace)
 * Model: text-embedding-3-small (1536 dimensions) - Fast & Reliable
 */
/**
 * Generates embeddings for multiple text chunks
 * @param texts - Array of text strings to embed
 * @returns Promise resolving to array of embeddings
 * @throws Error if API request fails
 */
export declare function embedTexts(texts: string[]): Promise<number[][]>;
/**
 * Generates embedding for a single text
 * @param text - Text string to embed
 * @returns Promise resolving to a 384-dim embedding vector
 */
export declare function embedText(text: string): Promise<number[]>;
//# sourceMappingURL=embedding.service.d.ts.map