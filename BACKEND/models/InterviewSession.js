const mongoose = require('mongoose');

const InterviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    domain: {
      type: String,
      required: true
    },
    mode: {
      type: String,
      enum: ['voice', 'text'],
      default: 'voice'
    },
    length: {
      type: Number,
      default: 10
    },
    startingDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    overallScore: {
      type: Number,
      default: 0
    },
    technicalScore: {
      type: Number,
      default: 0
    },
    communicationScore: {
      type: Number,
      default: 0
    },
    problemSolvingScore: {
      type: Number,
      default: 0
    },
    confidenceScore: {
      type: Number,
      default: 0
    },
    strengths: {
      type: [String],
      default: []
    },
    weakAreas: {
      type: [String],
      default: []
    },
    topicsToRevise: {
      type: [String],
      default: []
    },
    suggestedResources: {
      type: [String],
      default: []
    },
    recommendedTests: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress'
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
