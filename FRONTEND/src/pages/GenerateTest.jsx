import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { BookOpen, Sparkles, AlertCircle, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import documentService from '../services/documentService';
import testService from '../services/testService';

const GenerateTest = () => {
  const navigate = useNavigate();
  const { type } = useParams();
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Active parameter configuration
  const configMap = {
    mcq: {
      title: 'Generate General MCQ Exam',
      label: 'Number of Multiple Choice Questions',
      min: 1,
      max: 15,
      defaultVal: 5
    },
    aptitude: {
      title: 'Generate Aptitude Exam',
      label: 'Number of Aptitude MCQs',
      min: 1,
      max: 15,
      defaultVal: 5
    },
    dsa: {
      title: 'Generate DSA Coding Exam',
      label: 'Number of Coding Challenges',
      min: 1,
      max: 20,
      defaultVal: 2
    }
  };

  const activeType = ['mcq', 'aptitude', 'dsa'].includes(type) ? type : 'mcq';
  const activeConfig = configMap[activeType];

  // Form Fields
  const [selectedDocId, setSelectedDocId] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(activeConfig.defaultVal);

  // DSA Specialty Fields
  const [dsaTopic, setDsaTopic] = useState('Mixed');
  const [dsaSource, setDsaSource] = useState('AI Generated');
  const [dsaTimeLimit, setDsaTimeLimit] = useState('45 Minutes');

  // Aptitude Specialty Fields
  const [aptitudeTopic, setAptitudeTopic] = useState('Mixed Aptitude');

  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [error, setError] = useState(null);
  const [generatedTest, setGeneratedTest] = useState(null);

  // Sync question count default on type changes
  useEffect(() => {
    setQuestionCount(activeConfig.defaultVal);
    setError(null);
    setGeneratedTest(null);
  }, [type]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await documentService.getDocuments();
        setDocuments(data.documents || []);
        if (data.documents && data.documents.length > 0) {
          setSelectedDocId(data.documents[0]._id);
          setSubject(data.documents[0].subject);
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
      } finally {
        setDocsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  // Update subject input when document selection changes
  const handleDocChange = (docId) => {
    setSelectedDocId(docId);
    const selectedDoc = documents.find(d => d._id === docId);
    if (selectedDoc) {
      setSubject(selectedDoc.subject);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    // For DSA, subject is determined by dsaTopic. For Aptitude, it is determined by aptitudeTopic.
    const finalSubject = activeType === 'dsa'
      ? (dsaTopic === 'Mixed' ? 'Data Structures & Algorithms' : dsaTopic)
      : activeType === 'aptitude'
        ? aptitudeTopic
        : subject;

    if (!finalSubject && activeType !== 'dsa' && activeType !== 'aptitude') {
      setError('Please specify a subject domain.');
      return;
    }

    const countNum = Number(questionCount);
    if (isNaN(countNum) || countNum < activeConfig.min || countNum > activeConfig.max) {
      setError(`Please specify a question quantity between ${activeConfig.min} and ${activeConfig.max}.`);
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedTest(null);

    // Simulate RAG pipeline processing steps
    const steps = activeType === 'dsa' ? [
      'Initializing DSA Question Compilation...',
      'Formulating original coding interview problem...',
      'Designing constraints and complex arguments...',
      'Writing Java execution signature...',
      'Assembling visible and hidden test cases...',
      'AI Question Compilation complete!'
    ] : activeType === 'aptitude' ? [
      'Initializing Aptitude Assessment Setup...',
      'Targeting quantitative and logical reasoning frameworks...',
      'Formulating standard multiple-choice challenges...',
      'Calculating step-by-step mathematical explanations...',
      'Verifying distractor options accuracy...',
      'Aptitude Question Compilation complete!'
    ] : [
      'Locating document nodes in vector database...',
      'Retrieving relevant topic summaries...',
      'Synthesizing contextual evaluation criteria...',
      'Compiling MCQ statements and distractors...',
      'Formulating scenario narratives and grading rubrics...',
      'AI Question Compilation complete!'
    ];

    for (let i = 0; i < steps.length; i++) {
      setGenerationProgress(steps[i]);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const data = await testService.generateTest({
        documentId: (activeType === 'dsa' || activeType === 'aptitude') ? null : (selectedDocId || null),
        subject: finalSubject,
        difficulty,
        mcqCount: activeType === 'mcq' ? Number(questionCount) : 0,
        dsaCount: activeType === 'dsa' ? Number(questionCount) : 0,
        aptitudeCount: activeType === 'aptitude' ? Number(questionCount) : 0,
        shortCount: 0,
        longCount: 0,
        scenarioCount: 0,
        // DSA / Aptitude specialized fields
        topic: activeType === 'dsa' ? dsaTopic : (activeType === 'aptitude' ? aptitudeTopic : undefined),
        questionSource: activeType === 'dsa' ? dsaSource : undefined,
        timeLimit: activeType === 'dsa' ? dsaTimeLimit : undefined
      });

      if (data.success) {
        setGeneratedTest(data.test);
      } else {
        setError(data.message || 'Generation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error compiling test. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-8 animate-fadeIn max-w-md mx-auto py-12 px-4 text-center">
        <div className="glass-panel border border-brand-border/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 to-brand-warning"></div>

          <div className="mx-auto p-4 rounded-full bg-brand-warning/10 border border-brand-warning/20 text-brand-warning shadow-glow w-16 h-16 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-extrabold text-brand-textPrimary tracking-tight">
              Test Generator Disabled on Mobile
            </h2>
            <p className="text-xs text-brand-textSecondary leading-relaxed">
              AI Test Generation is disabled on mobile devices because the screen size is too small for configuring complex parameters and taking exams.
              Please switch to a desktop or tablet for the optimal workspace experience.
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-brand-darkBg hover:bg-brand-cardBg border border-brand-border/40 hover:text-brand-textPrimary text-xs font-bold text-brand-textSecondary rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (docsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const difficulties = ['Easy', 'Medium', 'Hard'];

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      <PageHeader
        title={activeConfig.title}
        subtitle={activeType === 'dsa' ? 'Practice coding interviews with AI-generated DSA problems inspired by real technical interviews.' : 'Extract knowledge from your documents to compile customized exams.'}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="py-2 px-4 rounded-xl border border-brand-border/40 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all cursor-pointer animate-fadeIn"
        >
          Return to Dashboard
        </button>
      </PageHeader>

      {error && (
        <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!generatedTest && !generating ? (
        /* Configuration Form */
        <form onSubmit={handleGenerate} className="glass-panel border border-brand-border/40 rounded-2xl p-6 md:p-8 space-y-6 relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent"></div>

          {/* Document Select - Hidden for DSA and Aptitude */}
          {activeType === 'mcq' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                Source Material
              </label>
              {documents.length === 0 ? (
                <div className="p-4 rounded-xl border border-brand-border/40 bg-brand-darkBg/30 text-xs text-brand-textSecondary flex justify-between items-center">
                  <span>No PDF uploaded yet. Standard general test templates will be generated.</span>
                  <span onClick={() => navigate('/upload-pdf')} className="text-brand-accent cursor-pointer hover:underline">Upload PDF</span>
                </div>
              ) : (
                <select
                  value={selectedDocId}
                  onChange={(e) => handleDocChange(e.target.value)}
                  className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all"
                >
                  <option value="">-- Manual Topic Input --</option>
                  {documents.map(d => (
                    <option key={d._id} value={d._id}>{d.originalName} ({d.subject})</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {activeType === 'dsa' ? (
            /* DSA Specialized Fields */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Topic Dropdown */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                    DSA Topic
                  </label>
                  <select
                    value={dsaTopic}
                    onChange={(e) => setDsaTopic(e.target.value)}
                    className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all"
                  >
                    {[
                      'Mixed', 'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue',
                      'HashMap', 'HashSet', 'Trees', 'Binary Search Tree',
                      'Heap / Priority Queue', 'Graph', 'Dynamic Programming',
                      'Greedy', 'Backtracking', 'Sliding Window', 'Binary Search',
                      'Recursion', 'Bit Manipulation', 'Trie'
                    ].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Level Segmented Buttons */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                    Difficulty Level
                  </label>
                  <div className="flex bg-brand-darkBg/60 border border-brand-border/30 rounded-xl p-1 w-full">
                    {difficulties.map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${difficulty === diff
                          ? 'bg-brand-primary text-white shadow-glow'
                          : 'text-brand-textSecondary hover:text-brand-textPrimary'
                          }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Question Source Radio Buttons */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                    Question Source
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'AI Generated', label: 'AI Generated ⭐ (Recommended)' },
                      { value: 'Inspired by LeetCode', label: 'Inspired by LeetCode' },
                      { value: 'Inspired by HackerRank', label: 'Inspired by HackerRank' },
                      { value: 'Mixed Interview Questions', label: 'Mixed Interview Questions' }
                    ].map((src) => (
                      <label
                        key={src.value}
                        className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${dsaSource === src.value
                          ? 'border-brand-primary/60 bg-brand-primary/5 text-brand-textPrimary'
                          : 'border-brand-border/30 hover:border-brand-border/60 text-brand-textSecondary'
                          }`}
                      >
                        <input
                          type="radio"
                          name="dsaSource"
                          value={src.value}
                          checked={dsaSource === src.value}
                          onChange={(e) => setDsaSource(e.target.value)}
                          className="text-brand-primary focus:ring-brand-primary/50"
                        />
                        <span className="text-xs font-medium">{src.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Time Limit Dropdown */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                    Time Limit
                  </label>
                  <select
                    value={dsaTimeLimit}
                    onChange={(e) => setDsaTimeLimit(e.target.value)}
                    className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all font-mono"
                  >
                    {[
                      'No Limit', '15 Minutes', '30 Minutes', '45 Minutes',
                      '60 Minutes', '90 Minutes', '120 Minutes'
                    ].map(limit => (
                      <option key={limit} value={limit}>{limit}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : activeType === 'aptitude' ? (
            /* Aptitude Form Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Topic Dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                  Topic
                </label>
                <select
                  value={aptitudeTopic}
                  onChange={(e) => setAptitudeTopic(e.target.value)}
                  className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all"
                >
                  {[
                    'Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation',
                    'Number System', 'Percentage', 'Profit & Loss', 'Ratio & Proportion', 'Average',
                    'Time & Work', 'Time, Speed & Distance', 'Pipes & Cisterns', 'Simple & Compound Interest',
                    'Probability', 'Permutations & Combinations', 'Mixtures & Allegations', 'Ages',
                    'Partnership', 'Boats & Streams', 'Calendar', 'Clock', 'Blood Relations',
                    'Direction Sense', 'Coding & Decoding', 'Series', 'Seating Arrangement',
                    'Syllogism', 'Puzzles', 'Mixed Aptitude'
                  ].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {difficulties.map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all ${difficulty === diff
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-textPrimary shadow-glow'
                        : 'bg-brand-cardBg border-brand-border/30 text-brand-textSecondary hover:border-brand-primary/30 hover:text-brand-textPrimary'
                        }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* MCQ Form Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                  Exam Subject Domain
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Core OOP Principles"
                  className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {difficulties.map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all ${difficulty === diff
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-textPrimary shadow-glow'
                        : 'bg-brand-cardBg border-brand-border/30 text-brand-textSecondary hover:border-brand-primary/30 hover:text-brand-textPrimary'
                        }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Question Counts Configuration */}
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
              {activeConfig.label}
            </label>
            <div className="p-4 rounded-xl bg-brand-darkBg border border-brand-border/30 max-w-xs space-y-2">
              <span className="text-[10px] font-bold text-brand-textSecondary uppercase block">Question Quantity</span>
              <input
                type="number"
                min={activeConfig.min}
                max={activeConfig.max}
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="w-full bg-brand-cardBg border border-brand-border/60 rounded-lg p-2 text-center text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-glow text-white text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 hover:brightness-110 transition-all select-none cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
            <span>Generate Assessment</span>
          </button>
        </form>
      ) : generating ? (
        /* Processing Screen */
        <div className="glass-panel border border-brand-border/40 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6">
          <LoadingSpinner size="lg" color="accent" />
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-sm font-bold text-brand-textPrimary uppercase tracking-wider">Compiling AI Exam</h3>
            <p className="text-xs text-brand-accent font-mono animate-pulse">{generationProgress}</p>
          </div>
        </div>
      ) : (
        /* Summary Box */
        <div className="glass-panel border border-brand-border/60 rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden animate-scaleUp">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-brand-success"></div>

          <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-brand-border/10">
            <div className="p-3.5 rounded-full bg-brand-success/15 border border-brand-success/20 text-brand-success shadow-glow">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-textPrimary">Assessment Ready!</h2>
              <p className="text-xs text-brand-textSecondary">AI successfully formulated evaluation criteria matching your document.</p>
            </div>
          </div>

          {/* Assessment Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
            <div className="p-3 bg-brand-darkBg border border-brand-border/20 rounded-xl">
              <span className="text-[10px] text-brand-textSecondary font-bold uppercase">Subject</span>
              <p className="text-xs font-bold text-brand-textPrimary mt-1 truncate">{generatedTest.subject}</p>
            </div>
            <div className="p-3 bg-brand-darkBg border border-brand-border/20 rounded-xl">
              <span className="text-[10px] text-brand-textSecondary font-bold uppercase">Difficulty</span>
              <p className="text-xs font-bold text-brand-accent mt-1">{generatedTest.difficulty}</p>
            </div>
            <div className="p-3 bg-brand-darkBg border border-brand-border/20 rounded-xl">
              <span className="text-[10px] text-brand-textSecondary font-bold uppercase">Duration</span>
              <p className="text-xs font-bold text-brand-textPrimary mt-1 font-mono">{generatedTest.duration} Minutes</p>
            </div>
            <div className="p-3 bg-brand-darkBg border border-brand-border/20 rounded-xl">
              <span className="text-[10px] text-brand-textSecondary font-bold uppercase">Structure</span>
              <p className="text-xs font-bold text-brand-textPrimary mt-1">
                {activeType === 'mcq' && `${generatedTest.questions.mcq?.length || 0} MCQ`}
                {activeType === 'dsa' && `${generatedTest.questions.dsa?.length || 0} DSA`}
                {activeType === 'aptitude' && `${generatedTest.questions.aptitude?.length || 0} Aptitude`}
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-brand-border/10">
            <button
              onClick={() => setGeneratedTest(null)}
              className="flex-1 py-3 px-4 bg-brand-darkBg border border-brand-border/40 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Reconfigure
            </button>
            <button
              onClick={() => navigate(`/take-test/${generatedTest._id}`)}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-glow text-xs font-semibold text-white rounded-xl flex items-center justify-center gap-1.5 hover:brightness-110 transition-all active:scale-95 cursor-pointer animate-pulse"
            >
              <span>Attempt Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateTest;
