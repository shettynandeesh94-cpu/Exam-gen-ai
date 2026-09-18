import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile on mount if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const data = await authService.getMe();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            handleLogout();
          }
        } catch (err) {
          console.error("Auth initialization failed:", err);
          // If token is invalid or server is down, keep the local storage user if offline, or logout
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          } else {
            handleLogout();
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  useEffect(() => {
    const handleGlobalLogout = () => {
      setToken(null);
      setUser(null);
      setError('Your session has expired. Please log in again.');
    };

    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setLoading(false);
        return { success: true };
      } else {
        setError(data.message || 'Login failed');
        setLoading(false);
        return { success: false, message: data.message };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  const googleLogin = async (googleToken) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.googleLogin(googleToken);
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setLoading(false);
        return { success: true };
      } else {
        setError(data.message || 'Google login failed');
        setLoading(false);
        return { success: false, message: data.message };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Google authentication failed';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  const register = async (name, email, password, otp) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(name, email, password, otp);
      if (data.success) {
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setToken(data.token);
          setUser(data.user);
        }
        setLoading(false);
        return { success: true, autoLoggedIn: !!data.token };
      } else {
        setError(data.message || 'Registration failed');
        setLoading(false);
        return { success: false, message: data.message };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  const sendRegisterOTP = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.sendRegisterOTP(name, email, password);
      setLoading(false);
      return { success: data.success, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  const updateProfile = async (name, email) => {
    setError(null);
    try {
      const data = await authService.updateProfile(name, email);
      if (data.success && data.user) {
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Profile update failed';
      return { success: false, message: msg };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setError(null);
    try {
      const data = await authService.changePassword(currentPassword, newPassword);
      return { success: data.success, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Password update failed';
      return { success: false, message: msg };
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.forgotPassword(email);
      setLoading(false);
      return { success: data.success, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.resetPassword(email, otp, newPassword);
      setLoading(false);
      return { success: data.success, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        googleLogin,
        register,
        sendRegisterOTP,
        logout: handleLogout,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
