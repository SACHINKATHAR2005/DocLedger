/**
 * Chunks text using recursive character-based splitting with overlap
 * @param text - The input text to chunk
 * @param chunkSize - Target size of each chunk (default: 800)
 * @param overlap - Number of overlapping characters between chunks (default: 120)
 * @returns Array of text chunks in order
 */
export function chunkText(
    text: string,
    chunkSize: number = 800,
    overlap: number = 120
): string[] {
    if (!text || text.trim().length === 0) {
        return [];
    }

    if (overlap >= chunkSize) {
        throw new Error("Overlap must be smaller than chunk size");
    }

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        // Calculate end index for this chunk
        let endIndex = startIndex + chunkSize;

        // If this is not the last chunk, try to break at sentence/word boundaries
        if (endIndex < text.length) {
            // Try to find a sentence boundary (., !, ?) within last 100 chars
            const searchStart = Math.max(startIndex, endIndex - 100);
            const searchText = text.substring(searchStart, endIndex + 50);
            const sentenceMatch = searchText.match(/[.!?]\s/);

            if (sentenceMatch && sentenceMatch.index !== undefined) {
                endIndex = searchStart + sentenceMatch.index + 1;
            } else {
                // If no sentence boundary, try word boundary
                const wordMatch = text.substring(endIndex - 50, endIndex + 50).match(/\s/);
                if (wordMatch && wordMatch.index !== undefined) {
                    endIndex = endIndex - 50 + wordMatch.index;
                }
            }
        } else {
            // Last chunk - take remaining text
            endIndex = text.length;
        }

        // Extract chunk and trim whitespace
        const chunk = text.substring(startIndex, endIndex).trim();

        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        // Move start index forward, accounting for overlap
        startIndex = endIndex - overlap;

        // Prevent infinite loop
        if (startIndex <= chunks.length * (chunkSize - overlap) - chunkSize) {
            startIndex = endIndex;
        }
    }

    return chunks;
}
