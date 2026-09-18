import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const Timer = ({ duration, onTimeUp }) => {
  const isNoLimit = !duration || duration >= 9999;
  const totalSeconds = isNoLimit ? 999999 : duration * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  useEffect(() => {
    if (isNoLimit) return;

    if (secondsLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onTimeUp, isNoLimit]);

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = isNoLimit ? 100 : (secondsLeft / totalSeconds) * 100;

  // Determine warning levels
  let progressColor = 'bg-gradient-to-r from-brand-primary to-brand-accent';
  let textColor = 'text-brand-textPrimary';
  let badgeColor = 'bg-brand-darkBg/60 text-brand-textSecondary';
  let isUrgent = false;

  if (!isNoLimit) {
    if (secondsLeft < 60) { // Under 1 minute
      progressColor = 'bg-brand-error animate-pulse';
      textColor = 'text-red-400 font-extrabold animate-pulse';
      badgeColor = 'bg-red-500/15 text-red-400 border border-red-500/20';
      isUrgent = true;
    } else if (secondsLeft < 300) { // Under 5 minutes
      progressColor = 'bg-brand-warning';
      textColor = 'text-amber-400 font-bold';
      badgeColor = 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
    }
  }

  return (
    <div className="w-full flex flex-col space-y-2 select-none animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-brand-border/40 font-mono text-sm ${badgeColor}`}>
          <Clock className={`w-4 h-4 ${isUrgent ? 'animate-spin' : ''}`} />
          <span>TIME REMAINING</span>
        </div>
        <span className={`text-2xl font-mono tracking-wider font-bold ${textColor}`}>
          {isNoLimit ? 'NO LIMIT' : formatTime(secondsLeft)}
        </span>
      </div>

      {/* Glow Progress Bar */}
      <div className="w-full h-2 bg-brand-darkBg rounded-full overflow-hidden border border-brand-border/40 relative">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${progressColor}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Timer;
