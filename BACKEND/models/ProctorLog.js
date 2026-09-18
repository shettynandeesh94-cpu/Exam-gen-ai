const mongoose = require('mongoose');

/**
 * ProctorLog Schema
 * Records all proctoring violations during an exam attempt
 * Used to compute suspicion score after submission
 */
const ViolationEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'tab_switch',
      'fullscreen_exit',
      'face_missing',
      'multiple_faces',
      'phone_detected',
      'copy_paste',
      'window_blur',
    ],
    required: true,
  },
  timestamp:   { type: Date, default: Date.now },
  description: { type: String, default: '' },
}, { _id: false });

const ProctorLogSchema = new mongoose.Schema(
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
    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Result',
    },

    violations: [ViolationEventSchema],

    // Aggregated counts for quick access
    summary: {
      tabSwitchCount:      { type: Number, default: 0 },
      fullscreenExitCount: { type: Number, default: 0 },
      faceMissingCount:    { type: Number, default: 0 },
      multipleFaceCount:   { type: Number, default: 0 },
      phoneDetectedCount:  { type: Number, default: 0 },
      copyPasteCount:      { type: Number, default: 0 },
    },

    // Computed suspicion level
    suspicionScore: {
      type: Number,
      default: 0,  // 0-100
    },
    suspicionLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },

    webcamEnabled: { type: Boolean, default: false },
    examDuration:  { type: Number, default: 0 }, // minutes
  },
  {
    timestamps: true,
  }
);

/**
 * Instance method: Calculate suspicion score based on violations
 * Call this before saving after exam submission
 */
ProctorLogSchema.methods.calculateSuspicionScore = function () {
  const s = this.summary;
  let score = 0;

  score += s.tabSwitchCount      * 10;
  score += s.fullscreenExitCount * 8;
  score += s.faceMissingCount    * 5;
  score += s.multipleFaceCount   * 15;
  score += s.phoneDetectedCount  * 20;
  score += s.copyPasteCount      * 3;

  this.suspicionScore = Math.min(score, 100);

  if (this.suspicionScore >= 60)      this.suspicionLevel = 'high';
  else if (this.suspicionScore >= 25) this.suspicionLevel = 'medium';
  else                                this.suspicionLevel = 'low';
};

module.exports = mongoose.model('ProctorLog', ProctorLogSchema);
