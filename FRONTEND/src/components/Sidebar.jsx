import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  UploadCloud,
  BookOpen,
  ClipboardCheck,
  Award,
  BarChart3,
  User,
  LogOut,
  X,
  GraduationCap,
  Bot,
  Mic
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  const navGroups = [
    {
      group: 'Core Workspace',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'AI Study Assistant', path: '/assistant', icon: Bot },
        { name: 'Learning Hub', path: '/learning-hub', icon: GraduationCap },
        { name: 'Mock Interview', path: '/mock-interview', icon: Mic }
      ]
    },
    {
      group: 'Document Archive',
      items: [
        { name: 'File Upload', path: '/upload-pdf', icon: UploadCloud }
      ]
    },
    {
      group: 'Assessment Engines',
      items: [
        { name: 'General MCQ Exam', path: '/generate-test/mcq', icon: BookOpen },
        { name: 'Aptitude Exam', path: '/generate-test/aptitude', icon: BookOpen },
        { name: 'DSA Exam', path: '/generate-test/dsa', icon: BookOpen }
      ]
    },
    {
      group: 'Exam Arena',
      items: [
        { name: 'Exam Attending', path: '/take-test/select', icon: ClipboardCheck }
      ]
    },
    {
      group: 'Performance & Profile',
      items: [
        { name: 'Results', path: '/results/history', icon: Award },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Profile', path: '/profile', icon: User }
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-brand-cardBg border-r border-brand-border/30 w-64 animate-fadeIn">
      {/* Sidebar Header Brand Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-brand-border/20">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-glow">
            <span className="text-lg font-bold text-white tracking-wider">Æ</span>
          </div>
          <span className="text-xl font-bold text-brand-textPrimary tracking-tight font-sans">
            ExamGen <span className="text-brand-accent">AI</span>
          </span>
        </div>
        {/* Close Button on Mobile Drawer */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-brand-textSecondary hover:text-brand-textPrimary md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <span className="px-4 text-[9px] font-bold text-brand-textSecondary/40 uppercase tracking-widest block mb-1">
              {group.group}
            </span>
            {group.items.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => { if (onClose) onClose(); }}
                className={({ isActive }) => `
                  flex items-center justify-between px-4 py-2 rounded-xl text-xs font-medium transition-all group duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-brand-primary/10 to-brand-secondary/5 text-brand-textPrimary active-nav-indicator border-l-2 border-brand-primary shadow-glow'
                    : 'text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/50 hover:translate-x-0.5'
                  }
                `}
              >
                <div className="flex items-center space-x-2.5">
                  <item.icon className="w-4 h-4 transition-colors group-hover:text-brand-primary text-brand-textSecondary" />
                  <span>{item.name}</span>
                </div>
                {item.label && (
                  <span className="px-2 py-0.5 text-[9px] font-semibold rounded bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                    {item.label}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Logout Action */}
      <div className="p-4 border-t border-brand-border/20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group duration-200"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 z-20 w-64 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Overlay backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          ></div>
          {/* Drawer content */}
          <div className="relative z-50 animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
