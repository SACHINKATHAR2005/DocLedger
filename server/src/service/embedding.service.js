/**
 * Embedding Service
 * Generates embeddings using OpenAI API (fallback to HuggingFace)
 * Model: text-embedding-3-small (1536 dimensions) - Fast & Reliable
 */
import { HfInference } from '@huggingface/inference';
const USE_OPENAI = !!process.env.OPENAI_API_KEY;
const RETRY_ATTEMPTS = 2; // Reduced for faster failure
const RETRY_DELAY = 500; // Reduced to 500ms
const REQUEST_TIMEOUT = 10000; // 10 second timeout
/**
 * Generates embeddings using OpenAI API
 */
async function embedTextsWithOpenAI(texts) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: texts,
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
    }
    const data = await response.json();
    return data.data.map((item) => item.embedding);
}
/**
 * Generates embeddings using HuggingFace API with retry logic
 */
async function embedTextsWithHuggingFace(texts) {
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
        throw new Error("HF_TOKEN environment variable is not set");
    }
    const hf = new HfInference(hfToken);
    let lastError = null;
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        try {
            console.log(`[Embedding] HF API attempt ${attempt}/${RETRY_ATTEMPTS}`);
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT));
            const embeddingPromise = hf.featureExtraction({
                model: 'sentence-transformers/all-MiniLM-L6-v2',
                inputs: texts,
                options: {
                    wait_for_model: true, // Wait if model is loading
                    use_cache: true, // Use cached results
                }
            });
            const result = await Promise.race([embeddingPromise, timeoutPromise]);
            if (Array.isArray(result) && Array.isArray(result[0])) {
                console.log(`[Embedding] HF API success on attempt ${attempt}`);
                return result;
            }
            return [result];
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            console.error(`[Embedding] HF API attempt ${attempt} failed:`, lastError.message);
            if (attempt < RETRY_ATTEMPTS) {
                console.log(`[Embedding] Retrying in ${RETRY_DELAY * attempt}ms...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
            }
        }
    }
    throw new Error(`Failed after ${RETRY_ATTEMPTS} attempts: ${lastError?.message}`);
}
/**
 * Generates embeddings for multiple text chunks
 * @param texts - Array of text strings to embed
 * @returns Promise resolving to array of embeddings
 * @throws Error if API request fails
 */
export async function embedTexts(texts) {
    if (!texts || texts.length === 0) {
        return [];
    }
    try {
        if (USE_OPENAI) {
            console.log('[Embedding] Using OpenAI API');
            return await embedTextsWithOpenAI(texts);
        }
        else {
            console.log('[Embedding] Using HuggingFace API');
            return await embedTextsWithHuggingFace(texts);
        }
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to generate embeddings: ${error.message}`);
        }
        throw new Error("Failed to generate embeddings: Unknown error");
    }
}
/**
 * Generates embedding for a single text
 * @param text - Text string to embed
 * @returns Promise resolving to a 384-dim embedding vector
 */
export async function embedText(text) {
    const embeddings = await embedTexts([text]);
    if (!embeddings[0]) {
        throw new Error("Failed to generate embedding for text");
    }
    return embeddings[0];
}
//# sourceMappingURL=embedding.service.js.map