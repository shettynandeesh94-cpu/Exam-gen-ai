import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import FloatingAssistant from '../components/FloatingAssistant';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-brand-darkBg text-brand-textPrimary font-sans">
      {/* Sidebar navigation drawer */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content pane */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        {/* Header navigation bar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Content pane */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto flex flex-col">
          <Outlet />
        </main>

        {/* Global Floating AI Assistant Widget */}
        <FloatingAssistant />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
