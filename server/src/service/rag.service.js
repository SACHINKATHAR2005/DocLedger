/**
 * RAG Chat Service
 * Implements Retrieval Augmented Generation using Groq API
 */
import { embedText } from './embedding.service.js';
import { searchSimilarChunks } from './vector.service.js';
/**
 * Process a chat query using RAG
 * 1. Embed the user query
 * 2. Retrieve similar chunks from vector DB
 * 3. Build context from retrieved chunks
 * 4. Send to Groq LLM with context
 * 5. Return answer with sources
 */
export async function processRagQuery(request) {
    const { orgId, projectId, query, conversationHistory = [], maxChunks = 3, documentIds } = request;
    try {
        console.log(`[RAG] Processing query for org: ${orgId}`, documentIds ? `with ${documentIds.length} specific documents` : 'all documents');
        // Step 1: Generate embedding for the user query
        console.log('[RAG] Generating query embedding...');
        const queryEmbedding = await embedText(query);
        // Step 2: Retrieve similar chunks from vector database
        console.log('[RAG] Searching for similar chunks...');
        const similarChunks = await searchSimilarChunks({
            orgId,
            ...(projectId !== undefined && { projectId }),
            queryEmbedding,
            limit: maxChunks,
            ...(documentIds !== undefined && { documentIds }),
        });
        if (similarChunks.length === 0) {
            return {
                answer: "I don't have any relevant information in the documents to answer your question. Please make sure documents are uploaded and processed.",
                sources: [],
                model: 'groq-llama-3.1-70b',
            };
        }
        console.log(`[RAG] Found ${similarChunks.length} relevant chunks`);
        // Step 3: Build context from retrieved chunks
        const context = similarChunks
            .map((chunk, idx) => {
            return `[Document: ${chunk.file_name}]\n${chunk.chunk_text}`;
        })
            .join('\n\n---\n\n');
        // Step 4: Build conversation messages for Groq
        const messages = [
            {
                role: 'system',
                content: `You are a document-aware AI assistant. Your job is to answer user questions strictly based on the provided document context.

### Core Rules:
- Use ONLY the information explicitly present in the provided document context.
- Do NOT use prior knowledge, assumptions, or external sources.
- If the document does not contain the required information, clearly say:
  "The provided documents do not contain information about this."

### Answer Quality Requirements:
- Give detailed, structured, and accurate answers.
- Reference the specific document, section, or context when applicable.
- If the question relates to tasks, projects, workflows, or documents:
  - Explain the purpose
  - Describe the steps involved
  - Mention roles, responsibilities, or rules if available
- Avoid vague or generic responses.

### Explanation & Understanding Rules:
- If the document mentions a technical or complex concept:
  - First explain it in simple terms
  - Then explain it as described in the document
- If a concept may be difficult to understand:
  - Provide a **simple real-world example** using common, everyday scenarios
  - Examples must clarify the concept, not introduce new information

### Output Style:
- Use clear headings, bullet points, and numbered steps where helpful
- Keep language simple, professional, and easy to understand
- Be concise but never incomplete

### Example Handling:
- If a document explains a rule or process, show:
  - What it means
  - How it works
  - A short practical example (e.g., organization workflow, daily-life analogy)

### If Information Is Missing:
- Clearly state what is missing
- Do NOT guess or fabricate answers
### Document Context:
${context}`,
            },
            ...conversationHistory.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
            {
                role: 'user',
                content: query,
            },
        ];
        // Step 5: Call Groq API
        console.log('[RAG] Calling Groq API...');
        const groqResponse = await callGroqAPI(messages);
        // Step 6: Prepare response with sources
        const sources = similarChunks.map((chunk) => ({
            document_id: chunk.document_id,
            file_name: chunk.file_name,
            chunk_index: chunk.chunk_index,
            similarity_score: chunk.similarity_score,
        }));
        return {
            answer: groqResponse.answer,
            sources,
            model: groqResponse.model,
        };
    }
    catch (error) {
        console.error('[RAG] Error processing query:', error);
        if (error instanceof Error) {
            throw new Error(`RAG query failed: ${error.message}`);
        }
        throw new Error('RAG query failed: Unknown error');
    }
}
/**
 * Call Groq API for chat completion
 */
async function callGroqAPI(messages) {
    const groqApiKey = process.env.GROQ_API_KEY;
    const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'; // Default to fastest model
    if (!groqApiKey) {
        throw new Error('GROQ_API_KEY environment variable is not set');
    }
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages,
                temperature: 0.3, // Lower temperature for more accurate responses
                max_tokens: 2048, // Increased for detailed answers
                top_p: 0.9,
                stream: false,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Groq API error (${response.status}): ${errorText}`);
        }
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from Groq API');
        }
        return {
            answer: data.choices[0].message.content,
            model: data.model,
        };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Groq API call failed: ${error.message}`);
        }
        throw new Error('Groq API call failed: Unknown error');
    }
}
/**
 * Stream chat response (for real-time streaming)
 * Note: This requires streaming support - implement if needed
 */
export async function processRagQueryStream(request, onChunk) {
    // Implementation for streaming responses
    // Similar to processRagQuery but with streaming support
    throw new Error('Streaming not yet implemented');
}
//# sourceMappingURL=rag.service.js.map