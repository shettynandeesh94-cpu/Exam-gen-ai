const mongoose = require('mongoose');

/**
 * Test Schema
 * Represents a generated exam with configuration and questions
 */
const TestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: 'General',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'medium',
    },
    // Question count configuration chosen by student
    config: {
      mcqCount: { type: Number, default: 10 },
      dsaCount: { type: Number, default: 0 },
      aptitudeCount: { type: Number, default: 0 },
      shortCount: { type: Number, default: 5 },
      longCount: { type: Number, default: 2 },
      scenarioCount: { type: Number, default: 1 },
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    status: {
      type: String,
      enum: ['generating', 'ready', 'attempted', 'evaluated', 'failed'],
      default: 'generating',
    },
    generationError: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Test', TestSchema);
