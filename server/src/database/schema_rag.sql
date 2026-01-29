-- =============================================
-- Database Schema for RAG Document Processing
-- =============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- Documents Table
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    project_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    extracted_text TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'READY', 'FAILED')),
    error_message TEXT,
    uploaded_by UUID,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for filtering
    INDEX idx_documents_org_id (org_id),
    INDEX idx_documents_project_id (project_id),
    INDEX idx_documents_status (status)
);

-- =============================================
-- Document Chunks Table
-- =============================================
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    org_id UUID NOT NULL,
    project_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure unique chunk index per document
    UNIQUE(document_id, chunk_index),
    
    -- Indexes
    INDEX idx_chunks_document_id (document_id),
    INDEX idx_chunks_org_id (org_id),
    INDEX idx_chunks_project_id (project_id)
);

-- =============================================
-- Document Embeddings Table (using pgvector)
-- =============================================
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    embedding vector(384) NOT NULL, -- 384 dimensions for all-MiniLM-L6-v2
    org_id UUID NOT NULL,
    project_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure unique embedding per chunk
    UNIQUE(chunk_id),
    
    -- Indexes for filtering
    INDEX idx_embeddings_document_id (document_id),
    INDEX idx_embeddings_org_id (org_id),
    INDEX idx_embeddings_project_id (project_id),
    
    -- HNSW index for fast vector similarity search
    INDEX idx_embeddings_vector ON document_embeddings 
    USING hnsw (embedding vector_cosine_ops)
);

-- =============================================
-- Example: Insert Document
-- =============================================
INSERT INTO documents (
    id,
    org_id,
    project_id,
    file_name,
    file_path,
    file_type,
    extracted_text,
    status,
    uploaded_by
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'project-requirements.pdf',
    '/uploads/550e8400/project-requirements.pdf',
    'application/pdf',
    'This is the extracted text from the PDF document...',
    'PENDING',
    '770e8400-e29b-41d4-a716-446655440000'
);

-- =============================================
-- Example: Insert Chunk
-- =============================================
INSERT INTO document_chunks (
    document_id,
    chunk_index,
    chunk_text,
    org_id,
    project_id
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    0,
    'This is the first chunk of text from the document. It contains relevant information about the project requirements and specifications.',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000'
);

-- =============================================
-- Example: Insert Embedding (with pgvector)
-- =============================================
INSERT INTO document_embeddings (
    document_id,
    chunk_id,
    chunk_index,
    embedding,
    org_id,
    project_id
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    '223e4567-e89b-12d3-a456-426614174000',
    0,
    '[0.123, -0.456, 0.789, ..., 0.321]'::vector, -- 384-dimensional vector
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000'
);

-- =============================================
-- Example: Similarity Search Query
-- =============================================
-- Find top 5 most similar chunks for a query embedding
-- (using cosine similarity)
SELECT 
    de.id,
    de.document_id,
    dc.chunk_text,
    d.file_name,
    1 - (de.embedding <=> $1::vector) AS similarity
FROM document_embeddings de
JOIN document_chunks dc ON de.chunk_id = dc.id
JOIN documents d ON de.document_id = d.id
WHERE 
    de.org_id = $2 
    AND de.project_id = $3
ORDER BY de.embedding <=> $1::vector
LIMIT 5;

-- Parameters:
-- $1: Query embedding vector (384 dimensions)
-- $2: org_id for multi-tenancy
-- $3: project_id for filtering

-- =============================================
-- Example: Get Document Processing Status
-- =============================================
SELECT 
    d.id,
    d.file_name,
    d.status,
    COUNT(DISTINCT dc.id) as chunk_count,
    COUNT(DISTINCT de.id) as embedding_count,
    d.processed_at
FROM documents d
LEFT JOIN document_chunks dc ON d.id = dc.document_id
LEFT JOIN document_embeddings de ON d.id = de.document_id
WHERE d.id = $1
GROUP BY d.id, d.file_name, d.status, d.processed_at;

-- =============================================
-- Example: Cleanup Failed Documents
-- =============================================
DELETE FROM documents 
WHERE status = 'FAILED' 
AND created_at < NOW() - INTERVAL '7 days';
