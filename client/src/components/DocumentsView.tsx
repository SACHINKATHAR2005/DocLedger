import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { docsApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { Upload, Trash2, FileText, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { Document } from '../types';

interface DocumentsViewProps {
    orgId: string;
    isAdmin: boolean;
}

export default function DocumentsView({ orgId, isAdmin }: DocumentsViewProps) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

    const { data: docsData, isLoading } = useQuery({
        queryKey: ['documents', orgId],
        queryFn: () => docsApi.getAll(orgId),
        enabled: !!orgId,
        refetchInterval: (query) => {
            const docs = query.state.data?.data?.documents || [];
            const hasProcessing = docs.some((doc: Document) =>
                doc.status === 'PENDING' || doc.status === 'PROCESSING'
            );
            return hasProcessing ? 5000 : false;
        },
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) => docsApi.upload(orgId, file),
        onSuccess: (_, file) => {
            queryClient.invalidateQueries({ queryKey: ['documents', orgId] });
            toast.success(`${file.name} uploaded successfully!`);
            setUploadingFiles((prev) => prev.filter((name) => name !== file.name));
        },
        onError: (error: any, file) => {
            toast.error(error.response?.data?.message || `Failed to upload ${file.name}`);
            setUploadingFiles((prev) => prev.filter((name) => name !== file.name));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (docId: string) => docsApi.delete(orgId, docId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', orgId] });
            toast.success('Document deleted successfully');
            setDeleteDialogOpen(false);
            setSelectedDoc(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete document');
        },
    });

    const onDrop = async (acceptedFiles: File[]) => {
        for (const file of acceptedFiles) {
            if (file.size > 50 * 1024 * 1024) {
                toast.error(`${file.name} is too large. Maximum size is 50MB`);
                continue;
            }

            const validTypes = [
                'application/pdf',
                'text/plain',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];

            if (!validTypes.includes(file.type)) {
                toast.error(`${file.name} is not a supported file type. Upload PDF, TXT, or DOCX files.`);
                continue;
            }

            setUploadingFiles((prev) => [...prev, file.name]);
            uploadMutation.mutate(file);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        multiple: true,
    });

    const documents = docsData?.data?.documents || [];

    const getStatusBadge = (status: Document['status']) => {
        switch (status) {
            case 'READY':
                return (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Ready
                    </Badge>
                );
            case 'PROCESSING':
                return (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Processing
                    </Badge>
                );
            case 'PENDING':
                return (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                );
            case 'FAILED':
                return (
                    <Badge variant="destructive" className="bg-red-100 text-red-700">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Failed
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const canDeleteDoc = (doc: Document) => {
        return isAdmin || doc.uploaded_by === user?.id;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="p-6 space-y-6">
            {/* Upload Area */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                    }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-4">
                        <Upload className="h-8 w-8 text-primary" />
                    </div>
                    {isDragActive ? (
                        <p className="text-lg font-medium">Drop files here...</p>
                    ) : (
                        <>
                            <div>
                                <p className="text-lg font-medium">Drop files here or click to upload</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Supported formats: PDF, TXT, DOCX (max 50MB)
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Uploading Files */}
            {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                    {uploadingFiles.map((fileName) => (
                        <div key={fileName} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm font-medium">{fileName}</span>
                            <span className="text-xs text-muted-foreground">Uploading...</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Documents Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-12">
                    <div className="rounded-full bg-slate-100 p-4 inline-block mb-4">
                        <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-muted-foreground">No documents yet. Upload your first document above.</p>
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Document</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Uploaded By</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map((doc) => (
                                <TableRow key={doc.id} className="cursor-pointer hover:bg-slate-50">
                                    <TableCell onClick={() => {
                                        navigate(`/orgs/${orgId}/documents/${doc.id}`);
                                    }}>
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-primary" />
                                            <div>
                                                <p className="font-medium hover:text-primary transition-colors">{doc.file_name}</p>
                                                {doc.error_message && (
                                                    <p className="text-xs text-red-600">{doc.error_message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatFileSize(doc.file_size)}
                                    </TableCell>
                                    <TableCell className="text-sm">{doc.uploader?.name || 'Unknown'}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(doc.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {canDeleteDoc(doc) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedDoc(doc);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Document</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{selectedDoc?.file_name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleteMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedDoc && deleteMutation.mutate(selectedDoc.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
