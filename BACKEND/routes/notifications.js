const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { registerClient } = require('../services/notificationService');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/notifications/stream
 * @desc    Establish real-time Server-Sent Events (SSE) connection
 * @access  Private (auth via query token)
 */
router.get('/stream', async (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    // Verify query JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    try {
      user = await User.findById(decoded.id);
    } catch (dbError) {
      console.error('Database connection/query error in notifications stream:', dbError);
      return res.status(500).json({ success: false, message: 'Database connection/query error.' });
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid or inactive user token.' });
    }

    // Register SSE client connection
    registerClient(user._id.toString(), res);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
});

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications history
 * @access  Private
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { unread: false },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all unread notifications of the user as read
 * @access  Private
 */
router.put('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, unread: true },
      { unread: false }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
