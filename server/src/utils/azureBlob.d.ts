/**
 * Upload file buffer to Azure Blob Storage
 */
export declare const uploadToAzureBlob: (blobPath: string, buffer: Buffer, mimeType: string) => Promise<{
    blobPath: string;
}>;
/**
 * Delete file from Azure Blob Storage
 */
export declare const deleteFromAzureBlob: (blobPath: string) => Promise<{
    blobPath: string;
    deleted: boolean;
}>;
/**
 * Download file from Azure Blob Storage
 */
export declare const downloadFromAzureBlob: (blobPath: string) => Promise<Buffer>;
//# sourceMappingURL=azureBlob.d.ts.map