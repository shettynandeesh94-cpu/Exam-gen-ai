import React from 'react';
import QuestionCard from './QuestionCard';

const ShortAnswerCard = ({ question, index, answer, onChange }) => {
  return (
    <QuestionCard index={index} title={question.question} marks={question.marks} typeLabel="Short Answer">
      <div className="space-y-2">
        <input
          type="text"
          value={answer || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40 font-mono"
        />
        <div className="flex justify-end text-[10px] font-mono text-brand-textSecondary">
          {answer ? answer.trim().length : 0} characters
        </div>
      </div>
    </QuestionCard>
  );
};

export default ShortAnswerCard;
