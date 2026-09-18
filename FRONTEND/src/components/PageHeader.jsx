import React from 'react';

const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-b border-brand-border/10 pb-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-brand-textPrimary font-sans tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-brand-textSecondary mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
