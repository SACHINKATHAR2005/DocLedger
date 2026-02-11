/**
 * Chat Controllers - Conversation & Message Management
 */
import { createConversation, saveMessage, getUserConversations, getConversationMessages, updateConversationTitle, getChatAnalytics, getAdvancedAnalytics, deleteConversation, getUserChatHistory, } from '../service/chatService.js';
import { pool } from '../config/db.js';
/**
 * Create a new conversation
 * POST /api/orgs/:orgId/conversations
 */
export const createConversationController = async (req, res) => {
    try {
        const userId = req.user.id;
        const orgId = req.params.orgId;
        const { title } = req.body;
        // Verify user is org member
        const membership = await pool.query(`SELECT 1 FROM organization_members
             WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
        if (membership.rowCount === 0) {
            return res.status(403).json({
                message: 'You are not a member of this organization',
                success: false,
            });
        }
        const conversation = await createConversation({ orgId, userId, title });
        return res.status(201).json({
            message: 'Conversation created successfully',
            success: true,
            data: { conversation },
        });
    }
    catch (error) {
        console.error('[Chat] Error creating conversation:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message,
        });
    }
};
/**
 * Get user's conversations
 * GET /api/orgs/:orgId/conversations
 */
export const getConversationsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const orgId = req.params.orgId;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const conversations = await getUserConversations({ orgId, userId, limit });
        return res.status(200).json({
            message: 'Conversations retrieved successfully',
            success: true,
            data: { conversations },
        });
    }
    catch (error) {
        console.error('[Chat] Error getting conversations:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message,
        });
    }
};
/**
 * Get conversation messages
 * GET /api/orgs/:orgId/conversations/:conversationId
 */
export const getConversationMessagesController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const messages = await getConversationMessages(conversationId, userId);
        return res.status(200).json({
            message: 'Messages retrieved successfully',
            success: true,
            data: { messages },
        });
    }
    catch (error) {
        console.error('[Chat] Error getting messages:', error);
        if (error.message === 'UNAUTHORIZED_CONVERSATION_ACCESS') {
            return res.status(403).json({
                message: 'You do not have access to this conversation',
                success: false,
            });
        }
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message,
        });
    }
};
/**
 * Save a message to conversation
 * POST /api/orgs/:orgId/conversations/:conversationId/messages
 */
export const saveMessageController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { role, content, sources } = req.body;
        // Verify user owns this conversation
        const ownerCheck = await pool.query(`SELECT 1 FROM conversations 
             WHERE id = $1 AND user_id = $2`, [conversationId, userId]);
        if (ownerCheck.rowCount === 0) {
            return res.status(403).json({
                message: 'You do not have access to this conversation',
                success: false,
            });
        }
        const message = await saveMessage({ conversationId, role, content, sources });
        return res.status(201).json({
            message: 'Message saved successfully',
            success: true,
            data: { message },
        });
    }
    catch (error) {
        console.error('[Chat] Error saving message:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message,
        });
    }
};
/**
 * Delete a conversation
 * DELETE /api/orgs/:orgId/conversations/:conversationId
 */
export const deleteConversationController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        await deleteConversation(conversationId, userId);
        return res.status(200).json({
            message: 'Conversation deleted successfully',
            success: true,
        });
    }
    catch (error) {
        console.error('[Chat] Error deleting conversation:', error);
        if (error.message === 'CONVERSATION_NOT_FOUND_OR_UNAUTHORIZED') {
            return res.status(404).json({
                message: 'Conversation not found or unauthorized',
                success: false,
            });
        }
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message,
        });
    }
};
/**
 * Get chat analytics (admin only)
 * GET /api/orgs/:orgId/chat-analytics
 */
export const getChatAnalyticsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const orgId = req.params.orgId;
        // Check if user is admin
        const membership = await pool.query(`SELECT role FROM organization_members
             WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
        if (membership.rowCount === 0 || membership.rows[0].role !== 'ADMIN') {
            return res.status(403).json({
                message: 'Only admins can view chat analytics',
                success: false,
            });
        }
        const analytics = await getChatAnalytics(orgId);
        return res.status(200).json({
            message: 'Analytics retrieved successfully',
            success: true,
            data: { analytics },
        });
    }
    catch (error) {
        console.error('[Chat] Error getting analytics:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message,
        });
    }
};
/**
 * Get user's own chat history
 * GET /api/orgs/:orgId/chat-history
 */
export const getUserChatHistoryController = async (req, res) => {
    try {
        const userId = req.user.id;
        const orgId = req.params.orgId;
        // Verify user is org member
        const membership = await pool.query(`SELECT 1 FROM organization_members
             WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
        if (membership.rowCount === 0) {
            return res.status(403).json({
                message: 'You are not a member of this organization',
                success: false,
            });
        }
        const history = await getUserChatHistory(orgId, userId);
        return res.status(200).json({
            message: 'Chat history retrieved successfully',
            success: true,
            data: { history },
        });
    }
    catch (error) {
        console.error('[Chat] Error getting user history:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message,
        });
    }
};
/**
 * Get advanced analytics (admin/team lead only)
 * GET /api/orgs/:orgId/chat-analytics/advanced
 */
export const getAdvancedAnalyticsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const orgId = req.params.orgId;
        // Check if user is admin or team lead
        const membership = await pool.query(`SELECT role FROM organization_members
             WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
        if (membership.rowCount === 0 ||
            (membership.rows[0].role !== 'ADMIN' && membership.rows[0].role !== 'TEAM_LEAD')) {
            return res.status(403).json({
                message: 'Only admins and team leads can view advanced analytics',
                success: false,
            });
        }
        const analytics = await getAdvancedAnalytics(orgId);
        return res.status(200).json({
            message: 'Advanced analytics retrieved successfully',
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        console.error('[Chat] Error getting advanced analytics:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message,
        });
    }
};
//# sourceMappingURL=chatController.js.map