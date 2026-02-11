/**
 * RAG Chat Controller
 * Handles chat requests with document context
 */
import type { Request, Response } from 'express';
/**
 * Chat with documents using RAG
 * POST /api/orgs/:orgId/chat
 */
export declare const chatWithDocumentsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get document processing status
 * GET /api/orgs/:orgId/documents/:docId/status
 */
export declare const getDocumentStatusController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Trigger document processing manually
 * POST /api/orgs/:orgId/documents/:docId/process
 */
export declare const triggerDocumentProcessingController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=ragController.d.ts.map