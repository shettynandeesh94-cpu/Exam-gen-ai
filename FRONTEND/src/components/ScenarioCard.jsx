import React from 'react';
import { BookOpen } from 'lucide-react';

const ScenarioCard = ({ scenario, index, answers, onAnswerChange }) => {
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="glass-panel border border-brand-border/40 rounded-2xl p-6 relative overflow-hidden space-y-6">
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-accent to-brand-primary"></div>
      
      <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
        <span className="px-2.5 py-1 rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/20 text-xs font-bold font-mono flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Scenario #{index}
        </span>
        <span className="text-xs font-bold font-mono text-brand-textSecondary">
          Case-Based Assessment
        </span>
      </div>

      {/* Scenario Text Narrative */}
      <div className="p-4 md:p-5 rounded-xl bg-brand-darkBg/60 border border-brand-border/20 text-sm md:text-base text-brand-textPrimary font-sans italic leading-relaxed shadow-inner">
        {scenario.scenarioText}
      </div>

      {/* Sub Questions Rendering */}
      <div className="space-y-6 pt-2">
        <h4 className="text-xs font-bold tracking-wider text-brand-textSecondary uppercase border-b border-brand-border/10 pb-2">
          Scenario Questions
        </h4>

        {scenario.subQuestions.map((subQ, subIdx) => {
          const subAns = answers[subQ.id];

          return (
            <div key={subQ.id} className="space-y-3 p-4 rounded-xl border border-brand-border/20 bg-brand-darkBg/20">
              <div className="flex justify-between items-start gap-2">
                <span className="text-sm font-semibold text-brand-textPrimary">
                  {subIdx + 1}. {subQ.question}
                </span>
                <span className="text-[10px] font-mono text-brand-accent font-bold px-1.5 py-0.5 rounded bg-brand-accent/5 border border-brand-accent/20 shrink-0">
                  {subQ.marks} Marks
                </span>
              </div>

              {subQ.type === 'mcq' ? (
                /* Sub MCQ options */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {subQ.options.map((opt, optIdx) => {
                    const isSelected = subAns !== undefined && Number(subAns) === optIdx;

                    return (
                      <button
                        key={optIdx}
                        onClick={() => onAnswerChange(subQ.id, optIdx)}
                        className={`p-3 rounded-lg text-left border text-xs transition-all flex items-center space-x-3 ${
                          isSelected
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-textPrimary shadow-glow'
                            : 'bg-brand-cardBg border-brand-border/30 text-brand-textSecondary hover:border-brand-primary/30 hover:text-brand-textPrimary hover:bg-brand-darkBg/60'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] font-mono shrink-0 ${
                          isSelected ? 'bg-brand-primary text-white' : 'bg-brand-darkBg border border-brand-border/30 text-brand-textSecondary'
                        }`}>
                          {letters[optIdx]}
                        </div>
                        <span className="truncate">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Sub Short Answer input */
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={subAns || ''}
                    onChange={(e) => onAnswerChange(subQ.id, e.target.value)}
                    placeholder="Type your answer to this scenario..."
                    className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40 font-mono"
                  />
                  <div className="flex justify-end text-[9px] font-mono text-brand-textSecondary">
                    {subAns ? subAns.trim().length : 0} characters
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScenarioCard;
