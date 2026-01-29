/**
 * Document Processor Service
 * Background worker for processing documents: chunking, embedding, and storage
 */


import { pool } from "../config/db.js";
import { chunkText } from "../utils/textChunking.js";
import { embedTexts } from "./embedding.service.js";
import { downloadFromAzureBlob } from "../utils/azureBlob.js";
import mammoth from "mammoth";
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Document status enum
enum DocumentStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    READY = "READY",
    FAILED = "FAILED",
}

interface Document {
    id: string;
    organization_id: string;
    file_path: string;
    file_name: string;
    file_type: string;
    status: string;
    extracted_text?: string;
}

/**
 * Extract text from PDF or DOCX file
 */
async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
    try {
        console.log(`[TextExtractor] Extracting text from ${filePath} (${fileType})`);

        // Download file from Azure Blob Storage
        const fileBuffer = await downloadFromAzureBlob(filePath);

        if (fileType === 'application/pdf') {
            // Extract text from PDF using pdfjs-dist
            // Convert Buffer to Uint8Array
            const uint8Array = new Uint8Array(fileBuffer);
            const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
            const pdfDocument = await loadingTask.promise;

            let fullText = '';

            // Extract text from each page
            for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
                const page = await pdfDocument.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');
                fullText += pageText + '\n';
            }

            return fullText.trim();
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Extract text from DOCX
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            return result.value;
        } else if (fileType === 'text/plain') {
            // Plain text file
            return fileBuffer.toString('utf-8');
        } else {
            throw new Error(`Unsupported file type: ${fileType}`);
        }
    } catch (error) {
        console.error(`[TextExtractor] Error extracting text:`, error);
        throw error;
    }
}

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
export async function processDocument(documentId: string): Promise<void> {
    try {
        console.log(`[Worker] Starting processing for document: ${documentId}`);

        // Step 1: Fetch document record
        const documentResult = await pool.query(
            `SELECT id, organization_id, file_path, file_name, file_type, status 
       FROM documents 
       WHERE id = $1`,
            [documentId]
        );

        if (documentResult.rows.length === 0) {
            throw new Error(`Document not found: ${documentId}`);
        }

        const document: Document = documentResult.rows[0];

        // Step 2: Update status to PROCESSING
        await pool.query(
            `UPDATE documents 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2`,
            [DocumentStatus.PROCESSING, documentId]
        );

        console.log(`[Worker] Document status updated to PROCESSING`);

        // Step 3: Extract text from the document
        console.log(`[Worker] Extracting text from: ${document.file_name}`);
        const extractedText = await extractTextFromFile(document.file_path, document.file_type);

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error("No text extracted from document");
        }

        console.log(`[Worker] Extracted ${extractedText.length} characters of text`);

        // Step 4: Chunk the text
        const chunks = chunkText(extractedText);
        console.log(`[Worker] Generated ${chunks.length} chunks`);

        if (chunks.length === 0) {
            throw new Error("No chunks generated from document text");
        }

        // Step 4: Save chunks to document_chunks table
        const chunkIds: string[] = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunkResult = await pool.query(
                `INSERT INTO document_chunks 
         (document_id, chunk_index, chunk_text, organization_id, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id`,
                [documentId, i, chunks[i], document.organization_id]
            );
            chunkIds.push(chunkResult.rows[0].id);
        }

        console.log(`[Worker] Saved ${chunks.length} chunks to database`);

        // Step 5: Generate embeddings in batches (batch size: 10)
        const BATCH_SIZE = 10;
        const allEmbeddings: number[][] = [];

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            const batchEmbeddings = await embedTexts(batch);
            allEmbeddings.push(...batchEmbeddings);

            console.log(
                `[Worker] Generated embeddings for batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`
            );

            // Optional: Small delay to avoid rate limiting
            if (i + BATCH_SIZE < chunks.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        console.log(`[Worker] Generated all ${allEmbeddings.length} embeddings`);

        // Step 6: Store embeddings in document_embeddings table
        for (let i = 0; i < allEmbeddings.length; i++) {
            // Convert embedding array to pgvector format: '[0.1, 0.2, ...]'
            const embedding = allEmbeddings[i];
            if (!embedding) {
                throw new Error(`Missing embedding at index ${i}`);
            }
            const vectorString = `[${embedding.join(',')}]`;

            await pool.query(
                `INSERT INTO document_embeddings 
         (document_id, chunk_index, embedding, org_id, project_id, created_at)
         VALUES ($1, $2, $3::vector, $4, $5, NOW())`,
                [
                    documentId,
                    i,
                    vectorString,
                    document.organization_id,
                    null, // project_id set to NULL
                ]
            );
        }

        console.log(`[Worker] Stored all embeddings in database`);

        // Step 7: Update document status to READY
        await pool.query(
            `UPDATE documents 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2`,
            [DocumentStatus.READY, documentId]
        );

        console.log(`[Worker] Document processing completed successfully: ${documentId}`);
    } catch (error) {
        // On any error, update status to FAILED
        console.error(`[Worker] Error processing document ${documentId}:`, error);

        try {
            await pool.query(
                `UPDATE documents 
         SET status = $1, updated_at = NOW() 
         WHERE id = $2`,
                [
                    DocumentStatus.FAILED,
                    documentId,
                ]
            );
        } catch (updateError) {
            console.error(`[Worker] Failed to update document status:`, updateError);
        }

        throw error;
    }
}

/**
 * Process multiple documents in sequence
 * @param documentIds - Array of document IDs to process
 */
export async function processDocuments(documentIds: string[]): Promise<void> {
    for (const documentId of documentIds) {
        try {
            await processDocument(documentId);
        } catch (error) {
            console.error(`Failed to process document ${documentId}, continuing...`);
            // Continue processing other documents
        }
    }
}
