import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login, googleLogin, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  
  const navigate = useNavigate();

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    const result = await googleLogin(response.credential);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id.apps.googleusercontent.com",
          callback: handleGoogleSuccess,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: document.documentElement.classList.contains('light') ? 'outline' : 'filled_blue',
            size: 'large',
            width: '100%',
            shape: 'pill',
          }
        );
      }
    };

    initializeGoogle();

    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
      script.addEventListener('load', initializeGoogle);
    }
    return () => {
      if (script) {
        script.removeEventListener('load', initializeGoogle);
      }
    };
  }, []);

  const handleValidation = () => {
    if (!email || !password) {
      setLocalError('All fields are required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return false;
    }
    setLocalError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  const activeError = localError || authError;

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold text-brand-textPrimary tracking-tight">Welcome Back</h2>
        <p className="text-xs text-brand-textSecondary mt-1">Sign in to your ExamGen AI student portal</p>
      </div>

      {activeError && (
        <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
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

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
              Password
            </label>
            <Link to="/forgot-password" className="text-[11px] font-medium text-brand-accent hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textSecondary/70">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
              placeholder="••••••••"
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

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-glow text-white text-sm font-semibold rounded-xl hover:brightness-110 active:scale-95 transition-all select-none cursor-pointer"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="relative flex items-center justify-center my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-brand-border/60"></div>
        </div>
        <span className="relative px-3 text-xs uppercase text-brand-textSecondary bg-brand-cardBg">Or continue with</span>
      </div>

      <div className="flex justify-center w-full">
        <div id="google-signin-button" className="w-full min-h-[40px] flex justify-center"></div>
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-brand-textSecondary">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-accent hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
