import React from 'react';
import QuestionCard from './QuestionCard';

const MCQCard = ({ question, index, selectedAnswer, onChange }) => {
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <QuestionCard index={index} title={question.question} marks={question.marks} typeLabel="MCQ">
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer !== undefined && Number(selectedAnswer) === idx;

          return (
            <button
              key={idx}
              onClick={() => onChange(idx)}
              className={`w-full flex items-center space-x-4 p-4 rounded-xl text-left border text-sm transition-all duration-200 select-none ${
                isSelected
                  ? 'bg-brand-primary/10 border-brand-primary text-brand-textPrimary shadow-glow'
                  : 'bg-brand-cardBg border-brand-border/60 hover:border-brand-primary/40 text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60'
              }`}
            >
              {/* Option Index Circle */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 transition-colors ${
                isSelected
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-darkBg text-brand-textSecondary border border-brand-border/40'
              }`}>
                {letters[idx]}
              </div>
              <span className="leading-relaxed">{option}</span>
            </button>
          );
        })}
      </div>
    </QuestionCard>
  );
};

export default MCQCard;
