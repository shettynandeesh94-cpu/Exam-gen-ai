import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, trend, trendType = 'up', description }) => {
  const isUp = trendType === 'up';

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-brand-primary opacity-5 rounded-full blur-2xl"></div>

      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
            {title}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-brand-textPrimary tracking-tight">
              {value}
            </span>
            {trend && (
              <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${
                isUp ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-error/10 text-brand-error'
              }`}>
                {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {trend}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-brand-textSecondary mt-1">
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <div className="p-3 rounded-xl bg-brand-darkBg border border-brand-border/40 text-brand-primary shadow-glow flex items-center justify-center">
            <Icon className="w-6 h-6 text-brand-accent" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
