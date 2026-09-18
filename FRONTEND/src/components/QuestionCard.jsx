import React from 'react';

const QuestionCard = ({ index, title, marks, children, typeLabel = 'Question' }) => {
  return (
    <div className="glass-panel border border-brand-border/40 rounded-2xl p-6 relative overflow-hidden space-y-4">
      {/* Accent Header border */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-primary to-brand-accent/50"></div>

      <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs font-bold font-mono">
            {typeLabel} #{index}
          </span>
        </div>
        <span className="text-xs font-bold font-mono text-brand-accent px-2 py-0.5 rounded bg-brand-accent/5 border border-brand-accent/25">
          {marks} Marks
        </span>
      </div>

      <div className="space-y-4">
        <h3 className="text-base md:text-lg font-semibold text-brand-textPrimary tracking-tight leading-relaxed">
          {title}
        </h3>
        <div className="pt-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
