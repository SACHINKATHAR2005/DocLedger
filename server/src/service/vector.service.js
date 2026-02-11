/**
 * Vector Service
 * Database operations for pgvector embeddings
 */
import { pool } from '../config/db.js';
/**
 * Insert document embeddings into the database
 */
export async function insertDocumentEmbeddings(params) {
    const { documentId, orgId, embeddings } = params;
    if (embeddings.length === 0) {
        throw new Error('Cannot insert empty embeddings array');
    }
    const expectedDim = 384;
    if (embeddings[0]?.length !== expectedDim) {
        throw new Error(`Invalid embedding dimension: expected ${expectedDim}, got ${embeddings[0]?.length}`);
    }
    let client = null;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        console.log(`[VectorService] Inserting ${embeddings.length} embeddings for document ${documentId}`);
        for (let i = 0; i < embeddings.length; i++) {
            const embedding = embeddings[i];
            if (!embedding) {
                throw new Error(`Embedding at index ${i} is undefined`);
            }
            const vectorString = `[${embedding.join(',')}]`;
            await client.query(`INSERT INTO document_embeddings 
                (document_id, chunk_index, embedding, org_id, created_at)
                VALUES ($1, $2, $3::vector, $4, NOW())
                ON CONFLICT (document_id, chunk_index) 
                DO UPDATE SET 
                    embedding = EXCLUDED.embedding`, [documentId, i, vectorString, orgId]);
        }
        await client.query('COMMIT');
        console.log(`[VectorService] Successfully inserted ${embeddings.length} embeddings`);
    }
    catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('[VectorService] Error inserting embeddings:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to insert embeddings: ${error.message}`);
        }
        throw new Error('Failed to insert embeddings: Unknown error');
    }
    finally {
        if (client) {
            client.release();
        }
    }
}
/**
 * Search for similar document chunks using cosine similarity
 */
export async function searchSimilarChunks(params) {
    const { orgId, projectId, queryEmbedding, limit = 5, documentIds } = params;
    const expectedDim = 384;
    if (queryEmbedding.length !== expectedDim) {
        throw new Error(`Invalid query embedding dimension: expected ${expectedDim}, got ${queryEmbedding.length}`);
    }
    try {
        const vectorString = `[${queryEmbedding.join(',')}]`;
        console.log(`[VectorService] Searching for top ${limit} similar chunks in org=${orgId}`, documentIds ? `filtered to ${documentIds.length} documents` : 'all documents');
        let query = `
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
            WHERE e.org_id = $1`;
        const queryParams = [orgId, vectorString];
        let paramIndex = 3;
        // Add document IDs filter if provided
        if (documentIds && documentIds.length > 0) {
            query += ` AND e.document_id = ANY($${paramIndex}::uuid[])`;
            queryParams.push(documentIds);
            paramIndex++;
        }
        if (projectId) {
            query += ` AND e.project_id = $${paramIndex}`;
            queryParams.push(projectId);
            paramIndex++;
        }
        query += ` ORDER BY e.embedding <=> $2::vector ASC LIMIT $${paramIndex}`;
        queryParams.push(limit);
        const result = await pool.query(query, queryParams);
        console.log(`[VectorService] Found ${result.rows.length} similar chunks`);
        return result.rows.map((row) => ({
            document_id: row.document_id,
            chunk_index: row.chunk_index,
            chunk_text: row.chunk_text,
            file_name: row.file_name,
            distance: parseFloat(row.distance),
            similarity_score: parseFloat(row.similarity_score),
        }));
    }
    catch (error) {
        console.error('[VectorService] Error searching similar chunks:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to search similar chunks: ${error.message}`);
        }
        throw new Error('Failed to search similar chunks: Unknown error');
    }
}
/**
 * Delete all embeddings for a specific document
 */
export async function deleteDocumentEmbeddings(documentId) {
    try {
        const result = await pool.query(`DELETE FROM document_embeddings WHERE document_id = $1`, [documentId]);
        console.log(`[VectorService] Deleted ${result.rowCount} embeddings for document ${documentId}`);
        return result.rowCount || 0;
    }
    catch (error) {
        console.error('[VectorService] Error deleting embeddings:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to delete embeddings: ${error.message}`);
        }
        throw new Error('Failed to delete embeddings: Unknown error');
    }
}
//# sourceMappingURL=vector.service.js.map