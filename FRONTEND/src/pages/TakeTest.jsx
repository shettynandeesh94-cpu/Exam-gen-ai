import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import testService from '../services/testService';
import resultService from '../services/resultService';
import LoadingSpinner from '../components/LoadingSpinner';
import Timer from '../components/Timer';
import WarningPopup from '../components/WarningPopup';
import MCQCard from '../components/MCQCard';
import ShortAnswerCard from '../components/ShortAnswerCard';
import LongAnswerCard from '../components/LongAnswerCard';
import ScenarioCard from '../components/ScenarioCard';
import { ChevronLeft, ChevronRight, Send, AlertTriangle, ShieldAlert, Award, FileText, Code, Terminal, Play, Check, RefreshCw } from 'lucide-react';

const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Test Selection State (if accessed via /take-test/select)
  const [availableTests, setAvailableTests] = useState([]);
  const [selectionLoading, setSelectionLoading] = useState(true);

  // Active Exam States
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0); // 0-indexed across all questions

  // Modals / Warnings
  const [submitWarningOpen, setSubmitWarningOpen] = useState(false);
  const [exitWarningOpen, setExitWarningOpen] = useState(false);
  const [tabViolationOpen, setTabViolationOpen] = useState(false);
  const [fullscreenViolationOpen, setFullscreenViolationOpen] = useState(false);
  const [violationsCount, setViolationsCount] = useState(0);
  const [examStarted, setExamStarted] = useState(false);

  // Flat question list for easy navigation
  const [flatQuestions, setFlatQuestions] = useState([]);

  // Custom DSA Code Editor States
  const [dsaRunResults, setDsaRunResults] = useState({});
  const [dsaRunning, setDsaRunning] = useState(false);
  const lineNumbersRef = useRef(null);

  // Code Sandbox States
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxCode, setSandboxCode] = useState(`// JavaScript Code Sandbox\n// Write your script or function below\n\nfunction main() {\n  console.log("Hello from virtual console!");\n  \n  const numbers = [1, 2, 3, 4, 5];\n  const summed = numbers.reduce((acc, curr) => acc + curr, 0);\n  console.log("Sum result is:", summed);\n  \n  return summed;\n}\n\nmain();`);
  const [sandboxLanguage] = useState('javascript');
  const [sandboxLogs, setSandboxLogs] = useState([]);
  const [sandboxResult, setSandboxResult] = useState('');
  const [sandboxError, setSandboxError] = useState('');
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxTime, setSandboxTime] = useState(0);

  const handleRunSandboxCode = async () => {
    setSandboxRunning(true);
    setSandboxError('');
    setSandboxResult('');
    setSandboxLogs([]);
    try {
      const data = await testService.runCode(sandboxCode, sandboxLanguage);
      if (data.success) {
        setSandboxLogs(data.logs || []);
        if (data.error) {
          setSandboxError(data.error);
        } else {
          setSandboxResult(data.result);
        }
        setSandboxTime(data.executionTimeMs || 0);
      } else {
        setSandboxError(data.message || 'Execution failed.');
      }
    } catch (err) {
      setSandboxError(err.response?.data?.message || 'Remote runtime unavailable.');
    } finally {
      setSandboxRunning(false);
    }
  };

  const handleInsertCodeToAnswer = () => {
    const activeQ = flatQuestions[activeQuestionIndex];
    if (!activeQ || activeQ.typeLabel === 'mcq') return;

    const formattedCode = `\`\`\`javascript\n${sandboxCode}\n\`\`\``;
    const currentAns = answers[activeQ.id] || '';
    const newAns = currentAns ? `${currentAns}\n\n${formattedCode}` : formattedCode;
    handleAnswerChange(activeQ.id, newAns);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = textarea.value.substring(0, start) + "  " + textarea.value.substring(end);
      textarea.value = newValue;
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      const activeQ = flatQuestions[activeQuestionIndex];
      if (activeQ) {
        handleAnswerChange(activeQ.id, newValue);
      }
    }
  };

  const handleLanguageChange = (lang) => {
    const activeQ = flatQuestions[activeQuestionIndex];
    if (!activeQ || activeQ.typeLabel !== 'dsa') return;

    const langKey = `${activeQ.id}_${lang}`;
    const langCode = answers[langKey] !== undefined
      ? answers[langKey]
      : (activeQ.starterTemplates?.[lang] || activeQ.starterCode || '');

    setAnswers((prev) => {
      const updated = {
        ...prev,
        [`${activeQ.id}_lang`]: lang,
        [langKey]: langCode,
        [activeQ.id]: langCode
      };
      localStorage.setItem(`active_exam_answers_${id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleRunDsaCode = async () => {
    const activeQ = flatQuestions[activeQuestionIndex];
    if (!activeQ || activeQ.typeLabel !== 'dsa') return;

    setDsaRunning(true);
    const selectedLang = answers[`${activeQ.id}_lang`] || 'javascript';
    const userCode = answers[`${activeQ.id}_${selectedLang}`] !== undefined
      ? answers[`${activeQ.id}_${selectedLang}`]
      : (activeQ.starterTemplates?.[selectedLang] || activeQ.starterCode || '');

    try {
      let functionName = 'solve';
      try {
        const tcs = JSON.parse(activeQ.testCases || '[]');
        if (tcs.length > 0 && tcs[0].functionName) {
          functionName = tcs[0].functionName;
        }
      } catch (e) { }

      const data = await testService.runCode(userCode, selectedLang, activeQ.testCases || '[]', functionName);

      setDsaRunResults(prev => ({
        ...prev,
        [activeQ.id]: {
          results: data.results || [],
          logs: data.logs || [],
          error: data.error || null,
          executionTimeMs: data.executionTimeMs || 0
        }
      }));
    } catch (err) {
      setDsaRunResults(prev => ({
        ...prev,
        [activeQ.id]: {
          results: [],
          logs: [],
          error: err.response?.data?.message || 'Execution node failed to execute runtime compilation.',
          executionTimeMs: 0
        }
      }));
    } finally {
      setDsaRunning(false);
    }
  };

  const handleResetDsaCode = () => {
    const activeQ = flatQuestions[activeQuestionIndex];
    if (!activeQ || activeQ.typeLabel !== 'dsa') return;
    const selectedLang = answers[`${activeQ.id}_lang`] || 'javascript';
    if (window.confirm(`Are you sure you want to reset your code to the starter template for ${selectedLang === 'cpp' ? 'C++' : selectedLang.toUpperCase()}?`)) {
      const template = activeQ.starterTemplates?.[selectedLang] || activeQ.starterCode || '';
      handleAnswerChange(`${activeQ.id}_${selectedLang}`, template);
    }
  };

  const renderNavButton = (q, idx) => {
    const isCurrent = idx === activeQuestionIndex;
    const isAnswered = isQuestionAnswered(idx);

    let btnStyle = 'border-brand-border text-brand-textSecondary bg-brand-darkBg/30 hover:border-brand-primary/40 hover:text-brand-textPrimary';
    if (isCurrent) {
      btnStyle = 'border-brand-primary text-brand-textPrimary bg-brand-primary/10 shadow-glow font-bold scale-105';
    } else if (isAnswered) {
      btnStyle = 'border-brand-success/40 text-brand-success bg-brand-success/5 hover:border-brand-success/60';
    }

    return (
      <button
        key={idx}
        onClick={() => setActiveQuestionIndex(idx)}
        className={`h-9 w-9 text-xs font-semibold rounded-lg border flex items-center justify-center transition-all ${btnStyle}`}
      >
        {idx + 1}
      </button>
    );
  };

  // 1. Fetch available tests on select route
  useEffect(() => {
    if (id === 'select') {
      const loadTests = async () => {
        try {
          const data = await testService.getTests();
          setAvailableTests(data.tests || []);
        } catch (e) {
          console.error(e);
        } finally {
          setSelectionLoading(false);
        }
      };
      loadTests();
    }
  }, [id]);

  // 2. Fetch specific test structure
  useEffect(() => {
    if (id && id !== 'select') {
      const fetchTest = async () => {
        try {
          setLoading(true);
          const data = await testService.getTest(id);
          setTest(data.test);

          // Flatten questions list to support linear index switching
          const qList = [];
          const t = data.test;
          if (t.questions.mcq) t.questions.mcq.forEach(q => qList.push({ ...q, typeLabel: 'mcq' }));
          if (t.questions.dsa) t.questions.dsa.forEach(q => qList.push({ ...q, typeLabel: 'dsa' }));
          if (t.questions.aptitude) t.questions.aptitude.forEach(q => qList.push({ ...q, typeLabel: 'aptitude' }));
          if (t.questions.short) t.questions.short.forEach(q => qList.push({ ...q, typeLabel: 'short' }));
          if (t.questions.long) t.questions.long.forEach(q => qList.push({ ...q, typeLabel: 'long' }));
          if (t.questions.scenario) {
            t.questions.scenario.forEach(sc => {
              qList.push({ ...sc, typeLabel: 'scenario' });
            });
          }
          setFlatQuestions(qList);

          // Restore saved answers from localStorage if present
          const cached = localStorage.getItem(`active_exam_answers_${id}`);
          if (cached) {
            setAnswers(JSON.parse(cached));
          }
        } catch (err) {
          console.error(err);
          navigate('/dashboard');
        } finally {
          setLoading(false);
        }
      };
      fetchTest();
    }
  }, [id, navigate]);

  // 3. Tab switching/Focus-loss detection (Proctoring Simulation)
  useEffect(() => {
    if (!test || id === 'select' || !examStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationsCount(prev => {
          const updated = prev + 1;
          setTabViolationOpen(true);
          return updated;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [test, id, examStarted]);

  // 3b. Fullscreen exit detection
  useEffect(() => {
    if (!test || id === 'select' || !examStarted) return;

    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      if (!isFs) {
        setViolationsCount(prev => {
          const updated = prev + 1;
          setFullscreenViolationOpen(true);
          return updated;
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [test, id, examStarted]);

  // 4. Auto-save answers to localStorage
  const handleAnswerChange = (qId, val) => {
    setAnswers((prev) => {
      const updated = { ...prev, [qId]: val };
      const activeQ = flatQuestions[activeQuestionIndex];
      if (activeQ && activeQ.typeLabel === 'dsa') {
        const selectedLang = updated[`${activeQ.id}_lang`] || 'javascript';
        if (qId === `${activeQ.id}_${selectedLang}`) {
          updated[activeQ.id] = val;
        }
      }
      localStorage.setItem(`active_exam_answers_${id}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Submit test to grader
  const handleBeginExam = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
    } catch (err) {
      console.error("Failed to enter fullscreen:", err);
    }
    setExamStarted(true);
  };

  const handleReenterFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
    } catch (err) {
      console.error("Failed to re-enter fullscreen:", err);
    }
    setFullscreenViolationOpen(false);
  };

  const handleSubmitExam = async () => {
    setSubmitWarningOpen(false);
    setLoading(true);

    try {
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error("Error exiting fullscreen:", err);
    }

    try {
      const data = await resultService.submitTest(test._id, answers);
      if (data.success && data.result) {
        // Clear cached answers
        localStorage.removeItem(`active_exam_answers_${id}`);
        navigate(`/results/${data.result._id}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error grading exam. Try submitting again.');
      setLoading(false);
    }
  };

  const handleTimeUp = () => {
    // Automatically submit when timer hits zero
    handleSubmitExam();
  };

  const handleNext = () => {
    if (activeQuestionIndex < flatQuestions.length - 1) {
      setActiveQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(prev => prev - 1);
    }
  };

  // Render selection dashboard if no specific test ID
  if (id === 'select') {
    if (selectionLoading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center bg-brand-darkBg">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fadeIn text-brand-textPrimary">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-textPrimary tracking-tight">Active Assessments</h1>
            <p className="text-xs text-brand-textSecondary mt-1">Select an exam to start your secure proctored attempt.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="py-2 px-4 rounded-xl border border-brand-border/40 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all cursor-pointer shrink-0"
          >
            Return to Dashboard
          </button>
        </div>

        {availableTests.length === 0 ? (
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-12 text-center space-y-4">
            <div className="p-3 rounded-full bg-brand-darkBg border border-brand-border/30 text-brand-textSecondary inline-block">
              <FileText className="w-10 h-10 opacity-30" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-brand-textPrimary">No active tests found</p>
              <p className="text-xs text-brand-textSecondary max-w-sm mx-auto">Generate an AI test from your materials in the generator panel before attempting.</p>
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
            {availableTests.map((t) => (
              <div
                key={t._id}
                className="glass-panel border border-brand-border/35 hover:border-brand-primary/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-brand-textPrimary leading-snug">{t.subject}</h3>
                  <p className="text-xs text-brand-textSecondary">Source: {t.documentName} | {t.duration} Mins</p>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs font-semibold">
                    {t.difficulty}
                  </span>
                  <button
                    onClick={() => navigate(`/take-test/${t._id}`)}
                    className="py-2 px-4 rounded-xl bg-brand-primary text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    Start Attempt
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Loading indicator for active exam loading
  if (loading || !test) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-brand-darkBg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Instructions screen before beginning exam (forces fullscreen user gesture)
  if (!examStarted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 text-brand-textPrimary font-sans">
        <div className="max-w-2xl w-full glass-panel border border-brand-border/40 rounded-2xl p-8 space-y-6 relative overflow-hidden animate-scaleUp">
          {/* Top border glow accent */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-primary to-brand-secondary"></div>

          <div className="text-center space-y-2">
            <div className="p-3 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 inline-block shadow-glow mb-2">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-extrabold text-brand-textPrimary tracking-tight">Proctored Assessment Setup</h1>
            <p className="text-xs text-brand-textSecondary">
              Please review the exam environment rules below before beginning the test.
            </p>
          </div>

          <div className="border-y border-brand-border/20 py-4 grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <span className="text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider block">Subject</span>
              <span className="text-xs font-semibold text-brand-textPrimary truncate block max-w-full" title={test.subject}>{test.subject}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider block">Duration</span>
              <span className="text-xs font-semibold text-brand-textPrimary">{test.duration} Minutes</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider block">Questions</span>
              <span className="text-xs font-semibold text-brand-textPrimary">{flatQuestions.length} Questions</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-brand-textPrimary">Assessment Rules:</h3>
            <ul className="space-y-2 text-xs text-brand-textSecondary">
              <li className="flex items-start space-x-2">
                <span className="text-brand-primary font-bold mr-1">•</span>
                <span>
                  <strong>Fullscreen Mode Required:</strong> This test will run in fullscreen mode. Exiting fullscreen will trigger an infraction violation.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-brand-primary font-bold mr-1">•</span>
                <span>
                  <strong>No Window Switching:</strong> Navigating away from this window or switching tabs will trigger tab-switching violation alerts.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-brand-primary font-bold mr-1">•</span>
                <span>
                  <strong>Maximum Infractions:</strong> Exceeding 3 proctoring violations of any kind will flag your final assessment score.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/take-test/select')}
              className="flex-1 py-3 px-4 rounded-xl border border-brand-border/40 text-xs font-bold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all active:scale-95 cursor-pointer"
            >
              Cancel & Return
            </button>
            <button
              onClick={handleBeginExam}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-xs font-bold hover:shadow-glow hover:brightness-110 transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>Begin Exam & Enter Fullscreen</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeQuestion = flatQuestions[activeQuestionIndex];

  // Helper check if a question or scenario subquestions are answered
  const isQuestionAnswered = (index) => {
    const q = flatQuestions[index];
    if (!q) return false;
    if (q.typeLabel === 'scenario') {
      return q.subQuestions.every(sub => answers[sub.id] !== undefined && answers[sub.id] !== '');
    }
    return answers[q.id] !== undefined && answers[q.id] !== '';
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row text-brand-textPrimary font-sans pb-8">
      {/* Dynamic Question Navigator Sidebar */}
      <aside className="w-full lg:w-72 bg-brand-cardBg border-b lg:border-b-0 lg:border-r border-brand-border/30 p-5 flex flex-col shrink-0 select-none">

        {/* Exam stats */}
        <div className="space-y-4 border-b border-brand-border/20 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-brand-textPrimary leading-tight truncate" title={test.subject}>{test.subject}</h2>
            <p className="text-[11px] text-brand-textSecondary mt-0.5 truncate">Source: {test.documentName}</p>
          </div>

          {/* Active Timer */}
          <Timer duration={test.duration} onTimeUp={handleTimeUp} />
        </div>

        {/* Navigator Grid */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1">
          {flatQuestions.some(q => q.typeLabel === 'mcq') && (
            <div>
              <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-2">
                MCQ Section
              </span>
              <div className="grid grid-cols-5 gap-2.5">
                {flatQuestions.map((q, idx) => {
                  if (q.typeLabel !== 'mcq') return null;
                  return renderNavButton(q, idx);
                })}
              </div>
            </div>
          )}

          {flatQuestions.some(q => q.typeLabel === 'dsa') && (
            <div>
              <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-2">
                DSA Section
              </span>
              <div className="grid grid-cols-5 gap-2.5">
                {flatQuestions.map((q, idx) => {
                  if (q.typeLabel !== 'dsa') return null;
                  return renderNavButton(q, idx);
                })}
              </div>
            </div>
          )}

          {flatQuestions.some(q => q.typeLabel === 'aptitude') && (
            <div>
              <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-2">
                Aptitude Section
              </span>
              <div className="grid grid-cols-5 gap-2.5">
                {flatQuestions.map((q, idx) => {
                  if (q.typeLabel !== 'aptitude') return null;
                  return renderNavButton(q, idx);
                })}
              </div>
            </div>
          )}

          {flatQuestions.some(q => !['mcq', 'dsa', 'aptitude'].includes(q.typeLabel)) && (
            <div>
              <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-2">
                Subjective Section
              </span>
              <div className="grid grid-cols-5 gap-2.5">
                {flatQuestions.map((q, idx) => {
                  if (['mcq', 'dsa', 'aptitude'].includes(q.typeLabel)) return null;
                  return renderNavButton(q, idx);
                })}
              </div>
            </div>
          )}
        </div>

        {/* Violations and warnings */}
        <div className="space-y-3 pt-3 border-t border-brand-border/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-brand-textSecondary">Exit Warnings:</span>
            <span className={`font-bold font-mono px-2 py-0.5 rounded ${violationsCount > 0 ? 'bg-brand-error/10 text-brand-error animate-pulse' : 'bg-brand-darkBg text-brand-textSecondary'}`}>
              {violationsCount} / 3
            </span>
          </div>

          <button
            onClick={() => setSubmitWarningOpen(true)}
            className="w-full py-2.5 px-4 bg-brand-success hover:shadow-glow text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish Attempt</span>
          </button>
        </div>
      </aside>

      {/* Workspace wrapper and sidebar arena */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">

        {/* Main Workspace Section */}
        <section className={`flex-1 p-6 md:p-8 flex flex-col justify-between ${activeQuestion?.typeLabel === 'dsa' ? 'max-w-full lg:max-w-[96%]' : (showSandbox ? 'max-w-3xl' : 'max-w-4xl')} w-full mx-auto space-y-6 transition-all duration-300`}>

          {/* Render Active Question Card */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] text-brand-textSecondary uppercase tracking-widest font-bold font-mono">
                Assessment Arena
              </span>
              {activeQuestion.typeLabel !== 'mcq' && activeQuestion.typeLabel !== 'aptitude' && activeQuestion.typeLabel !== 'dsa' && (
                <button
                  onClick={() => setShowSandbox(!showSandbox)}
                  className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold select-none cursor-pointer transition-all ${showSandbox
                    ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-glow'
                    : 'border-brand-border/40 text-brand-textSecondary hover:border-brand-primary/30 hover:text-brand-textPrimary'
                    }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{showSandbox ? 'Close Sandbox' : 'Open Code Sandbox'}</span>
                </button>
              )}
            </div>

            {(activeQuestion.typeLabel === 'mcq' || activeQuestion.typeLabel === 'aptitude') && (
              <MCQCard
                question={activeQuestion}
                index={activeQuestionIndex + 1}
                selectedAnswer={answers[activeQuestion.id]}
                onChange={(val) => handleAnswerChange(activeQuestion.id, val)}
              />
            )}

            {activeQuestion.typeLabel === 'dsa' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[500px]">
                {/* Left Side: Problem statement & Test Cases */}
                <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 flex flex-col justify-between space-y-5 bg-brand-cardBg/90 overflow-y-auto max-h-[600px]">
                  <div className="space-y-5">
                    {/* Header: Title, Mark & Topic */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="px-2.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[10px] font-bold uppercase tracking-wider">
                          {activeQuestion.topic || 'Coding Challenge'}
                        </span>
                        <span className="text-xs text-brand-textSecondary font-semibold">
                          Max Marks: {activeQuestion.marks || activeQuestion.maxMarks || 10}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-extrabold text-brand-textPrimary">
                          {activeQuestion.questionTitle || 'Coding Challenge'}
                        </h2>
                        {activeQuestion.difficulty && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${activeQuestion.difficulty.toLowerCase() === 'easy' ? 'bg-emerald-580/10 text-emerald-450 border-emerald-500/20' :
                            activeQuestion.difficulty.toLowerCase() === 'hard' ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                            {activeQuestion.difficulty}
                          </span>
                        )}
                      </div>

                      {/* Expected Complexities */}
                      {(activeQuestion.expectedTimeComplexity || activeQuestion.expectedSpaceComplexity) && (
                        <div className="flex items-center space-x-3 text-[10px] text-brand-textSecondary font-mono bg-brand-darkBg/40 border border-brand-border/20 rounded-lg p-2 max-w-fit">
                          {activeQuestion.expectedTimeComplexity && (
                            <div><span className="text-zinc-500">Time:</span> <strong className="text-brand-textPrimary">{activeQuestion.expectedTimeComplexity}</strong></div>
                          )}
                          {activeQuestion.expectedTimeComplexity && activeQuestion.expectedSpaceComplexity && (
                            <span className="text-brand-border/40">|</span>
                          )}
                          {activeQuestion.expectedSpaceComplexity && (
                            <div><span className="text-zinc-500">Space:</span> <strong className="text-brand-textPrimary">{activeQuestion.expectedSpaceComplexity}</strong></div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Problem Statement */}
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider">Problem Statement</h3>
                      <div className="text-xs text-brand-textSecondary leading-relaxed whitespace-pre-wrap font-sans bg-brand-darkBg/20 border border-brand-border/10 rounded-xl p-3.5">
                        {activeQuestion.question}
                      </div>
                    </div>

                    {/* Constraints */}
                    {activeQuestion.constraints && (
                      <div className="space-y-1.5">
                        <h3 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider">Constraints</h3>
                        <div className="p-3 bg-brand-darkBg border border-brand-border/30 rounded-xl font-mono text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {activeQuestion.constraints}
                        </div>
                      </div>
                    )}

                    {/* Input Format & Output Format */}
                    {(activeQuestion.inputFormat || activeQuestion.outputFormat) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeQuestion.inputFormat && (
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider">Input Format</h4>
                            <div className="p-3 bg-brand-darkBg/60 border border-brand-border/20 rounded-xl text-xs text-brand-textSecondary leading-relaxed whitespace-pre-wrap">
                              {activeQuestion.inputFormat}
                            </div>
                          </div>
                        )}
                        {activeQuestion.outputFormat && (
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider">Output Format</h4>
                            <div className="p-3 bg-brand-darkBg/60 border border-brand-border/20 rounded-xl text-xs text-brand-textSecondary leading-relaxed whitespace-pre-wrap">
                              {activeQuestion.outputFormat}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sample Case */}
                    {(activeQuestion.sampleInput || activeQuestion.sampleOutput) && (
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider">Example Case</h3>
                        <div className="p-3.5 bg-brand-darkBg/80 border border-brand-border/35 rounded-xl space-y-2">
                          {activeQuestion.sampleInput && (
                            <div className="font-mono text-xs text-brand-textSecondary block">
                              <span className="text-zinc-500 font-bold block mb-1">SAMPLE INPUT</span>
                              <pre className="p-2 rounded bg-black/40 overflow-x-auto text-[11px] text-zinc-300">{activeQuestion.sampleInput}</pre>
                            </div>
                          )}
                          {activeQuestion.sampleOutput && (
                            <div className="font-mono text-xs text-brand-textSecondary block">
                              <span className="text-zinc-550 font-bold block mb-1">SAMPLE OUTPUT</span>
                              <pre className="p-2 rounded bg-black/40 overflow-x-auto text-[11px] text-emerald-350 font-semibold">{activeQuestion.sampleOutput}</pre>
                            </div>
                          )}
                          {activeQuestion.explanation && (
                            <div className="text-xs text-brand-textSecondary leading-relaxed border-t border-brand-border/15 pt-2 mt-1">
                              <span className="font-bold text-[10px] text-brand-primary uppercase tracking-wider block mb-1">Explanation</span>
                              <p className="font-sans text-[11px] leading-relaxed">{activeQuestion.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Predefined Test Cases Status Reviews */}
                  <div className="pt-4 border-t border-brand-border/20 space-y-3">
                    <h4 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider">
                      Validation Test Cases
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        let testCases = [];
                        try {
                          testCases = JSON.parse(activeQuestion.testCases || '[]');
                        } catch (e) { }

                        const resultsData = dsaRunResults[activeQuestion.id] || {};
                        const runResults = resultsData.results || [];

                        return testCases.map((tc, idx) => {
                          const executed = runResults[idx];
                          const passed = executed ? executed.passed : null;

                          return (
                            <div key={idx} className="p-3 rounded-lg border text-xs bg-brand-darkBg/40 border-brand-border/20 space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-brand-textPrimary">Test Case {idx + 1}</span>
                                {passed === true && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                                    Passed
                                  </span>
                                )}
                                {passed === false && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-450 border border-rose-550/20 font-bold">
                                    Failed
                                  </span>
                                )}
                                {passed === null && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-brand-darkBg text-brand-textSecondary border border-brand-border/30">
                                    Unattempted
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[10px] text-brand-textSecondary space-y-0.5">
                                <div><span className="text-zinc-500">Input:</span> {JSON.stringify(tc.input && tc.input[0])}</div>
                                <div><span className="text-zinc-500">Expected:</span> {JSON.stringify(tc.expected)}</div>
                                {executed && executed.error && (
                                  <div className="text-rose-400"><span className="text-zinc-500">Error:</span> {executed.error}</div>
                                )}
                                {executed && !executed.error && !executed.passed && (
                                  <div><span className="text-rose-400">Actual:</span> <span className="text-rose-300 font-semibold">{JSON.stringify(executed.got)}</span></div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Right Side: Interactive Code Editor & Actions */}
                <div className="flex flex-col space-y-3 min-h-[500px]">
                  {/* Editor Header Tools */}
                  {(() => {
                    const selectedLang = answers[`${activeQuestion.id}_lang`] || 'javascript';
                    const activeCode = answers[`${activeQuestion.id}_${selectedLang}`] !== undefined
                      ? answers[`${activeQuestion.id}_${selectedLang}`]
                      : (activeQuestion.starterTemplates?.[selectedLang] || activeQuestion.starterCode || '');

                    const availableDsaLanguages = [
                      { value: 'javascript', label: 'JavaScript' },
                      { value: 'python', label: 'Python 3' },
                      { value: 'java', label: 'Java (Solution)' },
                      { value: 'cpp', label: 'C++ (G++)' },
                      { value: 'c', label: 'C (GCC)' }
                    ];

                    return (
                      <>
                        <div className="flex justify-between items-center px-4 py-2 bg-brand-darkBg border border-brand-border/30 rounded-t-xl text-[10px] font-semibold text-brand-textSecondary select-none">
                          <div className="flex items-center space-x-2">
                            <span className="text-zinc-500 font-bold uppercase tracking-wider">Language:</span>
                            <select
                              value={selectedLang}
                              onChange={(e) => handleLanguageChange(e.target.value)}
                              className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none focus:border-brand-primary cursor-pointer hover:bg-zinc-805 transition-all font-sans"
                            >
                              {availableDsaLanguages.map((l) => (
                                <option key={l.value} value={l.value} className="bg-zinc-950 text-white">{l.label}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={handleResetDsaCode}
                            className="flex items-center space-x-1 hover:text-brand-textPrimary transition-all cursor-pointer font-bold animate-fadeIn"
                          >
                            <RefreshCw className="w-3 h-3 text-brand-primary" />
                            <span>Reset Code Template</span>
                          </button>
                        </div>

                        {/* Responsive Code Textarea Editor */}
                        <div className="flex-1 flex overflow-hidden border-x border-b border-brand-border/30 rounded-b-xl bg-brand-darkBg text-xs font-mono h-[450px]">
                          <div ref={lineNumbersRef} className="py-4 select-none text-right text-brand-textSecondary/60 border-r border-brand-border/15 bg-brand-darkBg/80 px-2 min-w-[2.5rem] overflow-hidden whitespace-pre">
                            {(activeCode || '').split('\n').map((_, i) => (
                              <div key={i} className="leading-6 h-6">{i + 1}</div>
                            ))}
                          </div>
                          <textarea
                            value={activeCode}
                            onChange={(e) => handleAnswerChange(`${activeQuestion.id}_${selectedLang}`, e.target.value)}
                            onKeyDown={handleKeyDown}
                            onScroll={(e) => {
                              if (lineNumbersRef.current) {
                                lineNumbersRef.current.scrollTop = e.target.scrollTop;
                              }
                            }}
                            className="flex-1 p-4 bg-transparent text-emerald-400 font-semibold focus:outline-none placeholder-zinc-750 leading-6 h-full resize-none w-full whitespace-pre overflow-auto"
                            style={{ tabSize: 2 }}
                          />
                        </div>
                      </>
                    );
                  })()}

                  {/* Compile/Run Actions & Console outputs summaries */}
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={handleRunDsaCode}
                      disabled={dsaRunning}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-glow text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                    >
                      {dsaRunning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Executing sandboxed tests...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Execute Code & Run Tests</span>
                        </>
                      )}
                    </button>

                    {/* Console stdout outputs */}
                    {dsaRunResults[activeQuestion.id] && (
                      <div className="bg-brand-darkBg/90 border border-brand-border/30 rounded-xl p-3 text-xs col-span-2 space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar">
                        <div>
                          <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-1 font-bold">
                            <span>Compiler Console Logs</span>
                            {dsaRunResults[activeQuestion.id].executionTimeMs > 0 && (
                              <span>{dsaRunResults[activeQuestion.id].executionTimeMs}ms</span>
                            )}
                          </div>
                          <div className="font-mono text-emerald-300 space-y-1">
                            {dsaRunResults[activeQuestion.id].error && (
                              <div className="text-rose-450 py-1 font-bold block whitespace-pre-wrap">[Execution Error] {dsaRunResults[activeQuestion.id].error}</div>
                            )}
                            {dsaRunResults[activeQuestion.id].logs.map((log, lIdx) => (
                              <div key={lIdx} className="opacity-95 leading-relaxed block">&gt; {log}</div>
                            ))}
                            {!dsaRunResults[activeQuestion.id].error && dsaRunResults[activeQuestion.id].logs.length === 0 && (
                              <div className="text-zinc-500 italic text-[11px] py-0.5">Console did not generate outputs. Test execution logs are empty.</div>
                            )}
                          </div>
                        </div>

                        {/* Test Cases Results Summary inside Console */}
                        <div className="border-t border-brand-border/15 pt-2">
                          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold mb-1.5 flex justify-between items-center">
                            <span>Test Cases Status</span>
                            <span className="text-[9px] text-zinc-650 tracking-normal normal-case italic">(Also shown at bottom left details)</span>
                          </div>
                          <div className="space-y-1 font-mono text-[11px]">
                            {(() => {
                              let testCases = [];
                              try {
                                testCases = JSON.parse(activeQuestion.testCases || '[]');
                              } catch (e) { }

                              const resultsData = dsaRunResults[activeQuestion.id] || {};
                              const runResults = resultsData.results || [];

                              if (runResults.length === 0 && !resultsData.error) {
                                return (
                                  <div className="text-zinc-500 italic">
                                    No results returned. Ensure implementation and syntax are correct.
                                  </div>
                                );
                              }

                              return testCases.map((tc, idx) => {
                                const executed = runResults[idx];
                                const passed = executed ? executed.passed : null;

                                return (
                                  <div key={idx} className="flex justify-between items-center bg-black/15 px-2.5 py-1 rounded border border-brand-border/5">
                                    <span className="text-zinc-400 font-medium">Test Case {idx + 1}:</span>
                                    {passed === true && (
                                      <span className="text-emerald-450 font-bold">Passed</span>
                                    )}
                                    {passed === false && (
                                      <span className="text-rose-450 font-bold">
                                        Failed {executed.error ? `(${executed.error})` : `(Got: ${JSON.stringify(executed.got)} Expected: ${JSON.stringify(tc.expected)})`}
                                      </span>
                                    )}
                                    {passed === null && (
                                      <span className="text-zinc-550">Not Run</span>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeQuestion.typeLabel === 'short' && (
              <ShortAnswerCard
                question={activeQuestion}
                index={activeQuestionIndex + 1}
                answer={answers[activeQuestion.id]}
                onChange={(val) => handleAnswerChange(activeQuestion.id, val)}
              />
            )}

            {activeQuestion.typeLabel === 'long' && (
              <LongAnswerCard
                question={activeQuestion}
                index={activeQuestionIndex + 1}
                answer={answers[activeQuestion.id]}
                onChange={(val) => handleAnswerChange(activeQuestion.id, val)}
              />
            )}

            {activeQuestion.typeLabel === 'scenario' && (
              <ScenarioCard
                scenario={activeQuestion}
                index={activeQuestionIndex + 1}
                answers={answers}
                onAnswerChange={(qId, val) => handleAnswerChange(qId, val)}
              />
            )}
          </div>

          {/* Navigation Controls footer */}
          <div className="flex items-center justify-between border-t border-brand-border/10 pt-5 mt-auto">
            <button
              onClick={handlePrev}
              disabled={activeQuestionIndex === 0}
              className="py-2.5 px-4 rounded-xl border border-brand-border/40 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 disabled:opacity-40 disabled:pointer-events-none flex items-center space-x-1 transition-all active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-brand-textSecondary font-mono font-bold">
              QUESTION {activeQuestionIndex + 1} OF {flatQuestions.length}
            </span>

            {activeQuestionIndex === flatQuestions.length - 1 ? (
              <button
                onClick={() => setSubmitWarningOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-brand-success text-white text-xs font-bold hover:shadow-glow flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span>Submit Exam</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="py-2.5 px-4 rounded-xl border border-brand-border/40 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 flex items-center space-x-1 transition-all active:scale-95 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* ─── Code Arena Sandbox Workspace Drawer ─── */}
        {showSandbox && (
          <aside className="w-full xl:w-[480px] bg-brand-cardBg border-t xl:border-t-0 xl:border-l border-brand-border/30 p-6 flex flex-col shrink-0 space-y-5 animate-slideInRight select-none">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-brand-border/25">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-textPrimary">Code Arena Sandbox</h3>
                  <p className="text-[10px] text-brand-textSecondary">Write & run code securely</p>
                </div>
              </div>

              <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded bg-brand-darkBg border border-brand-border/35 text-[10px] font-semibold text-brand-textSecondary font-mono block">
                <span>JavaScript (Node VM)</span>
              </div>
            </div>

            {/* Code Inputs Textarea */}
            <div className="flex-1 flex flex-col min-h-[350px] relative">
              <div className="h-8 bg-brand-darkBg border-t border-x border-brand-border/35 rounded-t-xl px-4 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>main.js</span>
                <span className="text-[10px] text-zinc-500">Run code safe context</span>
              </div>
              <textarea
                value={sandboxCode}
                onChange={(e) => setSandboxCode(e.target.value)}
                className="flex-1 font-mono bg-brand-darkBg text-emerald-400 p-4 border border-brand-border/35 rounded-b-xl focus:outline-none focus:border-brand-primary placeholder-zinc-500 w-full text-xs leading-relaxed resize-none shadow-inner"
                style={{ tabSize: 2 }}
                placeholder="// Write your javascript code here..."
              />
            </div>

            {/* Run Actions Triggers */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleInsertCodeToAnswer}
                className="flex-1 py-2 px-3 border border-brand-border/35 hover:border-brand-primary/45 rounded-xl text-[11px] font-bold text-brand-textSecondary hover:text-brand-textPrimary flex items-center justify-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
                title="Append formatted markup code to active text input"
              >
                <Check className="w-3.5 h-3.5 text-brand-success" />
                <span>Copy Code to Answer</span>
              </button>

              <button
                onClick={handleRunSandboxCode}
                disabled={sandboxRunning}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-glow text-white text-[11px] font-bold rounded-xl flex items-center justify-center space-x-1.5 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
              >
                {sandboxRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Run JavaScript Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Logging and outputs terminal */}
            <div className="flex-1 flex flex-col min-h-[160px] bg-brand-darkBg border border-brand-border/30 rounded-xl overflow-hidden font-mono text-xs">
              <div className="px-4 py-2 bg-brand-darkBg border-b border-brand-border/20 flex justify-between items-center text-[10px] text-brand-textSecondary">
                <span className="font-bold">Console Output Logs</span>
                {sandboxTime > 0 && <span>{sandboxTime}ms</span>}
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-1 bg-black/35 min-h-[120px] max-h-[220px]">
                {sandboxError && (
                  <div className="text-rose-400 p-2 rounded bg-rose-500/5 border border-rose-500/15 whitespace-pre-wrap leading-relaxed/3">
                    [Runtime Error] {sandboxError}
                  </div>
                )}

                {!sandboxError && sandboxResult && (
                  <div className="text-zinc-400 p-2 rounded bg-zinc-600/5 border border-zinc-500/10 flex flex-col">
                    <span className="text-[10px] text-zinc-500">Return value:</span>
                    <span className="text-emerald-300 font-semibold">{sandboxResult}</span>
                  </div>
                )}

                {sandboxLogs.map((log, index) => (
                  <div key={index} className="text-emerald-400 py-0.5 border-b border-white/[0.02]">
                    &gt; {log}
                  </div>
                ))}

                {!sandboxError && !sandboxResult && sandboxLogs.length === 0 && (
                  <div className="text-zinc-500 italic text-[11px] text-center mt-6">
                    Console is empty. Click Run to evaluate code execution logs.
                  </div>
                )}
              </div>
            </div>

          </aside>
        )}
      </div>

      {/* ─── Proctor & Warning Modals ─── */}

      {/* Tab loss focus Violation warning */}
      <WarningPopup
        isOpen={tabViolationOpen}
        title="Proctoring Alert: Tab Switched"
        message={`Warning: You navigated away from the exam interface. Moving outside of the window is a violation of exam rules. Multiple infractions will flag your score.\n\nInfraction count: ${violationsCount}/3`}
        confirmText="Acknowledge & Return"
        onConfirm={() => setTabViolationOpen(false)}
      />

      {/* Fullscreen exit Violation warning */}
      <WarningPopup
        isOpen={fullscreenViolationOpen}
        title="Proctoring Alert: Fullscreen Exited"
        message={`Warning: Fullscreen mode was exited. Fullscreen mode is required to maintain proctoring security. Exiting fullscreen is an infraction violation.\n\nInfraction count: ${violationsCount}/3`}
        confirmText="Re-enter Fullscreen"
        onConfirm={handleReenterFullscreen}
      />

      {/* Early submit warning */}
      <WarningPopup
        isOpen={submitWarningOpen}
        title="Submit Assessment"
        message="Are you sure you want to finish and submit your attempt? Answers will be saved and automatically evaluated by the AI grading pipeline."
        confirmText="Yes, Submit Exam"
        cancelText="Review Questions"
        onConfirm={handleSubmitExam}
        onCancel={() => setSubmitWarningOpen(false)}
      />
    </div>
  );
};

export default TakeTest;
