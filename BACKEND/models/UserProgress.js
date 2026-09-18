const mongoose = require('mongoose');

const TopicRefSchema = new mongoose.Schema({
  branch:    { type: String, required: true },
  subjectId: { type: String, required: true },
  topicId:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const UserProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    completedTopics:  [TopicRefSchema],
    bookmarkedTopics: [TopicRefSchema],
    recentlyViewed:   [TopicRefSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('UserProgress', UserProgressSchema);
