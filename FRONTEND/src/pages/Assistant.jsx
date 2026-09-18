import React, { useState, useEffect, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import assistantService from '../services/assistantService';
import documentService from '../services/documentService';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  HelpCircle, 
  BookOpen, 
  Sparkles, 
  FileText,
  RotateCcw,
  BookMarked
} from 'lucide-react';

const Assistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello! I am your **ExamGen AI Study Buddy**.\n\nI can help you review concepts, explain difficult topics, summarize notes, or run quick practice quizzes.\n\nSelect one of the quick study prompts below or type any question to get started!",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const chatEndRef = useRef(null);

  // Quick study suggest prompts
  const suggestionPrompts = [
    { label: 'Quiz me on OOP', text: 'Give me a quick 3-question MCQ quiz on Object-Oriented Programming principles.' },
    { label: 'Explain Polymorphism', text: 'Can you explain polymorphism with a simple, real-world analogy?' },
    { label: 'Summarize Inheritance', text: 'Provide a concise summary of inheritance vs composition in programming.' },
    { label: 'Study strategy', text: 'What is the most effective active recall strategy to prepare for a computer science exam?' }
  ];

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load uploaded documents on mount for library context
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setDocsLoading(true);
        const data = await documentService.getDocuments();
        setDocuments(data.documents || []);
      } catch (err) {
        console.error("Failed to load context documents:", err);
      } finally {
        setDocsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleSend = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || loading) return;

    // Add user message to history
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputText('');
    setLoading(true);

    try {
      // Send message history to assistant API
      const chatHistory = [...messages, userMsg].map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      const res = await assistantService.chat(chatHistory);

      // Add assistant response to history
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: `⚠️ **System Error**: ${err.message || 'Unable to fetch response. Please try again.'}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'assistant',
        text: "Chat cleared. I'm ready for our next study session! What topic are we reviewing?",
        timestamp: new Date()
      }
    ]);
  };

  // Custom Markdown parsing and rendering
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // Escape standard tags
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks: ```code```
    html = html.replace(/```([\s\S]+?)```/g, (match, code) => {
      return `<pre class="bg-brand-darkBg border border-brand-border/60 rounded-xl p-3.5 my-3 text-xs font-mono overflow-x-auto text-brand-textPrimary select-all">${code.trim()}</pre>`;
    });

    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code class="bg-brand-darkBg/60 border border-brand-border/30 rounded px-1.5 py-0.5 text-xs font-mono text-brand-accent">$1</code>');

    // Bold: **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-brand-textPrimary">$1</strong>');

    // Headers: ### text, ## text, # text
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-extrabold text-brand-textPrimary mt-4 mb-1.5 tracking-tight">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-extrabold text-brand-textPrimary mt-5 mb-2 tracking-tight border-b border-brand-border/10 pb-1">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-black text-brand-textPrimary mt-6 mb-2.5 tracking-tight">$1</h2>');

    // Bullet points: - text
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4 list-disc pl-1.5 mt-1 text-brand-textSecondary">$1</li>');

    // Paragraph splits
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(p => {
      if (p.trim().startsWith('<pre') || p.trim().startsWith('<li') || p.trim().startsWith('<h')) {
        return p;
      }
      return `<p class="leading-relaxed mb-2">${p.replace(/\n/g, '<br />')}</p>`;
    }).join('');

    return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-1.5 text-xs sm:text-sm text-brand-textSecondary" />;
  };

  return (
    <div className="space-y-8 animate-fadeIn text-brand-textPrimary flex flex-col h-[calc(100vh-120px)]">
      <PageHeader 
        title="AI Study Buddy" 
        subtitle="Review notes, quiz yourself, and clarify difficult concepts with your interactive tutor." 
      >
        <button
          onClick={clearChat}
          className="flex items-center space-x-1.5 py-2 px-3.5 rounded-xl border border-brand-border hover:bg-brand-border/20 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary transition-all cursor-pointer"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Chat</span>
        </button>
      </PageHeader>

      {/* Main Split Panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-hidden">
        
        {/* Left Panel: Study Prompts & Context (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col space-y-6 min-h-0 overflow-y-auto">
          {/* Quick study prompts */}
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
              <span>Suggested Prompts</span>
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-2.5">
              {suggestionPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={(e) => handleSend(e, p.text)}
                  disabled={loading}
                  className="text-left py-2.5 px-3.5 rounded-xl border border-brand-border hover:border-brand-primary/40 bg-brand-darkBg/30 hover:bg-brand-primary/5 text-xs text-brand-textSecondary hover:text-brand-textPrimary transition-all cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Document Context Library */}
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-4 flex-1">
            <h3 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider flex items-center space-x-1.5">
              <BookMarked className="w-3.5 h-3.5 text-brand-secondary" />
              <span>Injected Library Context</span>
            </h3>
            <p className="text-[10px] text-brand-textSecondary leading-relaxed">
              Your uploaded PDFs are indexed by our RAG context system. The assistant references these notes automatically during study.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {docsLoading ? (
                <div className="py-4 text-center">
                  <LoadingSpinner size="sm" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-6 text-brand-textSecondary/50 text-[10px] italic border border-dashed border-brand-border/40 rounded-xl">
                  No documents in library context.
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc._id} className="flex items-center space-x-2.5 p-2 rounded-xl bg-brand-darkBg/40 border border-brand-border/30 text-xs text-brand-textSecondary truncate">
                    <FileText className="w-4 h-4 text-brand-primary shrink-0" />
                    <span className="truncate flex-1 font-medium text-brand-textPrimary">{doc.originalName}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-secondary/15 text-brand-secondary uppercase font-bold shrink-0">{doc.subject}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Chat workspace (lg:col-span-8) */}
        <div className="lg:col-span-8 glass-panel border border-brand-border/40 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col min-h-0 overflow-hidden relative">
          
          {/* Messages Loop Container */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex items-start space-x-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'}`}
              >
                {/* Message Icon */}
                <div className={`p-2 rounded-xl border shrink-0 ${
                  msg.sender === 'user' 
                    ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/25' 
                    : 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/25'
                }`}>
                  {msg.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div className={`p-3.5 rounded-2xl text-xs sm:text-sm border shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-brand-primary text-white border-brand-primary/20 rounded-tr-none'
                    : 'bg-brand-darkBg/60 text-brand-textPrimary border-brand-border/40 rounded-tl-none'
                }`}>
                  {/* Handle formatting */}
                  {msg.sender === 'user' ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    renderMarkdown(msg.text)
                  )}
                  <span className={`block text-[9px] mt-1.5 text-right font-medium ${msg.sender === 'user' ? 'text-white/60' : 'text-brand-textSecondary/60'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-start space-x-3 mr-auto max-w-[85%]">
                <div className="p-2 rounded-xl border bg-brand-secondary/10 text-brand-secondary border-brand-secondary/25 shrink-0">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-3.5 rounded-2xl bg-brand-darkBg/60 text-brand-textPrimary border border-brand-border/40 rounded-tl-none shadow-sm flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  <span className="text-[10px] text-brand-textSecondary ml-2 italic">Study Buddy is compiling explanation...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Form Chat Input */}
          <form onSubmit={handleSend} className="flex items-center space-x-3 pt-3 border-t border-brand-border/15 bg-brand-cardBg/90">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about OOP, Data Structures, or your uploaded notes..."
              disabled={loading}
              className="flex-1 bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-4 py-3 text-xs sm:text-sm text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-3 bg-brand-primary text-white rounded-xl hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Assistant;
