
import { pool } from "../config/db.js";
import crypto from "crypto";
import type { Multer } from "multer";




export const uploadDocument = async (
    orgId: string,
    uploadedBy: string,
    file: Express.Multer.File,
    filePath: string
) => {

    const membership = await pool.query(
        `SELECT 1 FROM organization_members
     WHERE organization_id = $1 AND user_id = $2`,
        [orgId, uploadedBy]
    );

    if (membership.rowCount === 0) {
        throw new Error("NOT_ORG_MEMBER");
    }


    const docId = crypto.randomUUID();


    const result = await pool.query(
        `INSERT INTO documents (
      id,
      organization_id,
      uploaded_by,
      file_name,
      file_type,
      file_size,
      file_path,
      status
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,'UPLOADED')
    RETURNING *`,
        [
            docId,
            orgId,
            uploadedBy,
            file.originalname,
            file.mimetype,
            file.size,
            filePath
        ]
    );

    return result.rows[0];
};

// Get all documents for an organization
export const getAllDocuments = async (
    orgId: string,
    userId: string
) => {
    // Check if user is a member of the organization
    const membership = await pool.query(
        `SELECT 1 FROM organization_members
     WHERE organization_id = $1 AND user_id = $2`,
        [orgId, userId]
    );

    if (membership.rowCount === 0) {
        throw new Error("NOT_ORG_MEMBER");
    }

    // Get all documents for the organization
    const result = await pool.query(
        `SELECT d.*, 
                jsonb_build_object(
                    'id', u.id,
                    'name', u.name,
                    'email', u.email
                ) as uploader
     FROM documents d
     LEFT JOIN users u ON d.uploaded_by = u.id
     WHERE d.organization_id = $1
     ORDER BY d.created_at DESC`,
        [orgId]
    );

    return result.rows;
};

// Get a single document by ID
export const getDocumentById = async (
    docId: string,
    orgId: string,
    userId: string
) => {
    // Check if user is a member of the organization
    const membership = await pool.query(
        `SELECT 1 FROM organization_members
     WHERE organization_id = $1 AND user_id = $2`,
        [orgId, userId]
    );

    if (membership.rowCount === 0) {
        throw new Error("NOT_ORG_MEMBER");
    }

    // Get the document
    const result = await pool.query(
        `SELECT d.*, 
                jsonb_build_object(
                    'id', u.id,
                    'name', u.name,
                    'email', u.email
                ) as uploader
     FROM documents d
     LEFT JOIN users u ON d.uploaded_by = u.id
     WHERE d.id = $1 AND d.organization_id = $2`,
        [docId, orgId]
    );

    if (result.rowCount === 0) {
        throw new Error("DOCUMENT_NOT_FOUND");
    }

    return result.rows[0];
};

// Update a document (only admin or uploader can update)
export const updateDocument = async (
    docId: string,
    orgId: string,
    userId: string,
    updates: {
        file_name?: string;
        status?: string;
    }
) => {
    // Check if document exists
    const docCheck = await pool.query(
        `SELECT uploaded_by FROM documents
     WHERE id = $1 AND organization_id = $2`,
        [docId, orgId]
    );

    if (docCheck.rowCount === 0) {
        throw new Error("DOCUMENT_NOT_FOUND");
    }

    const uploadedBy = docCheck.rows[0].uploaded_by;

    // Check if user is admin or the uploader
    const adminCheck = await pool.query(
        `SELECT role FROM organization_members
     WHERE organization_id = $1 AND user_id = $2`,
        [orgId, userId]
    );

    if (adminCheck.rowCount === 0) {
        throw new Error("NOT_ORG_MEMBER");
    }

    const isAdmin = adminCheck.rows[0].role === "ADMIN";
    const isUploader = uploadedBy === userId;

    if (!isAdmin && !isUploader) {
        throw new Error("FORBIDDEN");
    }

    // Build update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.file_name !== undefined) {
        updateFields.push(`file_name = $${paramCount++}`);
        values.push(updates.file_name);
    }

    if (updates.status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        values.push(updates.status);
    }

    if (updateFields.length === 0) {
        throw new Error("NO_UPDATES_PROVIDED");
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(docId, orgId);

    const result = await pool.query(
        `UPDATE documents
     SET ${updateFields.join(", ")}
     WHERE id = $${paramCount++} AND organization_id = $${paramCount++}
     RETURNING *`,
        values
    );

    return result.rows[0];
};

// Delete a document (only admin or uploader can delete)
export const deleteDocument = async (
    docId: string,
    orgId: string,
    userId: string
) => {
    // Check if document exists
    const docCheck = await pool.query(
        `SELECT uploaded_by, file_path FROM documents
     WHERE id = $1 AND organization_id = $2`,
        [docId, orgId]
    );

    if (docCheck.rowCount === 0) {
        throw new Error("DOCUMENT_NOT_FOUND");
    }

    const uploadedBy = docCheck.rows[0].uploaded_by;
    const filePath = docCheck.rows[0].file_path;

    // Check if user is admin or the uploader
    const adminCheck = await pool.query(
        `SELECT role FROM organization_members
     WHERE organization_id = $1 AND user_id = $2`,
        [orgId, userId]
    );

    if (adminCheck.rowCount === 0) {
        throw new Error("NOT_ORG_MEMBER");
    }

    const isAdmin = adminCheck.rows[0].role === "ADMIN";
    const isUploader = uploadedBy === userId;

    if (!isAdmin && !isUploader) {
        throw new Error("FORBIDDEN");
    }

    // Delete from database
    const result = await pool.query(
        `DELETE FROM documents
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
        [docId, orgId]
    );

    return { deletedDocument: result.rows[0], filePath };
};
