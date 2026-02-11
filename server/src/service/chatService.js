/**
 * Chat Service - Conversation & Message Management
 */
import { pool } from '../config/db.js';
/**
 * Create a new conversation
 */
export async function createConversation(params) {
    const { orgId, userId, title } = params;
    const result = await pool.query(`INSERT INTO conversations (organization_id, user_id, title)
         VALUES ($1, $2, $3)
         RETURNING id, created_at`, [orgId, userId, title || 'New Conversation']);
    return result.rows[0];
}
/**
 * Save a message to a conversation
 */
export async function saveMessage(params) {
    const { conversationId, role, content, sources } = params;
    const result = await pool.query(`INSERT INTO messages (conversation_id, role, content, sources)
         VALUES ($1, $2, $3, $4)
         RETURNING id, created_at`, [conversationId, role, content, sources ? JSON.stringify(sources) : null]);
    return result.rows[0];
}
/**
 * Get user's conversations (only their own)
 */
export async function getUserConversations(params) {
    const { orgId, userId, limit = 50 } = params;
    const result = await pool.query(`SELECT 
            id,
            title,
            message_count,
            created_at,
            updated_at
         FROM conversations
         WHERE organization_id = $1 AND user_id = $2
         ORDER BY updated_at DESC
         LIMIT $3`, [orgId, userId, limit]);
    return result.rows;
}
/**
 * Get messages for a specific conversation (only if user owns it)
 */
export async function getConversationMessages(conversationId, userId) {
    // First verify user owns this conversation
    const ownerCheck = await pool.query(`SELECT 1 FROM conversations 
         WHERE id = $1 AND user_id = $2`, [conversationId, userId]);
    if (ownerCheck.rowCount === 0) {
        throw new Error('UNAUTHORIZED_CONVERSATION_ACCESS');
    }
    const result = await pool.query(`SELECT 
            id,
            role,
            content,
            sources,
            created_at
         FROM messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC`, [conversationId]);
    return result.rows;
}
/**
 * Update conversation title (auto-generate from first message)
 */
export async function updateConversationTitle(conversationId, title) {
    await pool.query(`UPDATE conversations 
         SET title = $1 
         WHERE id = $2`, [title, conversationId]);
}
/**
 * Get chat analytics for admin (no message content)
 */
export async function getChatAnalytics(orgId) {
    const result = await pool.query(`SELECT 
            user_id,
            user_name,
            user_email,
            total_conversations::INTEGER as total_conversations,
            total_messages::INTEGER as total_messages,
            last_activity,
            first_activity
         FROM chat_analytics
         WHERE organization_id = $1
         ORDER BY last_activity DESC`, [orgId]);
    return result.rows;
}
/**
 * Get advanced analytics for admin - most asked questions, popular topics, document usage
 */
export async function getAdvancedAnalytics(orgId) {
    // Most frequently asked questions (top 10)
    const frequentQuestionsResult = await pool.query(`SELECT 
            m.content as question,
            COUNT(*) as frequency,
            COUNT(DISTINCT c.user_id) as asked_by_users,
            MAX(m.created_at) as last_asked
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE c.organization_id = $1 
         AND m.role = 'user'
         AND LENGTH(m.content) > 10
         GROUP BY m.content
         ORDER BY frequency DESC
         LIMIT 10`, [orgId]);
    // Popular search keywords/topics (extract common words)
    const topicsResult = await pool.query(`WITH words AS (
            SELECT 
                LOWER(regexp_split_to_table(m.content, E'\\\\s+')) as word,
                c.user_id
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.organization_id = $1 
            AND m.role = 'user'
            AND LENGTH(m.content) > 0
        )
        SELECT 
            word,
            COUNT(*) as frequency,
            COUNT(DISTINCT user_id) as used_by_users
        FROM words
        WHERE LENGTH(word) > 4
        AND word NOT IN ('what', 'when', 'where', 'which', 'would', 'could', 'should', 'about', 'there', 'their', 'these', 'those')
        GROUP BY word
        ORDER BY frequency DESC
        LIMIT 15`, [orgId]);
    // Document usage - most referenced documents
    const documentUsageResult = await pool.query(`SELECT 
            d.id,
            d.file_name,
            COUNT(DISTINCT m.id) as times_referenced,
            COUNT(DISTINCT c.user_id) as users_accessed,
            MAX(m.created_at) as last_accessed
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         CROSS JOIN LATERAL jsonb_array_elements(m.sources) AS source
         JOIN documents d ON d.id = (source->>'document_id')::UUID
         WHERE c.organization_id = $1
         AND m.role = 'assistant'
         AND m.sources IS NOT NULL
         GROUP BY d.id, d.file_name
         ORDER BY times_referenced DESC
         LIMIT 10`, [orgId]);
    // Activity timeline - messages per day for last 30 days
    const activityTimelineResult = await pool.query(`SELECT 
            DATE(m.created_at) as date,
            COUNT(*) as message_count,
            COUNT(DISTINCT c.user_id) as active_users
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE c.organization_id = $1
         AND m.created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(m.created_at)
         ORDER BY date DESC`, [orgId]);
    // Average response metrics
    const metricsResult = await pool.query(`SELECT 
            AVG(LENGTH(content))::INTEGER as avg_question_length,
            COUNT(CASE WHEN role = 'user' THEN 1 END) as total_questions,
            COUNT(CASE WHEN role = 'assistant' THEN 1 END) as total_responses
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE c.organization_id = $1`, [orgId]);
    return {
        frequentQuestions: frequentQuestionsResult.rows,
        popularTopics: topicsResult.rows,
        documentUsage: documentUsageResult.rows,
        activityTimeline: activityTimelineResult.rows,
        metrics: metricsResult.rows[0] || { avg_question_length: 0, total_questions: 0, total_responses: 0 }
    };
}
/**
 * Delete a conversation (only if user owns it)
 */
export async function deleteConversation(conversationId, userId) {
    const result = await pool.query(`DELETE FROM conversations 
         WHERE id = $1 AND user_id = $2
         RETURNING id`, [conversationId, userId]);
    if (result.rowCount === 0) {
        throw new Error('CONVERSATION_NOT_FOUND_OR_UNAUTHORIZED');
    }
}
/**
 * Get user's complete chat history with all messages
 */
export async function getUserChatHistory(orgId, userId) {
    const result = await pool.query(`SELECT 
            c.id as conversation_id,
            c.title,
            c.created_at as conversation_created_at,
            c.updated_at as conversation_updated_at,
            json_agg(
                json_build_object(
                    'id', m.id,
                    'role', m.role,
                    'content', m.content,
                    'sources', m.sources,
                    'created_at', m.created_at
                ) ORDER BY m.created_at ASC
            ) as messages
         FROM conversations c
         LEFT JOIN messages m ON m.conversation_id = c.id
         WHERE c.organization_id = $1 AND c.user_id = $2
         GROUP BY c.id, c.title, c.created_at, c.updated_at
         ORDER BY c.updated_at DESC`, [orgId, userId]);
    return result.rows;
}
//# sourceMappingURL=chatService.js.map