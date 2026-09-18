import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import { User, Mail, Shield, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword } = useAuth();

  // Profile Update Form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Password Update Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState(null);
  const [passError, setPassError] = useState(null);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      setProfileError('Name and email cannot be empty.');
      return;
    }

    setProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    const result = await updateProfile(name, email);
    setProfileLoading(false);

    if (result.success) {
      setProfileSuccess(result.message || 'Profile updated successfully!');
    } else {
      setProfileError(result.message || 'Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassError('All password fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassLoading(true);
    setPassSuccess(null);
    setPassError(null);

    const result = await changePassword(oldPassword, newPassword);
    setPassLoading(false);

    if (result.success) {
      setPassSuccess(result.message || 'Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPassError(result.message || 'Failed to change password.');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-brand-textPrimary max-w-5xl mx-auto">
      <PageHeader 
        title="Student Profile" 
        subtitle="Manage your personal credentials and account details." 
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="py-2 px-4 rounded-xl border border-brand-border/40 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all cursor-pointer animate-fadeIn"
        >
          Return to Dashboard
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* User Card */}
        <div className="lg:col-span-1 glass-panel border border-brand-border/40 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
          
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-primary/20 to-brand-secondary/20 border border-brand-primary/30 flex items-center justify-center text-brand-primary font-bold text-3xl mx-auto shadow-glow">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <h3 className="text-lg font-bold text-brand-textPrimary leading-tight">{user?.name}</h3>
            <p className="text-xs text-brand-textSecondary mt-1">{user?.email}</p>
          </div>

          <div className="pt-2 border-t border-brand-border/10 flex items-center justify-center space-x-2 text-xs text-brand-textSecondary font-semibold">
            <Shield className="w-4 h-4 text-brand-accent" />
            <span>Role: Student</span>
          </div>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* General Profile Settings */}
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b border-brand-border/10 pb-3">
              <User className="w-5 h-5 text-brand-primary" />
              <h2 className="text-sm font-bold tracking-wider text-brand-textSecondary uppercase">Profile Information</h2>
            </div>

            {profileError && (
              <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="flex items-center space-x-2 text-xs text-brand-success bg-brand-success/10 border border-brand-success/20 px-4 py-2.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-textSecondary/50">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-textPrimary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-textSecondary/50">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-textPrimary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="py-2.5 px-5 bg-brand-primary hover:shadow-glow text-white text-xs font-semibold rounded-xl hover:brightness-110 active:scale-95 transition-all select-none cursor-pointer"
                >
                  {profileLoading ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password settings */}
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b border-brand-border/10 pb-3">
              <Lock className="w-5 h-5 text-brand-secondary" />
              <h2 className="text-sm font-bold tracking-wider text-brand-textSecondary uppercase">Update Credentials</h2>
            </div>

            {passError && (
              <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="flex items-center space-x-2 text-xs text-brand-success bg-brand-success/10 border border-brand-success/20 px-4 py-2.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5 max-w-sm">
                <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs text-brand-textPrimary focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs text-brand-textPrimary focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs text-brand-textPrimary focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="py-2.5 px-5 bg-brand-secondary hover:shadow-glow text-white text-xs font-semibold rounded-xl hover:brightness-110 active:scale-95 transition-all select-none cursor-pointer"
                >
                  {passLoading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
