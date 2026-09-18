import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, AlertCircle, CheckCircle2, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword, resetPassword, error: authError } = useAuth();
  const [step, setStep] = useState(1); // 1 = request OTP, 2 = reset password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setLocalError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    setLocalError(null);
    setLoading(true);
    setSuccessMsg(null);

    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      setSuccessMsg('OTP sent successfully to your email.');
      setTimeout(() => {
        setSuccessMsg(null);
        setStep(2);
      }, 1500);
    } else {
      setLocalError(result.message || 'Failed to send OTP.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      setLocalError('All fields are required.');
      return;
    }
    if (otp.length !== 6 || isNaN(otp)) {
      setLocalError('OTP must be a 6-digit number.');
      return;
    }
    if (newPassword.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLocalError(null);
    setLoading(true);
    setSuccessMsg(null);

    const result = await resetPassword(email, otp, newPassword);
    setLoading(false);

    if (result.success) {
      setSuccessMsg('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setLocalError(result.message || 'Failed to reset password.');
    }
  };

  const activeError = localError || authError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold text-brand-textPrimary tracking-tight">
          {step === 1 ? 'Forgot Password?' : 'Reset Password'}
        </h2>
        <p className="text-xs text-brand-textSecondary mt-1">
          {step === 1 
            ? 'No worries, enter your email and we will send you an OTP.' 
            : 'Enter the 6-digit OTP code and choose your new password.'
          }
        </p>
      </div>

      {/* Alerts */}
      {activeError && (
        <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center space-x-2 text-xs text-brand-success bg-brand-success/10 border border-brand-success/20 px-4 py-3 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Step 1 Form: Request OTP */}
      {step === 1 && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textSecondary/70">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
                placeholder="name@university.edu"
                className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl pl-10 pr-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-glow text-white text-sm font-semibold rounded-xl hover:brightness-110 active:scale-95 transition-all select-none cursor-pointer"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      )}

      {/* Step 2 Form: Reset Password */}
      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* OTP Code */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
              OTP Verification Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textSecondary/70">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setLocalError(null); }}
                placeholder="123456"
                className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl pl-10 pr-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40 font-mono tracking-widest text-center"
              />
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textSecondary/70">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setLocalError(null); }}
                placeholder="••••••"
                className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl pl-10 pr-10 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-textSecondary/70 hover:text-brand-textPrimary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textSecondary/70">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(null); }}
                placeholder="••••••"
                className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl pl-10 pr-10 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-glow text-white text-sm font-semibold rounded-xl hover:brightness-110 active:scale-95 transition-all select-none cursor-pointer"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); setLocalError(null); }}
              className="inline-flex items-center space-x-1 text-xs text-brand-textSecondary hover:text-brand-textPrimary transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to email entry</span>
            </button>
          </div>
        </form>
      )}

      {/* Back to Login Footer */}
      <div className="text-center pt-2 border-t border-brand-border/20">
        <Link to="/login" className="inline-flex items-center space-x-1.5 text-xs text-brand-textSecondary hover:text-brand-accent transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
