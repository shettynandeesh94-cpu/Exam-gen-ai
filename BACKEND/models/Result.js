const mongoose = require('mongoose');

/**
 * Result Schema
 * Stores a student's exam attempt and AI evaluation
 * Each answer is stored with marks and AI feedback
 */
const AnswerDetailSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  questionType: { type: String, enum: ['mcq', 'short', 'long', 'scenario', 'dsa', 'aptitude'] },
  questionText: { type: String },
  studentAnswer: { type: String, default: '' },
  correctAnswer: { type: String, default: '' },
  marksObtained: { type: Number, default: 0 },
  maxMarks: { type: Number, default: 1 },
  isCorrect: { type: Boolean, default: false },
  topic: { type: String, default: '' },
  // AI feedback fields (filled after evaluation)
  aiFeedback: {
    correctConcepts: [{ type: String }],
    missingConcepts: [{ type: String }],
    suggestions: { type: String, default: '' },
    detailedFeedback: { type: String, default: '' },
  },
  subAnswers: [
    {
      questionId: { type: String },
      questionType: { type: String },
      questionText: { type: String },
      studentAnswer: { type: String, default: '' },
      correctAnswer: { type: String, default: '' },
      marksObtained: { type: Number, default: 0 },
      maxMarks: { type: Number, default: 1 },
      isCorrect: { type: Boolean, default: false },
      explanation: { type: String, default: '' }
    }
  ]
}, { _id: false });

const ResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    answers: [AnswerDetailSchema],

    // Score summary
    totalMarksObtained: { type: Number, default: 0 },
    totalMaxMarks: { type: Number, default: 0 },
    percentageScore: { type: Number, default: 0 },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B', 'C', 'D', 'F', 'N/A'],
      default: 'N/A',
    },

    // Weak topic analysis (generated after evaluation)
    weakTopics: [{ type: String }],
    strongTopics: [{ type: String }],
    topicWisePerformance: [
      {
        topic: { type: String },
        correct: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
    ],

    // Time tracking
    startedAt: { type: Date },
    submittedAt: { type: Date },
    timeTakenMinutes: { type: Number, default: 0 },

    evaluationStatus: {
      type: String,
      enum: ['pending', 'evaluating', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Result', ResultSchema);
