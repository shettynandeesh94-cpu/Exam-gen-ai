import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import interviewService from '../services/interviewService';
import { 
  ArrowLeft, 
  Award, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  ListPlus, 
  Compass, 
  Sparkles, 
  Printer, 
  MessageSquare,
  HelpCircle,
  TrendingUp,
  Bookmark
} from 'lucide-react';

const MockInterviewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        const res = await interviewService.getSessionDetails(id);
        if (res.success) {
          setSession(res.session);
          setQuestions(res.questions);
        } else {
          setErrorMessage('Failed to load session details.');
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setErrorMessage('Failed to connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-brand-success bg-brand-success/10 border-brand-success/20';
    if (score >= 5) return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20';
    return 'text-brand-error bg-brand-error/10 border-brand-error/20';
  };

  const getScoreProgressColor = (score) => {
    if (score >= 8) return 'bg-brand-success';
    if (score >= 5) return 'bg-brand-warning';
    return 'bg-brand-error';
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-brand-textSecondary font-semibold uppercase animate-pulse">
          Generating placement metrics scorecard...
        </p>
      </div>
    );
  }

  if (errorMessage || !session) {
    return (
      <div className="glass-panel border border-brand-border/40 rounded-2xl p-8 text-center text-brand-textSecondary text-xs max-w-md mx-auto my-12">
        <XCircle className="w-10 h-10 mx-auto mb-2 text-brand-error" />
        <p className="font-semibold text-brand-textPrimary">Error Loading Report</p>
        <p className="text-[10px] mt-1 text-brand-textSecondary/70">{errorMessage || 'Unable to retrieve interview results.'}</p>
        <button 
          onClick={() => navigate('/mock-interview')}
          className="mt-4 px-4 py-2 bg-brand-primary text-white font-bold rounded-xl"
        >
          Back to Interview Hub
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn text-brand-textPrimary font-sans pb-16 print:p-0 print:space-y-6">
      
      {/* Top Navigation Row */}
      <div className="flex justify-between items-center border-b border-brand-border/15 pb-4 print:hidden">
        <button 
          onClick={() => navigate('/mock-interview')}
          className="flex items-center space-x-1.5 py-2 px-4 rounded-xl border border-brand-border/40 text-xs font-bold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Interview Hub</span>
        </button>

        <button 
          onClick={handlePrint}
          className="flex items-center space-x-1.5 py-2 px-4 rounded-xl bg-brand-accent/15 border border-brand-accent/30 hover:bg-brand-accent hover:text-white text-brand-accent text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Save/Print PDF Report</span>
        </button>
      </div>

      {/* Main Scorecard Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-border/40 bg-gradient-to-br from-brand-cardBg via-brand-darkBg to-brand-darkBg p-6 md:p-8 shadow-2xl print:border print:bg-white print:text-black">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-brand-success/5 blur-3xl pointer-events-none print:hidden"></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 text-[10px] font-bold tracking-wider px-3 py-1 rounded-full bg-brand-success/15 border border-brand-success/20 text-brand-success uppercase">
              <Sparkles className="w-3 h-3 text-brand-secondary animate-pulse" />
              <span>Assessment Completed</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-brand-textPrimary print:text-black">
              Placement Interview Scorecard
            </h1>
            <p className="text-xs text-brand-textSecondary leading-relaxed max-w-xl print:text-gray-600">
              Session completed for domain <span className="font-bold text-brand-textPrimary print:text-black">{session.domain}</span> on {new Date(session.completedAt || session.updatedAt).toLocaleDateString()}. Assessment based on placement rubrics.
            </p>
          </div>

          {/* Large overall score wheel */}
          <div className="w-32 h-32 shrink-0 rounded-full border-4 border-brand-success/30 flex flex-col items-center justify-center text-center bg-brand-darkBg/60 relative shadow-lg print:border-green-600 print:bg-gray-50">
            <span className="text-3xl font-black text-brand-success font-mono">
              {session.overallScore.toFixed(1)}
            </span>
            <span className="text-[9px] font-bold text-brand-textSecondary uppercase tracking-wider mt-0.5">
              Score / 10
            </span>
          </div>
        </div>
      </div>

      {/* Skill Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4">
        {[
          { label: 'Technical Depth', score: session.technicalScore, desc: 'Accuracy & concept details' },
          { label: 'Communication Skills', score: session.communicationScore, desc: 'Grammar, vocabulary, delivery' },
          { label: 'Problem Solving', score: session.problemSolvingScore, desc: 'Edge cases & logical steps' },
          { label: 'Speech Confidence', score: session.confidenceScore, desc: 'Pace, hesitation & conviction' }
        ].map((skill, index) => (
          <div key={index} className="glass-panel border border-brand-border/40 rounded-2xl p-5 shadow-md space-y-3 print:bg-white print:text-black print:border-gray-300">
            <span className="text-[10px] font-extrabold text-brand-textSecondary uppercase tracking-wide block">{skill.label}</span>
            
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-brand-textPrimary print:text-black">{skill.score.toFixed(1)}</span>
              <span className="text-[10px] text-brand-textSecondary font-bold">/ 10</span>
            </div>

            {/* mini progress bar */}
            <div className="h-1.5 bg-brand-darkBg rounded-full overflow-hidden border border-brand-border/20 print:bg-gray-200">
              <div 
                className={`h-full ${getScoreProgressColor(skill.score)} rounded-full`}
                style={{ width: `${skill.score * 10}%` }}
              ></div>
            </div>

            <p className="text-[9px] text-brand-textSecondary italic leading-relaxed opacity-80">{skill.desc}</p>
          </div>
        ))}
      </div>

      {/* Detailed Qualities: Strengths, Weaknesses, Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:grid-cols-1">
        
        {/* Left Side: Strengths & Weaknesses (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-6 shadow-md space-y-5 print:bg-white print:text-black print:border-gray-300">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-textSecondary flex items-center gap-1.5 border-b border-brand-border/10 pb-3">
              <TrendingUp className="w-4.5 h-4.5 text-brand-success" />
              <span>Placement Qualitative Feedback</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:grid-cols-2">
              {/* Strengths */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-brand-success uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Key Strengths</span>
                </h4>
                <ul className="space-y-2 pl-1">
                  {(session.strengths || []).map((str, idx) => (
                    <li key={idx} className="text-xs text-brand-textSecondary flex items-start space-x-1.5 leading-relaxed">
                      <span className="text-brand-success font-black mt-0.5">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weak Areas */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-brand-warning uppercase tracking-wider flex items-center gap-1">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Areas For Improvement</span>
                </h4>
                <ul className="space-y-2 pl-1">
                  {(session.weakAreas || []).map((weak, idx) => (
                    <li key={idx} className="text-xs text-brand-textSecondary flex items-start space-x-1.5 leading-relaxed">
                      <span className="text-brand-warning font-black mt-0.5">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Revisions & Learning Resources (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-6 shadow-md space-y-5 print:bg-white print:text-black print:border-gray-300">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-textSecondary flex items-center gap-1.5 border-b border-brand-border/10 pb-3">
              <Compass className="w-4.5 h-4.5 text-brand-accent" />
              <span>Recommended Action Plan</span>
            </h3>

            <div className="space-y-4">
              {/* Topics to Revise */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block">Topics To Revise</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(session.topicsToRevise || []).map((topic, idx) => (
                    <span key={idx} className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-brand-darkBg/60 border border-brand-border/30 text-brand-textSecondary">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block">Suggested Learning Materials</span>
                <ul className="space-y-1.5 pl-1">
                  {(session.suggestedResources || []).map((res, idx) => (
                    <li key={idx} className="text-xs text-brand-textSecondary flex items-start space-x-1.5 leading-relaxed">
                      <BookOpen className="w-3.5 h-3.5 text-brand-accent mt-0.5 shrink-0" />
                      <span>{res}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Practice Tests */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block">Recommended Mock Tests</span>
                <ul className="space-y-1.5 pl-1">
                  {(session.recommendedTests || []).map((test, idx) => (
                    <li key={idx} className="text-xs text-brand-textSecondary flex items-start space-x-1.5 leading-relaxed">
                      <ListPlus className="w-3.5 h-3.5 text-brand-success mt-0.5 shrink-0" />
                      <span>{test}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question-by-Question Review Breakdown */}
      <div className="space-y-6 print:mt-8">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-textSecondary flex items-center gap-1.5 border-b border-brand-border/10 pb-3">
          <MessageSquare className="w-4.5 h-4.5 text-brand-accent" />
          <span>Question-by-Question Detailed Review</span>
        </h3>

        <div className="space-y-6">
          {questions.map((q, idx) => {
            const scoreColor = getScoreColor(q.score);
            return (
              <div 
                key={q._id} 
                className="glass-panel border border-brand-border/40 rounded-2xl p-6 shadow-md space-y-4 print:bg-white print:text-black print:border-gray-300 print:break-inside-avoid"
              >
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-brand-border/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-brand-darkBg/60 border border-brand-border/30 text-brand-textSecondary">
                      Question #{q.order}
                    </span>
                    <span className="text-[9px] font-bold text-brand-textSecondary/80 uppercase tracking-wider capitalize">
                      {q.difficulty} • {q.questionType}
                    </span>
                    {q.bookmarked && (
                      <span className="inline-flex items-center text-[9px] font-bold text-brand-warning uppercase tracking-wider bg-brand-warning/10 border border-brand-warning/20 px-1.5 py-0.5 rounded-lg gap-0.5">
                        <Bookmark className="w-2.5 h-2.5" />
                        <span>Bookmarked</span>
                      </span>
                    )}
                  </div>
                  
                  {/* Score badge */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono border ${scoreColor}`}>
                    Score: {q.score} / 10
                  </span>
                </div>

                {/* Question text */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-brand-textSecondary uppercase tracking-wider block">Question Prompt</span>
                  <p className="text-xs md:text-sm font-extrabold text-brand-textPrimary print:text-black">
                    "{q.questionText}"
                  </p>
                </div>

                {/* Student Answer */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-brand-textSecondary uppercase tracking-wider block">Your Spoken Answer</span>
                  <div className="p-3.5 rounded-xl bg-brand-darkBg/40 border border-brand-border/20 text-xs text-brand-textPrimary font-medium print:bg-gray-50 print:text-black leading-relaxed whitespace-pre-wrap">
                    {q.studentAnswer}
                  </div>
                </div>

                {/* Feedback Critique */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-brand-textSecondary uppercase tracking-wider block">AI Evaluator Critique</span>
                  <p className="text-xs text-brand-textSecondary leading-relaxed whitespace-pre-wrap">
                    {q.feedback}
                  </p>
                </div>

                {/* Missing key concepts */}
                {q.missingPoints && q.missingPoints.length > 0 && (
                  <div className="p-4 rounded-xl bg-brand-warning/5 border border-brand-warning/20 space-y-2 print:bg-yellow-50/50 print:border-yellow-200">
                    <span className="text-[10px] font-extrabold text-brand-warning uppercase tracking-wider block flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Missing Key Points Evaluated</span>
                    </span>
                    <ul className="space-y-1 pl-1">
                      {q.missingPoints.map((pt, ptIdx) => (
                        <li key={ptIdx} className="text-xs text-brand-textSecondary flex items-start space-x-1.5 leading-relaxed">
                          <span className="text-brand-warning font-black">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improved Model Answer */}
                {q.improvedAnswer && (
                  <div className="p-4 rounded-xl bg-brand-success/5 border border-brand-success/20 space-y-2 print:bg-green-50/50 print:border-green-200">
                    <span className="text-[10px] font-extrabold text-brand-success uppercase tracking-wider block flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Exemplar Placement Response</span>
                    </span>
                    <p className="text-xs text-brand-textSecondary leading-relaxed whitespace-pre-wrap">
                      {q.improvedAnswer}
                    </p>
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

export default MockInterviewReport;
