import API from './api';

/**
 * Fetch all notifications for the authenticated user
 * @returns {Promise<Array>} List of notifications
 */
export const getNotifications = async () => {
  try {
    const response = await API.get('/notifications');
    return response.data.notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark a single notification as read
 * @param {string} id - Notification ID
 * @returns {Promise<object>} Updated notification
 */
export const markAsRead = async (id) => {
  try {
    const response = await API.put(`/notifications/${id}/read`);
    return response.data.notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for the user
 * @returns {Promise<boolean>} Success status
 */
export const markAllAsRead = async () => {
  try {
    const response = await API.put('/notifications/read-all');
    return response.data.success;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};
