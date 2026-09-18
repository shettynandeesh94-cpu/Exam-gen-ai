const mongoose = require('mongoose');
const DocumentChunk = require('../models/DocumentChunk');
const { getEmbedding, getEmbeddingsBatch } = require('./embeddingService');

/**
 * Split text into overlapping chunks
 * @param {string} text - Input document text
 * @param {number} size - Maximum characters per chunk
 * @param {number} overlap - Overlapping character count between adjacent chunks
 * @returns {string[]} - Array of text chunks
 */
const chunkText = (text, size = 800, overlap = 200) => {
  if (!text) return [];
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    let end = Math.min(start + size, text.length);
    
    // Find sentence or word boundaries to prevent ugly cut-offs
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const bestSplit = Math.max(lastSpace, lastNewline);
      
      // Only split on separator if it's within the last 30% of the chunk window
      if (bestSplit > start + (size * 0.7)) {
        end = bestSplit;
      }
    }
    
    const chunk = text.substring(start, end).trim();
    if (chunk.length > 15) {
      chunks.push(chunk);
    }
    
    if (end === text.length) {
      break; // Reached the end of the document, stop looping
    }
    
    start = end - overlap;
    // Safety check to ensure we always advance
    if (start >= end) start = end + 1;
  }
  
  return chunks;
};

/**
 * Generate vector embeddings for all chunks of a document and save them
 * @param {string} documentId - MongoDB ID of the document
 * @param {string} userId - MongoDB ID of the owner user
 * @param {string} fullText - Extracted text contents
 */
const indexDocument = async (documentId, userId, fullText) => {
  try {
    // Delete existing chunks if indexing is re-run
    await DocumentChunk.deleteMany({ document: documentId });

    const chunkTexts = chunkText(fullText);
    if (chunkTexts.length === 0) return;

    console.log(`📦 Chunked PDF into ${chunkTexts.length} segments. Indexing...`);

    // Fetch embeddings in batches of 20 to respect API rate limits and avoid payload issues
    const batchSize = 20;
    const dbChunks = [];

    for (let i = 0; i < chunkTexts.length; i += batchSize) {
      const batchTexts = chunkTexts.slice(i, i + batchSize);
      const batchEmbeddings = await getEmbeddingsBatch(batchTexts);

      batchTexts.forEach((text, index) => {
        dbChunks.push({
          document: documentId,
          user: userId,
          text,
          embedding: batchEmbeddings[index],
          chunkIndex: i + index,
        });
      });
    }

    await DocumentChunk.insertMany(dbChunks);
    console.log(`✅ Indexed ${dbChunks.length} chunks successfully for document: ${documentId}`);
  } catch (error) {
    console.error('❌ ragService.indexDocument Failed:', error);
    throw error;
  }
};

/**
 * Calculate cosine similarity score between two vector arrays
 */
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Retrieve relevant chunks matching a query. Supports MongoDB Vector Search with JS fallback.
 * @param {Object} params - Search configuration parameters
 * @param {string} params.userId - Owner user ID (for security filter)
 * @param {string} [params.documentId] - Optional document filter
 * @param {string} params.queryText - Semantic search input
 * @param {number} [params.limit=5] - Number of matches to return
 */
const searchRelevantChunks = async ({ userId, documentId, queryText, limit = 5 }) => {
  const queryEmbedding = await getEmbedding(queryText);
  
  // 1. Try MongoDB Atlas Vector Search ($vectorSearch)
  try {
    const matchFilter = { user: new mongoose.Types.ObjectId(userId) };
    if (documentId) {
      matchFilter.document = new mongoose.Types.ObjectId(documentId);
    }

    const results = await DocumentChunk.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: limit * 2, // get slightly more candidates to apply match filtering
        },
      },
      {
        $match: matchFilter,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          text: 1,
          chunkIndex: 1,
          document: 1,
          score: { $meta: 'searchScore' },
        },
      },
      {
        $populate: {
          path: 'document',
          select: 'originalName',
        },
      },
    ]);

    if (results && results.length > 0) {
      return results;
    }
  } catch (vectorSearchError) {
    // Expected to fail if index is unconfigured or DB is local MongoDB
    console.log(
      '💡 MongoDB Atlas Search Index unconfigured. Running JS cosine-similarity search fallback...'
    );
  }

  // 2. Fallback: JS in-memory cosine ranking
  const queryFilter = { user: userId };
  if (documentId) {
    queryFilter.document = documentId;
  }

  // Find candidate chunks in DB
  const candidateChunks = await DocumentChunk.find(queryFilter)
    .populate('document', 'originalName')
    .limit(400); // safety cap to prevent resource exhaustion

  const scoredChunks = candidateChunks.map((chunk) => {
    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
    return {
      _id: chunk._id,
      text: chunk.text,
      chunkIndex: chunk.chunkIndex,
      document: chunk.document,
      score,
    };
  });

  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, limit);
};

module.exports = {
  chunkText,
  indexDocument,
  searchRelevantChunks,
};
