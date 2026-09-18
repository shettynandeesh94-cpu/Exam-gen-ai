import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    primary: 'border-t-brand-primary',
    secondary: 'border-t-brand-secondary',
    accent: 'border-t-brand-accent',
    white: 'border-t-white',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} border-slate-700/50 rounded-full animate-spin`}
        style={{ borderTopColor: 'currentColor' }}
      ></div>
      <span className="text-xs text-brand-textSecondary animate-pulse">Processing request...</span>
    </div>
  );
};

export default LoadingSpinner;
