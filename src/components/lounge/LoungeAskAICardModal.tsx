import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User as UserIcon,
  Lightbulb,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { askAI } from '../../services/ai';
import { useAuth } from '../../context/AuthContext';

interface LoungeAskAICardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostIdeaToComposer?: (content: string) => void;
}

interface QuickMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const LoungeAskAICardModal: React.FC<LoungeAskAICardModalProps> = ({
  isOpen,
  onClose,
  onPostIdeaToComposer,
}) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<QuickMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello ${profile?.name || 'builder'}! I am your Lounge AI Assistant. How can I help you in The Lounge today? I can suggest post topics, polish writing, analyze community discussions, or brainstorm technical concepts.`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputText).trim();
    if (!text || loading) return;

    setInputText('');
    const userMsg: QuickMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await askAI({
        prompt: `You are the Lounge AI Companion in Personal AI OS. Help the user with community discussions, creative post writing, or technical knowledge sharing. Request:\n\n${text}`,
        mode: 'chat',
      });

      setMessages((prev) => [
        ...prev,
        {
          id: 'ai_' + Date.now(),
          role: 'model',
          text: reply || 'I am ready to help you craft your next post or discuss any topic!',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai_err_' + Date.now(),
          role: 'model',
          text: 'Here is an idea: Share your recent breakthrough or key learning from today! What is one technical or productivity insight you discovered this week?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    '💡 3 high-impact post ideas for today',
    '✨ How to structure an engineering insight post',
    '🚀 Critique my latest project idea',
  ];

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative flex flex-col h-[580px] w-full max-w-lg rounded-3xl border border-[var(--color-primary)]/40 bg-[var(--color-surface)] shadow-2xl overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-primary)] via-indigo-500 to-[var(--color-cyan)]" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]/60 bg-[var(--color-bg-secondary)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30">
              <Sparkles className="w-4 h-4 text-[var(--color-cyan)]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[var(--color-text)] flex items-center gap-1.5">
                <span>The Lounge AI Copilot</span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-bold text-emerald-400">
                  Live
                </span>
              </h3>
              <p className="text-[10px] text-[var(--color-muted)]">
                Instant top-up assistance &amp; social brainstorming
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-[var(--color-muted)] hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/20 text-[var(--color-primary)] mt-0.5 border border-[var(--color-primary)]/30">
                    <Bot className="w-3.5 h-3.5 text-[var(--color-cyan)]" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-[var(--color-primary)] text-white rounded-br-none'
                      : 'border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>

                {isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-elevated)] text-[var(--color-muted)] mt-0.5 border border-[var(--color-border)]">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-[var(--color-muted)]">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--color-primary)]/20 text-[var(--color-primary)] animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-cyan)]" />
              </div>
              <span className="animate-pulse font-medium">Generating Lounge suggestions…</span>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-t border-[var(--color-border)]/40 bg-[var(--color-bg-secondary)]/50">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-bold text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-white transition-all whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 p-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask AI anything about Lounge posts, ideas, or study concepts…"
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-all font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
