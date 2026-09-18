import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Sparkles, 
  ArrowRight, 
  UploadCloud, 
  Cpu, 
  LineChart, 
  ShieldAlert, 
  BookOpen, 
  ChevronRight, 
  CheckCircle,
  FileText,
  Sun,
  Moon,
  Database,
  Zap,
  KeyRound,
  FileCode,
  Users,
  Activity,
  ArrowUpRight
} from 'lucide-react';

const Landing = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Interactive Simulator States
  const [simState, setSimState] = useState('idle'); // 'idle' | 'uploading' | 'config' | 'taking' | 'result'
  const [simProgress, setSimProgress] = useState(0);
  const [simSelectedOption, setSimSelectedOption] = useState(null);
  const [simDifficulty, setSimDifficulty] = useState('Medium');
  const [simUploadingText, setSimUploadingText] = useState('');

  // Sync theme changes
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
    window.dispatchEvent(new Event('themechange'));
  }, [theme]);

  // Handle Page scroll
  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  const handleGetStarted = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  // Run Simulator Upload animation
  const runUploadSimulation = () => {
    setSimState('uploading');
    setSimProgress(0);
    setSimUploadingText('Parsing document nodes...');
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setSimProgress(currentProgress);
      
      if (currentProgress === 30) {
        setSimUploadingText('Extracting lecture slide contexts...');
      } else if (currentProgress === 65) {
        setSimUploadingText('Generating vector index embeddings...');
      } else if (currentProgress === 85) {
        setSimUploadingText('Syncing with AI test compiler...');
      }
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setSimState('config');
        }, 400);
      }
    }, 80);
  };

  const handleCompileSimulation = () => {
    setSimState('taking');
  };

  const handleSubmitSimulation = () => {
    setSimState('result');
  };

  const resetSimulation = () => {
    setSimState('idle');
    setSimProgress(0);
    setSimSelectedOption(null);
  };

  return (
    <div className="min-h-screen bg-brand-darkBg text-brand-textPrimary relative overflow-x-hidden selection:bg-brand-primary/30 selection:text-white transition-colors duration-300 tech-grid tech-grid-flow">
      
      {/* Background ambient glowing spheres */}
      <div className="absolute top-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-brand-primary/10 blur-[180px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute top-[35vh] left-[-5%] w-[500px] h-[500px] rounded-full bg-brand-secondary/8 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[20vh] right-[-10%] w-[700px] h-[700px] rounded-full bg-brand-accent/6 blur-[200px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-brand-border/30 h-16 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-primary via-brand-secondary to-brand-accent flex items-center justify-center shadow-glow hover:rotate-6 transition-transform duration-300">
            <span className="text-lg font-bold text-white tracking-wider font-sans">Æ</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-brand-textPrimary font-sans">
            ExamGen <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">AI</span>
          </span>
        </div>

        {/* Desktop Menu Links */}
        <nav className="hidden md:flex items-center space-x-8 text-[11px] font-bold uppercase tracking-wider text-brand-textSecondary">
          <button 
            onClick={() => handleScrollTo('features')} 
            className="hover:text-brand-primary transition-colors cursor-pointer relative group py-2"
          >
            Features
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-primary transition-all group-hover:w-full"></span>
          </button>
          <button 
            onClick={() => handleScrollTo('how-it-works')} 
            className="hover:text-brand-secondary transition-colors cursor-pointer relative group py-2"
          >
            How it Works
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-secondary transition-all group-hover:w-full"></span>
          </button>
          <button 
            onClick={() => handleScrollTo('preview')} 
            className="hover:text-brand-accent transition-colors cursor-pointer relative group py-2"
          >
            Sandbox Simulator
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-accent transition-all group-hover:w-full"></span>
          </button>
        </nav>

        {/* Action Buttons & Theme Switch */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-border/20 border border-transparent hover:border-brand-border/40 transition-all flex items-center justify-center cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-brand-warning animate-spin-slow" /> : <Moon className="w-4.5 h-4.5 text-brand-primary" />}
          </button>

          {token ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-1.5 px-5 py-2.5 text-xs font-bold rounded-xl border border-brand-primary/30 hover:border-brand-primary/60 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary tracking-wide transition-all shadow-glow hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:inline-block text-xs font-bold text-brand-textSecondary hover:text-brand-textPrimary px-4 py-2.5 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent text-white hover:brightness-110 active:scale-95 transition-all shadow-glow hover:-translate-y-0.5 cursor-pointer hover:shadow-accent-glow"
              >
                Register Free
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-20 md:py-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Left Hero Column */}
        <div className="lg:col-span-6 space-y-8 text-left z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/25 text-[10px] font-bold uppercase tracking-wider text-brand-primary shadow-glow">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
            <span>AI-Driven Secure Proctoring Sandbox</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-brand-textPrimary font-sans">
            Stop Reading.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent glow-text-indigo">
              Start Challenging.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-brand-textSecondary leading-relaxed max-w-xl">
            Passively reading study notes doesn't build retention. Instantly convert textbooks, PDFs, and slide decks into custom, proctored practice exams tailored specifically to your curriculum.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleGetStarted}
              className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent text-white font-bold text-sm shadow-accent-glow hover:brightness-115 active:scale-98 transition-all hover:-translate-y-0.5 group cursor-pointer"
            >
              <span>Compile Your First Exam</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleScrollTo('preview')}
              className="flex items-center justify-center px-6 py-4 rounded-xl border border-brand-border/60 hover:border-brand-primary/40 bg-brand-darkBg/50 hover:bg-brand-border/20 text-sm font-bold text-brand-textSecondary hover:text-brand-textPrimary transition-all cursor-pointer shadow-glow"
            >
              Interactive Simulator
            </button>
          </div>

          {/* Quick trust metrics */}
          <div className="pt-8 border-t border-brand-border/20 grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary font-mono">100%</p>
              <p className="text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider">RAG Parsing Precision</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-brand-accent font-mono">SECURE</p>
              <p className="text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider">Tab & Fullscreen Lock</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-primary font-mono">REAL-TIME</p>
              <p className="text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider">AI Evaluation Grader</p>
            </div>
          </div>
        </div>

        {/* Right Hero Column: RAG Node Visualizer (Futuristic CSS Animation) */}
        <div className="lg:col-span-6 relative w-full flex justify-center items-center py-6">
          <div className="absolute w-[400px] h-[400px] rounded-full bg-brand-primary/10 blur-[90px] pointer-events-none animate-pulse-slow"></div>
          
          {/* Main Visualizer Container */}
          <div className="relative w-full max-w-[500px] aspect-[4/3] rounded-3xl glass-panel border border-brand-border/70 p-6 shadow-2xl flex items-center justify-between overflow-hidden">
            
            {/* Ambient visual grid */}
            <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none"></div>

            {/* Left Node: Document Uploader */}
            <div className="relative z-10 w-28 aspect-[3/4] rounded-2xl glass-panel border border-brand-border/80 flex flex-col justify-between p-3 animate-float-gentle bg-brand-darkBg/60 shadow-lg">
              <div className="flex justify-between items-center">
                <FileText className="w-5 h-5 text-brand-primary" />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-ping"></span>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-brand-textPrimary truncate">Syllabus_OOP.pdf</p>
                <div className="w-full bg-brand-border h-1 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-brand-primary rounded-full"></div>
                </div>
              </div>
              
              {/* Scan Beam effect */}
              <div className="absolute left-0 right-0 h-[2px] bg-brand-primary/60 shadow-glow animate-scan-beam pointer-events-none"></div>
            </div>

            {/* Middle Node: Vector Data Streams */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              {/* Floating dot particles tracing trajectories */}
              <div className="absolute w-2 h-2 rounded-full bg-brand-primary top-1/2 left-[30%] animate-particle-stream"></div>
              <div className="absolute w-2 h-2 rounded-full bg-brand-secondary top-[40%] left-[32%] [animation-delay:0.7s] animate-particle-stream"></div>
              <div className="absolute w-2 h-2 rounded-full bg-brand-accent top-[60%] left-[28%] [animation-delay:1.3s] animate-particle-stream"></div>
              
              {/* Connecting lines */}
              <svg className="w-full h-full absolute inset-0 text-brand-border/40" fill="none">
                <path d="M 140 170 Q 240 100 240 170" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                <path d="M 140 190 Q 240 190 240 195" stroke="currentColor" strokeWidth="1.5" />
                <path d="M 140 210 Q 240 300 240 210" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                
                <path d="M 280 190 Q 360 110 370 140" stroke="currentColor" strokeWidth="1.5" />
                <path d="M 280 200 Q 360 270 370 240" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
              </svg>
            </div>

            {/* Center Node: AI Processor Core */}
            <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-accent p-[1px] shadow-glow animate-float-delayed">
              <div className="w-full h-full bg-brand-cardBg rounded-[15px] flex flex-col items-center justify-center">
                <Cpu className="w-7 h-7 text-brand-secondary animate-pulse" />
                <span className="text-[8px] font-bold text-brand-textSecondary mt-1 uppercase tracking-wider font-mono">RAG Core</span>
              </div>
            </div>

            {/* Right Node: Compiled Exam Widget */}
            <div className="relative z-10 w-32 glass-panel border border-brand-primary/30 rounded-2xl p-3.5 shadow-xl animate-float-reversed bg-brand-darkBg/60">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-brand-border/20">
                <span className="text-[8px] font-bold uppercase tracking-wider text-brand-accent">Exam compiled</span>
                <CheckCircle className="w-3.5 h-3.5 text-brand-success" />
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-brand-textPrimary/90 rounded-full"></div>
                <div className="h-2 w-5/6 bg-brand-textSecondary/50 rounded-full"></div>
                
                <div className="grid grid-cols-2 gap-1 pt-1.5">
                  <div className="h-4 rounded bg-brand-primary/10 border border-brand-primary/20 text-[7px] font-bold flex items-center justify-center text-brand-primary">MCQ</div>
                  <div className="h-4 rounded bg-brand-secondary/10 border border-brand-secondary/20 text-[7px] font-bold flex items-center justify-center text-brand-secondary">Case</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 border-t border-brand-border/20">
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Next-Gen Capability</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-textPrimary leading-tight">
            Engineered to Optimize Academic Output
          </h2>
          <p className="text-sm text-brand-textSecondary leading-relaxed">
            Move past passive review and transition into structured test execution with custom learning diagnostics.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Adaptive RAG Generator */}
          <div className="gradient-border-card p-[1px]">
            <div className="bg-brand-cardBg/90 rounded-[11px] p-8 text-left h-[290px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-11 w-11 rounded-xl bg-brand-primary/10 border border-brand-primary/25 flex items-center justify-center text-brand-primary shadow-glow">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-brand-textPrimary">Contextual RAG Compiler</h3>
                <p className="text-xs sm:text-sm text-brand-textSecondary leading-relaxed">
                  Imports notes and references, parses themes, and drafts customized exams (MCQs, case problems, descriptive essays) matching specific syllabus targets.
                </p>
              </div>
              <div className="flex items-center text-xs text-brand-primary font-bold tracking-wide uppercase group cursor-pointer" onClick={handleGetStarted}>
                <span>Initiate RAG Compiler</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>

          {/* Card 2: Proctored Sandbox Player */}
          <div className="gradient-border-card p-[1px]">
            <div className="bg-brand-cardBg/90 rounded-[11px] p-8 text-left h-[290px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-11 w-11 rounded-xl bg-brand-secondary/10 border border-brand-secondary/25 flex items-center justify-center text-brand-secondary shadow-glow">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-brand-textPrimary">Proctor Sandbox Player</h3>
                <p className="text-xs sm:text-sm text-brand-textSecondary leading-relaxed">
                  Test your skills under realistic pressure. Restricts screen switches, monitors focus flags, and tracks elapsed time limits to reinforce exam discipline.
                </p>
              </div>
              <div className="flex items-center text-xs text-brand-secondary font-bold tracking-wide uppercase group cursor-pointer" onClick={handleGetStarted}>
                <span>Enter Proctor Sandbox</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>

          {/* Card 3: AI Evaluation Grader */}
          <div className="gradient-border-card p-[1px]">
            <div className="bg-brand-cardBg/90 rounded-[11px] p-8 text-left h-[290px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-11 w-11 rounded-xl bg-brand-accent/10 border border-brand-accent/25 flex items-center justify-center text-brand-accent shadow-glow">
                  <LineChart className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-brand-textPrimary">Diagnostics & AI Grader</h3>
                <p className="text-xs sm:text-sm text-brand-textSecondary leading-relaxed">
                  Evaluate text submissions instantly using detailed rubrics. AI parses correctness, assigns marks, and suggests review points to fix knowledge gaps.
                </p>
              </div>
              <div className="flex items-center text-xs text-brand-accent font-bold tracking-wide uppercase group cursor-pointer" onClick={handleGetStarted}>
                <span>Inspect AI Diagnostics</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How it Works Timeline */}
      <section id="how-it-works" className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 border-t border-brand-border/20">
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-24">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Operational Flow</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-textPrimary leading-tight">
            How ExamGen AI Works
          </h2>
          <p className="text-sm text-brand-textSecondary leading-relaxed">
            Move from unstructured document folders to targeted knowledge retention in 3 simple steps.
          </p>
        </div>

        {/* Step Flowchart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative">
          {/* Timeline connecting bar */}
          <div className="hidden lg:block absolute top-10 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent/40 z-0"></div>

          {/* Step 1 */}
          <div className="flex flex-col items-center text-center space-y-5 relative z-10 group">
            <div className="h-20 w-20 rounded-2xl bg-brand-cardBg border border-brand-border flex items-center justify-center text-brand-primary font-bold text-xl shadow-glow relative group-hover:border-brand-primary transition-all duration-300">
              <UploadCloud className="w-7 h-7 text-brand-primary" />
              <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center shadow-glow">1</div>
            </div>
            <h3 className="text-xl font-bold text-brand-textPrimary">Upload Study Guides</h3>
            <p className="text-xs sm:text-sm text-brand-textSecondary max-w-xs leading-relaxed">
              Upload study guides, textbook chapters, or course PDFs. The system breaks them down into context indexes.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center space-y-5 relative z-10 group">
            <div className="h-20 w-20 rounded-2xl bg-brand-cardBg border border-brand-border flex items-center justify-center text-brand-secondary font-bold text-xl shadow-glow relative group-hover:border-brand-secondary transition-all duration-300">
              <Cpu className="w-7 h-7 text-brand-secondary" />
              <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-brand-secondary text-white text-xs font-bold flex items-center justify-center shadow-glow">2</div>
            </div>
            <h3 className="text-xl font-bold text-brand-textPrimary">Select Parameters</h3>
            <p className="text-xs sm:text-sm text-brand-textSecondary max-w-xs leading-relaxed">
              Choose difficulty ranges, question types, and duration parameters to generate a balanced mock exam.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-5 relative z-10 group">
            <div className="h-20 w-20 rounded-2xl bg-brand-cardBg border border-brand-border flex items-center justify-center text-brand-accent font-bold text-xl shadow-glow relative group-hover:border-brand-accent transition-all duration-300">
              <BookOpen className="w-7 h-7 text-brand-accent" />
              <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-brand-accent text-white text-xs font-bold flex items-center justify-center shadow-glow">3</div>
            </div>
            <h3 className="text-xl font-bold text-brand-textPrimary">Practice & Review</h3>
            <p className="text-xs sm:text-sm text-brand-textSecondary max-w-xs leading-relaxed">
              Attempt mocks in the proctored sandbox player, review prompt responses, and address identified weak points.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Terminal Sandbox Simulator */}
      <section id="preview" className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 border-t border-brand-border/20 text-center">
        
        <div className="space-y-4 max-w-2xl mx-auto mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-secondary">Interactive Sandbox</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-textPrimary leading-tight">
            Run the AI Exam Simulator
          </h2>
          <p className="text-sm text-brand-textSecondary leading-relaxed">
            Test drive the dynamic PDF parsing, exam generation, and grading pipeline directly below.
          </p>
        </div>

        {/* Console/Terminal Mockup */}
        <div className="max-w-4xl mx-auto glass-panel rounded-3xl border border-brand-border/70 shadow-2xl relative overflow-hidden text-left bg-brand-cardBg/45 hover:border-brand-primary/30 transition-all duration-500">
          
          {/* Terminal Window Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-brand-darkBg/90 border-b border-brand-border/60">
            <div className="flex space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#ef4444]/80 flex items-center justify-center"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#f59e0b]/80 flex items-center justify-center"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#10b981]/80 flex items-center justify-center"></span>
            </div>
            <div className="px-4 py-1.5 rounded-lg bg-brand-darkBg border border-brand-border/80 text-[10px] text-brand-textSecondary font-mono uppercase tracking-wider">
              {simState === 'idle' ? 'init_sandbox' : simState === 'uploading' ? 'parsing_pdf' : simState === 'config' ? 'exam_setup' : simState === 'taking' ? 'assessment_active' : 'grading_report'}.sh
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></span>
              <span className="text-[10px] text-brand-accent uppercase font-bold tracking-wider font-mono">Terminal Active</span>
            </div>
          </div>

          {/* Terminal Screen area */}
          <div className="p-6 md:p-10 min-h-[380px] flex flex-col justify-center transition-all duration-300 relative">
            
            {/* STATE 1: Idle (Upload Area) */}
            {simState === 'idle' && (
              <div 
                onClick={runUploadSimulation}
                className="group border-2 border-dashed border-brand-border/80 hover:border-brand-primary/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 bg-brand-darkBg/30 hover:bg-brand-darkBg/60 relative overflow-hidden"
              >
                <div className="p-4.5 rounded-full bg-brand-cardBg border border-brand-border/40 text-brand-textSecondary mb-4 group-hover:text-brand-primary group-hover:shadow-glow transition-all duration-300">
                  <UploadCloud className="w-12 h-12 text-brand-primary" />
                </div>
                <h3 className="text-lg font-bold text-brand-textPrimary">Simulate Lecture Upload</h3>
                <p className="text-xs text-brand-textSecondary max-w-sm mt-1.5 leading-relaxed">
                  Click here to simulate uploading a <strong>Computer_Networks_Slide.pdf</strong> file to vectors.
                </p>
                <span className="mt-6 px-6 py-3 rounded-xl bg-brand-primary hover:brightness-110 font-bold text-xs text-white shadow-glow transition-all uppercase tracking-wider">
                  Select Lecture PDF
                </span>
              </div>
            )}

            {/* STATE 2: Uploading (Progress bar) */}
            {simState === 'uploading' && (
              <div className="space-y-6 max-w-md mx-auto w-full text-center py-6">
                <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 inline-block text-brand-primary animate-bounce">
                  <Database className="w-9 h-9" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-brand-textPrimary">Indexing PDF Data Source</h3>
                  <p className="text-xs text-brand-accent font-mono animate-pulse uppercase tracking-wider">{simUploadingText}</p>
                </div>

                <div className="space-y-2.5">
                  <div className="w-full bg-brand-darkBg rounded-full h-3 overflow-hidden border border-brand-border/60">
                    <div 
                      className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent h-full rounded-full transition-all duration-200"
                      style={{ width: `${simProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-brand-textSecondary font-bold">
                    <span>COMPUTER_NETWORKS_SLIDE.PDF</span>
                    <span>{simProgress}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* STATE 3: Config */}
            {simState === 'config' && (
              <div className="space-y-6 animate-scaleUp max-w-2xl mx-auto w-full">
                <div className="flex items-start justify-between border-b border-brand-border/20 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-brand-textPrimary">AI Assessment Configuration</h3>
                    <p className="text-xs text-brand-textSecondary mt-0.5">Specify parameters to formulate custom exam questions.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-brand-success/15 border border-brand-success/20 text-brand-success text-[10px] font-bold uppercase tracking-wider font-mono">Vector Parsed</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Subject Domain</label>
                    <input 
                      type="text" 
                      value="Computer Networks & Protocols" 
                      disabled
                      className="w-full bg-brand-darkBg border border-brand-border/80 rounded-xl px-4 py-3.5 text-xs text-brand-textSecondary cursor-not-allowed font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Difficulty Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Easy', 'Medium', 'Hard'].map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setSimDifficulty(diff)}
                          className={`py-2.5 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            simDifficulty === diff
                              ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-glow'
                              : 'bg-brand-darkBg/50 border-brand-border/40 text-brand-textSecondary hover:border-brand-primary/40'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-brand-border/20 flex justify-end space-x-3">
                  <button 
                    onClick={resetSimulation}
                    className="py-3 px-5 rounded-xl border border-brand-border/60 text-xs font-bold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-border/20 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCompileSimulation}
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-xs font-bold hover:brightness-110 active:scale-95 shadow-glow cursor-pointer"
                  >
                    Compile AI Exam ⚡
                  </button>
                </div>
              </div>
            )}

            {/* STATE 4: Taking */}
            {simState === 'taking' && (
              <div className="space-y-6 animate-scaleUp w-full">
                <div className="flex items-center justify-between border-b border-brand-border/20 pb-4">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-brand-textPrimary">Sandbox Question Player</h3>
                    <p className="text-[10px] text-brand-textSecondary font-mono">Active Attempt: Computer Networks | Difficulty: {simDifficulty}</p>
                  </div>
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    <span>Proctoring Mode Active</span>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="p-5 rounded-xl border border-brand-border/20 bg-brand-darkBg/40 flex flex-col md:flex-row md:justify-between md:items-center text-xs gap-3">
                    <span className="font-semibold text-brand-textPrimary leading-relaxed">
                      Q1. Which protocol provides reliable, ordered, and error-checked delivery of packets between applications?
                    </span>
                    <span className="px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[9px] font-bold font-mono shrink-0 text-center">
                      MCQ (3 Marks)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { letter: 'A', text: 'UDP (User Datagram Protocol)' },
                      { letter: 'B', text: 'TCP (Transmission Control Protocol)', correct: true },
                      { letter: 'C', text: 'IP (Internet Protocol)' },
                      { letter: 'D', text: 'DNS (Domain Name System)' }
                    ].map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setSimSelectedOption(i)}
                        className={`p-4 rounded-xl border text-xs text-left transition-all flex items-center space-x-4 w-full cursor-pointer ${
                          simSelectedOption === i
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-glow'
                            : 'bg-brand-cardBg border-brand-border/60 text-brand-textSecondary hover:border-brand-primary/30 hover:text-brand-textPrimary hover:bg-brand-border/20'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                          simSelectedOption === i ? 'bg-brand-primary text-white shadow-glow' : 'bg-brand-darkBg border border-brand-border/30 text-brand-textSecondary'
                        }`}>
                          {opt.letter}
                        </div>
                        <span className="font-semibold">{opt.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-brand-border/20 flex justify-end space-x-3">
                  <button 
                    onClick={resetSimulation}
                    className="py-3 px-5 rounded-xl border border-brand-border/60 text-xs font-bold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-border/20 cursor-pointer"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={handleSubmitSimulation}
                    disabled={simSelectedOption === null}
                    className={`py-3 px-6 rounded-xl font-bold text-xs text-white transition-all ${
                      simSelectedOption !== null
                        ? 'bg-brand-success hover:brightness-110 active:scale-95 shadow-glow cursor-pointer'
                        : 'bg-brand-darkBg/60 text-brand-textSecondary/40 cursor-not-allowed border border-brand-border/40'
                    }`}
                  >
                    Submit & Grade Exam
                  </button>
                </div>
              </div>
            )}

            {/* STATE 5: Result */}
            {simState === 'result' && (
              <div className="space-y-6 animate-scaleUp w-full">
                <div className="flex items-center justify-between border-b border-brand-border/20 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-brand-textPrimary">Grading & Evaluation Report</h3>
                    <p className="text-xs text-brand-textSecondary mt-0.5">Automated AI Feedback Evaluation</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-brand-success/15 border border-brand-success/20 text-brand-success text-[10px] font-bold uppercase tracking-wider font-mono">Grades Published</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-stretch">
                  <div className="sm:col-span-4 p-6 rounded-2xl border border-brand-border/30 bg-brand-darkBg/40 flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-textSecondary">Test Score</span>
                    <span className={`text-4xl font-black font-mono ${simSelectedOption === 1 ? 'text-brand-success' : 'text-brand-error'}`}>
                      {simSelectedOption === 1 ? '100%' : '0%'}
                    </span>
                    <span className="text-[10px] text-brand-textSecondary font-bold">{simSelectedOption === 1 ? '3/3 Marks' : '0/3 Marks'}</span>
                  </div>

                  <div className="sm:col-span-8 p-6 rounded-2xl border border-brand-primary/25 bg-brand-primary/5 flex flex-col justify-center space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5 font-mono">
                      <Zap className="w-4 h-4 text-brand-accent" />
                      AI Grader Insights
                    </span>
                    <p className="text-xs text-brand-textPrimary leading-relaxed">
                      {simSelectedOption === 1 
                        ? "Correct! You successfully identified TCP as the reliable connection-oriented transport protocol. It provides stream control and packet acknowledgment. Strong network fundamentals."
                        : "Incorrect. Packet delivery guarantees are handled by TCP (Transmission Control Protocol). You selected an incorrect protocol. DNS handles name translation, UDP is connectionless, and IP handles addressing. Focus area: Transport Layer."
                      }
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-brand-border/20 flex justify-end space-x-3">
                  <button 
                    onClick={resetSimulation}
                    className="py-3 px-5 rounded-xl border border-brand-border/60 text-xs font-bold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-border/20 cursor-pointer"
                  >
                    Reset Simulator
                  </button>
                  <button 
                    onClick={handleGetStarted}
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent text-white text-xs font-bold hover:brightness-110 active:scale-95 shadow-glow cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Launch Full Dashboard</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="max-w-5xl mx-auto px-6 py-16 md:py-24 text-center">
        <div className="glass-panel rounded-3xl border border-brand-border/70 p-10 sm:p-16 relative overflow-hidden shadow-2xl bg-brand-cardBg/30 hover:border-brand-primary/20 transition-all duration-300">
          {/* Subtle glowing elements */}
          <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-brand-primary/10 blur-[60px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-44 h-44 rounded-full bg-brand-accent/10 blur-[60px] pointer-events-none"></div>

          <div className="max-w-2xl mx-auto space-y-8 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-textPrimary leading-tight font-sans">
              Upgrade Your Assessment Pipeline
            </h2>
            <p className="text-sm sm:text-base text-brand-textSecondary leading-relaxed">
              Join thousands of students and educators transforming study materials into interactive assessment engines. Upgrade your efficiency with ExamGen AI Pro.
            </p>
            <div className="pt-4">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent text-white font-bold text-sm shadow-accent-glow hover:brightness-115 active:scale-98 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Get Started For Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 md:px-12 py-16 border-t border-brand-border/20 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center text-xs text-brand-textSecondary gap-8">
        <div className="flex items-center space-x-2 select-none">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-xs font-bold text-white shadow-glow">
            Æ
          </div>
          <span className="font-semibold text-brand-textPrimary text-sm font-sans tracking-wide">ExamGen AI Pro</span>
        </div>
        <p>© {new Date().getFullYear()} ExamGen AI. All rights reserved.</p>
        <div className="flex space-x-8 font-semibold">
          <a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-brand-secondary transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
