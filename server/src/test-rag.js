/**
 * Test Script for RAG System
 * Run with: npx tsx src/test-rag.ts
 */
import 'dotenv/config';
import { embedText } from './service/embedding.service.js';
import { chunkText } from './utils/textChunking.js';
async function testRagSystem() {
    console.log('🧪 Testing RAG System Components...\n');
    try {
        // Test 1: Text Chunking
        console.log('✅ Test 1: Text Chunking');
        const sampleText = `
This is a sample document for testing the RAG system.
It contains multiple sentences and paragraphs that will be chunked.
The chunking algorithm should split this text into reasonable segments.
Each chunk should have some overlap with the previous chunk.
This helps maintain context when processing documents.

This is the second paragraph.
It continues the document with more information.
The system will process this and create embeddings.
These embeddings will be stored in the pgvector database.
Users can then query the system and get relevant answers.
`.repeat(5); // Make it longer
        const chunks = chunkText(sampleText, 200, 50);
        console.log(`   Generated ${chunks.length} chunks`);
        if (chunks.length > 0 && chunks[0]) {
            console.log(`   First chunk: "${chunks[0].substring(0, 100)}..."\n`);
        }
        // Test 2: Embedding Generation
        console.log('✅ Test 2: Embedding Generation');
        const testQuery = "What is the RAG system about?";
        const embedding = await embedText(testQuery);
        console.log(`   Generated embedding with ${embedding.length} dimensions`);
        console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]\n`);
        // Test 3: Batch Embeddings
        console.log('✅ Test 3: Batch Embeddings');
        const { embedTexts } = await import('./service/embedding.service.js');
        const testChunks = chunks.slice(0, 3);
        const embeddings = await embedTexts(testChunks);
        console.log(`   Generated ${embeddings.length} embeddings for ${testChunks.length} chunks`);
        if (embeddings.length > 0) {
            console.log(`   Each embedding has ${embeddings[0]?.length || 0} dimensions\n`);
        }
        console.log('🎉 All tests passed!\n');
        console.log('Next steps:');
        console.log('1. Make sure your .env file has HF_TOKEN and GROQ_API_KEY');
        console.log('2. Run the SQL schema: psql -U postgres -d taskledger -f database/rag_schema.sql');
        console.log('3. Start the server: npm run dev');
        console.log('4. Upload a document via API');
        console.log('5. Chat with your documents!\n');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        console.error('\nMake sure:');
        console.error('- HF_TOKEN is set in .env');
        console.error('- You have internet connection');
        console.error('- HuggingFace API is accessible');
        process.exit(1);
    }
}
// Run tests
testRagSystem();
//# sourceMappingURL=test-rag.js.map