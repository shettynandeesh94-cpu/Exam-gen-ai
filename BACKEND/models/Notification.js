const mongoose = require('mongoose');

/**
 * Notification Schema
 * Stores alerts/messages for individual users (e.g., test graded, document processed)
 */
const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Notification text is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    unread: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

module.exports = mongoose.model('Notification', NotificationSchema);
