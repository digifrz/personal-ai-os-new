import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  ArrowLeft,
  Paperclip,
  Mic,
  Trash2,
  CheckCheck,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DirectThreadItem, DirectMessageItem } from '../../types';
import {
  subscribeDirectMessages,
  sendDirectMessage,
} from '../../services/db';

interface DirectChatModalProps {
  thread: DirectThreadItem;
  onClose: () => void;
  onDeleteThread: (threadId: string) => void;
  onShowToast: (msg: string) => void;
}

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  thread,
  onClose,
  onDeleteThread,
  onShowToast,
}) => {
  const { user, profile } = useAuth();
  const otherUserId = thread.participants.find((p) => p !== user?.uid) || '';
  const recipientName = thread.participantNames[otherUserId] || 'Community Member';
  const recipientAvatar = thread.participantAvatars[otherUserId];

  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeDirectMessages(thread.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    });

    return () => unsub();
  }, [thread.id]);

  // Voice recording simulation
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      setRecordingSeconds(0);
      interval = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!inputText.trim() && !attachedFile && !isRecording)) return;

    const content = inputText.trim();
    setInputText('');

    let attachments: Array<{ name: string; url: string; type: string }> = [];
    if (attachedFile) {
      attachments = [
        {
          name: attachedFile.name,
          url: URL.createObjectURL(attachedFile),
          type: attachedFile.type,
        },
      ];
      setAttachedFile(null);
    }

    try {
      await sendDirectMessage(thread.id, {
        threadId: thread.id,
        senderId: user.uid,
        senderName: profile?.name || user.email?.split('@')[0] || 'Me',
        senderAvatar: profile?.avatarUrl || '',
        content: content || (attachments.length ? 'Shared an attachment' : 'Sent a voice note'),
        attachments: attachments.length ? attachments : undefined,
      });
    } catch (err) {
      console.warn('Error sending message:', err);
      onShowToast('Message delivery failed.');
    }
  };

  const handleToggleVoiceRecord = async () => {
    if (isRecording) {
      // Finish recording and send voice note
      setIsRecording(false);
      if (!user) return;

      try {
        await sendDirectMessage(thread.id, {
          threadId: thread.id,
          senderId: user.uid,
          senderName: profile?.name || user.email?.split('@')[0] || 'Me',
          senderAvatar: profile?.avatarUrl || '',
          content: `🎙 Voice note (${recordingSeconds}s)`,
        });
        onShowToast('Voice note sent!');
      } catch {
        onShowToast('Could not send voice message.');
      }
    } else {
      setIsRecording(true);
      onShowToast('Recording voice note… tap mic again to send');
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
            aria-label="Back to Inbox"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-text)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {recipientAvatar ? (
            <img
              src={recipientAvatar}
              alt={recipientName}
              className="h-10 w-10 rounded-full object-cover border border-[var(--color-border)]"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-extrabold text-white">
              {recipientName[0]?.toUpperCase() || 'U'}
            </span>
          )}

          <div>
            <h2 className="text-sm font-bold text-[var(--color-text)] sm:text-base leading-tight">
              {recipientName}
            </h2>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Online now</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete this conversation? This will remove it from your inbox.')) {
                onDeleteThread(thread.id);
                onClose();
              }
            }}
            className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/15 transition-all"
          >
            Delete chat
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 max-w-3xl w-full mx-auto"
      >
        {messages.map((m) => {
          const isMine = m.senderId === user?.uid;
          return (
            <div
              key={m.id}
              className={`flex flex-col max-w-[80%] sm:max-w-[70%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                isMine
                  ? 'ml-auto bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{m.content}</div>

              {m.attachments && m.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {m.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium underline ${
                        isMine ? 'bg-white/10 text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-cyan)]'
                      }`}
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>{att.name}</span>
                    </a>
                  ))}
                </div>
              )}

              <div
                className={`mt-1.5 flex items-center justify-between text-[9px] gap-2 ${
                  isMine ? 'text-white/75' : 'text-[var(--color-muted)]'
                }`}
              >
                <span>
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                {isMine && (
                  <span className="flex items-center gap-0.5 font-bold">
                    <CheckCheck className="w-3 h-3 text-white" />
                    <span>Seen</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="flex h-full min-h-[250px] items-center justify-center text-center text-xs text-[var(--color-muted)]">
            No private messages yet. Say hello to {recipientName}!
          </div>
        )}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-red-400 animate-pulse">
          <Radio className="w-4 h-4" />
          <span>Recording voice message… {recordingSeconds}s (tap mic again to send)</span>
        </div>
      )}

      {attachedFile && (
        <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-1.5 flex items-center justify-between text-xs text-[var(--color-muted)]">
          <span>📎 {attachedFile.name}</span>
          <button
            type="button"
            onClick={() => setAttachedFile(null)}
            className="text-red-400 hover:underline text-[11px]"
          >
            Remove
          </button>
        </div>
      )}

      {/* Composer Form */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4">
        <form
          onSubmit={handleSend}
          className="max-w-3xl mx-auto flex items-center gap-2"
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setAttachedFile(e.target.files[0]);
              }
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleToggleVoiceRecord}
            title={isRecording ? 'Stop & send voice note' : 'Record voice note'}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write a private message…"
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim() && !attachedFile}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-40 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
