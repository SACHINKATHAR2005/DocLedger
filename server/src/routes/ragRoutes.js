/**
 * RAG Chat Routes
 */
import { Router } from 'express';
import { chatWithDocumentsController, getDocumentStatusController, triggerDocumentProcessingController, } from '../controllers/ragController.js';
import { authMiddleware as authenticateToken } from '../middleware/auth.js';
const router = Router();
// All routes require authentication
router.use(authenticateToken);
/**
 * POST /api/orgs/:orgId/chat
 * Chat with documents using RAG
 * Body: { query: string, projectId?: string, conversationHistory?: [], maxChunks?: number }
 */
router.post('/orgs/:orgId/chat', chatWithDocumentsController);
/**
 * GET /api/orgs/:orgId/documents/:docId/status
 * Get document processing status
 */
router.get('/orgs/:orgId/documents/:docId/status', getDocumentStatusController);
/**
 * POST /api/orgs/:orgId/documents/:docId/process
 * Manually trigger document processing
 */
router.post('/orgs/:orgId/documents/:docId/process', triggerDocumentProcessingController);
export default router;
//# sourceMappingURL=ragRoutes.js.map