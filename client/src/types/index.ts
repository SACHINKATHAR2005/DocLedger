export interface User {
    id: string;
    name: string;
    email: string;
    created_at: string;
}

export interface Organization {
    id: string;
    name: string;
    created_by: string;
    created_at: string;
}

export interface OrganizationMember {
    organization_id: string;
    user_id: string;
    role: 'ADMIN' | 'MEMBER' | 'TEAM_LEAD';
    joined_at: string;
    user?: User;
}

export interface Document {
    id: string;
    organization_id: string;
    project_id?: string;
    uploaded_by: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_path: string;
    extracted_text?: string;
    status: 'UPLOADED' | 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
    error_message?: string;
    chunk_count?: number;
    embedding_count?: number;
    created_at: string;
    updated_at: string;
    processed_at?: string;
    uploader?: User;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatSource {
    document_id: string;
    document_name: string;
    chunk_text: string;
    text: string;
    metadata?: {
        page?: number;
        [key: string]: any;
    };
}

export interface ChatResponse {
    answer: string;
    sources: ChatSource[];
    conversationId?: string;
}

export interface Conversation {
    id: string;
    title: string;
    message_count: number;
    created_at: string;
    updated_at: string;
}

export interface SavedMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: ChatSource[];
    created_at: string;
}

export interface ChatAnalytics {
    user_id: string;
    user_name: string;
    user_email: string;
    total_conversations: number;
    total_messages: number;
    last_activity: string;
    first_activity: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface OrganizationWithRole extends Organization {
    role: 'ADMIN' | 'MEMBER' | 'TEAM_LEAD';
}
