const mongoose = require('mongoose');

const LearningNoteSchema = new mongoose.Schema(
  {
    branch: {
      type: String,
      required: true,
      enum: ['CSE', 'ECE']
    },
    subjectId: {
      type: String,
      required: true
    },
    topicId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    examPoints: {
      type: String,
      default: ''
    },
    interviewQuestions: {
      type: String,
      default: ''
    },
    commonMistakes: {
      type: String,
      default: ''
    },
    practiceMCQs: [
      {
        question: { type: String, required: true },
        options: {
          A: { type: String, required: true },
          B: { type: String, required: true },
          C: { type: String, required: true },
          D: { type: String, required: true }
        },
        correctAnswer: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] },
        explanation: { type: String, default: '' }
      }
    ],
    readingTime: {
      type: Number,
      default: 5
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate entries for the same topic
LearningNoteSchema.index({ branch: 1, subjectId: 1, topicId: 1 }, { unique: true });

module.exports = mongoose.model('LearningNote', LearningNoteSchema);
