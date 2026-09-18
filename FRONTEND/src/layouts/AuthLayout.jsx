import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthLayout = () => {
  const { token } = useAuth();

  // Redirect to dashboard if already logged in
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-brand-darkBg overflow-hidden">
      {/* Ambient background blur blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-primary opacity-20 blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-brand-secondary opacity-15 blur-[120px] animate-pulse-slow"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-brand-accent opacity-10 blur-[80px]"></div>

      {/* Main Container */}
      <div className="relative w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-glow">
              <span className="text-xl font-bold text-white tracking-wider">Æ</span>
            </div>
            <h1 className="text-3xl font-extrabold font-sans text-transparent bg-clip-text bg-gradient-to-r from-brand-textPrimary via-brand-textPrimary/90 to-brand-textSecondary tracking-tight">
              ExamGen <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">AI Pro</span>
            </h1>
          </div>
          <p className="text-sm text-brand-textSecondary text-center">
            AI-Powered Smart Document Assessment Platform
          </p>
        </div>

        {/* Dynamic Forms (Login / Register) */}
        <div className="glass-panel rounded-2xl border border-brand-border/40 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent"></div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
