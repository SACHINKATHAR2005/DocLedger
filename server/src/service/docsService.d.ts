export declare const uploadDocument: (orgId: string, uploadedBy: string, file: Express.Multer.File, filePath: string) => Promise<any>;
export declare const getAllDocuments: (orgId: string, userId: string) => Promise<any[]>;
export declare const getDocumentById: (docId: string, orgId: string, userId: string) => Promise<any>;
export declare const updateDocument: (docId: string, orgId: string, userId: string, updates: {
    file_name?: string;
    status?: string;
}) => Promise<any>;
export declare const deleteDocument: (docId: string, orgId: string, userId: string) => Promise<{
    deletedDocument: any;
    filePath: any;
}>;
//# sourceMappingURL=docsService.d.ts.map