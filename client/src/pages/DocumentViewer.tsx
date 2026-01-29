import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, MessageSquare, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { docsApi } from '../lib/api';
import { useState } from 'react';
import DocumentChatPanel from '../components/DocumentChatPanel';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function DocumentViewer() {
    const { orgId, docId } = useParams<{ orgId: string; docId: string }>();
    const navigate = useNavigate();
    const [isChatOpen, setIsChatOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['document', orgId, docId],
        queryFn: () => docsApi.getDocument(orgId!, docId!),
        enabled: !!orgId && !!docId,
    });

    const document = data?.data?.document;
    const viewUrl = `${API_BASE_URL}/api/docs/org/${orgId}/documents/${docId}/view`;

    const handleDownload = () => {
        const link = window.document.createElement('a');
        link.href = viewUrl;
        link.download = document?.file_name || 'download';
        link.click();
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!document) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-lg text-muted-foreground">Document not found</p>
                <Button onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">{document.file_name}</h1>
                        <p className="text-sm text-muted-foreground">
                            Uploaded by {document.uploader?.name || 'Unknown'} on{' '}
                            {new Date(document.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        variant={isChatOpen ? "default" : "outline"}
                        size="sm"
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat with Doc
                    </Button>
                    <Button onClick={handleDownload} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                </div>
            </div>

            {/* Document Viewer with Chat Panel */}
            <div className="flex-1 overflow-hidden flex">
                {/* Document Viewer */}
                <div className={`flex-1 overflow-hidden transition-all ${isChatOpen ? 'w-1/2' : 'w-full'}`}>
                    {document.file_name.toLowerCase().endsWith('.pdf') || document.file_name.toLowerCase().endsWith('.docx') ? (
                        <iframe
                            src={viewUrl}
                            className="w-full h-full"
                            title={document.file_name}
                        />
                    ) : document.file_name.toLowerCase().match(/\.(jpg|jpeg|png|gif|svg|bmp)$/i) ? (
                        <div className="h-full flex items-center justify-center bg-slate-50 p-8">
                            <img
                                src={viewUrl}
                                alt={document.file_name}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    ) : document.file_name.toLowerCase().endsWith('.txt') ? (
                        <iframe
                            src={viewUrl}
                            className="w-full h-full"
                            title={document.file_name}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
                            <div className="text-center">
                                <div className="mb-4 flex justify-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Download className="h-8 w-8 text-blue-600" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{document.file_name}</h3>
                                <p className="text-muted-foreground mb-6">
                                    Preview not available for this file type
                                </p>
                                <Button onClick={handleDownload} size="lg">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download File
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Panel */}
                {isChatOpen && (
                    <div className="w-1/2 border-l bg-white flex flex-col">
                        <DocumentChatPanel
                            orgId={orgId!}
                            docId={docId!}
                            onClose={() => setIsChatOpen(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
