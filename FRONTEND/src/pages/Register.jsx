import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Lock, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

const Register = () => {
  const { register, sendRegisterOTP, googleLogin, error: authError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);

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
          document.getElementById('google-signup-button'),
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

  // Timer effect for OTP resend cooldown
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '', width: 'w-0' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    let label = 'Weak';
    let color = 'bg-red-500';
    let width = 'w-1/5';
    if (score === 2) {
      label = 'Weak';
      color = 'bg-red-400';
      width = 'w-2/5';
    } else if (score === 3) {
      label = 'Fair';
      color = 'bg-amber-500';
      width = 'w-3/5';
    } else if (score === 4) {
      label = 'Good';
      color = 'bg-emerald-400';
      width = 'w-4/5';
    } else if (score === 5) {
      label = 'Strong';
      color = 'bg-brand-success';
      width = 'w-full';
    }
    return { score, label, color, width };
  };

  const handleValidation = () => {
    if (!name || !email || !password || !confirmPassword) {
      setLocalError('All fields are required.');
      return false;
    }
    if (name.length < 2) {
      setLocalError('Name must be at least 2 characters.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setLocalError('Password must contain at least one uppercase letter.');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setLocalError('Password must contain at least one lowercase letter.');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setLocalError('Password must contain at least one number.');
      return false;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setLocalError('Password must contain at least one special character.');
      return false;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return false;
    }
    setLocalError(null);
    return true;
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setLoading(true);
    setLocalError(null);
    setSuccessMsg(null);

    const result = await sendRegisterOTP(name, email, password);
    setLoading(false);

    if (result.success) {
      setOtpSent(true);
      setTimer(60);
      setSuccessMsg('Verification code sent to your email.');
    } else {
      setLocalError(result.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp) {
      setLocalError('Please enter the 6-digit OTP code.');
      return;
    }
    if (otp.length !== 6) {
      setLocalError('OTP must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    setLocalError(null);
    setSuccessMsg(null);

    const result = await register(name, email, password, otp);
    setLoading(false);

    if (result.success) {
      setSuccessMsg('Registration successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      setLocalError(result.message || 'Verification failed.');
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    setLoading(true);
    setLocalError(null);
    setSuccessMsg(null);

    const result = await sendRegisterOTP(name, email, password);
    setLoading(false);

    if (result.success) {
      setTimer(60);
      setSuccessMsg('A new verification code has been sent.');
    } else {
      setLocalError(result.message || 'Failed to send OTP.');
    }
  };

  const handleGoBack = () => {
    setOtpSent(false);
    setOtp('');
    setLocalError(null);
    setSuccessMsg(null);
  };

  const activeError = localError || authError;

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold text-brand-textPrimary tracking-tight">Create Account</h2>
        <p className="text-xs text-brand-textSecondary mt-1">Get started with ExamGen AI Pro</p>
      </div>

      {activeError && (
        <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center space-x-2 text-xs text-brand-success bg-brand-success/10 border border-brand-success/20 px-4 py-3 rounded-xl animate-pulse">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {!otpSent ? (
        <>
          <form onSubmit={handleRequestOTP} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textSecondary/70">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setLocalError(null); }}
                  placeholder="Alex Mercer"
                  className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl pl-10 pr-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40"
                />
              </div>
            </div>

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

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textSecondary/70">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
                    placeholder="••••••"
                    className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl pl-10 pr-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40 font-mono"
                  />
                </div>

                {password && (
                  <div className="mt-2.5 space-y-2 select-none animate-fadeIn">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-brand-textSecondary">Password Strength:</span>
                      <span className={`font-bold transition-colors ${getPasswordStrength(password).score <= 2 ? 'text-red-400' :
                          getPasswordStrength(password).score === 3 ? 'text-amber-400' :
                            getPasswordStrength(password).score === 4 ? 'text-emerald-400' :
                              'text-brand-success'
                        }`}>
                        {getPasswordStrength(password).label}
                      </span>
                    </div>
                    {/* Strength Progress Bar */}
                    <div className="h-1 w-full bg-brand-border/30 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${getPasswordStrength(password).color} ${getPasswordStrength(password).width}`}></div>
                    </div>
                    {/* Criteria Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 pt-1.5">
                      {[
                        { label: 'Min. 8 characters', met: password.length >= 8 },
                        { label: 'Uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
                        { label: 'Lowercase letter (a-z)', met: /[a-z]/.test(password) },
                        { label: 'One number (0-9)', met: /[0-9]/.test(password) },
                        { label: 'Special char (e.g. !@#)', met: /[^A-Za-z0-9]/.test(password) },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-1 text-[10px] leading-tight">
                          <span className={`transition-colors font-bold ${item.met ? 'text-brand-success' : 'text-brand-textSecondary/30'}`}>
                            {item.met ? '✓' : '•'}
                          </span>
                          <span className={`${item.met ? 'text-brand-textPrimary' : 'text-brand-textSecondary/50'}`}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex flex-col justify-start">
                <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textSecondary/70">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(null); }}
                    placeholder="••••••"
                    className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl pl-10 pr-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-glow text-white text-sm font-semibold rounded-xl hover:brightness-110 active:scale-95 transition-all select-none cursor-pointer"
            >
              {loading ? 'Sending OTP...' : 'Sign Up'}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border/60"></div>
            </div>
            <span className="relative px-3 text-xs uppercase text-brand-textSecondary bg-brand-cardBg">Or continue with</span>
          </div>

          <div className="flex justify-center w-full">
            <div id="google-signup-button" className="w-full min-h-[40px] flex justify-center"></div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-brand-textSecondary">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </>
      ) : (
        <form onSubmit={handleVerifyAndRegister} className="space-y-5">
          {/* OTP Instructions Card */}
          <div className="bg-brand-darkBg/50 border border-brand-border/60 p-4 rounded-xl space-y-2">
            <p className="text-xs text-brand-textSecondary">
              We've sent a 6-digit verification code to:
            </p>
            <p className="text-sm font-semibold text-brand-primary break-all">
              {email}
            </p>
            <p className="text-xs text-brand-textSecondary/80">
              Please enter the code below to verify your email and complete registration.
            </p>
          </div>

          {/* OTP input field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
              Verification Code (OTP)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textSecondary/70">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setLocalError(null); }}
                placeholder="123456"
                className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl pl-10 pr-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40 text-center tracking-[0.5em] font-bold font-mono"
              />
            </div>
          </div>

          {/* Resend and Go Back links */}
          <div className="flex items-center justify-between text-xs gap-3">
            <button
              type="button"
              onClick={handleGoBack}
              disabled={loading}
              className="text-brand-textSecondary hover:text-brand-textPrimary text-left font-medium transition-colors cursor-pointer"
            >
              ← Edit details
            </button>

            {timer > 0 ? (
              <span className="text-brand-textSecondary/80 text-right">
                Resend code in <strong className="text-brand-textPrimary font-mono">{timer}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-brand-accent hover:underline font-semibold text-right transition-colors cursor-pointer"
              >
                Resend OTP code
              </button>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-glow text-white text-sm font-semibold rounded-xl hover:brightness-110 active:scale-95 transition-all select-none cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Verify & Register'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Register;
