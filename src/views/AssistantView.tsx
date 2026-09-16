import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Copy,
  FilePlus,
  BookOpen,
  CheckSquare,
  Search,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AIChatMessage, TaskItem, NoteItem, FileItem, CalendarEventItem } from '../types';
import {
  listenToAIChats,
  addAIChatMessage,
  clearAIChats,
  createNote,
  createTask,
} from '../services/db';
import { askAI } from '../services/ai';

interface AssistantViewProps {
  tasks: TaskItem[];
  notes: NoteItem[];
  files: FileItem[];
  events: CalendarEventItem[];
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  tasks,
  notes,
  files,
  events,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'suggest_tasks' | 'study_quiz'>('chat');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  useEffect(() => {
    if (!user) return;
    const unsub = listenToAIChats(user.uid, (chatList) => {
      setMessages(chatList);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || inputPrompt).trim();
    if (!user || !text || loading) return;

    setInputPrompt('');
    setLoading(true);

    // Context preparation
    const workspaceContext = {
      openTasksCount: tasks.filter((t) => t.status !== 'done').length,
      recentTasks: tasks.slice(0, 5).map((t) => t.title),
      totalNotesCount: notes.length,
      recentNotes: notes.slice(0, 5).map((n) => n.title),
      recentFiles: files.slice(0, 5).map((f) => f.name),
      upcomingEvents: events.slice(0, 3).map((e) => `${e.title} at ${e.startsAt}`),
    };

    try {
      // Save user message to Firestore
      await addAIChatMessage(user.uid, 'user', text);

      // Call Gemini API via full-stack server
      const aiReply = await askAI({
        prompt: text,
        mode: activeMode,
        context: workspaceContext,
      });

      // Save AI response to Firestore
      await addAIChatMessage(user.uid, 'model', aiReply);
    } catch (err: any) {
      console.error('Chat error:', err);
      showToast('AI request failed. Please check connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    if (!confirm('Clear all AI chat history?')) return;
    await clearAIChats(user.uid);
    showToast('AI history cleared.');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNote = async (text: string) => {
    if (!user) return;
    try {
      await createNote({
        userId: user.uid,
        title: 'AI Insight: ' + new Date().toLocaleDateString(),
        body: text,
        category: 'Personal',
        color: 'Purple',
        isPinned: false,
        isArchived: false,
        isTrashed: false,
      });
      showToast('Saved to Notes!');
    } catch (e) {
      showToast('Could not save note.');
    }
  };

  const quickPrompts = [
    {
      title: 'Analyze my tasks',
      prompt: 'Review my open tasks and tell me what 2 items deserve my absolute focus today and why.',
    },
    {
      title: 'Weekly planning',
      prompt: 'Draft a balanced weekly study and productivity routine based on my calendar and tasks.',
    },
    {
      title: 'Summarize notes',
      prompt: 'Look at my recent notes and tell me what recurring themes or ideas are emerging.',
    },
    {
      title: 'Study quiz',
      prompt: 'Generate 4 challenging conceptual questions based on my current study topics.',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[150] rounded-xl border border-[var(--color-primary)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-xs font-bold text-[var(--color-text)] shadow-xl animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl text-[var(--color-ai)]">✦</span>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-ai)]">
              AI Command Center
            </p>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Unified Intelligence.
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Powered by Gemini, with full real-time awareness of your tasks, notes, files, and calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-muted)] hover:text-red-400 hover:border-red-400/40 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear history</span>
          </button>
        </div>
      </section>

      {/* Mode Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveMode('chat')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border ${
            activeMode === 'chat'
              ? 'border-[var(--color-ai)] bg-[var(--color-ai-soft)] text-[var(--color-ai)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-ai)]/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>General Workspace Copilot</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('suggest_tasks')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border ${
            activeMode === 'suggest_tasks'
              ? 'border-[var(--color-ai)] bg-[var(--color-ai-soft)] text-[var(--color-ai)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-ai)]/40'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Task Strategist</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('study_quiz')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border ${
            activeMode === 'study_quiz'
              ? 'border-[var(--color-ai)] bg-[var(--color-ai-soft)] text-[var(--color-ai)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-ai)]/40'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Study Quiz Generator</span>
        </button>
      </div>

      {/* Main Chat Frame */}
      <div className="flex flex-col h-[650px] rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isModel = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isModel ? '' : 'flex-row-reverse'}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                    isModel
                      ? 'ai-gradient text-white shadow-md'
                      : 'bg-[var(--color-primary)] text-white'
                  }`}
                >
                  {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`relative max-w-[82%] sm:max-w-[72%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isModel
                      ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text)] border border-[var(--color-border)]'
                      : 'bg-[var(--color-primary)] text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-sans text-xs">{msg.text}</p>

                  {isModel && (
                    <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/50 text-[10px] text-[var(--color-muted)]">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="flex items-center gap-1 hover:text-[var(--color-text)]"
                      >
                        {copiedId === msg.id ? (
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
                        onClick={() => handleSaveToNote(msg.text)}
                        className="flex items-center gap-1 hover:text-[var(--color-text)]"
                      >
                        <FilePlus className="w-3 h-3" />
                        <span>Save to Note</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="ai-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 text-xs text-[var(--color-muted)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-ai)] animate-ping" />
                  <span>Personal AI is thinking with workspace context…</span>
                </div>
              </div>
            </div>
          )}

          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="ai-gradient flex h-14 w-14 items-center justify-center rounded-3xl text-2xl text-white shadow-xl">
                ✦
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  Ask anything about your workspace
                </h3>
                <p className="mt-1 text-xs text-[var(--color-muted)] max-w-sm">
                  Personal AI knows about your {tasks.length} tasks, {notes.length} notes, {files.length} files, and upcoming events.
                </p>
              </div>

              {/* Quick Prompt Cards */}
              <div className="grid sm:grid-cols-2 gap-2.5 max-w-xl w-full pt-4 text-left">
                {quickPrompts.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 hover:border-[var(--color-ai)] transition-all group"
                  >
                    <strong className="block text-xs font-bold text-[var(--color-text)] group-hover:text-[var(--color-ai)]">
                      {item.title}
                    </strong>
                    <small className="block text-[11px] text-[var(--color-muted)] truncate mt-0.5">
                      {item.prompt}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 rounded-2xl border border-[var(--color-ai)]/50 bg-[var(--color-bg-secondary)] px-4 py-2.5 focus-within:ring-2 focus-within:ring-[var(--color-ai)]/20 transition-all"
          >
            <Sparkles className="w-4 h-4 text-[var(--color-ai)] shrink-0" />
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask anything, formulate plans, or ask for workspace suggestions..."
              className="w-full bg-transparent text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-ai)] text-white hover:bg-[var(--color-ai)]/90 disabled:opacity-40 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
