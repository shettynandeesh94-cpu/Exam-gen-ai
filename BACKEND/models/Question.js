const mongoose = require('mongoose');

/**
 * Question Schema
 * Stores AI-generated questions for a test
 * Supports MCQ, Short Answer, Long Answer, Scenario types
 */
const QuestionSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    type: {
      type: String,
      enum: ['mcq', 'short', 'long', 'scenario', 'dsa', 'aptitude'],
      required: true,
    },
    section: {
      type: String,
      enum: ['mcq', 'dsa', 'aptitude'],
      default: 'mcq',
    },
    questionTitle: {
      type: String,
      default: '',
    },
    constraints: {
      type: String,
      default: '',
    },
    inputFormat: {
      type: String,
      default: '',
    },
    outputFormat: {
      type: String,
      default: '',
    },
    sampleInput: {
      type: String,
      default: '',
    },
    sampleOutput: {
      type: String,
      default: '',
    },
    javaSignature: {
      type: String,
      default: '',
    },
    expectedTimeComplexity: {
      type: String,
      default: '',
    },
    expectedSpaceComplexity: {
      type: String,
      default: '',
    },
    starterCode: {
      type: String,
      default: '',
    },
    starterTemplates: {
      javascript: { type: String, default: '' },
      python: { type: String, default: '' },
      java: { type: String, default: '' },
      cpp: { type: String, default: '' },
      c: { type: String, default: '' }
    },
    testCases: {
      type: String, // Stringified JSON array of test cases
      default: '',
    },
    hiddenTestCases: {
      type: String, // Stringified JSON array of hidden test cases
      default: '',
    },
    questionText: {
      type: String,
      required: true,
    },
    // MCQ specific fields
    options: {
      A: { type: String, default: '' },
      B: { type: String, default: '' },
      C: { type: String, default: '' },
      D: { type: String, default: '' },
    },
    correctAnswer: {
      type: String, // 'A', 'B', 'C', 'D' for MCQ, or full answer for others
      default: '',
    },
    // Marks
    maxMarks: {
      type: Number,
      default: 1,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    topic: {
      type: String, // Auto-detected topic for weak topic analysis
      default: '',
    },
    // AI-generated model answer for evaluation reference
    modelAnswer: {
      type: String,
      default: '',
    },
    // Scenario specific nested subquestions
    subQuestions: [
      {
        type: {
          type: String,
          enum: ['mcq', 'short', 'long'],
          required: true,
        },
        questionText: {
          type: String,
          required: true,
        },
        options: {
          A: { type: String, default: '' },
          B: { type: String, default: '' },
          C: { type: String, default: '' },
          D: { type: String, default: '' },
        },
        correctAnswer: {
          type: String,
          default: '',
        },
        maxMarks: {
          type: Number,
          default: 1,
        },
        modelAnswer: {
          type: String,
          default: '',
        },
        explanation: {
          type: String,
          default: '',
        },
      }
    ],
    orderIndex: {
      type: Number, // Position in the test
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Question', QuestionSchema);
