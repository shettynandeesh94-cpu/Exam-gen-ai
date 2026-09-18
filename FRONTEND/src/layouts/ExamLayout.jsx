import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Shield, Sun, Moon } from 'lucide-react';

const ExamLayout = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

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

  return (
    <div className="min-h-screen bg-brand-darkBg text-brand-textPrimary flex flex-col font-sans">
      {/* Locked Header */}
      <header className="h-14 bg-brand-cardBg border-b border-brand-border/40 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="h-7 w-7 rounded bg-brand-primary flex items-center justify-center shadow-glow">
            <span className="text-sm font-bold text-white">Æ</span>
          </div>
          <span className="text-sm font-bold text-brand-textPrimary tracking-tight">ExamGen AI Assessment Engine</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme switch inside exam view */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all flex items-center justify-center cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-brand-warning" /> : <Moon className="w-4 h-4 text-brand-primary" />}
          </button>

          <div className="flex items-center space-x-2 text-brand-success text-xs font-semibold px-3 py-1 rounded-full bg-brand-success/10 border border-brand-success/20">
            <Shield className="w-3.5 h-3.5 animate-pulse" />
            <span>Secure Session Active</span>
          </div>
        </div>
      </header>

      {/* Main Secure Content Pane */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default ExamLayout;
