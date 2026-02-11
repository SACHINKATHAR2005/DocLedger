/**
 * RAG Chat Controller
 * Handles chat requests with document context
 */
import { processRagQuery } from '../service/rag.service.js';
import { pool } from '../config/db.js';
import { createConversation, saveMessage } from '../service/chatService.js';
const { processDocument } = await import('../service/documentProcessor.js');
/**
 * Chat with documents using RAG
 * POST /api/orgs/:orgId/chat
 */
export const chatWithDocumentsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const orgId = req.params.orgId;
        const { query, projectId, conversationHistory, maxChunks, documentIds, conversationId } = req.body;
        // Validate input
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                message: 'Query is required',
                success: false,
            });
        }
        if (!orgId || typeof orgId !== 'string') {
            return res.status(400).json({
                message: 'Invalid organization ID',
                success: false,
            });
        }
        // Validate documentIds if provided
        if (documentIds && (!Array.isArray(documentIds) || documentIds.length === 0)) {
            return res.status(400).json({
                message: 'documentIds must be a non-empty array if provided',
                success: false,
            });
        }
        // Check if user is a member of the organization
        const membership = await pool.query(`SELECT 1 FROM organization_members
             WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
        if (membership.rowCount === 0) {
            return res.status(403).json({
                message: 'You are not a member of this organization',
                success: false,
            });
        }
        // Check if organization has any processed documents
        const docCheck = await pool.query(`SELECT COUNT(*) as count FROM documents
             WHERE organization_id = $1 AND status = 'READY'`, [orgId]);
        if (parseInt(docCheck.rows[0].count) === 0) {
            return res.status(404).json({
                message: 'No processed documents found. Please upload and process documents first.',
                success: false,
            });
        }
        console.log(`[Chat] User ${userId} querying in org ${orgId}: "${query}"`, documentIds ? `[${documentIds.length} docs selected]` : '[all docs]');
        // Create or get conversation
        let currentConversationId = conversationId;
        if (!currentConversationId) {
            // Generate title from first 50 chars of query
            const title = query.length > 50 ? query.substring(0, 47) + '...' : query;
            const newConversation = await createConversation({ orgId, userId, title });
            currentConversationId = newConversation.id;
        }
        // Save user message
        await saveMessage({
            conversationId: currentConversationId,
            role: 'user',
            content: query,
        });
        // Process RAG query
        const response = await processRagQuery({
            orgId,
            projectId,
            query,
            conversationHistory,
            maxChunks: maxChunks || 3, // Reduced for faster responses
            documentIds,
        });
        // Save assistant response
        await saveMessage({
            conversationId: currentConversationId,
            role: 'assistant',
            content: response.answer,
            sources: response.sources,
        });
        return res.status(200).json({
            message: 'Query processed successfully',
            success: true,
            data: {
                ...response,
                conversationId: currentConversationId,
            },
        });
    }
    catch (error) {
        console.error('[Chat] Error processing chat request:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message,
        });
    }
};
/**
 * Get document processing status
 * GET /api/orgs/:orgId/documents/:docId/status
 */
export const getDocumentStatusController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orgId, docId } = req.params;
        if (!orgId || typeof orgId !== 'string') {
            return res.status(400).json({
                message: 'Invalid organization ID',
                success: false,
            });
        }
        // Check membership
        const membership = await pool.query(`SELECT 1 FROM organization_members
             WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
        if (membership.rowCount === 0) {
            return res.status(403).json({
                message: 'You are not a member of this organization',
                success: false,
            });
        }
        // Get document status with chunk counts
        const result = await pool.query(`SELECT 
                d.id,
                d.file_name,
                d.status,
                COUNT(DISTINCT dc.id) as chunk_count,
                COUNT(DISTINCT de.id) as embedding_count,
                d.created_at,
                d.updated_at
            FROM documents d
            LEFT JOIN document_chunks dc ON d.id = dc.document_id
            LEFT JOIN document_embeddings de ON d.id = de.document_id
            WHERE d.id = $1 AND d.organization_id = $2
            GROUP BY d.id, d.file_name, d.status, d.created_at, d.updated_at`, [docId, orgId]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Document not found',
                success: false,
            });
        }
        return res.status(200).json({
            message: 'Document status retrieved successfully',
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('[Chat] Error getting document status:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message,
        });
    }
};
/**
 * Trigger document processing manually
 * POST /api/orgs/:orgId/documents/:docId/process
 */
export const triggerDocumentProcessingController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orgId, docId } = req.params;
        if (!orgId || typeof orgId !== 'string') {
            return res.status(400).json({
                message: 'Invalid organization ID',
                success: false,
            });
        }
        // Check membership
        const membership = await pool.query(`SELECT 1 FROM organization_members
             WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
        if (membership.rowCount === 0) {
            return res.status(403).json({
                message: 'You are not a member of this organization',
                success: false,
            });
        }
        // Ensure docId is a string
        if (!docId || typeof docId !== 'string') {
            return res.status(400).json({
                message: 'Invalid document ID',
                success: false,
            });
        }
        // Check if document exists
        const docCheck = await pool.query(`SELECT id, status FROM documents
             WHERE id = $1 AND organization_id = $2`, [docId, orgId]);
        if (docCheck.rowCount === 0) {
            return res.status(404).json({
                message: 'Document not found',
                success: false,
            });
        }
        const currentStatus = docCheck.rows[0].status;
        if (currentStatus === 'PROCESSING') {
            return res.status(400).json({
                message: 'Document is already being processed',
                success: false,
            });
        }
        // Import and trigger processing (in real app, this should be a background job)
        const { processDocument } = await import('../service/documentProcessor.js');
        // Validate docId is a string
        if (typeof docId !== 'string') {
            return res.status(400).json({
                message: 'Invalid document ID',
                success: false,
            });
        }
        // Trigger processing in background (don't await)
        processDocument(docId).catch((error) => {
            console.error(`[Chat] Error processing document ${docId}:`, error);
        });
        return res.status(202).json({
            message: 'Document processing started',
            success: true,
            data: { documentId: docId, status: 'PROCESSING' },
        });
    }
    catch (error) {
        console.error('[Chat] Error triggering document processing:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message,
        });
    }
};
//# sourceMappingURL=ragController.js.map