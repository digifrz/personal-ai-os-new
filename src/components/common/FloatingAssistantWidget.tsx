import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Check,
  ChevronDown,
  Layers,
  Key,
} from 'lucide-react';
import { askAI } from '../../services/ai';
import { TaskItem, NoteItem } from '../../types';

export interface FloatingAssistantWidgetProps {
  tasks: TaskItem[];
  notes: NoteItem[];
  onNavigateTab?: (tab: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  engine: 'gemini' | 'chatgpt';
  timestamp: string;
}

export const FloatingAssistantWidget: React.FC<FloatingAssistantWidgetProps> = ({
  tasks,
  notes,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [engine, setEngine] = useState<'gemini' | 'chatgpt'>('chatgpt'); // Default to ChatGPT as user requested!
  const [customOpenAiKey, setCustomOpenAiKey] = useState(() => {
    try {
      return localStorage.getItem('user_openai_api_key') || '';
    } catch {
      return '';
    }
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: "👋 Hi! I'm your external assistant (OpenAI ChatGPT & Gemini integrated). How can I assist with your workspace tasks, notes, or research today?",
      engine: 'chatgpt',
      timestamp: new Date().toISOString(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSaveKey = () => {
    setCustomOpenAiKey(tempKeyInput.trim());
    try {
      localStorage.setItem('user_openai_api_key', tempKeyInput.trim());
    } catch {}
    setShowKeyModal(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      engine,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const answer = await askAI({
        prompt: userText,
        provider: engine === 'chatgpt' ? 'chatgpt' : 'gemini',
        openaiApiKey: customOpenAiKey || undefined,
        context: {
          recentTasks: tasks.slice(0, 5).map((t) => t.title),
          recentNotes: notes.slice(0, 5).map((n) => n.title),
          openTasksCount: tasks.filter((t) => t.status !== 'done').length,
        },
      });

      const assistantMsg: Message = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: answer,
        engine,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'I could not complete that request right now. Please try again.',
          engine,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher trigger button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Open AI Assistant (ChatGPT & Gemini)"
          className="fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-3 sm:px-4 sm:py-3 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all select-none hover:shadow-emerald-500/30 hover:shadow-2xl"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-300 animate-ping" />
          </div>
          <span className="hidden sm:inline text-xs font-black tracking-tight">
            Ask Assistant
          </span>
          <span className="rounded-full bg-black/30 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300">
            {engine === 'chatgpt' ? 'GPT-4o' : 'Gemini'}
          </span>
        </button>
      )}

      {/* Floating drawer modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-[9995] flex flex-col w-[92vw] sm:w-[420px] h-[550px] max-h-[85vh] rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden backdrop-blur-2xl animate-fade-in text-xs">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)]/70">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-black ${
                engine === 'chatgpt' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
              }`}>
                {engine === 'chatgpt' ? 'GPT' : <Sparkles className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[var(--color-text)] text-sm">
                    {engine === 'chatgpt' ? 'ChatGPT Assistant' : 'Gemini Assistant'}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    engine === 'chatgpt'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                  }`}>
                    {engine === 'chatgpt' ? 'OpenAI GPT-4o' : 'Gemini 3.8'}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-muted)] leading-none mt-0.5">
                  External assistant for your workspace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setTempKeyInput(customOpenAiKey);
                  setShowKeyModal(true);
                }}
                title="Configure API key"
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Engine Selector Segmented Control */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]/50">
            <span className="text-[10px] font-bold text-[var(--color-muted)]">Model Provider:</span>
            <div className="flex items-center rounded-xl bg-[var(--color-surface)] p-0.5 border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setEngine('chatgpt')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  engine === 'chatgpt'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <span>🟢 ChatGPT</span>
              </button>
              <button
                type="button"
                onClick={() => setEngine('gemini')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  engine === 'gemini'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <span>🌟 Gemini</span>
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1 mb-0.5 px-1 text-[9px] text-[var(--color-muted)]">
                    <span>{isUser ? 'You' : m.engine === 'chatgpt' ? 'ChatGPT' : 'Gemini'}</span>
                  </div>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 max-w-[88%] leading-relaxed whitespace-pre-wrap break-words ${
                      isUser
                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text)] border border-[var(--color-border)]'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-[var(--color-muted)] p-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-mono">Thinking…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="px-3 py-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-t border-[var(--color-border)]/40 bg-[var(--color-surface)]">
            {[
              'Summarize open tasks',
              'Draft an update email',
              'Break down my goals',
              'Review notes',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setInput(chip);
                }}
                className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 p-3 bg-[var(--color-surface-elevated)] border-t border-[var(--color-border)]/70"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${engine === 'chatgpt' ? 'ChatGPT' : 'Gemini'} anything…`}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-[var(--color-text)] outline-none text-xs"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center h-8 w-8 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* OpenAI Key Configuration Modal */}
      {showKeyModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setShowKeyModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xl text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="font-extrabold text-[var(--color-text)] text-sm">
                  OpenAI API Key (Optional)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[var(--color-muted)] leading-relaxed">
              You can optionally connect your personal OpenAI API Key to directly bill GPT-4o completions to your OpenAI account. If left blank, the app uses the built-in universal AI Studio bridge at zero extra cost!
            </p>

            <div>
              <label className="block font-bold text-[var(--color-muted)] mb-1">
                API Key (sk-...)
              </label>
              <input
                type="password"
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2.5 text-[var(--color-text)] outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="rounded-xl px-3 py-1.5 text-[var(--color-muted)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
