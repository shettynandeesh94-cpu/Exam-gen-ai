const mongoose = require('mongoose');

const InterviewQuestionSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['technical', 'scenario', 'follow-up', 'hr'],
      default: 'technical'
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    studentAnswer: {
      type: String,
      default: ''
    },
    score: {
      type: Number,
      default: 0
    },
    feedback: {
      type: String,
      default: ''
    },
    missingPoints: {
      type: [String],
      default: []
    },
    improvedAnswer: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      required: true
    },
    bookmarked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('InterviewQuestion', InterviewQuestionSchema);
