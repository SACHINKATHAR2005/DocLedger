/**
 * Chat Routes - Conversation & Message Management
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
    createConversationController,
    getConversationsController,
    getConversationMessagesController,
    saveMessageController,
    deleteConversationController,
    getChatAnalyticsController,
    getAdvancedAnalyticsController,
    getUserChatHistoryController,
} from '../controllers/chatController.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Conversation management
router.post('/orgs/:orgId/conversations', createConversationController);
router.get('/orgs/:orgId/conversations', getConversationsController);
router.get('/orgs/:orgId/conversations/:conversationId', getConversationMessagesController);
router.delete('/orgs/:orgId/conversations/:conversationId', deleteConversationController);

// Message management
router.post('/orgs/:orgId/conversations/:conversationId/messages', saveMessageController);

// Admin analytics
router.get('/orgs/:orgId/chat-analytics', getChatAnalyticsController);
router.get('/orgs/:orgId/chat-analytics/advanced', getAdvancedAnalyticsController);

// User's own chat history
router.get('/orgs/:orgId/chat-history', getUserChatHistoryController);

export default router;
