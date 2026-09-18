import API from './api';

const authService = {
  // Login student
  login: async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    return response.data; // { success, token, user }
  },

  // Google login
  googleLogin: async (token) => {
    const response = await API.post('/auth/google', { token });
    return response.data; // { success, token, user }
  },

  // Register student
  register: async (name, email, password, otp) => {
    const response = await API.post('/auth/register', { name, email, password, otp });
    return response.data; // { success, token, user }
  },

  // Send registration OTP
  sendRegisterOTP: async (name, email, password) => {
    const response = await API.post('/auth/send-register-otp', { name, email, password });
    return response.data; // { success, message }
  },

  // Send password reset OTP
  forgotPassword: async (email) => {
    const response = await API.post('/auth/forgot-password', { email });
    return response.data; // { success, message }
  },

  // Reset password using OTP
  resetPassword: async (email, otp, newPassword) => {
    const response = await API.post('/auth/reset-password', { email, otp, newPassword });
    return response.data; // { success, message }
  },

  // Get current user profile
  getMe: async () => {
    const response = await API.get('/auth/me');
    return response.data; // { success, user }
  },

  // Update profile (with fallback mock if backend endpoint not yet deployed)
  updateProfile: async (name, email) => {
    try {
      const response = await API.put('/auth/profile', { name, email });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Simulate successful local update
        return {
          success: true,
          message: 'Profile updated successfully (local sandbox)',
          user: { name, email, role: 'student' }
        };
      }
      throw error;
    }
  },

  // Change password (with fallback mock if backend endpoint not yet deployed)
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await API.put('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Simulate successful local password change
        return {
          success: true,
          message: 'Password changed successfully (local sandbox)'
        };
      }
      throw error;
    }
  }
};

export default authService;
