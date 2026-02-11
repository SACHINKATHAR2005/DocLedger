/**
 * Chat Service - Conversation & Message Management
 */
interface CreateConversationParams {
    orgId: string;
    userId: string;
    title?: string;
}
interface SaveMessageParams {
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
}
interface GetConversationsParams {
    orgId: string;
    userId: string;
    limit?: number;
}
/**
 * Create a new conversation
 */
export declare function createConversation(params: CreateConversationParams): Promise<{
    id: string;
    created_at: string;
}>;
/**
 * Save a message to a conversation
 */
export declare function saveMessage(params: SaveMessageParams): Promise<{
    id: string;
    created_at: string;
}>;
/**
 * Get user's conversations (only their own)
 */
export declare function getUserConversations(params: GetConversationsParams): Promise<any[]>;
/**
 * Get messages for a specific conversation (only if user owns it)
 */
export declare function getConversationMessages(conversationId: string, userId: string): Promise<any[]>;
/**
 * Update conversation title (auto-generate from first message)
 */
export declare function updateConversationTitle(conversationId: string, title: string): Promise<void>;
/**
 * Get chat analytics for admin (no message content)
 */
export declare function getChatAnalytics(orgId: string): Promise<any[]>;
/**
 * Get advanced analytics for admin - most asked questions, popular topics, document usage
 */
export declare function getAdvancedAnalytics(orgId: string): Promise<any>;
/**
 * Delete a conversation (only if user owns it)
 */
export declare function deleteConversation(conversationId: string, userId: string): Promise<void>;
/**
 * Get user's complete chat history with all messages
 */
export declare function getUserChatHistory(orgId: string, userId: string): Promise<any[]>;
export {};
//# sourceMappingURL=chatService.d.ts.map