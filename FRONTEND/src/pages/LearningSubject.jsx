import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import learningService from '../services/learningService';
import { branchCatalog } from '../config/learningCatalog';
import { 
  ArrowLeft, 
  BookOpen, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  Circle, 
  FileText, 
  ChevronRight,
  Download
} from 'lucide-react';

const LearningSubject = () => {
  const { branch, subjectId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [subjectData, setSubjectData] = useState(null);

  // Load progress and subject details
  useEffect(() => {
    const loadSubject = async () => {
      try {
        setLoading(true);
        const branchData = branchCatalog[branch];
        if (!branchData) {
          navigate('/learning-hub');
          return;
        }

        const subject = branchData.subjects.find(s => s.id === subjectId);
        if (!subject) {
          navigate('/learning-hub');
          return;
        }
        setSubjectData(subject);

        const data = await learningService.getProgress();
        setProgress(data.progress);
      } catch (err) {
        console.error('Failed to load subject topics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (branch && subjectId) {
      loadSubject();
    }
  }, [branch, subjectId, navigate]);

  const isBookmarked = (topicId) => {
    if (!progress) return false;
    return progress.bookmarkedTopics.some(
      t => t.branch === branch && t.subjectId === subjectId && t.topicId === topicId
    );
  };

  const isCompleted = (topicId) => {
    if (!progress) return false;
    return progress.completedTopics.some(
      t => t.branch === branch && t.subjectId === subjectId && t.topicId === topicId
    );
  };

  const handleToggleBookmark = async (e, topicId) => {
    e.stopPropagation();
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
      console.error('Error bookmarking topic:', err);
    }
  };

  const handleToggleComplete = async (e, topicId) => {
    e.stopPropagation();
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
      console.error('Error toggling completion:', err);
    }
  };

  if (loading || !subjectData) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Count completions in this subject
  const completedCount = progress?.completedTopics.filter(
    t => t.branch === branch && t.subjectId === subjectId
  ).length || 0;
  
  const totalTopics = subjectData.topics.length;
  const percentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn text-brand-textPrimary font-sans pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button 
          onClick={() => navigate('/learning-hub')}
          className="flex items-center space-x-1.5 py-2 px-4 rounded-xl border border-brand-border/40 text-xs font-bold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Learning Hub Dashboard</span>
        </button>

        <span className="text-xs font-bold text-brand-textSecondary font-mono uppercase bg-brand-darkBg/60 border border-brand-border/30 px-3 py-1.5 rounded-xl">
          Syllabus Subject: <span className="text-brand-accent">{subjectData.name}</span>
        </span>
      </div>

      <div className="glass-panel border border-brand-border/40 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-brand-textPrimary tracking-tight">{subjectData.name}</h1>
            <p className="text-xs text-brand-textSecondary max-w-lg">
              Review detailed textbooks and B.Tech curriculum summaries. Complete each topic below to build study assessments.
            </p>
          </div>
          {subjectData.notesFile && (
            <a 
              href={`/uploads/notes/${subjectData.notesFile}`}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 py-2 px-4 bg-brand-accent/15 border border-brand-accent/30 hover:bg-brand-accent hover:text-white text-brand-accent text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm w-fit"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download PDF Notes</span>
            </a>
          )}
        </div>

        {/* Progress summary for subject */}
        <div className="flex items-center space-x-4 shrink-0 bg-brand-darkBg/50 border border-brand-border/20 rounded-2xl p-4 w-full md:w-auto">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block">Subject Completion</span>
            <span className="text-xs font-bold block">{completedCount} / {totalTopics} Topics Completed</span>
            <div className="w-44 h-1.5 bg-brand-darkBg rounded-full overflow-hidden border border-brand-border/20 mt-1">
              <div 
                className="h-full bg-brand-success rounded-full" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-brand-border/20"></div>
          <div className="text-center font-mono font-black text-lg text-brand-success">
            {percentage}%
          </div>
        </div>
      </div>

      {/* Topics list */}
      <div className="space-y-4">
        <span className="text-[10px] font-bold tracking-wider text-brand-textSecondary uppercase block">
          Curriculum Topic Outlines
        </span>

        <div className="grid grid-cols-1 gap-4">
          {subjectData.topics.map((topic, index) => {
            const bookmarked = isBookmarked(topic.id);
            const completed = isCompleted(topic.id);

            return (
              <div 
                key={topic.id}
                onClick={() => navigate(`/learning-hub/${branch}/${subjectId}/${topic.id}`)}
                className={`glass-panel border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer transition-all duration-300 ${
                  completed 
                    ? 'border-brand-success/20 bg-brand-success/2 hover:border-brand-success/40' 
                    : 'border-brand-border/30 hover:border-brand-primary/30'
                }`}
              >
                {/* Left Outline Info */}
                <div className="flex items-start space-x-3.5 min-w-0 max-w-2xl">
                  {/* Completion indicator icon */}
                  <button 
                    onClick={(e) => handleToggleComplete(e, topic.id)}
                    className="mt-0.5 text-brand-textSecondary hover:text-brand-success shrink-0"
                    title={completed ? "Mark as Incomplete" : "Mark as Completed"}
                  >
                    {completed 
                      ? <CheckCircle2 className="w-5 h-5 text-brand-success" /> 
                      : <Circle className="w-5 h-5 opacity-40 hover:opacity-100" />
                    }
                  </button>
                  
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-brand-textSecondary font-bold bg-brand-darkBg/60 border border-brand-border/30 px-2 py-0.5 rounded-lg">
                        Topic #{index + 1}
                      </span>
                      {completed && (
                        <span className="text-[9px] font-bold text-brand-success uppercase tracking-wider bg-brand-success/10 border border-brand-success/20 px-2 py-0.5 rounded-lg">
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-brand-textPrimary leading-snug">{topic.name}</h3>
                    <p className="text-xs text-brand-textSecondary leading-relaxed break-words">{topic.desc}</p>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center space-x-3 w-full md:w-auto shrink-0 justify-end pt-3 md:pt-0 border-t md:border-t-0 border-brand-border/10">
                  {/* Bookmark Button */}
                  <button 
                    onClick={(e) => handleToggleBookmark(e, topic.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      bookmarked 
                        ? 'bg-brand-warning/10 border-brand-warning/35 text-brand-warning shadow-glow' 
                        : 'border-brand-border/40 hover:border-brand-warning/40 text-brand-textSecondary hover:text-brand-warning'
                    }`}
                    title={bookmarked ? "Bookmarked" : "Add Bookmark"}
                  >
                    {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>

                  {/* Read Notes Trigger */}
                  <button 
                    onClick={() => navigate(`/learning-hub/${branch}/${subjectId}/${topic.id}`)}
                    className="flex items-center space-x-1 py-2.5 px-4.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:shadow-glow hover:brightness-110 transition-all active:scale-95 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>Read Notes</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LearningSubject;
