import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { chatApi, docsApi } from '../lib/api';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Send, Loader2, FileText, Bot, User, Filter, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import type { ChatMessage, ChatSource } from '../types';

interface ChatPanelProps {
    orgId: string;
}

interface Message extends ChatMessage {
    sources?: ChatSource[];
}

export default function ChatPanel({ orgId }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]); // Empty = all docs
    const [conversationId, setConversationId] = useState<string | undefined>();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch available documents
    const { data: documentsData } = useQuery({
        queryKey: ['documents', orgId],
        queryFn: () => docsApi.getAll(orgId),
    });

    const readyDocuments = documentsData?.data?.documents?.filter(doc => doc.status === 'READY') || [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const chatMutation = useMutation({
        mutationFn: (query: string) => {
            const history = messages.map(({ role, content }) => ({ role, content }));
            return chatApi.sendMessage(orgId, {
                query,
                history,
                documentIds: selectedDocuments.length > 0 ? selectedDocuments : undefined,
                conversationId,
            });
        },
        onSuccess: (response) => {
            if (response.success && response.data) {
                // Save conversation ID from first response
                if (!conversationId && response.data.conversationId) {
                    setConversationId(response.data.conversationId);
                }

                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: response.data!.answer,
                        sources: response.data!.sources,
                    },
                ]);
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to get response');
            // Remove the user message if the request failed
            setMessages((prev) => prev.slice(0, -1));
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || chatMutation.isPending) return;

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        chatMutation.mutate(input.trim());
        setInput('');

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);

        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-sm">
                            <div className="rounded-full bg-primary/10 p-4 inline-block mb-4">
                                <Bot className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Ask me anything</h3>
                            <p className="text-sm text-muted-foreground">
                                I can help you find information from your uploaded documents. Ask questions and I'll provide answers with sources.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <div key={index} className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`rounded-full p-2 ${message.role === 'user'
                                            ? 'bg-slate-100'
                                            : 'bg-primary/10'
                                            }`}
                                    >
                                        {message.role === 'user' ? (
                                            <User className="h-4 w-4 text-slate-600" />
                                        ) : (
                                            <Bot className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2 min-w-0">
                                        <div className="prose prose-sm max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                                    li: ({ children }) => <li className="ml-2">{children}</li>,
                                                    code: ({ children }) => <code className="bg-slate-100 px-1 py-0.5 rounded text-sm">{children}</code>,
                                                    pre: ({ children }) => <pre className="bg-slate-100 p-2 rounded overflow-x-auto">{children}</pre>,
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>

                                        {/* Sources */}
                                        {message.sources && message.sources.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground">Sources:</p>
                                                <div className="space-y-2">
                                                    {message.sources.map((source, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                                                        >
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <FileText className="h-3 w-3 text-primary" />
                                                                <span className="text-xs font-medium truncate">
                                                                    {source.document_name}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                                                {source.chunk_text}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {chatMutation.isPending && (
                            <div className="flex items-start gap-3">
                                <div className="rounded-full p-2 bg-primary/10">
                                    <Bot className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t p-4 bg-white">
                <form onSubmit={handleSubmit} className="space-y-2">
                    {/* Document Filter */}
                    {readyDocuments.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Filter className="h-3 w-3" />
                                        {selectedDocuments.length === 0
                                            ? `All Documents (${readyDocuments.length})`
                                            : `${selectedDocuments.length} Selected`}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-64 bg-white">
                                    {readyDocuments.map((doc) => (
                                        <DropdownMenuCheckboxItem
                                            key={doc.id}
                                            checked={selectedDocuments.includes(doc.id)}
                                            onCheckedChange={(checked) => {
                                                setSelectedDocuments((prev) =>
                                                    checked
                                                        ? [...prev, doc.id]
                                                        : prev.filter((id) => id !== doc.id)
                                                );
                                            }}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <FileText className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{doc.file_name}</span>
                                            </div>
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Clear filter button */}
                            {selectedDocuments.length > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedDocuments([])}
                                    className="h-8"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear Filter
                                </Button>
                            )}
                        </div>
                    )}

                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question about your documents..."
                        className="min-h-[60px] max-h-[200px] resize-none"
                        disabled={chatMutation.isPending}
                    />
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                            Press Enter to send, Shift+Enter for new line
                        </p>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!input.trim() || chatMutation.isPending}
                        >
                            {chatMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
