import React from 'react';

const ProgressCard = ({ title, percentage, count, total, subtitle, color = 'primary' }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    primary: 'stroke-brand-primary',
    secondary: 'stroke-brand-secondary',
    accent: 'stroke-brand-accent',
    success: 'stroke-brand-success',
  };

  const glowColorMap = {
    primary: 'rgba(99, 102, 241, 0.3)',
    secondary: 'rgba(168, 85, 247, 0.3)',
    accent: 'rgba(6, 182, 212, 0.3)',
    success: 'rgba(16, 185, 129, 0.3)',
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-brand-textSecondary uppercase tracking-wider block">
          {title}
        </span>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold text-brand-textPrimary tracking-tight">
            {percentage}%
          </span>
          {count !== undefined && total !== undefined && (
            <span className="text-xs text-brand-textSecondary">
              ({count}/{total})
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-brand-textSecondary mt-2">
            {subtitle}
          </p>
        )}
      </div>

      {/* Circle SVG */}
      <div className="relative w-20 h-20 shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="stroke-brand-border/60"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={`transition-all duration-1000 ease-out ${colorMap[color]}`}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 4px ${glowColorMap[color]})`
            }}
          />
        </svg>
        {/* Centered Text */}
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-brand-textPrimary">
          {Math.round(percentage)}%
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;
