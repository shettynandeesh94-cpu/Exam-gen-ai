const mongoose = require('mongoose');

/**
 * OTP Schema
 * Stores temporary verification codes for registration and password resets
 * Automatically deleted after 10 minutes (600 seconds) via TTL index
 */
const OtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP code is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // Automatically deletes document 10 minutes after createdAt
    },
  },
  {
    versionKey: false,
  }
);

// Create compound index for querying quickly by email and OTP code
OtpSchema.index({ email: 1, otp: 1 });

module.exports = mongoose.model('Otp', OtpSchema);
