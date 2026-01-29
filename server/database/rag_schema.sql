-- =============================================
-- Complete RAG System Database Schema
-- =============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- Documents Table (if not exists)
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID,
    uploaded_by UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    file_path TEXT NOT NULL,
    extracted_text TEXT,
    status VARCHAR(20) DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PENDING', 'PROCESSING', 'READY', 'FAILED')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- =============================================
-- Document Chunks Table
-- =============================================
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    organization_id UUID NOT NULL,
    project_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(document_id, chunk_index)
);

-- Indexes for chunks
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_org_id ON document_chunks(organization_id);
CREATE INDEX IF NOT EXISTS idx_chunks_project_id ON document_chunks(project_id);

-- =============================================
-- Document Embeddings Table (pgvector)
-- =============================================
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    embedding VECTOR(384) NOT NULL,
    org_id UUID NOT NULL,
    project_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(document_id, chunk_index)
);

-- Indexes for embeddings
CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_org_id ON document_embeddings(org_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_project_id ON document_embeddings(project_id);

-- CRITICAL: Vector similarity search index (HNSW)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
ON document_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- =============================================
-- Useful Queries
-- =============================================

-- Get document processing statistics
SELECT 
    d.id,
    d.file_name,
    d.status,
    COUNT(DISTINCT dc.id) as chunk_count,
    COUNT(DISTINCT de.id) as embedding_count,
    d.created_at,
    d.updated_at
FROM documents d
LEFT JOIN document_chunks dc ON d.id = dc.document_id
LEFT JOIN document_embeddings de ON d.id = de.document_id
WHERE d.organization_id = 'YOUR_ORG_ID'
GROUP BY d.id, d.file_name, d.status, d.created_at, d.updated_at
ORDER BY d.created_at DESC;

-- Find similar chunks (example - replace $1, $2, $3 with actual values)
-- $1 = org_id (UUID)
-- $2 = query_embedding (vector)
-- $3 = limit (integer)
SELECT 
    e.document_id,
    e.chunk_index,
    c.chunk_text,
    d.file_name,
    e.embedding <=> $2::vector AS distance,
    1 - (e.embedding <=> $2::vector) / 2 AS similarity_score
FROM document_embeddings e
JOIN document_chunks c 
    ON e.document_id = c.document_id 
    AND e.chunk_index = c.chunk_index
JOIN documents d
    ON e.document_id = d.id
WHERE e.org_id = $1
ORDER BY e.embedding <=> $2::vector ASC
LIMIT $3;

-- Clean up failed documents older than 7 days
DELETE FROM documents 
WHERE status = 'FAILED' 
AND created_at < NOW() - INTERVAL '7 days';

-- Get organization document statistics
SELECT 
    organization_id,
    COUNT(*) as total_documents,
    SUM(CASE WHEN status = 'READY' THEN 1 ELSE 0 END) as ready_documents,
    SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing_documents,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_documents
FROM documents
GROUP BY organization_id;
