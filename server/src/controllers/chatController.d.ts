/**
 * Chat Controllers - Conversation & Message Management
 */
import type { Request, Response } from 'express';
/**
 * Create a new conversation
 * POST /api/orgs/:orgId/conversations
 */
export declare const createConversationController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get user's conversations
 * GET /api/orgs/:orgId/conversations
 */
export declare const getConversationsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get conversation messages
 * GET /api/orgs/:orgId/conversations/:conversationId
 */
export declare const getConversationMessagesController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Save a message to conversation
 * POST /api/orgs/:orgId/conversations/:conversationId/messages
 */
export declare const saveMessageController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Delete a conversation
 * DELETE /api/orgs/:orgId/conversations/:conversationId
 */
export declare const deleteConversationController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get chat analytics (admin only)
 * GET /api/orgs/:orgId/chat-analytics
 */
export declare const getChatAnalyticsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get user's own chat history
 * GET /api/orgs/:orgId/chat-history
 */
export declare const getUserChatHistoryController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get advanced analytics (admin/team lead only)
 * GET /api/orgs/:orgId/chat-analytics/advanced
 */
export declare const getAdvancedAnalyticsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=chatController.d.ts.map