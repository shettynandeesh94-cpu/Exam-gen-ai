import React, { useState, useEffect, useRef } from 'react';
import assistantService from '../services/assistantService';
import documentService from '../services/documentService';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Sparkles, 
  RotateCcw,
  MessageSquare,
  X,
  FileText,
  Maximize2,
  Minimize2
} from 'lucide-react';

const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello! I am your **ExamGen AI Study Buddy**.\n\nI can help you review study concepts, explain topics, or quiz you.\n\nSelect a prompt below or type your question!",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const chatEndRef = useRef(null);

  // Quick study suggest prompts
  const suggestionPrompts = [
    { label: 'Quiz me on OOP', text: 'Give me a quick 3-question MCQ quiz on Object-Oriented Programming.' },
    { label: 'Explain Polymorphism', text: 'Can you explain polymorphism with a simple analogy?' },
    { label: 'Study strategy', text: 'What is the best study strategy to prepare for an exam?' }
  ];

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  // Load uploaded documents on mount for library context
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await documentService.getDocuments();
        setDocuments(data.documents || []);
      } catch (err) {
        console.error("Failed to load context documents in floating assistant:", err);
      }
    };
    fetchDocs();
  }, []);

  // Lock body scroll on mobile screens when the assistant is open
  useEffect(() => {
    const handleBodyScroll = () => {
      const isMobile = window.innerWidth < 768;
      if (isOpen && isMobile) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    handleBodyScroll();
    window.addEventListener('resize', handleBodyScroll);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleBodyScroll);
    };
  }, [isOpen]);

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
        text: `⚠️ **System Error**: ${err.message || 'Unable to fetch response.'}`,
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
        text: "Chat cleared. What concept should we study next?",
        timestamp: new Date()
      }
    ]);
  };

  // Custom Markdown parsing and rendering
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks: ```code```
    html = html.replace(/```([\s\S]+?)```/g, (match, code) => {
      return `<pre class="bg-brand-darkBg border border-brand-border/60 rounded-xl p-3 my-2 text-[10px] font-mono overflow-x-auto text-brand-textPrimary select-all">${code.trim()}</pre>`;
    });

    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code class="bg-brand-darkBg/60 border border-brand-border/30 rounded px-1 py-0.5 text-[10px] font-mono text-brand-accent">$1</code>');

    // Bold: **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-brand-textPrimary">$1</strong>');

    // Headers: ### text, ## text
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-xs font-extrabold text-brand-textPrimary mt-3 mb-1 tracking-tight">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-xs font-extrabold text-brand-textPrimary mt-4 mb-1.5 border-b border-brand-border/10 pb-0.5 tracking-tight">$1</h3>');

    // Bullet points: - text
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-3 list-disc pl-1 mt-0.5 text-brand-textSecondary">$1</li>');

    // Paragraph splits
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(p => {
      if (p.trim().startsWith('<pre') || p.trim().startsWith('<li') || p.trim().startsWith('<h')) {
        return p;
      }
      return `<p class="leading-relaxed mb-1">${p.replace(/\n/g, '<br />')}</p>`;
    }).join('');

    return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-1 text-xs text-brand-textSecondary" />;
  };

  const panelClasses = `fixed z-50 glass-panel shadow-2xl flex flex-col overflow-hidden overscroll-contain transition-all duration-300 ease-out ${
    isOpen 
      ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
      : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
  } ${
    isFullscreen 
      ? 'inset-0 w-screen h-screen rounded-none !border-none' 
      : 'bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[530px] rounded-2xl !border-2 !border-brand-primary/60 md:!border md:!border-brand-primary/40 shadow-[0_0_25px_rgba(99,102,241,0.25)]'
  }`;

  return (
    <>
      {/* 1. Floating Circular Toggle Button (Bottom-Right) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none"
        title="AI Assistant Study Buddy"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.4))' }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 animate-pulse" />}
      </button>

      {/* 2. Floating Chat Overlay Panel (Bottom-Right with transition and fullscreen toggle) */}
      <div 
        className={panelClasses}
        style={{ backdropFilter: 'blur(16px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border/20 bg-brand-darkBg/60">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-brand-primary/15 border border-brand-primary/30 text-brand-primary">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-brand-textPrimary tracking-wide leading-none">AI Study Buddy</h3>
              <span className="text-[9px] text-brand-success font-medium flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse"></span>
                Online
              </span>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Fullscreen Toggle Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg border border-brand-border/40 hover:bg-brand-border/20 text-brand-textSecondary hover:text-brand-textPrimary transition-all mr-1.5"
              title={isFullscreen ? "Minimize Chat" : "Maximize Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Clear Conversation Button */}
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg border border-brand-border/40 hover:bg-brand-border/20 text-brand-textSecondary hover:text-brand-textPrimary transition-all"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages Log Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin overscroll-contain">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex items-start space-x-2.5 max-w-[88%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'}`}
            >
              <div className={`p-1.5 rounded-lg border shrink-0 ${
                msg.sender === 'user' 
                  ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' 
                  : 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20'
              }`}>
                {msg.sender === 'user' ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className={`p-3 rounded-xl text-xs border shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-brand-primary text-white border-brand-primary/10 rounded-tr-none'
                  : 'bg-brand-darkBg/60 text-brand-textPrimary border-brand-border/40 rounded-tl-none'
              }`}>
                {msg.sender === 'user' ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  renderMarkdown(msg.text)
                )}
              </div>
            </div>
          ))}

          {/* Typing status */}
          {loading && (
            <div className="flex items-start space-x-2.5 mr-auto max-w-[88%]">
              <div className="p-1.5 rounded-lg border bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20 shrink-0">
                <Bot className="w-3.5 h-3.5 animate-bounce" />
              </div>
              <div className="p-3 rounded-xl bg-brand-darkBg/60 text-brand-textPrimary border border-brand-border/40 rounded-tl-none shadow-sm flex items-center space-x-1.5">
                <span className="w-1 h-1 rounded-full bg-brand-secondary animate-bounce"></span>
                <span className="w-1 h-1 rounded-full bg-brand-secondary animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1 h-1 rounded-full bg-brand-secondary animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                <span className="text-[9px] text-brand-textSecondary ml-1 italic">Tutor thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Suggestions row & Library Context badge */}
        <div className="px-4 py-2 border-t border-brand-border/10 bg-brand-darkBg/30 space-y-2">
          {/* suggestions list */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none pr-1">
            <Sparkles className="w-3 h-3 text-brand-primary shrink-0" />
            {suggestionPrompts.map((p, i) => (
              <button
                key={i}
                onClick={(e) => handleSend(e, p.text)}
                disabled={loading}
                className="py-1 px-2.5 rounded-full border border-brand-border hover:border-brand-primary/40 bg-brand-cardBg/90 hover:bg-brand-primary/5 text-[10px] text-brand-textSecondary hover:text-brand-textPrimary transition-all cursor-pointer font-medium whitespace-nowrap shrink-0 disabled:opacity-40"
              >
                {p.label}
              </button>
            ))}
          </div>
          
          {/* Injected Context Indicator */}
          {documents.length > 0 && (
            <div className="flex items-center space-x-1 text-[9px] text-brand-textSecondary/70 truncate">
              <FileText className="w-3 h-3 text-brand-primary shrink-0" />
              <span className="truncate">Active library context: {documents.map(d => d.originalName).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Footer Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-brand-border/15 bg-brand-cardBg/90 flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
            className="flex-1 bg-brand-darkBg border border-brand-border/60 hover:border-brand-border focus:border-brand-primary rounded-xl px-3.5 py-2.5 text-xs text-brand-textPrimary focus:outline-none transition-all placeholder:text-brand-textSecondary/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="p-2.5 bg-brand-primary text-white rounded-xl hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </>
  );
};

export default FloatingAssistant;
