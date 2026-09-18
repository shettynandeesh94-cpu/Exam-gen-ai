import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import interviewService from '../services/interviewService';
import { 
  Mic, 
  Keyboard, 
  Play, 
  History, 
  Trash2, 
  ChevronRight, 
  Award, 
  Calendar, 
  ArrowRight,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

const MockInterviewHub = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // States for configs per card category
  const [configs, setConfigs] = useState({});

  const categories = [
    { id: 'dsa', name: 'DSA', desc: 'Data Structures, algorithms, sorting, and complexity analysis.' },
    { id: 'dbms', name: 'DBMS', desc: 'Relational databases, SQL, normalization, and ACID properties.' },
    { id: 'os', name: 'Operating Systems', desc: 'Process management, threads, memory, and CPU scheduling.' },
    { id: 'cn', name: 'Computer Networks', desc: 'OSI layers, TCP/IP, routing protocols, and IP addressing.' },
    { id: 'oop', name: 'OOP', desc: 'Encapsulation, inheritance, polymorphism, and abstraction.' },
    { id: 'java', name: 'Java', desc: 'Core Java, JVM memory, multi-threading, and OOP syntax.' },
    { id: 'python', name: 'Python', desc: 'Python structures, decorators, memory management, and OOP.' },
    { id: 'web-dev', name: 'Web Development', desc: 'HTML, CSS, JS, browser APIs, React, and REST APIs.' },
    { id: 'system-design', name: 'System Design', desc: 'Scalability, microservices, load balancing, caching, and databases.' },
    { id: 'hr', name: 'HR Interview', desc: 'Behavioral, situational, career goals, and cultural fit questions.' },
    { id: 'ece', name: 'ECE Core Subjects', desc: 'Digital/analog electronics, signals, DSP, and microprocessors.' }
  ];

  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        setLoading(true);
        const res = await interviewService.getHistory();
        if (res.success) {
          setHistory(res.sessions || []);
          // Find if there is an in-progress session
          const active = res.sessions.find(s => s.status === 'in-progress');
          if (active) {
            setActiveSession(active);
          } else {
            setActiveSession(null);
          }
        }
      } catch (err) {
        console.error('Failed to load interview history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();

    // Initialize config states for categories
    const initialConfigs = {};
    categories.forEach(cat => {
      initialConfigs[cat.id] = {
        length: 10,
        difficulty: 'Medium',
        mode: 'voice' // 'voice' or 'text'
      };
    });
    setConfigs(initialConfigs);
  }, []);

  const handleConfigChange = (catId, field, value) => {
    setConfigs(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [field]: value
      }
    }));
  };

  const handleStartInterview = async (catId, catName) => {
    try {
      setLoading(true);
      const config = configs[catId];
      const res = await interviewService.startSession(
        catName,
        config.difficulty,
        config.length,
        config.mode
      );
      if (res.success && res.session) {
        navigate(`/mock-interview/session/${res.session._id}`);
      }
    } catch (err) {
      console.error('Failed to start interview:', err);
      alert('Error initiating interview. Please try again.');
      setLoading(false);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this session from history?')) return;
    try {
      const res = await interviewService.deleteSession(sessionId);
      if (res.success) {
        setHistory(prev => prev.filter(s => s._id !== sessionId));
        if (activeSession && activeSession._id === sessionId) {
          setActiveSession(null);
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  if (loading && history.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn text-brand-textPrimary font-sans pb-16">
      
      {/* Welcome Hero Area */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-border/40 bg-gradient-to-br from-brand-cardBg via-brand-darkBg to-brand-darkBg p-6 md:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-brand-accent/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center space-x-2 text-[10px] font-bold tracking-wider px-3 py-1 rounded-full bg-brand-accent/15 border border-brand-accent/20 text-brand-accent uppercase">
              <Sparkles className="w-3 h-3 text-brand-secondary animate-pulse" />
              <span>Simulated Placement Platform</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-textPrimary tracking-tight">
              AI Mock Interview Platform
            </h1>
            <p className="text-xs md:text-sm text-brand-textSecondary leading-relaxed">
              Practice technical and HR interviews with AI, improve communication skills, receive detailed feedback, and prepare for placements. Choose a domain and customize your session below.
            </p>
          </div>

          <div className="shrink-0 p-4 rounded-2xl bg-brand-darkBg/60 border border-brand-border/30 flex items-center justify-center shadow-glow">
            <Mic className="w-10 h-10 text-brand-accent animate-pulse" />
          </div>
        </div>
      </div>

      {/* Active Session Resumption Banner */}
      {activeSession && (
        <div className="p-4.5 rounded-2xl border border-brand-warning/35 bg-brand-warning/10 text-brand-textPrimary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse-slow">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-warning/20 text-brand-warning border border-brand-warning/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-warning">Active Interview In Progress</h4>
              <p className="text-xs text-brand-textSecondary mt-0.5">
                You have an active in-progress <span className="font-bold text-brand-textPrimary">{activeSession.domain}</span> session.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate(`/mock-interview/session/${activeSession._id}`)}
            className="flex items-center space-x-1.5 py-2 px-4.5 bg-brand-warning text-black text-xs font-extrabold rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span>Resume Interview</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Categories Grid */}
      <div className="space-y-4">
        <span className="text-[10px] font-bold tracking-wider text-brand-textSecondary uppercase block">
          Select Interview Domain
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => {
            const config = configs[cat.id] || { length: 10, difficulty: 'Medium', mode: 'voice' };
            return (
              <div 
                key={cat.id}
                className="glass-panel border border-brand-border/40 rounded-2xl p-5 hover:border-brand-primary/30 flex flex-col justify-between h-[280px] shadow-md transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-extrabold text-brand-textPrimary group-hover:text-brand-primary transition-colors">{cat.name}</h3>
                    <span className="text-[9px] font-mono font-bold bg-brand-darkBg/60 border border-brand-border/30 px-2 py-0.5 rounded-lg text-brand-textSecondary uppercase">
                      CATALOG
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-textSecondary leading-relaxed h-[36px] overflow-hidden">{cat.desc}</p>
                </div>

                {/* Configurations UI inside card */}
                <div className="space-y-2.5 pt-3 border-t border-brand-border/10">
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-semibold text-brand-textSecondary">
                    {/* Length Selection */}
                    <div className="space-y-1">
                      <span className="block text-[8px] uppercase tracking-wider text-brand-textSecondary/70">Questions</span>
                      <select 
                        value={config.length}
                        onChange={(e) => handleConfigChange(cat.id, 'length', parseInt(e.target.value))}
                        className="w-full bg-brand-darkBg border border-brand-border/40 rounded px-1.5 py-1 text-brand-textPrimary focus:outline-none"
                      >
                        <option value="5">5 Qs</option>
                        <option value="10">10 Qs</option>
                        <option value="20">20 Qs</option>
                      </select>
                    </div>

                    {/* Difficulty Selection */}
                    <div className="space-y-1">
                      <span className="block text-[8px] uppercase tracking-wider text-brand-textSecondary/70">Start Level</span>
                      <select 
                        value={config.difficulty}
                        onChange={(e) => handleConfigChange(cat.id, 'difficulty', e.target.value)}
                        className="w-full bg-brand-darkBg border border-brand-border/40 rounded px-1.5 py-1 text-brand-textPrimary focus:outline-none"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    {/* Mode Selection */}
                    <div className="space-y-1">
                      <span className="block text-[8px] uppercase tracking-wider text-brand-textSecondary/70">Input Mode</span>
                      <select 
                        value={config.mode}
                        onChange={(e) => handleConfigChange(cat.id, 'mode', e.target.value)}
                        className="w-full bg-brand-darkBg border border-brand-border/40 rounded px-1.5 py-1 text-brand-textPrimary focus:outline-none"
                      >
                        <option value="voice">🎙 Voice</option>
                        <option value="text">⌨ Text</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-brand-textSecondary">
                    {config.mode === 'voice' ? (
                      <span className="flex items-center space-x-1"><Mic className="w-3.5 h-3.5 text-brand-accent" /><span>Voice Mode</span></span>
                    ) : (
                      <span className="flex items-center space-x-1"><Keyboard className="w-3.5 h-3.5 text-brand-primary" /><span>Text Mode</span></span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleStartInterview(cat.id, cat.name)}
                    className="flex items-center space-x-1 py-2 px-3.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:shadow-glow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Start</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Log Section */}
      <div className="space-y-4 pt-4">
        <span className="text-[10px] font-bold tracking-wider text-brand-textSecondary uppercase block flex items-center gap-1">
          <History className="w-4 h-4 text-brand-accent" />
          <span>Interview Session History</span>
        </span>

        {history.length === 0 ? (
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-8 text-center text-brand-textSecondary text-xs">
            <Award className="w-10 h-10 mx-auto mb-2 opacity-30 text-brand-textSecondary" />
            <p className="font-semibold">No interviews completed yet.</p>
            <p className="text-[10px] mt-1 text-brand-textSecondary/70">Complete an interview session above to get placement-grade coaching feedback.</p>
          </div>
        ) : (
          <div className="glass-panel border border-brand-border/40 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-darkBg/60 text-brand-textSecondary border-b border-brand-border/10 font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-4">Domain / Category</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4 text-center">Questions</th>
                    <th className="p-4">Mode</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/15">
                  {history.map((session) => {
                    const isCompleted = session.status === 'completed';
                    
                    return (
                      <tr 
                        key={session._id}
                        className="hover:bg-brand-darkBg/30 transition-all cursor-pointer"
                        onClick={() => {
                          if (isCompleted) {
                            navigate(`/mock-interview/report/${session._id}`);
                          } else {
                            navigate(`/mock-interview/session/${session._id}`);
                          }
                        }}
                      >
                        {/* Domain */}
                        <td className="p-4 font-bold text-brand-textPrimary">{session.domain}</td>
                        {/* Date */}
                        <td className="p-4 text-brand-textSecondary text-[11px] flex items-center space-x-1.5 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-brand-textSecondary/70" />
                          <span>{new Date(session.createdAt).toLocaleDateString()} at {new Date(session.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </td>
                        {/* Questions count */}
                        <td className="p-4 text-center text-brand-textSecondary font-mono font-medium">{session.length} Qs</td>
                        {/* Mode */}
                        <td className="p-4 text-brand-textSecondary capitalize">
                          {session.mode === 'voice' ? '🎙 Voice' : '⌨ Text'}
                        </td>
                        {/* Score */}
                        <td className="p-4 text-center">
                          {isCompleted ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-brand-success/15 border border-brand-success/30 font-bold font-mono text-brand-success text-[10px]">
                              {session.overallScore.toFixed(1)} / 10
                            </span>
                          ) : (
                            <span className="text-brand-textSecondary text-[10px] italic">N/A</span>
                          )}
                        </td>
                        {/* Status */}
                        <td className="p-4">
                          {isCompleted ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-brand-success/10 text-brand-success border border-brand-success/20">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-brand-warning/10 text-brand-warning border border-brand-warning/20">
                              In Progress
                            </span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-2.5">
                            {isCompleted ? (
                              <button 
                                onClick={(e) => { e.stopPropagation(); navigate(`/mock-interview/report/${session._id}`); }}
                                className="py-1 px-3 bg-brand-primary text-white text-[10px] font-bold rounded-lg hover:shadow-glow transition-all"
                              >
                                View Report
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => { e.stopPropagation(); navigate(`/mock-interview/session/${session._id}`); }}
                                className="py-1 px-3 bg-brand-warning text-black text-[10px] font-bold rounded-lg hover:brightness-110 transition-all"
                              >
                                Resume
                              </button>
                            )}

                            <button
                              onClick={(e) => handleDeleteSession(e, session._id)}
                              className="p-1.5 rounded-lg border border-brand-border/40 text-brand-textSecondary hover:border-red-500/40 hover:text-red-500 transition-all"
                              title="Delete Interview Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterviewHub;
