const Notification = require('../models/Notification');

// Map of userId string -> Array of Response objects
const clients = new Map();

/**
 * Register a client Response object for real-time SSE stream
 * @param {string} userId - ID of the logged in user
 * @param {object} res - Express Response object
 */
const registerClient = (userId, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Keep-alive heartbeat to prevent timeouts
  res.write(': heartbeat\n\n');

  if (!clients.has(userId)) {
    clients.set(userId, []);
  }
  clients.get(userId).push(res);

  // Clean up when client disconnects
  res.on('close', () => {
    const userResList = clients.get(userId);
    if (userResList) {
      const index = userResList.indexOf(res);
      if (index !== -1) {
        userResList.splice(index, 1);
      }
      if (userResList.length === 0) {
        clients.delete(userId);
      }
    }
  });
};

/**
 * Persists a notification to DB and broadcasts it to all active SSE connections for the user
 * @param {string} userId - User to receive notification
 * @param {object} data - Notification content { text, type }
 */
const sendNotification = async (userId, data) => {
  try {
    // 1. Save to MongoDB
    const notification = await Notification.create({
      user: userId,
      text: data.text,
      type: data.type || 'info',
    });

    // 2. Broadcast to all active client connections for this user ID
    const userResList = clients.get(userId.toString());
    if (userResList && userResList.length > 0) {
      const payload = JSON.stringify({
        _id: notification._id,
        text: notification.text,
        type: notification.type,
        unread: notification.unread,
        createdAt: notification.createdAt,
      });

      userResList.forEach((res) => {
        res.write(`data: ${payload}\n\n`);
      });
    }

    return notification;
  } catch (error) {
    console.error('Error in sendNotification:', error);
  }
};

module.exports = {
  registerClient,
  sendNotification,
};
