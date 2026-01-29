import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { chatApi, docsApi } from '../lib/api';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Send, Loader2, Bot, User, X, AlertCircle, RefreshCw, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, ChatSource } from '../types';

interface DocumentChatPanelProps {
    orgId: string;
    docId: string;
    onClose: () => void;
}

interface Message extends ChatMessage {
    sources?: ChatSource[];
}

export default function DocumentChatPanel({ orgId, docId, onClose }: DocumentChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState<string | undefined>();
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Check document processing status
    const { data: statusData, refetch: refetchStatus, isLoading: isLoadingStatus, error: statusError } = useQuery({
        queryKey: ['documentStatus', orgId, docId],
        queryFn: async () => {
            console.log('[DocumentChat] Fetching status for doc:', docId);
            const result = await docsApi.getStatus(orgId!, docId!);
            console.log('[DocumentChat] Status response:', result);
            return result;
        },
        refetchInterval: (query) => {
            // Refetch every 3 seconds if document is processing
            const status = query.state.data?.data?.status;
            return status === 'PROCESSING' ? 3000 : false;
        },
    });

    const document = statusData?.data;
    const documentStatus = document?.status;
    const chunkCount = document?.chunk_count || 0;
    const embeddingCount = document?.embedding_count || 0;

    console.log('[DocumentChat] Document status:', documentStatus, 'Loading:', isLoadingStatus, 'Error:', statusError);
    console.log('[DocumentChat] Chunks:', chunkCount, 'Embeddings:', embeddingCount);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Mutation to process document
    const processMutation = useMutation({
        mutationFn: () => docsApi.processDocument(orgId, docId),
        onSuccess: () => {
            toast.success('Document processing started');
            refetchStatus();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to process document');
        },
    });

    const chatMutation = useMutation({
        mutationFn: (query: string) => {
            const controller = new AbortController();
            setAbortController(controller);

            return chatApi.sendMessage(orgId, {
                query,
                history: messages,
                documentIds: [docId], // Only use this specific document
                conversationId,
            }, controller.signal);
        },
        onSuccess: (response) => {
            setAbortController(null);
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
            setAbortController(null);
            if (error.name === 'AbortError' || error.name === 'CanceledError') {
                toast.info('Response cancelled');
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: '_Response was cancelled by user._',
                    },
                ]);
            } else {
                toast.error(error.response?.data?.message || 'Failed to get response');
                // Remove the user message if the request failed
                setMessages((prev) => prev.slice(0, -1));
            }
        },
    });

    const handleStop = () => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
        }
    };

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
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Chat with Document</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Document Processing Status Banner */}
            {isLoadingStatus && (
                <div className="px-4 py-3 bg-muted border-b">
                    <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-muted-foreground">
                            Checking document status...
                        </span>
                    </div>
                </div>
            )}
            {statusError && (
                <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                    <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-600">
                            Error loading document status: {(statusError as any)?.message || 'Unknown error'}
                        </span>
                    </div>
                </div>
            )}
            {!isLoadingStatus && !statusError && documentStatus === 'READY' && (chunkCount === 0 || embeddingCount === 0) && (
                <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-yellow-700">
                                Document is ready but has no embeddings ({chunkCount} chunks, {embeddingCount} embeddings). Click to reprocess.
                            </span>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => processMutation.mutate()}
                            disabled={processMutation.isPending}
                        >
                            {processMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Reprocess
                        </Button>
                    </div>
                </div>
            )}
            {!isLoadingStatus && !statusError && documentStatus && documentStatus !== 'READY' && (
                <div className="px-4 py-3 bg-muted border-b">
                    {documentStatus === 'PROCESSING' && (
                        <div className="flex items-center gap-2 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="text-muted-foreground">
                                Processing document for chat... This may take a moment.
                            </span>
                        </div>
                    )}
                    {(documentStatus === 'PENDING' || documentStatus === 'UPLOADED') && (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <span className="text-muted-foreground">
                                    Document needs to be processed before you can chat with it.
                                </span>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => processMutation.mutate()}
                                disabled={processMutation.isPending}
                            >
                                {processMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Process Now
                            </Button>
                        </div>
                    )}
                    {documentStatus === 'FAILED' && (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="text-muted-foreground">
                                    Document processing failed. Please try again.
                                </span>
                            </div>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => processMutation.mutate()}
                                disabled={processMutation.isPending}
                            >
                                {processMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Retry
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground px-4">
                        <Bot className="h-12 w-12 mb-4 text-muted-foreground/50" />
                        <p className="text-sm">
                            Ask me anything about this document!
                        </p>
                        <p className="text-xs mt-2">
                            I'll answer based on the content of this specific document.
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${message.role === 'assistant' ? 'bg-muted/50 -mx-4 px-4 py-3' : ''
                                    }`}
                            >
                                <div className="shrink-0">
                                    {message.role === 'user' ? (
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                            <User className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-blue-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2 min-w-0">
                                    <div className="prose prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                    {message.sources && message.sources.length > 0 && (
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p className="font-medium">Sources:</p>
                                            {message.sources.map((source, idx) => (
                                                <div key={idx} className="bg-background rounded p-2 border">
                                                    <p className="line-clamp-2">{source.text}</p>
                                                    {source.metadata?.page && (
                                                        <p className="text-[10px] mt-1">Page {source.metadata.page}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {chatMutation.isPending && (
                            <div className="flex gap-3 bg-muted/50 -mx-4 px-4 py-3">
                                <div className="shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Bot className="h-4 w-4 text-blue-600" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            documentStatus === 'READY' && chunkCount > 0 && embeddingCount > 0
                                ? "Ask a question about this document..."
                                : "Document must be processed before chatting..."
                        }
                        className="min-h-11 max-h-30 resize-none"
                        rows={1}
                        disabled={documentStatus !== 'READY' || chunkCount === 0 || embeddingCount === 0 || chatMutation.isPending}
                    />
                    {chatMutation.isPending ? (
                        <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            onClick={handleStop}
                            className="shrink-0"
                        >
                            <StopCircle className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || documentStatus !== 'READY' || chunkCount === 0 || embeddingCount === 0}
                            className="shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    )}
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </>
    );
}
