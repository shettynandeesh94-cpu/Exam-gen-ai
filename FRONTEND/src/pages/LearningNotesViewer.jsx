import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import WarningPopup from '../components/WarningPopup';
import learningService from '../services/learningService';
import { branchCatalog } from '../config/learningCatalog';
import { 
  ArrowLeft, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  Clock, 
  Award, 
  Send, 
  Bot, 
  User as UserIcon, 
  X, 
  Sparkles, 
  HelpCircle, 
  FileText,
  AlertTriangle,
  ChevronRight,
  ListRestart,
  Download
} from 'lucide-react';

const LearningNotesViewer = () => {
  const { branch, subjectId, topicId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState(null);
  const [progress, setProgress] = useState(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectNotesFile, setSubjectNotesFile] = useState(null);

  // Interactive MCQ state
  const [mcqAnswers, setMcqAnswers] = useState({}); // { index: selectedOption }
  const [mcqChecked, setMcqChecked] = useState({}); // { index: boolean }

  // Slide-over AI Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello! I am your contextual AI Study Companion. Ask me any clarifying questions about these notes, and I will explain them using B.Tech curriculum parameters.",
      timestamp: new Date()
    }
  ]);
  const chatEndRef = useRef(null);

  // Active section tab in viewer: 'notes' | 'exam' | 'interview' | 'mcq'
  const [activeTab, setActiveTab] = useState('notes');
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  useEffect(() => {
    const loadNotesData = async () => {
      try {
        setLoading(true);
        // Find subject name in catalog
        const branchData = branchCatalog[branch];
        const subject = branchData?.subjects.find(s => s.id === subjectId);
        if (subject) {
          setSubjectName(subject.name);
          setSubjectNotesFile(subject.notesFile || null);
        }

        // 1. Fetch/compile notes
        const notesRes = await learningService.getNotes(branch, subjectId, topicId);
        setNotes(notesRes.notes);

        // 2. Fetch progress
        const progRes = await learningService.getProgress();
        setProgress(progRes.progress);

        // 3. Record recently viewed log
        await learningService.recordView(branch, subjectId, topicId);
      } catch (err) {
        console.error('Failed to load notes data:', err);
        navigate('/learning-hub');
      } finally {
        setLoading(false);
      }
    };

    if (branch && subjectId && topicId) {
      loadNotesData();
    }
  }, [branch, subjectId, topicId, navigate]);

  // Scroll to bottom of AI chat drawer
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatOpen]);

  const bookmarked = progress?.bookmarkedTopics.some(
    t => t.branch === branch && t.subjectId === subjectId && t.topicId === topicId
  );

  const completed = progress?.completedTopics.some(
    t => t.branch === branch && t.subjectId === subjectId && t.topicId === topicId
  );

  const handleToggleBookmark = async () => {
    try {
      const data = await learningService.toggleBookmark(branch, subjectId, topicId);
      setProgress(prev => {
        if (!prev) return prev;
        let updated = [...prev.bookmarkedTopics];
        if (data.bookmarked) {
          updated.push({ branch, subjectId, topicId });
        } else {
          updated = updated.filter(t => !(t.branch === branch && t.subjectId === subjectId && t.topicId === topicId));
        }
        return { ...prev, bookmarkedTopics: updated };
      });
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleToggleComplete = async () => {
    try {
      const data = await learningService.toggleComplete(branch, subjectId, topicId);
      setProgress(prev => {
        if (!prev) return prev;
        let updated = [...prev.completedTopics];
        if (data.completed) {
          updated.push({ branch, subjectId, topicId });
        } else {
          updated = updated.filter(t => !(t.branch === branch && t.subjectId === subjectId && t.topicId === topicId));
        }
        return { ...prev, completedTopics: updated };
      });
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  const handleGenerateTest = async () => {
    if (window.innerWidth < 768) {
      setShowMobileWarning(true);
      return;
    }
    try {
      setLoading(true);
      const data = await learningService.generateTest(branch, subjectId, topicId);
      if (data.success && data.testId) {
        navigate(`/take-test/${data.testId}`);
      }
    } catch (err) {
      console.error('Failed to generate test:', err);
      alert('Error compiling assessment. Please try again.');
      setLoading(false);
    }
  };

  const handleRecompileNotes = async () => {
    if (!window.confirm('Are you sure you want to re-compile these notes? This will recreate the syllabus study guide using the new, highly-structured template.')) return;
    try {
      setLoading(true);
      const res = await learningService.getNotes(branch, subjectId, topicId, true);
      if (res.success && res.notes) {
        setNotes(res.notes);
        setMcqAnswers({});
        setMcqChecked({});
      }
    } catch (err) {
      console.error('Failed to recompile notes:', err);
      alert('Error recompiling notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: chatInput,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const historyParam = chatHistory.map(m => ({ sender: m.sender, text: m.text }));
      const res = await learningService.askAI(branch, subjectId, topicId, userMsg.text, historyParam);
      
      setChatHistory(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error('AI chat failed:', err);
      setChatHistory(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: "⚠️ **System Error**: Unable to obtain AI companion response. Please check your connection.",
        timestamp: new Date()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks
    html = html.replace(/```([\s\S]+?)```/g, (match, code) => {
      return `<pre class="bg-brand-darkBg border border-brand-border/60 rounded-xl p-4 my-3 text-xs font-mono overflow-x-auto text-brand-textPrimary select-all">${code.trim()}</pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-brand-darkBg/60 border border-brand-border/30 rounded px-1.5 py-0.5 text-xs font-mono text-brand-accent">$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-brand-textPrimary">$1</strong>');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-extrabold text-brand-textPrimary mt-5 mb-2 tracking-tight">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-extrabold text-brand-textPrimary mt-6 mb-2.5 tracking-tight border-b border-brand-border/10 pb-1.5">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-black text-brand-textPrimary mt-8 mb-3.5 tracking-tight">$1</h2>');

    // Bullet points
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-5 list-disc pl-1.5 mt-1.5 text-brand-textSecondary">$1</li>');

    // Paragraph splits
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(p => {
      if (p.trim().startsWith('<pre') || p.trim().startsWith('<li') || p.trim().startsWith('<h')) {
        return p;
      }
      return `<p class="leading-relaxed mb-3">${p.replace(/\n/g, '<br />')}</p>`;
    }).join('');

    return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-2 text-sm text-brand-textSecondary leading-relaxed font-sans" />;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-brand-textPrimary">
        <LoadingSpinner size="lg" />
        <div className="text-center space-y-2 max-w-sm px-4">
          <h3 className="text-sm font-bold tracking-wider text-brand-textPrimary uppercase animate-pulse">Compiling B.Tech Syllabus Notes...</h3>
          <p className="text-xs text-brand-textSecondary leading-relaxed">
            Our AI textbook author is parsing B.Tech curriculum specifications, formatting definitions, compiling interview guidelines, and structuring practice MCQs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn text-brand-textPrimary font-sans pb-16 relative">
      
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border/15 pb-4">
        <button 
          onClick={() => navigate(`/learning-hub/${branch}/${subjectId}`)}
          className="flex items-center space-x-1.5 py-2 px-4 rounded-xl border border-brand-border/40 text-xs font-bold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Subject Outline</span>
        </button>

        <div className="flex items-center space-x-3 shrink-0">
          {/* Bookmark Toggle */}
          <button 
            onClick={handleToggleBookmark}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              bookmarked 
                ? 'bg-brand-warning/10 border-brand-warning/35 text-brand-warning shadow-glow' 
                : 'border-brand-border/40 hover:border-brand-warning/40 text-brand-textSecondary hover:text-brand-warning'
            }`}
            title={bookmarked ? "Bookmarked Topic" : "Bookmark Topic"}
          >
            {bookmarked ? <BookmarkCheck className="w-4.5 h-4.5" /> : <Bookmark className="w-4.5 h-4.5" />}
          </button>

          {/* Mark Completed Toggle */}
          <button 
            onClick={handleToggleComplete}
            className={`flex items-center space-x-1.5 py-2 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              completed 
                ? 'bg-brand-success/10 border-brand-success/30 text-brand-success' 
                : 'border-brand-border/40 hover:border-brand-success/40 text-brand-textSecondary hover:text-brand-success'
            }`}
          >
            {completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            <span>{completed ? 'Completed' : 'Mark Completed'}</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left pane: Outline & Panel Toggles (lg:col-span-3) */}
        <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-24">
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-4 space-y-4 shadow-md">
            <h4 className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block border-b border-brand-border/15 pb-2">
              Reader Study Mode
            </h4>
            
            <div className="flex flex-col gap-1.5">
              <button 
                onClick={() => setActiveTab('notes')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 ${
                  activeTab === 'notes' 
                    ? 'bg-brand-primary/10 border border-brand-primary text-brand-textPrimary shadow-glow' 
                    : 'border border-transparent text-brand-textSecondary hover:bg-brand-darkBg/60 hover:text-brand-textPrimary'
                }`}
              >
                <FileText className="w-4 h-4 text-brand-primary" />
                <span>Structured Notes</span>
              </button>

              <button 
                onClick={() => setActiveTab('exam')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 ${
                  activeTab === 'exam' 
                    ? 'bg-brand-primary/10 border border-brand-primary text-brand-textPrimary shadow-glow' 
                    : 'border border-transparent text-brand-textSecondary hover:bg-brand-darkBg/60 hover:text-brand-textPrimary'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-brand-warning" />
                <span>Exam Highlights</span>
              </button>

              <button 
                onClick={() => setActiveTab('interview')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 ${
                  activeTab === 'interview' 
                    ? 'bg-brand-primary/10 border border-brand-primary text-brand-textPrimary shadow-glow' 
                    : 'border border-transparent text-brand-textSecondary hover:bg-brand-darkBg/60 hover:text-brand-textPrimary'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-brand-accent" />
                <span>Interview Q&A</span>
              </button>

              <button 
                onClick={() => setActiveTab('mcq')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 ${
                  activeTab === 'mcq' 
                    ? 'bg-brand-primary/10 border border-brand-primary text-brand-textPrimary shadow-glow' 
                    : 'border border-transparent text-brand-textSecondary hover:bg-brand-darkBg/60 hover:text-brand-textPrimary'
                }`}
              >
                <Award className="w-4 h-4 text-brand-success" />
                <span>Practice MCQs</span>
              </button>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-4 space-y-3 shadow-md">
            <h4 className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block border-b border-brand-border/15 pb-2">
              Topic Actions
            </h4>

            {/* Generate Exam */}
            <button 
              onClick={handleGenerateTest}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-brand-success/20 bg-brand-success/5 hover:bg-brand-success/10 hover:border-brand-success/35 text-xs text-brand-success font-bold transition-all active:scale-95 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Generate Test</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Ask AI Trigger */}
            <button 
              onClick={() => setIsChatOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-brand-primary/25 bg-brand-primary/10 hover:bg-brand-primary/15 hover:border-brand-primary/45 text-xs text-brand-textPrimary font-bold transition-all active:scale-95 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-secondary animate-pulse" />
                <span>Ask Study Companion</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Re-compile Notes */}
            <button 
              onClick={handleRecompileNotes}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-brand-accent/25 bg-brand-accent/5 hover:bg-brand-accent/15 hover:border-brand-accent/35 text-xs text-brand-accent font-bold transition-all active:scale-95 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
                <span>Re-compile Notes</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Download Subject Notes PDF */}
            {subjectNotesFile && (
              <a 
                href={`/uploads/notes/${subjectNotesFile}`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-brand-accent/20 bg-brand-accent/5 hover:bg-brand-accent/15 hover:border-brand-accent/45 text-xs text-brand-accent font-bold transition-all active:scale-95 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Download Notes</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </a>
            )}
          </div>
        </aside>

        {/* Right pane: Reading Workspace (lg:col-span-9) */}
        <section className="lg:col-span-9 glass-panel border border-brand-border/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          
          {/* Article Header info */}
          <div className="border-b border-brand-border/15 pb-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[10px] font-bold uppercase tracking-wider font-mono">
                {branch} Syllabus
              </span>
              <span className="text-[10px] text-brand-textSecondary font-bold">•</span>
              <span className="text-xs text-brand-textSecondary font-medium truncate max-w-xs" title={subjectName}>
                {subjectName}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-brand-textPrimary tracking-tight">
              {notes.title || 'Syllabus Notes'}
            </h2>

            <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-brand-textSecondary font-medium">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-brand-accent" />
                <span>{notes.readingTime || 5} Mins Read</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-brand-warning" />
                <span>Difficulty: {notes.difficulty || 'Medium'}</span>
              </div>
            </div>
          </div>

          {/* ───────────────── CONTENT PANELS ───────────────── */}

          {activeTab === 'notes' && (
            /* Structured Academic Notes */
            <article className="space-y-4 prose prose-invert max-w-none">
              {renderMarkdown(notes.content)}
            </article>
          )}

          {activeTab === 'exam' && (
            /* Exam Highlights & Common Mistakes */
            <div className="space-y-8 animate-fadeIn">
              {/* Highlights */}
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-brand-textPrimary tracking-wide border-b border-brand-border/15 pb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-brand-warning" />
                  <span>Important Semester Exam Highlights</span>
                </h3>
                <div className="pl-1">
                  {renderMarkdown(notes.examPoints)}
                </div>
              </div>

              {/* Common Mistakes */}
              {notes.commonMistakes && (
                <div className="p-5 rounded-2xl bg-brand-error/5 border border-brand-error/25 space-y-3">
                  <h3 className="text-sm font-extrabold text-brand-error flex items-center gap-2">
                    <AlertTriangle className="w-4.5 h-4.5" />
                    <span>Common Conceptual & Semester Mistakes</span>
                  </h3>
                  <div className="pl-1">
                    {renderMarkdown(notes.commonMistakes)}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'interview' && (
            /* Interview Q&A */
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-base font-extrabold text-brand-textPrimary tracking-wide border-b border-brand-border/15 pb-2 flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-brand-accent" />
                <span>Technical Interview Preparation Q&A</span>
              </h3>
              <div className="pl-1">
                {renderMarkdown(notes.interviewQuestions)}
              </div>
            </div>
          )}

          {activeTab === 'mcq' && (
            /* Interactive Practice MCQs */
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-brand-border/15 pb-3 flex justify-between items-center">
                <h3 className="text-base font-extrabold text-brand-textPrimary tracking-wide flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-brand-success" />
                  <span>Interactive Practice Assessment MCQs</span>
                </h3>
                {/* Reset MCQs */}
                <button 
                  onClick={() => { setMcqAnswers({}); setMcqChecked({}); }}
                  className="flex items-center space-x-1 py-1.5 px-3 rounded-lg border border-brand-border/40 hover:bg-brand-border/20 text-[10px] font-bold text-brand-textSecondary hover:text-brand-textPrimary transition-all cursor-pointer"
                  title="Reset practice MCQs"
                >
                  <ListRestart className="w-3.5 h-3.5" />
                  <span>Reset Quiz</span>
                </button>
              </div>

              <div className="space-y-6">
                {(notes.practiceMCQs || []).map((mcq, mcqIdx) => {
                  const selectedOpt = mcqAnswers[mcqIdx];
                  const checked = mcqChecked[mcqIdx];
                  const letters = ['A', 'B', 'C', 'D'];

                  return (
                    <div key={mcqIdx} className="p-5 rounded-2xl border border-brand-border/30 bg-brand-darkBg/10 space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-bold text-brand-textPrimary">
                          Q{mcqIdx + 1}. {mcq.question}
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-success/5 border border-brand-success/20 text-brand-success shrink-0">
                          Interactive
                        </span>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(mcq.options || {}).map(([key, val]) => {
                          const isSelected = selectedOpt === key;
                          const isCorrectOption = key === mcq.correctAnswer;
                          
                          let btnStyle = 'bg-brand-cardBg border-brand-border/40 text-brand-textSecondary hover:border-brand-primary/45 hover:text-brand-textPrimary hover:bg-brand-darkBg/40';
                          let circleStyle = 'bg-brand-darkBg border border-brand-border/30 text-brand-textSecondary';

                          if (checked) {
                            if (isCorrectOption) {
                              btnStyle = 'bg-brand-success/10 border-brand-success text-brand-textPrimary';
                              circleStyle = 'bg-brand-success text-white';
                            } else if (isSelected) {
                              btnStyle = 'bg-brand-error/10 border-brand-error text-brand-textPrimary';
                              circleStyle = 'bg-brand-error text-white';
                            } else {
                              btnStyle = 'bg-brand-cardBg border-brand-border/30 text-brand-textSecondary/40 pointer-events-none';
                              circleStyle = 'bg-brand-darkBg/40 border border-brand-border/20 text-brand-textSecondary/40';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-brand-primary/10 border-brand-primary text-brand-textPrimary';
                            circleStyle = 'bg-brand-primary text-white';
                          }

                          return (
                            <button
                              key={key}
                              disabled={checked}
                              onClick={() => setMcqAnswers(prev => ({ ...prev, [mcqIdx]: key }))}
                              className={`p-3.5 rounded-xl border text-xs text-left transition-all flex items-center space-x-3.5 select-none ${btnStyle}`}
                            >
                              <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] font-mono shrink-0 transition-colors ${circleStyle}`}>
                                {key}
                              </div>
                              <span className="leading-relaxed">{val}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Check / Explanation Section */}
                      <div className="flex justify-end items-center pt-1.5 border-t border-brand-border/10">
                        {!checked ? (
                          <button
                            disabled={!selectedOpt}
                            onClick={() => setMcqChecked(prev => ({ ...prev, [mcqIdx]: true }))}
                            className="py-1.5 px-4.5 bg-brand-primary hover:shadow-glow text-white text-[11px] font-extrabold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
                          >
                            Submit Answer
                          </button>
                        ) : (
                          <div className="w-full space-y-2 mt-1">
                            <div className="flex items-center space-x-2 text-xs font-bold">
                              {selectedOpt === mcq.correctAnswer ? (
                                <span className="text-brand-success">✓ Correct Logic Applied</span>
                              ) : (
                                <span className="text-brand-error">✗ Incorrect Option Selected</span>
                              )}
                              <span className="text-brand-textSecondary/60 font-medium font-mono text-[10px]">
                                (Correct Option: {mcq.correctAnswer})
                              </span>
                            </div>
                            {mcq.explanation && (
                              <p className="p-3 bg-brand-darkBg/60 border border-brand-border/25 rounded-xl text-xs text-brand-textSecondary leading-relaxed">
                                {mcq.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </section>
      </div>

      {/* ───────────────── AI STUDY ASSISTANT DRAWER (Right Slide-over) ───────────────── */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-[450px] max-w-[calc(100vw-2rem)] bg-brand-cardBg/95 border-l border-brand-border/40 shadow-2xl flex flex-col transition-all duration-300 ease-out transform ${
          isChatOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backdropFilter: 'blur(16px)' }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border/20 bg-brand-darkBg/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-textPrimary tracking-wide">AI Study Companion</h3>
              <p className="text-[9px] text-brand-accent font-semibold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse"></span>
                Reviewing notes for: {notes.title}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsChatOpen(false)}
            className="p-1.5 rounded-lg border border-brand-border/30 hover:bg-brand-border/15 text-brand-textSecondary hover:text-brand-textPrimary transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Messages list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4.5 scrollbar-thin">
          {chatHistory.map((msg) => (
            <div 
              key={msg.id}
              className={`flex items-start space-x-2.5 max-w-[88%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'}`}
            >
              <div className={`p-2 rounded-lg border shrink-0 ${
                msg.sender === 'user' 
                  ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' 
                  : 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20'
              }`}>
                {msg.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`p-3 rounded-2xl text-xs border shadow-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-brand-primary text-white border-brand-primary/10 rounded-tr-none'
                  : 'bg-brand-darkBg/60 text-brand-textPrimary border-brand-border/40 rounded-tl-none'
              }`}>
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  renderMarkdown(msg.text)
                )}
                <span className={`block text-[8px] mt-1.5 text-right font-medium ${msg.sender === 'user' ? 'text-white/60' : 'text-brand-textSecondary/60'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex items-start space-x-2.5 mr-auto max-w-[88%]">
              <div className="p-2 rounded-lg border bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20 shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="p-3 rounded-2xl bg-brand-darkBg/60 text-brand-textPrimary border border-brand-border/40 rounded-tl-none shadow-sm flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                <span className="text-[9.5px] text-brand-textSecondary ml-1.5 italic">Companion typing...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Drawer Footer input form */}
        <form onSubmit={handleSendChat} className="p-4 border-t border-brand-border/20 bg-brand-cardBg flex items-center space-x-2">
          <input 
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`Ask about ${notes.title}...`}
            disabled={chatLoading}
            className="flex-1 bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-3.5 py-3 text-xs text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40 disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="p-3 bg-brand-primary text-white rounded-xl hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Backdrop overlay for AI drawer */}
      {isChatOpen && (
        <div 
          onClick={() => setIsChatOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300"
        ></div>
      )}

      {/* Mobile Screen size Warning Popup */}
      <WarningPopup 
        isOpen={showMobileWarning}
        title="Test Generator Disabled"
        message="AI Test Generation is disabled on mobile devices as the screen size is too small for configuring complex parameters and taking exams. Please switch to a desktop or tablet device."
        confirmText="Understood"
        onConfirm={() => setShowMobileWarning(false)}
        onCancel={null}
      />

    </div>
  );
};

export default LearningNotesViewer;
