const mongoose = require('mongoose');

/**
 * Document Schema
 * Stores metadata for uploaded PDF files
 * Actual file stored on disk, embeddings in ChromaDB
 */
const DocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true, // Stored file name (UUID-based)
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // In bytes
    },
    subject: {
      type: String,
      trim: true,
      default: 'General',
    },
    extractedText: {
      type: String, // Raw text from PDF
      default: '',
    },
    totalChunks: {
      type: Number,
      default: 0,
    },
    chromaCollectionId: {
      type: String, // Reference to ChromaDB collection
      default: '',
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processingError: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Document', DocumentSchema);
