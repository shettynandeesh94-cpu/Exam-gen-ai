import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-4 px-6 border-t border-brand-border/20 text-center text-xs text-brand-textSecondary mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <p>© {new Date().getFullYear()} ExamGen AI Pro. All rights reserved.</p>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-brand-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-brand-primary transition-colors">System Health</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
