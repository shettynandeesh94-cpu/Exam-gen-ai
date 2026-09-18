import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const WarningPopup = ({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onCancel} 
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
      ></div>

      {/* Modal Box */}
      <div className="relative glass-panel border border-brand-border/60 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp z-10">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-brand-warning"></div>

        {/* Close button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-brand-textSecondary hover:text-brand-textPrimary p-1 rounded-lg hover:bg-brand-darkBg/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="p-3 rounded-full bg-brand-warning/10 text-brand-warning border border-brand-warning/20 shadow-glow">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-brand-textPrimary tracking-tight">
              {title || 'Are you sure?'}
            </h3>
            <p className="text-xs text-brand-textSecondary leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full pt-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-brand-textSecondary bg-brand-darkBg hover:bg-brand-cardBg border border-brand-border/40 hover:text-brand-textPrimary transition-all active:scale-95"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-warning to-amber-600 hover:shadow-glow hover:brightness-110 transition-all active:scale-95"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarningPopup;
