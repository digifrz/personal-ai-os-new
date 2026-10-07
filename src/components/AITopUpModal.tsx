import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Copy,
  Check,
  FileText,
  Radio,
  File,
  CheckSquare,
  Calendar,
  Layers,
  ExternalLink,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { ViewTab, TaskItem, NoteItem, FileItem, CalendarEventItem } from '../types';
import { askAI } from '../services/ai';
import { createNote } from '../services/db';
import { useAuth } from '../context/AuthContext';

interface AITopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ViewTab;
  onNavigateToFullAI: () => void;
  tasks?: TaskItem[];
  notes?: NoteItem[];
  files?: FileItem[];
  events?: CalendarEventItem[];
}

interface TopUpMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
}

export const AITopUpModal: React.FC<AITopUpModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onNavigateToFullAI,
  tasks = [],
  notes = [],
  files = [],
  events = [],
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TopUpMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNoteMsg, setSavedNoteMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine current page contextual metadata
  const pageMeta = React.useMemo(() => {
    switch (activeTab) {
      case 'community':
        return {
          title: 'The Lounge AI Co-Pilot',
          badge: 'The Lounge Context',
          color: 'from-pink-500 to-purple-600',
          textColor: 'text-pink-400',
          borderColor: 'border-pink-500/30',
          bgColor: 'bg-pink-500/10',
          icon: Radio,
          description:
            'Tailored for The Lounge: create engaging posts, community discussion starters, review etiquette rules & creator networking.',
          quickPrompts: [
            '✍️ Draft an engaging Lounge post about modern tech workflows',
            '🔥 Suggest 3 trending community discussion topics for today',
            '🛡️ What are the Lounge privacy and moderation rules?',
            '✨ Polish my social post caption with 2 relevant hashtags',
            '🤝 Tips on networking with fellow creators in The Lounge',
          ],
        };
      case 'files':
        return {
          title: 'Workspace Files AI Assistant',
          badge: 'Files & Storage Context',
          color: 'from-amber-500 to-orange-600',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/30',
          bgColor: 'bg-amber-500/10',
          icon: File,
          description:
            'File summaries, document classification, search intelligence & cloud storage optimization for your uploaded files.',
          quickPrompts: [
            '📄 Summarize my recently uploaded workspace files',
            '🗂️ How should I structure my project folders for peak efficiency?',
            '📊 Analyze my workspace file types and storage distribution',
            '🔍 Help me locate documents and notes related to active projects',
          ],
        };
      case 'notes':
      case 'favorites':
      case 'trash':
        return {
          title: 'Notes & Synthesis AI',
          badge: 'Notes Context',
          color: 'from-purple-500 to-indigo-600',
          textColor: 'text-purple-400',
          borderColor: 'border-purple-500/30',
          bgColor: 'bg-purple-500/10',
          icon: FileText,
          description:
            'Synthesize notes into executive summaries, brainstorm new concepts, and extract key action items.',
          quickPrompts: [
            '📝 Synthesize my recent notes into key takeaways',
            '💡 Brainstorm 3 fresh concepts based on my note titles',
            '⚡ Extract actionable tasks from my latest notes',
          ],
        };
      case 'tasks':
      case 'goals':
        return {
          title: 'Tasks & Execution AI',
          badge: 'Tasks & Productivity Context',
          color: 'from-emerald-500 to-teal-600',
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/30',
          bgColor: 'bg-emerald-500/10',
          icon: CheckSquare,
          description:
            'Prioritize tasks, break down complex goals, and optimize your sprint schedule.',
          quickPrompts: [
            '🎯 Which 3 open tasks deserve my highest focus today and why?',
            '⚡ Break down my biggest pending task into 4 manageable steps',
            '⏱️ Recommend realistic time allocations for my open items',
          ],
        };
      case 'calendar':
        return {
          title: 'Schedule & Calendar AI',
          badge: 'Calendar Context',
          color: 'from-blue-500 to-cyan-600',
          textColor: 'text-cyan-400',
          borderColor: 'border-cyan-500/30',
          bgColor: 'bg-cyan-500/10',
          icon: Calendar,
          description:
            'Agenda planning, 90-minute focus blocks, and meeting preparation.',
          quickPrompts: [
            '📅 Review my upcoming events and suggest dedicated focus blocks',
            '📋 Create a standard meeting agenda template for tomorrow',
          ],
        };
      default:
        return {
          title: 'Personal AI OS Co-Pilot',
          badge: 'Workspace Hub Context',
          color: 'from-indigo-500 to-cyan-500',
          textColor: 'text-[var(--color-primary)]',
          borderColor: 'border-[var(--color-primary)]/30',
          bgColor: 'bg-[var(--color-primary)]/10',
          icon: Sparkles,
          description:
            'Cross-workspace assistant connecting your tasks, notes, files, events, and community activities.',
          quickPrompts: [
            '📊 Give me an executive briefing of my current workspace status',
            '⚡ What is my highest-leverage priority right now?',
            '💡 Suggest a productivity workflow improvement',
          ],
        };
    }
  }, [activeTab]);

  // Reset or initialize greeting when modal opens or activeTab changes
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          id: 'welcome_' + activeTab,
          role: 'model',
          text: `Hi! I'm your **${pageMeta.title}**. I am actively contextualized for **${pageMeta.badge}**.\n\n${pageMeta.description}\n\nAsk me anything below or click one of the quick suggestions!`,
          createdAt: new Date().toISOString(),
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, activeTab, pageMeta]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || loading) return;

    setInput('');
    const userMsg: TopUpMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Build rich page-specific context
    const contextData = {
      activePage: activeTab,
      pageContext: pageMeta.badge,
      filesSummary: files.slice(0, 8).map((f) => `${f.name} (${f.mimeType || f.itemType}, ${((f.sizeBytes || 0) / 1024).toFixed(1)}KB)`),
      tasksSummary: tasks.slice(0, 8).map((t) => `${t.title} [${t.priority}] (${t.status})`),
      notesSummary: notes.slice(0, 8).map((n) => n.title),
      eventsSummary: events.slice(0, 5).map((e) => `${e.title} at ${e.startsAt}`),
      loungeGuidelines:
        'Lounge is a collaborative, respectful community. Respect fellow creators, keep content constructive, and protect privacy.',
    };

    try {
      const reply = await askAI({
        prompt: `[Current Page: ${pageMeta.badge}]\nUser Query: ${text}\n\nPlease provide a clear, helpful, well-structured response directly relevant to the current page context (${pageMeta.badge}). Format with markdown bullet points if helpful.`,
        mode: 'chat',
        context: contextData,
      });

      const modelMsg: TopUpMessage = {
        id: 'mdl_' + Date.now(),
        role: 'model',
        text: reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      console.warn('AI Top Up error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'model',
          text: 'I encountered a temporary connection issue. Please check your prompt or try again shortly.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNote = async (text: string) => {
    try {
      await createNote({
        userId: user?.uid || 'guest_user',
        title: `${pageMeta.badge} Insight - ${new Date().toLocaleDateString()}`,
        body: text,
        category: 'AI Insights',
        color: 'Purple',
        isPinned: false,
        isArchived: false,
        isTrashed: false,
      });
      setSavedNoteMsg(true);
      setTimeout(() => setSavedNoteMsg(false), 2500);
    } catch (e) {
      console.warn('Save note failed:', e);
    }
  };

  const PageIcon = pageMeta.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        className="relative flex flex-col h-[85vh] max-h-[750px] w-full max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden text-[var(--color-text)] animate-scale-up"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-gradient-to-r from-neutral-900/60 via-[var(--color-surface)] to-neutral-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${pageMeta.color} text-white shadow-lg`}>
              <PageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-[var(--color-text)]">
                  {pageMeta.title}
                </h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pageMeta.bgColor} border ${pageMeta.borderColor} ${pageMeta.textColor}`}>
                  {pageMeta.badge}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] truncate max-w-[280px] sm:max-w-md">
                {pageMeta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToFullAI();
              }}
              title="Open Full AI Workspace"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all"
            >
              <span>Full View</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Context Prompt Chips */}
        <div className="px-5 py-2.5 border-b border-[var(--color-border)]/50 bg-[var(--color-surface)]/40 overflow-x-auto scrollbar-none flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 text-[var(--color-cyan)]" />
            Quick Suggestions:
          </span>
          {pageMeta.quickPrompts.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q.replace(/^[^\w\s]+\s*/, ''))}
              className="whitespace-nowrap shrink-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all font-medium"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Saved Note Toast Notification */}
        {savedNoteMsg && (
          <div className="mx-5 mt-2 flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-md animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Saved to Notes!</span>
          </div>
        )}

        {/* Chat Message Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs sm:text-sm animate-fade-in ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${pageMeta.color} text-white shadow-sm mt-0.5`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-2xl p-3.5 sm:p-4 leading-relaxed ${
                    isUser
                      ? 'bg-[var(--color-primary)] text-white shadow-md'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap select-text">{m.text}</div>

                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-[var(--color-border)]/60 flex items-center justify-end gap-2 text-[11px] text-[var(--color-muted)]">
                      <button
                        type="button"
                        onClick={() => handleCopy(m.text, m.id)}
                        className="flex items-center gap-1 hover:text-[var(--color-text)] transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveToNote(m.text)}
                        className="flex items-center gap-1 hover:text-[var(--color-text)] transition-colors ml-2"
                        title="Save response to workspace notes"
                      >
                        <FileText className="w-3 h-3 text-purple-400" />
                        <span>Save to Note</span>
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-primary)] font-bold text-xs mt-0.5">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 text-xs animate-pulse">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${pageMeta.color} text-white shadow-sm`}>
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-muted)] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-ping" />
                <span>Thinking with {pageMeta.badge} context…</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all shadow-inner"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask AI about ${pageMeta.badge}…`}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-muted)] px-1">
            <span>Context: {pageMeta.badge} active</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToFullAI();
              }}
              className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors font-semibold"
            >
              <span>Switch to Full AI Workspace</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
