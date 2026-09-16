import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ArrowLeft, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CommunityChannelItem, CommunityMessageItem } from '../../types';
import { subscribeChannelMessages, sendChannelMessage } from '../../services/db';

interface RoomChatModalProps {
  room: CommunityChannelItem;
  onClose: () => void;
}

export const RoomChatModal: React.FC<RoomChatModalProps> = ({ room, onClose }) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<CommunityMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeChannelMessages(room.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    });

    return () => unsub();
  }, [room.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendChannelMessage(
        room.id,
        user.uid,
        profile?.name || user.email?.split('@')[0] || 'Community Member',
        text
      );
    } catch (e) {
      console.warn('Failed to send room message:', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[150] flex flex-col bg-[var(--color-bg)]"
    >
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to Public Rooms"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-text)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-base">
            🌐
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--color-text)] sm:text-base">
                {room.name}
              </h2>
              <span className="rounded-full bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-cyan)]">
                Public Room
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-muted)] truncate max-w-[280px] sm:max-w-md">
              {room.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Messages Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 max-w-4xl w-full mx-auto"
      >
        {messages.map((m) => {
          const isMine = m.userId === user?.uid;
          return (
            <div
              key={m.id}
              className={`flex flex-col max-w-[80%] sm:max-w-[70%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                isMine
                  ? 'ml-auto bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]'
              }`}
            >
              {!isMine && (
                <strong className="block text-[11px] font-bold text-[var(--color-cyan)] mb-1">
                  {m.authorName}
                </strong>
              )}
              <div className="whitespace-pre-wrap break-words">{m.content}</div>
              <small
                className={`mt-1.5 text-[9px] ${
                  isMine ? 'text-white/70 text-right' : 'text-[var(--color-muted)]'
                }`}
              >
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </small>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-xs text-[var(--color-muted)] space-y-2">
            <Globe className="w-8 h-8 text-[var(--color-muted)]/50" />
            <p>Welcome to {room.name}! Say hello to get the conversation started.</p>
          </div>
        )}
      </div>

      {/* Composer Form */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4">
        <form
          onSubmit={handleSend}
          className="max-w-4xl mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            required
            maxLength={500}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Write a message to ${room.name}…`}
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-all"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-50 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
