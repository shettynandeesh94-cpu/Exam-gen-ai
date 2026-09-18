import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Bell, Menu, User, LogOut, ChevronDown, BookOpen, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState([]);
  const [bellAnimate, setBellAnimate] = useState(false);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
    window.dispatchEvent(new Event('themechange'));
  }, [theme]);

  useEffect(() => {
    if (!user) return;

    // Fetch initial list of notifications
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    fetchNotifications();

    // Establish real-time SSE stream
    const token = localStorage.getItem('token');
    if (!token) return;

    const baseURL = import.meta.env.VITE_API_URL || '';
    const sseUrl = `${baseURL}/api/notifications/stream?token=${token}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const newNotif = JSON.parse(event.data);
        setNotifications((prev) => [newNotif, ...prev]);

        // Trigger micro-animation on bell icon
        setBellAnimate(true);
        setTimeout(() => setBellAnimate(false), 800);
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE stream disconnected. Browser will retry connection automatically.', err);
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, unread: false } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-brand-border/30 h-16 flex items-center justify-between px-6">
      {/* Brand Logo & Mobile Menu Toggle */}
      <div className="flex items-center space-x-2.5">
        <button 
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 md:hidden flex items-center justify-center cursor-pointer"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-opacity select-none"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-glow">
            <span className="text-lg font-bold text-white tracking-wider font-sans">Æ</span>
          </div>
          <span className="text-xl font-bold text-brand-textPrimary tracking-tight font-sans">
            ExamGen <span className="text-brand-accent">AI</span>
          </span>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4 relative">
        {/* Theme Switch Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all flex items-center justify-center cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-brand-warning" /> : <Moon className="w-5 h-5 text-brand-primary" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowDropdown(false); }}
            className={`p-2 rounded-lg text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all relative ${bellAnimate ? 'animate-bounce' : ''}`}
          >
            <Bell className="w-5 h-5" />
            {notifications.some((n) => n.unread) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-accent animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-panel border border-brand-border/60 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
              <div className="px-4 py-2 border-b border-brand-border/30 flex justify-between items-center bg-brand-darkBg/60">
                <span className="text-xs font-semibold text-brand-textPrimary">System Alerts</span>
                {notifications.some((n) => n.unread) && (
                  <span
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-brand-accent cursor-pointer hover:underline"
                  >
                    Mark all read
                  </span>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-brand-textSecondary">
                    No new alerts
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleMarkRead(notif._id)}
                      className={`p-3 border-b border-brand-border/20 text-xs transition-colors hover:bg-brand-darkBg/40 cursor-pointer ${
                        notif.unread ? 'bg-brand-primary/5' : ''
                      }`}
                    >
                      <p
                        className={`text-brand-textPrimary font-medium mb-1 ${
                          notif.unread ? 'text-brand-textPrimary' : 'opacity-80'
                        }`}
                      >
                        {notif.text}
                      </p>
                      <span className="text-[10px] text-brand-textSecondary">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Trigger */}
        <div className="relative">
          <button
            onClick={() => { setShowDropdown(!showDropdown); setShowNotifications(false); }}
            className="flex items-center space-x-2 p-1.5 rounded-xl border border-brand-border/30 hover:border-brand-primary/40 bg-brand-darkBg/20 hover:bg-brand-darkBg/40 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary/30 to-brand-secondary/30 border border-brand-primary/30 flex items-center justify-center text-brand-primary font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:inline text-sm font-medium text-brand-textPrimary max-w-[100px] truncate">
              {user?.name || 'User'}
            </span>
            <ChevronDown className="w-4 h-4 text-brand-textSecondary hidden sm:inline" />
          </button>

          {/* Profile Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 glass-panel border border-brand-border/60 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-brand-border/30 bg-brand-darkBg/60">
                <p className="text-sm font-semibold text-brand-textPrimary leading-tight truncate">{user?.name}</p>
                <p className="text-xs text-brand-textSecondary truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => { setShowDropdown(false); navigate('/profile'); }}
                className="w-full text-left px-4 py-2 text-xs text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-primary/15 flex items-center space-x-2 transition-all"
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center space-x-2 border-t border-brand-border/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
