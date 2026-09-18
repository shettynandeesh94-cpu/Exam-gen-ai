import React from 'react';
import QuestionCard from './QuestionCard';

const LongAnswerCard = ({ question, index, answer, onChange }) => {
  const getWordCount = (str) => {
    if (!str || str.trim() === '') return 0;
    return str.trim().split(/\s+/).length;
  };

  return (
    <QuestionCard index={index} title={question.question} marks={question.marks} typeLabel="Long Answer">
      <div className="space-y-2">
        <textarea
          rows="6"
          value={answer || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your comprehensive answer here (provide structural context, code snippets if applicable, and deep logic)..."
          className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40 leading-relaxed font-sans resize-y"
        />
        <div className="flex justify-between items-center text-[10px] font-mono text-brand-textSecondary px-1">
          <span>Target recommendation: &gt; 100 words</span>
          <span>
            {getWordCount(answer)} words | {answer ? answer.length : 0} characters
          </span>
        </div>
      </div>
    </QuestionCard>
  );
};

export default LongAnswerCard;
