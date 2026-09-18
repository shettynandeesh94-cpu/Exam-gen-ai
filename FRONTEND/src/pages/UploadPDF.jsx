import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import UploadBox from '../components/UploadBox';
import LoadingSpinner from '../components/LoadingSpinner';
import { Trash2, FileText, Calendar, Database, Shield } from 'lucide-react';
import documentService from '../services/documentService';

const UploadPDF = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadDocuments = async () => {
    try {
      const data = await documentService.getDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUploadSuccess = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this study material?")) return;
    
    setDeletingId(id);
    try {
      const data = await documentService.deleteDocument(id);
      if (data.success) {
        setDocuments((prev) => prev.filter(doc => doc._id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.response?.data?.message || 'Error deleting file.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader 
        title="Study Materials Manager" 
        subtitle="Manage your training PDF corpus and feed topics to the AI question generation model." 
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="py-2 px-4 rounded-xl border border-brand-border/40 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-darkBg/60 transition-all cursor-pointer animate-fadeIn"
        >
          Return to Dashboard
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Upload box container */}
        <div className="lg:col-span-1">
          <UploadBox onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Uploaded Documents List */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-brand-border/40 flex flex-col min-h-[400px]">
          <div className="flex items-center space-x-2 border-b border-brand-border/10 pb-3 mb-6">
            <Database className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-brand-textPrimary">Your PDF Knowledge Base</h2>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="p-4 rounded-full bg-brand-darkBg border border-brand-border/30 text-brand-textSecondary">
                <FileText className="w-12 h-12 opacity-30 text-brand-textSecondary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-brand-textPrimary">No documents found</p>
                <p className="text-xs text-brand-textSecondary max-w-sm">Use the form on the left to drag and drop a PDF file and initialize your study resources.</p>
              </div>
            </div>
          ) : (
            /* Responsive table scrollbox */
            <div className="overflow-x-auto w-full -mx-4 px-4 sm:-mx-6 sm:px-6">
              <table className="min-w-full divide-y divide-brand-border/20 text-xs sm:text-sm">
                <thead>
                  <tr className="text-brand-textSecondary text-left font-bold uppercase tracking-wider">
                    <th className="pb-3.5 pr-4 font-semibold">File Name</th>
                    <th className="pb-3.5 px-4 font-semibold">Subject</th>
                    <th className="pb-3.5 px-4 font-semibold hidden sm:table-cell">Uploaded</th>
                    <th className="pb-3.5 px-4 font-semibold hidden md:table-cell">Size</th>
                    <th className="pb-3.5 pl-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/10">
                  {documents.map((doc) => (
                    <tr key={doc._id} className="text-brand-textPrimary hover:bg-brand-darkBg/60 transition-colors">
                      <td className="py-4 pr-4 font-medium max-w-[200px] truncate">
                        <div className="flex items-center space-x-2.5">
                          <FileText className="w-4 h-4 text-brand-primary shrink-0" />
                          <span className="truncate text-brand-textPrimary" title={doc.originalName}>
                            {doc.originalName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-medium">
                          {doc.subject}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-brand-textSecondary hidden sm:table-cell">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-brand-textSecondary hidden md:table-cell">
                        {formatBytes(doc.fileSize)}
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <button
                          onClick={() => handleDelete(doc._id)}
                          disabled={deletingId === doc._id}
                          className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:text-white hover:bg-red-500/15 disabled:opacity-40 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPDF;
