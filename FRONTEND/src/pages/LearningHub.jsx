import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import learningService from '../services/learningService';
import { branchCatalog } from '../config/learningCatalog';
import { 
  GraduationCap, 
  ChevronRight, 
  ArrowLeft, 
  Terminal, 
  Cpu, 
  BookOpen, 
  Bookmark, 
  CheckCircle2, 
  Compass 
} from 'lucide-react';

const LearningHub = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const data = await learningService.getProgress();
        setProgressData(data.progress);
      } catch (err) {
        console.error('Failed to load learning progress:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = progressData?.stats || {
    cseCompleted: 0,
    cseTotal: 25,
    csePercentage: 0,
    eceCompleted: 0,
    eceTotal: 29,
    ecePercentage: 0,
    totalCompleted: 0,
    totalTopicsCount: 54,
    totalPercentage: 0
  };

  // Helper to count subjects and topics in catalog
  const getBranchInfo = (branch) => {
    const branchData = branchCatalog[branch];
    const subjectCount = branchData.subjects.length;
    let topicCount = 0;
    branchData.subjects.forEach(s => {
      topicCount += s.topics.length;
    });
    return { subjectCount, topicCount };
  };

  const cseInfo = getBranchInfo('CSE');
  const eceInfo = getBranchInfo('ECE');

  return (
    <div className="space-y-8 animate-fadeIn text-brand-textPrimary font-sans pb-12">
      <PageHeader 
        title="Welcome to the Learning Hub" 
        subtitle="Explore engineering subjects, learn important concepts, revise key topics, and prepare for exams and placements."
      />

      {/* 1. Global Progress Panel */}
      <div className="glass-panel border border-brand-border/40 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          
          <div className="space-y-2 max-w-lg">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Compass className="w-5 h-5 text-brand-accent animate-spin-slow" />
              <span>Your B.Tech Learning Syllabus Progress</span>
            </h3>
            <p className="text-xs text-brand-textSecondary leading-relaxed">
              Track your completion rate across standard Computer Science and Electronics syllabi. Complete topics and generate exams to build concepts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto shrink-0 items-center">
            {/* Overall Circular Progress Indicator */}
            <div className="flex items-center space-x-4">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="38" className="stroke-brand-border/60 fill-none" strokeWidth="6" />
                  <circle 
                    cx="48" cy="48" r="38" 
                    className="stroke-brand-accent fill-none transition-all duration-1000" 
                    strokeWidth="6" 
                    strokeDasharray="238.7" 
                    strokeDashoffset={238.7 - (238.7 * stats.totalPercentage) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-black font-mono">{stats.totalPercentage}%</span>
              </div>
              <div className="text-left space-y-1">
                <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block">Overall Hub Progress</span>
                <span className="text-sm font-bold block">{stats.totalCompleted} / {stats.totalTopicsCount} Topics</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent border border-brand-accent/20 font-semibold font-mono">Grading Hub Active</span>
              </div>
            </div>

            {/* Branch Specific Progress Bars */}
            <div className="w-full sm:w-52 space-y-3.5 border-t sm:border-t-0 sm:border-l border-brand-border/20 pt-4 sm:pt-0 sm:pl-6">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-brand-textSecondary">
                  <span>CSE Branch</span>
                  <span>{stats.cseCompleted}/{stats.cseTotal}</span>
                </div>
                <div className="h-2 bg-brand-darkBg rounded-full overflow-hidden border border-brand-border/30">
                  <div className="h-full bg-brand-primary rounded-full" style={{ width: `${stats.csePercentage}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-brand-textSecondary">
                  <span>ECE Branch</span>
                  <span>{stats.eceCompleted}/{stats.eceTotal}</span>
                </div>
                <div className="h-2 bg-brand-darkBg rounded-full overflow-hidden border border-brand-border/30">
                  <div className="h-full bg-brand-secondary rounded-full" style={{ width: `${stats.ecePercentage}%` }}></div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {!selectedBranch ? (
        /* Branch Welcome Cards Selection */
        <div className="space-y-4">
          <span className="text-[10px] font-bold tracking-wider text-brand-textSecondary uppercase block">
            Select Your Engineering Branch
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* CSE Card */}
            <div 
              onClick={() => setSelectedBranch('CSE')}
              className="group relative overflow-hidden rounded-3xl border border-brand-border/40 bg-brand-cardBg/60 hover:bg-brand-darkBg/80 hover:border-brand-primary/40 p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[260px] shadow-lg"
            >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-brand-primary opacity-5 rounded-full blur-2xl transition-all duration-500 group-hover:scale-155"></div>
              
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-glow inline-block">
                  <Terminal className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold group-hover:text-brand-primary transition-colors">Computer Science Engineering</h3>
                  <p className="text-xs text-brand-textSecondary leading-relaxed">
                    Master programming paradigms, optimize algorithms, build relational database systems, manage concurrency, study networking packets, and program core OS threading models.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-brand-border/10 flex items-center justify-between text-xs text-brand-textSecondary font-semibold">
                <div className="flex gap-4">
                  <span>{cseInfo.subjectCount} Subjects</span>
                  <span>•</span>
                  <span>{cseInfo.topicCount} Topics</span>
                </div>
                <button className="flex items-center space-x-1 py-2 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary text-white font-bold transition-all shadow-glow">
                  <span>Start Learning</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ECE Card */}
            <div 
              onClick={() => setSelectedBranch('ECE')}
              className="group relative overflow-hidden rounded-3xl border border-brand-border/40 bg-brand-cardBg/60 hover:bg-brand-darkBg/80 hover:border-brand-secondary/40 p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[260px] shadow-lg"
            >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-brand-secondary opacity-5 rounded-full blur-2xl transition-all duration-500 group-hover:scale-155"></div>

              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 shadow-glow inline-block">
                  <Cpu className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold group-hover:text-brand-secondary transition-colors">Electronics & Communication</h3>
                  <p className="text-xs text-brand-textSecondary leading-relaxed">
                    Understand electronic logic families, analyze microprocessors assembly syntax, design feedback op-amps, master Fourier/Z frequency signals, and implement passband modulations.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-brand-border/10 flex items-center justify-between text-xs text-brand-textSecondary font-semibold">
                <div className="flex gap-4">
                  <span>{eceInfo.subjectCount} Subjects</span>
                  <span>•</span>
                  <span>{eceInfo.topicCount} Topics</span>
                </div>
                <button className="flex items-center space-x-1 py-2 px-4 rounded-xl bg-brand-secondary hover:bg-brand-secondary text-white font-bold transition-all shadow-glow">
                  <span>Start Learning</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Subject List Selection View for selected Branch */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setSelectedBranch(null)}
              className="flex items-center space-x-1.5 py-2 px-4 rounded-xl border border-brand-border/40 text-xs font-bold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Branches</span>
            </button>
            <span className="text-xs font-bold text-brand-textSecondary font-mono uppercase">
              Branch: <span className="text-brand-primary">{selectedBranch}</span>
            </span>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-bold tracking-wider text-brand-textSecondary uppercase block">
              Syllabus Subjects Under {selectedBranch === 'CSE' ? 'Computer Science' : 'Electronics & Communication'}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branchCatalog[selectedBranch].subjects.map((subject) => {
                // Count how many topics the student has completed in this subject
                const completedInSubject = progressData?.completedTopics.filter(
                  t => t.branch === selectedBranch && t.subjectId === subject.id
                ).length || 0;
                
                const percent = subject.topics.length > 0 ? Math.round((completedInSubject / subject.topics.length) * 100) : 0;

                return (
                  <div 
                    key={subject.id}
                    onClick={() => navigate(`/learning-hub/${selectedBranch}/${subject.id}`)}
                    className="glass-panel glass-panel-hover border border-brand-border/30 hover:border-brand-primary/30 rounded-2xl p-5 flex flex-col justify-between min-h-[160px] cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-brand-textPrimary leading-snug">{subject.name}</h4>
                        <p className="text-[11px] text-brand-textSecondary">{subject.topics.length} Syllabus Topics Available</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-brand-textSecondary shrink-0" />
                    </div>

                    <div className="space-y-2 mt-4 pt-3 border-t border-brand-border/10">
                      <div className="flex justify-between text-[10px] font-bold text-brand-textSecondary">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-success" />
                          <span>{completedInSubject} Completed</span>
                        </span>
                        <span>{percent}%</span>
                      </div>
                      <div className="h-1.5 bg-brand-darkBg rounded-full overflow-hidden border border-brand-border/20">
                        <div 
                          className={`h-full rounded-full ${selectedBranch === 'CSE' ? 'bg-brand-primary' : 'bg-brand-secondary'}`} 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningHub;
