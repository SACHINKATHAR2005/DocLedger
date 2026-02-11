import { BlobServiceClient } from "@azure/storage-blob";
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_BLOB_CONTAINER;
if (!connectionString) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING not set");
}
if (!containerName) {
    throw new Error("AZURE_BLOB_CONTAINER not set");
}
// create blob service client
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
// get container client
const containerClient = blobServiceClient.getContainerClient(containerName);
/**
 * Upload file buffer to Azure Blob Storage
 */
export const uploadToAzureBlob = async (blobPath, buffer, mimeType) => {
    // ensure container exists
    await containerClient.createIfNotExists();
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
            blobContentType: mimeType,
        },
    });
    return {
        blobPath,
    };
};
/**
 * Delete file from Azure Blob Storage
 */
export const deleteFromAzureBlob = async (blobPath) => {
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.deleteIfExists();
    return {
        blobPath,
        deleted: true,
    };
};
/**
 * Download file from Azure Blob Storage
 */
export const downloadFromAzureBlob = async (blobPath) => {
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    const downloadResponse = await blockBlobClient.download(0);
    if (!downloadResponse.readableStreamBody) {
        throw new Error("Failed to download file from Azure Blob Storage");
    }
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
};
//# sourceMappingURL=azureBlob.js.map