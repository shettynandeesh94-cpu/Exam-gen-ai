const mongoose = require('mongoose');

/**
 * DocumentChunk Schema
 * Stores chunked text and vector embeddings for RAG retrieval
 */
const DocumentChunkSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Chunk text is required'],
    },
    embedding: {
      type: [Number],
      required: [true, 'Embedding vector is required'],
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DocumentChunk', DocumentChunkSchema);
