import axios from 'axios';
import type {
    User,
    Organization,
    OrganizationMember,
    Document,
    ChatMessage,
    ChatResponse,
    ApiResponse,
    OrganizationWithRole,
    Conversation,
    SavedMessage,
    ChatAnalytics,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Auth API
export const authApi = {
    signup: async (data: { name: string; email: string; password: string }) => {
        const response = await api.post<ApiResponse<User>>('/api/auth/signup', data);
        return response.data;
    },

    signin: async (data: { email: string; password: string }) => {
        const response = await api.post<ApiResponse<User>>('/api/auth/signin', data);
        return response.data;
    },

    me: async () => {
        const response = await api.get<ApiResponse<User>>('/api/auth/me');
        return response.data;
    },

    logout: async () => {
        const response = await api.post<ApiResponse>('/api/auth/logout');
        return response.data;
    },
};

// Organizations API
export const orgsApi = {
    create: async (data: { name: string }) => {
        const response = await api.post<ApiResponse<{ organization: Organization }>>('/api/orgs/create', data);
        return response.data;
    },

    getAll: async () => {
        const response = await api.get<ApiResponse<{ organizations: OrganizationWithRole[] }>>('/api/orgs');
        return response.data;
    },

    getOne: async (orgId: string) => {
        const response = await api.get<ApiResponse<{ organization: Organization }>>(`/api/orgs/${orgId}`);
        return response.data;
    },

    update: async (orgId: string, data: { name: string }) => {
        const response = await api.put<ApiResponse<{ organization: Organization }>>(`/api/orgs/${orgId}`, data);
        return response.data;
    },

    delete: async (orgId: string) => {
        const response = await api.delete<ApiResponse>(`/api/orgs/${orgId}`);
        return response.data;
    },

    // Members
    getMembers: async (orgId: string) => {
        const response = await api.get<ApiResponse<{ members: OrganizationMember[] }>>(`/api/orgs/members/${orgId}`);
        return response.data;
    },

    invite: async (orgId: string, data: { email: string; role: 'ADMIN' | 'MEMBER' | 'TEAM_LEAD' }) => {
        const response = await api.post<ApiResponse<OrganizationMember>>(`/api/orgs/add-member/${orgId}`, data);
        return response.data;
    },

    updateMemberRole: async (orgId: string, userId: string, data: { role: 'ADMIN' | 'MEMBER' | 'TEAM_LEAD' }) => {
        const response = await api.put<ApiResponse<OrganizationMember>>(`/api/orgs/members/update-role/${orgId}/${userId}`, data);
        return response.data;
    },

    removeMember: async (orgId: string, userId: string) => {
        const response = await api.delete<ApiResponse>(`/api/orgs/members/remove/${orgId}/${userId}`);
        return response.data;
    },
};

// Documents API
export const docsApi = {
    upload: async (orgId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<ApiResponse<Document>>(`/api/docs/org/${orgId}/documents`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getAll: async (orgId: string) => {
        const response = await api.get<ApiResponse<{ documents: Document[] }>>(`/api/docs/org/${orgId}/documents`);
        return response.data;
    },

    getOne: async (orgId: string, docId: string) => {
        const response = await api.get<ApiResponse<Document>>(`/api/docs/org/${orgId}/documents/${docId}`);
        return response.data;
    },

    getDocument: async (orgId: string, docId: string) => {
        const response = await api.get<ApiResponse<{ document: Document }>>(`/api/docs/org/${orgId}/documents/${docId}`);
        return response.data;
    },

    update: async (orgId: string, docId: string, data: { file_name?: string }) => {
        const response = await api.put<ApiResponse<Document>>(`/api/docs/org/${orgId}/documents/${docId}`, data);
        return response.data;
    },

    delete: async (orgId: string, docId: string) => {
        const response = await api.delete<ApiResponse>(`/api/docs/org/${orgId}/documents/${docId}`);
        return response.data;
    },

    getStatus: async (orgId: string, docId: string) => {
        const response = await api.get<ApiResponse<Document>>(`/api/orgs/${orgId}/documents/${docId}/status`);
        return response.data;
    },

    processDocument: async (orgId: string, docId: string) => {
        const response = await api.post<ApiResponse>(`/api/orgs/${orgId}/documents/${docId}/process`);
        return response.data;
    },
};

// RAG/Chat API
export const chatApi = {
    sendMessage: async (
        orgId: string,
        data: { query: string; history?: ChatMessage[]; documentIds?: string[]; conversationId?: string },
        signal?: AbortSignal
    ) => {
        const response = await api.post<ApiResponse<ChatResponse>>(
            `/api/orgs/${orgId}/chat`,
            data,
            { signal }
        );
        return response.data;
    },

    // Conversation management
    createConversation: async (orgId: string, title?: string) => {
        const response = await api.post<ApiResponse<{ conversation: Conversation }>>(`/api/orgs/${orgId}/conversations`, { title });
        return response.data;
    },

    getConversations: async (orgId: string) => {
        const response = await api.get<ApiResponse<{ conversations: Conversation[] }>>(`/api/orgs/${orgId}/conversations`);
        return response.data;
    },

    getConversationMessages: async (orgId: string, conversationId: string) => {
        const response = await api.get<ApiResponse<{ messages: SavedMessage[] }>>(`/api/orgs/${orgId}/conversations/${conversationId}`);
        return response.data;
    },

    deleteConversation: async (orgId: string, conversationId: string) => {
        const response = await api.delete<ApiResponse>(`/api/orgs/${orgId}/conversations/${conversationId}`);
        return response.data;
    },

    // Admin analytics
    getChatAnalytics: async (orgId: string) => {
        const response = await api.get<ApiResponse<{ analytics: ChatAnalytics[] }>>(`/api/orgs/${orgId}/chat-analytics`);
        return response.data;
    },

    // Advanced analytics (admin/team lead)
    getAdvancedAnalytics: async (orgId: string) => {
        const response = await api.get<ApiResponse<any>>(`/api/orgs/${orgId}/chat-analytics/advanced`);
        return response.data;
    },

    // User's own chat history
    getUserChatHistory: async (orgId: string) => {
        const response = await api.get<ApiResponse<{ history: any[] }>>(`/api/orgs/${orgId}/chat-history`);
        return response.data;
    },
};
