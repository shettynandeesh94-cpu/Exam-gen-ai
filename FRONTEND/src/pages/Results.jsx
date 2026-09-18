import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressCard from '../components/ProgressCard';
import { Award, CheckCircle2, XCircle, AlertCircle, Calendar, FileText, ChevronRight, HelpCircle, Lightbulb } from 'lucide-react';
import resultService from '../services/resultService';
import { seedInitialResults } from '../services/analyticsService';

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // History Listing states
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Specific result states
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch historical attempts
  useEffect(() => {
    if (id === 'history') {
      const loadHistory = async () => {
        try {
          // Trigger seeding on history view in case they haven't done anything
          seedInitialResults();
          const data = await resultService.getResults();
          setHistoryList(data.results || []);
        } catch (e) {
          console.error(e);
        } finally {
          setHistoryLoading(false);
        }
      };
      loadHistory();
    }
  }, [id]);

  // 2. Fetch specific attempt details
  useEffect(() => {
    if (id && id !== 'history') {
      const loadResult = async () => {
        try {
          setLoading(true);
          const data = await resultService.getResult(id);
          setResult(data.result);
        } catch (e) {
          console.error(e);
          navigate('/dashboard');
        } finally {
          setLoading(false);
        }
      };
      loadResult();
    }
  }, [id, navigate]);

  // Selection view (History List)
  if (id === 'history') {
    if (historyLoading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center text-brand-textPrimary bg-brand-darkBg">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-fadeIn text-brand-textPrimary max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-textPrimary tracking-tight">Assessment History</h1>
          <p className="text-xs text-brand-textSecondary mt-1">Review all your previous test scores and detailed AI feedback transcripts.</p>
        </div>

        {historyList.length === 0 ? (
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-12 text-center space-y-4">
            <div className="p-3 rounded-full bg-brand-darkBg border border-brand-border/30 text-brand-textSecondary inline-block">
              <Award className="w-10 h-10 opacity-30" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-brand-textPrimary">No historical results</p>
              <p className="text-xs text-brand-textSecondary max-w-xs mx-auto">Attempt a generated test to populate your assessment grading history.</p>
            </div>
            <button
              onClick={() => navigate('/generate-test')}
              className="py-2.5 px-5 bg-gradient-to-r from-brand-primary to-brand-secondary text-xs font-semibold text-white rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Go to Generator
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {historyList.map((res) => (
              <div
                key={res._id}
                onClick={() => navigate(`/results/${res._id}`)}
                className="glass-panel glass-panel-hover border border-brand-border/35 rounded-2xl p-5 flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1.5 min-w-[70%]">
                  <h3 className="text-base font-bold text-brand-textPrimary leading-snug truncate">{res.testSubject}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-textSecondary">
                    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-brand-primary" /> {res.documentName}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(res.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 shrink-0">
                  <div className="text-right">
                    <span className={`text-xl font-bold font-mono ${res.percentage >= 75 ? 'text-brand-success' : res.percentage >= 50 ? 'text-brand-warning' : 'text-brand-error'}`}>
                      {res.percentage}%
                    </span>
                    <p className="text-[10px] text-brand-textSecondary font-mono">{res.score}/{res.totalMarks} Marks</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-textSecondary" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Loading indicator for specific result loading
  if (loading || !result) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-brand-darkBg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto text-brand-textPrimary">
      <PageHeader
        title="Grading & Evaluation Report"
        subtitle={`Exam: ${result.testSubject} | Reference document: ${result.documentName}`}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="py-2 px-4 rounded-xl border border-brand-border/40 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </PageHeader>

      {/* Overview Cards (Score & Recommendations) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="md:col-span-1">
          <ProgressCard
            title="Total Score"
            percentage={result.percentage}
            count={result.score}
            total={result.totalMarks}
            subtitle={`Difficulty Level: ${result.testDifficulty}`}
            color={result.percentage >= 75 ? 'success' : result.percentage >= 50 ? 'accent' : 'primary'}
          />
        </div>

        {/* AI Recommendations */}
        <div className="md:col-span-2 glass-panel rounded-2xl p-6 border border-brand-border/40 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-brand-accent opacity-5 rounded-full blur-2xl"></div>
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-xl bg-brand-accent/15 text-brand-accent border border-brand-accent/20 shrink-0">
              <Lightbulb className="w-6 h-6 animate-pulse-slow" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-brand-accent uppercase tracking-wider block">AI Suggestions & Analysis</span>
              <p className="text-sm text-brand-textPrimary leading-relaxed">
                {result.aiSuggestions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weak Topics */}
      <div className="glass-panel rounded-2xl p-6 border border-brand-border/40 space-y-3">
        <span className="text-xs font-semibold text-brand-textSecondary uppercase tracking-wider block">Identified Weak Areas</span>
        <div className="flex flex-wrap gap-2">
          {result.weakTopics.map((topic, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-xl bg-brand-warning/10 text-brand-warning border border-brand-warning/20 text-xs font-bold font-mono"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Detailed Corrections */}
      <div className="space-y-6">
        <h3 className="text-base font-bold text-brand-textPrimary tracking-wider uppercase border-b border-brand-border/10 pb-3">
          Question-Wise Corrective Analytics
        </h3>

        <div className="space-y-6">
          {result.questionFeedback.map((feedback, idx) => {
            const isCorrect = feedback.status === 'correct';
            const isPartial = feedback.status === 'partially_correct';

            let statusIcon = <XCircle className="w-5 h-5 text-brand-error" />;
            let statusText = 'Incorrect';
            let bgStyle = 'bg-brand-error/5 border-brand-error/25';

            if (isCorrect) {
              statusIcon = <CheckCircle2 className="w-5 h-5 text-brand-success" />;
              statusText = 'Correct';
              bgStyle = 'bg-brand-success/5 border-brand-success/20';
            } else if (isPartial) {
              statusIcon = <AlertCircle className="w-5 h-5 text-brand-warning animate-pulse" />;
              statusText = 'Partially Correct';
              bgStyle = 'bg-brand-warning/5 border-brand-warning/25';
            }

            return (
              <div
                key={idx}
                className={`glass-panel border rounded-2xl p-6 relative overflow-hidden space-y-4 ${bgStyle}`}
              >
                {/* Header info */}
                <div className="flex justify-between items-center border-b border-brand-border/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-lg bg-brand-darkBg border border-brand-border/30 text-brand-textSecondary text-[10px] font-mono font-bold">
                      Q#{idx + 1} ({feedback.type.toUpperCase()})
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      {statusIcon}
                      <span className={isCorrect ? 'text-brand-success' : isPartial ? 'text-brand-warning' : 'text-brand-error'}>{statusText}</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-brand-textPrimary">
                    {feedback.allocatedMarks} / {feedback.maxMarks} Marks
                  </span>
                </div>

                {/* Question */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-brand-textSecondary uppercase">Question Statement</span>
                  <p className="text-sm font-semibold text-brand-textPrimary leading-relaxed">{feedback.question}</p>
                </div>

                {/* Answer responses */}
                <div className="space-y-4 pt-1">
                  {/* Student Submission */}
                  <div className="p-4 rounded-xl bg-brand-darkBg/60 border border-brand-border/25 space-y-2">
                    <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block border-b border-brand-border/10 pb-1">
                      Your Submission
                    </span>
                    <p className="text-sm text-brand-textPrimary font-sans leading-relaxed whitespace-pre-wrap break-words">
                      {feedback.studentAnswer || <span className="italic text-brand-textSecondary text-xs">No answer submitted</span>}
                    </p>
                  </div>


                </div>

                {/* AI Explanation / Suggestions */}
                {feedback.explanation && (
                  <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/15 flex items-start space-x-2 text-xs leading-relaxed">
                    <HelpCircle className="w-4.5 h-4.5 text-brand-primary shrink-0 mt-0.5" />
                    <div className="space-y-1 w-full">
                      <span className="font-semibold text-brand-primary uppercase text-[9px] tracking-wider block border-b border-brand-primary/10 pb-1">
                        AI Grader Insights
                      </span>
                      <p className="text-brand-textPrimary font-sans leading-relaxed whitespace-pre-wrap break-words">
                        {feedback.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Results;
