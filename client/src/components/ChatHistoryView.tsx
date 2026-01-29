import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../lib/api';
import { Card } from './ui/card';
import { Loader2, MessageSquare, User, Bot, FileText, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';

interface ChatHistoryViewProps {
    orgId: string;
}

export default function ChatHistoryView({ orgId }: ChatHistoryViewProps) {
    const { data: historyData, isLoading } = useQuery({
        queryKey: ['chat-history', orgId],
        queryFn: () => chatApi.getUserChatHistory(orgId),
        enabled: !!orgId,
    });

    const history = historyData?.data?.history || [];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatDateShort = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">My Chat History</h2>
                <p className="text-muted-foreground">
                    View all your conversations and interactions with documents
                </p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Conversations</p>
                            <p className="text-2xl font-bold">{history.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Messages</p>
                            <p className="text-2xl font-bold">
                                {history.reduce((acc, conv) => acc + (conv.messages?.length || 0), 0)}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Last Activity</p>
                            <p className="text-sm font-medium">
                                {history[0] ? formatDateShort(history[0].conversation_updated_at) : 'No activity'}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Conversations List */}
            {history.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center">
                        <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Chat History Yet</h3>
                        <p className="text-muted-foreground">
                            Start chatting with your documents to see your conversation history here
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {history.map((conversation: any) => (
                        <Card key={conversation.conversation_id} className="p-6">
                            <div className="space-y-4">
                                {/* Conversation Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-1">
                                            {conversation.title || 'Untitled Conversation'}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(conversation.conversation_created_at)}
                                            </span>
                                            <Badge variant="secondary">
                                                {conversation.messages?.length || 0} messages
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="space-y-3 mt-4 border-t pt-4">
                                    {conversation.messages?.filter((msg: any) => msg.id).map((message: any) => (
                                        <div
                                            key={message.id}
                                            className={`flex gap-3 p-3 rounded-lg ${message.role === 'user'
                                                    ? 'bg-blue-50 dark:bg-blue-950/20'
                                                    : 'bg-gray-50 dark:bg-gray-900/20'
                                                }`}
                                        >
                                            <div className="flex-shrink-0">
                                                {message.role === 'user' ? (
                                                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                                                        <Bot className="h-5 w-5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm">
                                                        {message.role === 'user' ? 'You' : 'Assistant'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(message.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap break-words">
                                                    {message.content}
                                                </p>

                                                {/* Sources */}
                                                {message.sources && message.sources.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <FileText className="h-3 w-3" />
                                                            Sources:
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {message.sources.map((source: any, idx: number) => (
                                                                <Badge key={idx} variant="outline" className="text-xs">
                                                                    {source.document_name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
