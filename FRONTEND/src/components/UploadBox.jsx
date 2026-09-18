import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2 } from 'lucide-react';
import documentService from '../services/documentService';

const UploadBox = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    setSuccess(false);

    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF documents are supported.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size exceeds 10MB limit.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const data = await documentService.uploadDocument(
        file,
        subject,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      );

      if (data.success) {
        setSuccess(true);
        setFile(null);
        setSubject('');
        if (onUploadSuccess) {
          onUploadSuccess(data.document);
        }
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred during file upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-brand-border/40 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-brand-textPrimary mb-1">Upload Study Material</h2>
        <p className="text-xs text-brand-textSecondary">Upload PDF manuals, notes, or documents to train your AI Gen engine.</p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
          dragActive 
            ? 'border-brand-primary bg-brand-primary/10 scale-[0.99] shadow-glow' 
            : 'border-brand-border hover:border-brand-primary/60 bg-brand-darkBg/30'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="p-3 rounded-full bg-brand-darkBg border border-brand-border/40 text-brand-textSecondary mb-3 group-hover:text-brand-primary group-hover:shadow-glow">
          <UploadCloud className="w-8 h-8 text-brand-primary animate-pulse-slow" />
        </div>

        {file ? (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-brand-textPrimary truncate max-w-xs">{file.name}</p>
            <p className="text-xs text-brand-textSecondary">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-brand-textPrimary">Drag & drop your PDF here, or <span className="text-brand-accent hover:underline">browse</span></p>
            <p className="text-xs text-brand-textSecondary">PDF files only (max. 10MB)</p>
          </div>
        )}
      </div>

      {/* Inputs and actions */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-brand-textSecondary uppercase tracking-wider mb-2">
            Document Subject / Domain
          </label>
          <input
            type="text"
            placeholder="e.g. OOP in Java, Computer Networks, Neural Networks"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={uploading}
            className="w-full bg-brand-darkBg border border-brand-border/60 hover:border-brand-border/90 focus:border-brand-primary rounded-xl px-4 py-3 text-sm text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40"
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 text-xs text-brand-success bg-brand-success/10 border border-brand-success/20 px-4 py-2.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0 animate-bounce" />
            <span>File uploaded and processed successfully!</span>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-brand-textSecondary">
              <span>Extracting and parsing text...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-brand-cardBg rounded-full h-2 overflow-hidden border border-brand-border/40">
              <div 
                className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <button
          onClick={handleUploadSubmit}
          disabled={!file || uploading}
          className={`w-full py-3.5 px-4 rounded-xl text-sm font-semibold tracking-wide text-white transition-all ${
            file && !uploading
              ? 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-glow active:scale-95 cursor-pointer'
              : 'bg-brand-darkBg/60 text-brand-textSecondary/50 cursor-not-allowed border border-brand-border/40'
          }`}
        >
          {uploading ? 'Processing File...' : 'Upload & Train AI Engine'}
        </button>
      </div>
    </div>
  );
};

export default UploadBox;
