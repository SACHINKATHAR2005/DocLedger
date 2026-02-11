import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/multerMiddleware.js";
import { uploadDocumentController, getAllDocumentsController, getDocumentByIdController, updateDocumentController, deleteDocumentController } from "../controllers/docsUploadControllers.js";
const router = Router();
// Upload document - all members can upload
// POST http://localhost:8000/api/docs/org/:orgId/documents
router.post("/org/:orgId/documents", authMiddleware, upload.single("file"), uploadDocumentController);
// Get all documents in an organization - all members can read
// GET http://localhost:8000/api/docs/org/:orgId/documents
router.get("/org/:orgId/documents", authMiddleware, getAllDocumentsController);
// Get a single document by ID - all members can read
// GET http://localhost:8000/api/docs/org/:orgId/documents/:docId
router.get("/org/:orgId/documents/:docId", authMiddleware, getDocumentByIdController);
// Update document - only admin or uploader can update
// PUT http://localhost:8000/api/docs/org/:orgId/documents/:docId
router.put("/org/:orgId/documents/:docId", authMiddleware, updateDocumentController);
// Delete document - only admin or uploader can delete
// DELETE http://localhost:8000/api/docs/org/:orgId/documents/:docId
router.delete("/org/:orgId/documents/:docId", authMiddleware, deleteDocumentController);
// Download/view document file - all members can view
// GET http://localhost:8000/api/docs/org/:orgId/documents/:docId/view
router.get("/org/:orgId/documents/:docId/view", authMiddleware, async (req, res, next) => {
    const { downloadDocumentController } = await import("../controllers/docsUploadControllers.js");
    return downloadDocumentController(req, res);
});
export default router;
//# sourceMappingURL=docsRoutes.js.map