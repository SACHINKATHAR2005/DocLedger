-- =============================================
-- Quick Setup Script for pgAdmin
-- Copy and paste this entire script into pgAdmin Query Tool
-- =============================================

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    organization_id UUID NOT NULL,
    project_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_org_id ON document_chunks(organization_id);

-- Step 3: Create document_embeddings table with pgvector
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding VECTOR(384) NOT NULL,
    org_id UUID NOT NULL,
    project_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_org_id ON document_embeddings(org_id);

-- Step 4: CRITICAL - Create HNSW vector index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
ON document_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Step 5: Verify setup
SELECT 'Setup complete! Tables created:' as message;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('document_chunks', 'document_embeddings');

SELECT 'pgvector extension enabled:' as message;
SELECT * FROM pg_extension WHERE extname = 'vector';
