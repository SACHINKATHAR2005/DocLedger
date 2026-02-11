import { uploadDocument, getAllDocuments, getDocumentById, updateDocument, deleteDocument } from "../service/docsService.js";
import { randomUUID } from "crypto";
import { uploadToAzureBlob, deleteFromAzureBlob, downloadFromAzureBlob } from "../utils/azureBlob.js";
import { convertDocxToPdf } from "../utils/docxToPdf.js";
export const uploadDocumentController = async (req, res) => {
    try {
        console.log('[Upload] Received request');
        console.log('[Upload] req.file:', req.file);
        console.log('[Upload] req.body:', req.body);
        console.log('[Upload] Content-Type:', req.headers['content-type']);
        const userId = req.user.id;
        const orgId = req.params.orgId;
        const file = req.file;
        if (!file) {
            console.log('[Upload] No file found in request');
            return res.status(400).json({ message: "No file uploaded" });
        }
        if (!orgId || typeof orgId !== "string") {
            return res.status(400).json({ message: "Invalid organization ID" });
        }
        const allowedTypes = [
            "application/pdf",
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({ message: "Unsupported file type" });
        }
        const docId = randomUUID();
        const filePath = `orgs/${orgId}/documents/${docId}-${file.originalname}`;
        await uploadToAzureBlob(filePath, file.buffer, file.mimetype);
        const document = await uploadDocument(orgId, userId, file, filePath);
        // Trigger background processing (don't await - fire and forget)
        import('../service/documentProcessor.js').then(({ processDocument }) => {
            processDocument(document.id).catch((error) => {
                console.error(`[Upload] Error processing document ${document.id}:`, error);
            });
        });
        return res.status(201).json({
            message: "Document uploaded successfully. Processing will begin shortly.",
            success: true,
            data: document,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message,
        });
    }
};
// Get all documents for an organization
export const getAllDocumentsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const orgId = req.params.orgId;
        if (!orgId || typeof orgId !== "string") {
            return res.status(400).json({ message: "Invalid organization ID" });
        }
        const documents = await getAllDocuments(orgId, userId);
        return res.status(200).json({
            message: "Documents retrieved successfully",
            success: true,
            data: { documents },
        });
    }
    catch (error) {
        if (error.message === "NOT_ORG_MEMBER") {
            return res.status(403).json({
                message: "You are not a member of this organization",
                success: false,
            });
        }
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message,
        });
    }
};
// Get a single document by ID
export const getDocumentByIdController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orgId, docId } = req.params;
        if (!orgId || typeof orgId !== "string") {
            return res.status(400).json({ message: "Invalid organization ID" });
        }
        if (!docId || typeof docId !== "string") {
            return res.status(400).json({ message: "Invalid document ID" });
        }
        const document = await getDocumentById(docId, orgId, userId);
        return res.status(200).json({
            message: "Document retrieved successfully",
            success: true,
            data: { document },
        });
    }
    catch (error) {
        if (error.message === "NOT_ORG_MEMBER") {
            return res.status(403).json({
                message: "You are not a member of this organization",
                success: false,
            });
        }
        if (error.message === "DOCUMENT_NOT_FOUND") {
            return res.status(404).json({
                message: "Document not found",
                success: false,
            });
        }
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message,
        });
    }
};
// Update a document
export const updateDocumentController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orgId, docId } = req.params;
        const { file_name, status } = req.body;
        if (!orgId || typeof orgId !== "string") {
            return res.status(400).json({ message: "Invalid organization ID" });
        }
        if (!docId || typeof docId !== "string") {
            return res.status(400).json({ message: "Invalid document ID" });
        }
        const updates = {};
        if (file_name)
            updates.file_name = file_name;
        if (status)
            updates.status = status;
        const document = await updateDocument(docId, orgId, userId, updates);
        return res.status(200).json({
            message: "Document updated successfully",
            success: true,
            data: document,
        });
    }
    catch (error) {
        if (error.message === "NOT_ORG_MEMBER") {
            return res.status(403).json({
                message: "You are not a member of this organization",
                success: false,
            });
        }
        if (error.message === "DOCUMENT_NOT_FOUND") {
            return res.status(404).json({
                message: "Document not found",
                success: false,
            });
        }
        if (error.message === "FORBIDDEN") {
            return res.status(403).json({
                message: "Only admin or uploader can update this document",
                success: false,
            });
        }
        if (error.message === "NO_UPDATES_PROVIDED") {
            return res.status(400).json({
                message: "No updates provided",
                success: false,
            });
        }
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message,
        });
    }
};
// Delete a document
export const deleteDocumentController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orgId, docId } = req.params;
        if (!orgId || typeof orgId !== "string") {
            return res.status(400).json({ message: "Invalid organization ID" });
        }
        if (!docId || typeof docId !== "string") {
            return res.status(400).json({ message: "Invalid document ID" });
        }
        const { deletedDocument, filePath } = await deleteDocument(docId, orgId, userId);
        // Delete from Azure Blob Storage
        try {
            await deleteFromAzureBlob(filePath);
        }
        catch (blobError) {
            console.error("Error deleting from Azure Blob:", blobError);
            // Continue even if blob deletion fails
        }
        return res.status(200).json({
            message: "Document deleted successfully",
            success: true,
            data: deletedDocument,
        });
    }
    catch (error) {
        if (error.message === "NOT_ORG_MEMBER") {
            return res.status(403).json({
                message: "You are not a member of this organization",
                success: false,
            });
        }
        if (error.message === "DOCUMENT_NOT_FOUND") {
            return res.status(404).json({
                message: "Document not found",
                success: false,
            });
        }
        if (error.message === "FORBIDDEN") {
            return res.status(403).json({
                message: "Only admin or uploader can delete this document",
                success: false,
            });
        }
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message,
        });
    }
};
// Download/view a document file
export const downloadDocumentController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orgId, docId } = req.params;
        if (!orgId || typeof orgId !== "string") {
            return res.status(400).json({ message: "Invalid organization ID" });
        }
        if (!docId || typeof docId !== "string") {
            return res.status(400).json({ message: "Invalid document ID" });
        }
        // Get document to verify access and get file path
        const document = await getDocumentById(docId, orgId, userId);
        if (!document) {
            return res.status(404).json({
                message: "Document not found",
                success: false,
            });
        }
        // Download file from Azure Blob Storage
        const fileBuffer = await downloadFromAzureBlob(document.file_path);
        // For DOCX files, convert to PDF before serving
        if (document.file_name.toLowerCase().endsWith('.docx')) {
            try {
                console.log('[Download] Converting DOCX to PDF...');
                const pdfBuffer = await convertDocxToPdf(fileBuffer);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${document.file_name.replace('.docx', '.pdf')}"`);
                res.setHeader('Content-Length', pdfBuffer.length);
                return res.send(pdfBuffer);
            }
            catch (conversionError) {
                console.error('[Download] DOCX to PDF conversion failed:', conversionError);
                // Fallback to serving the original file
                res.setHeader('Content-Type', document.file_type);
                res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
                res.setHeader('Content-Length', fileBuffer.length);
                return res.send(fileBuffer);
            }
        }
        // Set appropriate headers for file download/view
        res.setHeader('Content-Type', document.file_type);
        res.setHeader('Content-Disposition', `inline; filename="${document.file_name}"`);
        res.setHeader('Content-Length', fileBuffer.length);
        // Send the file
        return res.send(fileBuffer);
    }
    catch (error) {
        if (error.message === "NOT_ORG_MEMBER") {
            return res.status(403).json({
                message: "You are not a member of this organization",
                success: false,
            });
        }
        if (error.message === "DOCUMENT_NOT_FOUND") {
            return res.status(404).json({
                message: "Document not found",
                success: false,
            });
        }
        console.error("Error downloading document:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message,
        });
    }
};
//# sourceMappingURL=docsUploadControllers.js.map