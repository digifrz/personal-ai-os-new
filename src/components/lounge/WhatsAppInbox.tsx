import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Mic,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Check,
  CheckCheck,
  X,
  Radio,
  Clock,
  ArrowLeft,
  Users,
  Shield,
  Sparkles,
  MessageSquare,
  Lock,
  UserX,
  Flag,
  Edit3,
  BellOff,
  Bell,
  Trash2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DirectThreadItem, DirectMessageItem } from '../../types';
import {
  subscribeDirectMessages,
  sendDirectMessage,
} from '../../services/db';

interface WhatsAppInboxProps {
  threads: DirectThreadItem[];
  activeThread: DirectThreadItem | null;
  onSelectThread: (thread: DirectThreadItem | null) => void;
  onShowToast: (msg: string) => void;
  onStartMessageWithUser?: (userId: string, name: string) => void;
  onOpenUserProfile?: (user: {
    userId: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
  }) => void;
}

const SEED_CHAT_MESSAGES: Record<string, DirectMessageItem[]> = {
  seed_alex: [
    {
      id: 'm1',
      threadId: 'seed_alex',
      senderId: 'seed_alex',
      senderName: 'Alex Chen',
      content: 'Hey! Saw your neural workflow update in The Lounge. That is super clean!',
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'm2',
      threadId: 'seed_alex',
      senderId: 'current',
      senderName: 'Me',
      content: 'Thanks Alex! Added the 500 MB cloud storage quota and Google add-ons today too.',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    {
      id: 'm3',
      threadId: 'seed_alex',
      senderId: 'seed_alex',
      senderName: 'Alex Chen',
      content: 'Brilliant move. Let me know if you want to collaborate on the offline vector search.',
      createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
  ],
  seed_maya: [
    {
      id: 'm4',
      threadId: 'seed_maya',
      senderId: 'seed_maya',
      senderName: 'Maya Lin',
      content: 'Hi! Loving the new Lounge profile layout and community tabs.',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'm5',
      threadId: 'seed_maya',
      senderId: 'current',
      senderName: 'Me',
      content: 'Appreciate it Maya! Built the Lounge messenger view now as well with HD video calls.',
      createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    },
  ],
};

export const WhatsAppInbox: React.FC<WhatsAppInboxProps> = ({
  threads,
  activeThread,
  onSelectThread,
  onShowToast,
  onOpenUserProfile,
}) => {
  const { user, profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // Individual chat action menu & dialog states
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Spam or Scam');
  const [reportDetails, setReportDetails] = useState('');

  // Persisted Nicknames & Blocked Users in localStorage
  const [nicknames, setNicknames] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`lounge_nicknames_${user?.uid || 'guest'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`lounge_blocked_${user?.uid || 'guest'}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [mutedThreads, setMutedThreads] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`lounge_muted_${user?.uid || 'guest'}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fallback demo contacts if user has 0 threads
  const effectiveThreads: DirectThreadItem[] = useMemo(() => {
    if (threads && threads.length > 0) return threads;
    return [
      {
        id: 'seed_alex',
        participants: [user?.uid || 'current', 'seed_alex'],
        participantNames: {
          [user?.uid || 'current']: profile?.name || 'Me',
          seed_alex: 'Alex Chen',
        },
        participantAvatars: {
          seed_alex: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        },
        lastMessage: 'Brilliant move. Let me know if you want to collaborate…',
        lastMessageAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        unreadBy: ['current'],
      },
      {
        id: 'seed_maya',
        participants: [user?.uid || 'current', 'seed_maya'],
        participantNames: {
          [user?.uid || 'current']: profile?.name || 'Me',
          seed_maya: 'Maya Lin',
        },
        participantAvatars: {
          seed_maya: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
        lastMessage: 'Hi! Loving the new Lounge profile layout…',
        lastMessageAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
    ];
  }, [threads, user?.uid, profile?.name]);

  // Current recipient details
  const otherUserId = activeThread
    ? activeThread.participants.find((p) => p !== (user?.uid || 'current')) || ''
    : '';
  const baseRecipientName = activeThread
    ? activeThread.participantNames?.[otherUserId] || 'Community Member'
    : '';
  const recipientAvatar = activeThread ? activeThread.participantAvatars?.[otherUserId] : '';

  // Custom Nickname resolution
  const customNickname = nicknames[otherUserId];
  const displayedRecipientName = customNickname || baseRecipientName;
  const isBlocked = blockedUserIds.has(otherUserId);
  const isMuted = activeThread ? mutedThreads.has(activeThread.id) : false;

  // NOTE: Per user request, DO NOT auto-select first thread on mount!
  // "make the inbox's ui more simple as no chat is opened until i opens"

  // Subscribe to real-time messages for active thread
  useEffect(() => {
    if (!activeThread) return;

    // Check seed fallback
    if (SEED_CHAT_MESSAGES[activeThread.id]) {
      setMessages(SEED_CHAT_MESSAGES[activeThread.id]);
    }

    if (user && !activeThread.id.startsWith('seed_')) {
      const unsub = subscribeDirectMessages(activeThread.id, (msgs) => {
        setMessages(msgs);
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 60);
      });
      return () => unsub();
    }
  }, [activeThread?.id, user]);

  // Voice recording simulation
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      setRecordingSeconds(0);
      interval = window.setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isBlocked) {
      onShowToast('Cannot send messages to a blocked contact. Unblock to resume.');
      return;
    }
    if (!inputText.trim() && !attachedFile && !isRecording) return;
    if (!activeThread) return;

    const text = inputText.trim();
    setInputText('');

    let attachments: Array<{ name: string; url: string; type: string }> = [];
    if (attachedFile) {
      attachments = [{ name: attachedFile.name, url: URL.createObjectURL(attachedFile), type: attachedFile.type }];
      setAttachedFile(null);
    }

    const newMsg: DirectMessageItem = {
      id: 'local_' + Date.now(),
      threadId: activeThread.id,
      senderId: user?.uid || 'current',
      senderName: profile?.name || 'Me',
      content: text || (isRecording ? `🎤 Voice note (${recordingSeconds}s)` : 'Sent an attachment'),
      attachments: attachments.length > 0 ? attachments : undefined,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsRecording(false);
    setShowEmojiPicker(false);

    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);

    // Save to Firestore if connected
    if (user && !activeThread.id.startsWith('seed_')) {
      try {
        await sendDirectMessage(activeThread.id, {
          threadId: activeThread.id,
          senderId: user.uid,
          senderName: profile?.name || 'Me',
          content: newMsg.content,
          attachments,
        });
      } catch (err) {
        console.warn('Direct message sync notice:', err);
      }
    }
  };

  const handleToggleVoice = () => {
    if (isRecording) {
      handleSendMessage();
    } else {
      setIsRecording(true);
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  // Nickname Handler
  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherUserId) return;
    const cleanNick = nicknameInput.trim();
    const updated = { ...nicknames };
    if (cleanNick) {
      updated[otherUserId] = cleanNick;
      onShowToast(`Nickname set to "${cleanNick}"`);
    } else {
      delete updated[otherUserId];
      onShowToast('Nickname removed');
    }
    setNicknames(updated);
    try {
      localStorage.setItem(`lounge_nicknames_${user?.uid || 'guest'}`, JSON.stringify(updated));
    } catch {}
    setIsNicknameModalOpen(false);
  };

  // Block / Unblock Handler
  const handleToggleBlock = () => {
    if (!otherUserId) return;
    const nextSet = new Set(blockedUserIds);
    if (nextSet.has(otherUserId)) {
      nextSet.delete(otherUserId);
      onShowToast(`Unblocked ${baseRecipientName}`);
    } else {
      nextSet.add(otherUserId);
      onShowToast(`Blocked ${baseRecipientName}`);
    }
    setBlockedUserIds(nextSet);
    try {
      localStorage.setItem(`lounge_blocked_${user?.uid || 'guest'}`, JSON.stringify(Array.from(nextSet)));
    } catch {}
    setIsActionMenuOpen(false);
  };

  // Mute / Unmute Handler
  const handleToggleMute = () => {
    if (!activeThread) return;
    const nextSet = new Set(mutedThreads);
    if (nextSet.has(activeThread.id)) {
      nextSet.delete(activeThread.id);
      onShowToast('Notifications unmuted');
    } else {
      nextSet.add(activeThread.id);
      onShowToast('Notifications muted');
    }
    setMutedThreads(nextSet);
    try {
      localStorage.setItem(`lounge_muted_${user?.uid || 'guest'}`, JSON.stringify(Array.from(nextSet)));
    } catch {}
    setIsActionMenuOpen(false);
  };

  // Clear Chat History
  const handleClearHistory = () => {
    if (!confirm(`Clear all messages with ${displayedRecipientName}? This action cannot be undone.`)) return;
    setMessages([]);
    onShowToast('Chat history cleared.');
    setIsActionMenuOpen(false);
  };

  // Report Contact Submit
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast(`Report submitted for ${displayedRecipientName} (${reportReason}).`);
    setIsReportModalOpen(false);
    setIsActionMenuOpen(false);
    setReportDetails('');
  };

  // Filter threads by search query
  const filteredThreads = effectiveThreads.filter((t) => {
    const oId = t.participants.find((p) => p !== (user?.uid || 'current')) || '';
    const oName = nicknames[oId] || t.participantNames?.[oId] || '';
    if (!searchQuery) return true;
    return oName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="mx-auto flex h-[820px] w-full max-w-6xl overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl relative">
      {/* =========================================================
          LEFT SIDEBAR: CONVERSATIONS LIST
      ========================================================= */}
      <aside
        className={`w-full md:w-96 flex flex-col border-r border-[var(--color-border)]/70 bg-[var(--color-surface)] ${
          activeThread ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[var(--color-border)]/70 bg-[var(--color-bg-secondary)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                <MessageSquare className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text)]">
                  Direct Messages
                </h2>
                <p className="text-[10px] text-[var(--color-muted)] font-mono">
                  Workspace Inbox
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-emerald-400 font-mono">
              Online
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-muted)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or start new chat…"
              className="w-full rounded-xl bg-[var(--color-surface)] py-2 pl-9 pr-4 text-xs text-[var(--color-text)] outline-none border border-[var(--color-border)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Filter Chips: All, Unread */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            {(['all', 'unread'] as const).map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setFilterTab(chip as any)}
                className={`rounded-full px-3 py-1 transition-all capitalize ${
                  filterTab === chip
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Chats Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]/40 scrollbar-thin">
          {filteredThreads.map((thread) => {
            const oId = thread.participants.find((p) => p !== (user?.uid || 'current')) || '';
            const rawName = thread.participantNames?.[oId] || 'Member';
            const oName = nicknames[oId] || rawName;
            const oAvatar = thread.participantAvatars?.[oId];
            const isSelected = activeThread?.id === thread.id;
            const hasUnread = (thread.unreadBy || []).includes(user?.uid || 'current');
            const isContactBlocked = blockedUserIds.has(oId);

            return (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread)}
                className={`flex items-center justify-between p-3.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[var(--color-primary)]/15 border-l-4 border-l-[var(--color-primary)]'
                    : 'hover:bg-[var(--color-surface-elevated)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Profile photo: Tapping opens that person's profile modal */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenUserProfile?.({
                        userId: oId,
                        displayName: rawName,
                        avatarUrl: oAvatar,
                      });
                    }}
                    className="relative shrink-0 hover:scale-105 transition-transform"
                    title={`View ${rawName}'s profile`}
                  >
                    {oAvatar ? (
                      <img src={oAvatar} alt={oName} className="h-12 w-12 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold text-sm">
                        {oName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[var(--color-surface)]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <strong className="block text-xs font-bold text-[var(--color-text)] truncate">
                        {oName}
                      </strong>
                      {isContactBlocked && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/15 text-red-400 font-bold">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-muted)] truncate">
                      {thread.lastMessage || 'Start a conversation…'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                  <span className="text-[10px] text-[var(--color-muted)] font-mono">
                    {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  {hasUnread && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-white">
                      1
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredThreads.length === 0 && (
            <div className="p-8 text-center text-xs text-[var(--color-muted)] space-y-2">
              <MessageSquare className="w-8 h-8 text-[var(--color-muted)]/40 mx-auto" />
              <p>No conversations found.</p>
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================
          RIGHT PANEL: ACTIVE CHAT WINDOW OR SIMPLE EMPTY STATE
      ========================================================= */}
      <main className={`flex-1 flex flex-col bg-[var(--color-bg)] relative ${!activeThread ? 'hidden md:flex' : 'flex'}`}>
        {activeThread ? (
          <>
            {/* Chat Header */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-surface)] px-4 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectThread(null)}
                  className="md:hidden p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-muted)]"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {/* Profile photo in header: Tapping opens that person's profile page */}
                <div
                  onClick={() => {
                    onOpenUserProfile?.({
                      userId: otherUserId,
                      displayName: baseRecipientName,
                      avatarUrl: recipientAvatar,
                    });
                  }}
                  className="relative shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                  title={`View ${baseRecipientName}'s profile`}
                >
                  {recipientAvatar ? (
                    <img src={recipientAvatar} alt={displayedRecipientName} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold text-xs">
                      {displayedRecipientName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-[var(--color-surface)]" />
                </div>

                {/* Contact Name in header: Tapping opens the Action Menu (Block, Report, Nickname, etc.) */}
                <div
                  onClick={() => setIsActionMenuOpen(true)}
                  className="cursor-pointer hover:opacity-85 transition-opacity min-w-0"
                  title="Click to view contact options (Block, Report, Nickname)"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text)] flex items-center gap-1.5 truncate">
                    <span>{displayedRecipientName}</span>
                    {customNickname && (
                      <span className="text-[10px] text-[var(--color-muted)] font-normal truncate">
                        ({baseRecipientName})
                      </span>
                    )}
                    {isBlocked && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 font-bold shrink-0">
                        Blocked
                      </span>
                    )}
                    {isMuted && (
                      <BellOff className="w-3 h-3 text-[var(--color-muted)] shrink-0" />
                    )}
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-semibold block leading-tight truncate">
                    {isBlocked ? 'Blocked contact' : 'Online · Click name for options'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 text-[var(--color-muted)]">
                <button
                  type="button"
                  onClick={() => onShowToast(`Direct calling with ${displayedRecipientName} is currently offline.`)}
                  className="p-2 rounded-full hover:bg-white/10 hover:text-[var(--color-text)] transition-colors"
                  title="Video call"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onShowToast(`Audio calling with ${displayedRecipientName} is currently offline.`)}
                  className="p-2 rounded-full hover:bg-white/10 hover:text-[var(--color-text)] transition-colors"
                  title="Audio call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  id="inbox-chat-options-btn"
                  onClick={() => setIsActionMenuOpen(true)}
                  className="p-2 rounded-full hover:bg-white/10 hover:text-[var(--color-text)] transition-colors"
                  title="Chat action options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Chat Wallpaper & Messages Stream */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 relative"
              style={{
                backgroundColor: 'var(--color-bg)',
              }}
            >
              {/* End-to-End Encrypted Banner */}
              <div className="flex items-center justify-center my-2">
                <div className="flex items-center gap-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-3.5 py-1.5 text-[10px] text-[var(--color-muted)] shadow-sm max-w-sm text-center">
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Private direct messaging channel · Verified local storage</span>
                </div>
              </div>

              {messages.map((msg) => {
                const isMe = msg.senderId === (user?.uid || 'current');
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                    <div
                      className={`max-w-[75%] sm:max-w-md rounded-2xl p-3 text-xs shadow-sm space-y-1 relative ${
                        isMe
                          ? 'bg-[var(--color-primary)] text-white rounded-tr-none'
                          : 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-tl-none'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {msg.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-[11px] underline opacity-90 hover:opacity-100"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>{att.name}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 text-[9px] opacity-70">
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Emoji Quick Bar */}
            {showEmojiPicker && (
              <div className="flex items-center gap-2 border-t border-[var(--color-border)]/60 bg-[var(--color-surface)] p-2.5 overflow-x-auto text-lg animate-in fade-in">
                {['❤️', '👍', '😂', '🔥', '🎉', '👏', '💡', '🚀', '💯', '✨', '🙌'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => handleAddEmoji(em)}
                    className="p-1.5 hover:scale-125 transition-transform"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Input Composer or Blocked Banner */}
            {isBlocked ? (
              <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
                <span>You have blocked this contact. Unblock to send and receive messages.</span>
                <button
                  type="button"
                  onClick={handleToggleBlock}
                  className="px-3 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:brightness-110 shadow-sm"
                >
                  Unblock Contact
                </button>
              </div>
            ) : (
              <footer className="flex items-center gap-2 border-t border-[var(--color-border)]/60 bg-[var(--color-surface)] p-3 z-10">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-full text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                  title="Emojis"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                  title="Attach Document or Image"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setAttachedFile(f);
                      onShowToast(`Attached: ${f.name}`);
                    }
                  }}
                />

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    placeholder={
                      attachedFile
                        ? `Attached: ${attachedFile.name}`
                        : isRecording
                        ? `Recording voice note… ${recordingSeconds}s`
                        : 'Type a message…'
                    }
                    className="w-full rounded-xl bg-[var(--color-bg-secondary)] px-4 py-2.5 text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] border border-[var(--color-border)] focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* Voice note recorder */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`p-2.5 rounded-full transition-all ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                  title={isRecording ? 'Stop & Send Recording' : 'Record voice note'}
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() && !attachedFile && !isRecording}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white hover:brightness-110 transition-all disabled:opacity-40 shadow-md"
                  title="Send"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </footer>
            )}
          </>
        ) : (
          /* Simple, clean empty state when no chat is opened */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-lg">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="max-w-sm space-y-2">
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                Select a conversation
              </h2>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                Choose a contact from the list on the left to start direct messaging, or explore members in the Lounge.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)] pt-4">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>End-to-end encryption enabled</span>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================
          ACTION MENU MODAL FOR INDIVIDUAL CHATS
          Options: Block, Report, Add Nickname, Mute, Clear, Profile
      ========================================================= */}
      {isActionMenuOpen && activeThread && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-sm rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                {recipientAvatar ? (
                  <img src={recipientAvatar} alt={displayedRecipientName} className="h-10 w-10 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold text-xs">
                    {displayedRecipientName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-extrabold text-[var(--color-text)] truncate max-w-[180px]">
                    {displayedRecipientName}
                  </h4>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Chat Options &amp; Controls
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActionMenuOpen(false)}
                className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Options */}
            <div className="space-y-1.5">
              {/* Add / Edit Nickname */}
              <button
                type="button"
                onClick={() => {
                  setNicknameInput(customNickname || '');
                  setIsNicknameModalOpen(true);
                  setIsActionMenuOpen(false);
                }}
                className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl hover:bg-white/5 text-xs font-semibold text-[var(--color-text)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  <span>{customNickname ? 'Edit Nickname' : 'Add Nickname'}</span>
                </div>
                {customNickname && (
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">
                    {customNickname}
                  </span>
                )}
              </button>

              {/* View Full Profile */}
              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  onOpenUserProfile?.({
                    userId: otherUserId,
                    displayName: baseRecipientName,
                    avatarUrl: recipientAvatar,
                  });
                }}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl hover:bg-white/5 text-xs font-semibold text-[var(--color-text)] transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-[var(--color-primary)]" />
                <span>View Full Profile</span>
              </button>

              {/* Mute Notifications */}
              <button
                type="button"
                onClick={handleToggleMute}
                className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl hover:bg-white/5 text-xs font-semibold text-[var(--color-text)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isMuted ? <Bell className="w-4 h-4 text-amber-400" /> : <BellOff className="w-4 h-4 text-[var(--color-muted)]" />}
                  <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                </div>
                {isMuted && (
                  <span className="text-[10px] text-amber-400 font-bold">Muted</span>
                )}
              </button>

              {/* Clear Chat History */}
              <button
                type="button"
                onClick={handleClearHistory}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl hover:bg-white/5 text-xs font-semibold text-[var(--color-text)] transition-colors"
              >
                <Trash2 className="w-4 h-4 text-[var(--color-muted)]" />
                <span>Clear Chat History</span>
              </button>

              {/* Block / Unblock Contact */}
              <button
                type="button"
                onClick={handleToggleBlock}
                className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                  isBlocked
                    ? 'text-emerald-400 hover:bg-emerald-500/10'
                    : 'text-rose-400 hover:bg-rose-500/10'
                }`}
              >
                <UserX className="w-4 h-4" />
                <span>{isBlocked ? 'Unblock Contact' : 'Block Contact'}</span>
              </button>

              {/* Report Contact */}
              <button
                type="button"
                onClick={() => {
                  setIsReportModalOpen(true);
                  setIsActionMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Flag className="w-4 h-4" />
                <span>Report Contact</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          NICKNAME MODAL
      ========================================================= */}
      {isNicknameModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[180] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-sm rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
              <h4 className="text-sm font-bold text-[var(--color-text)]">
                Set Nickname for {baseRecipientName}
              </h4>
              <button
                type="button"
                onClick={() => setIsNicknameModalOpen(false)}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNickname} className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1">
                  Custom Nickname
                </label>
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  placeholder={`e.g. Partner, Team Lead (${baseRecipientName})`}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                  autoFocus
                />
                <p className="text-[10px] text-[var(--color-muted)] mt-1.5">
                  Only you will see this nickname in your inbox.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNicknameModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:brightness-110 shadow-sm"
                >
                  Save Nickname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          REPORT CONTACT MODAL
      ========================================================= */}
      {isReportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[180] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-sm rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h4 className="text-sm font-bold text-[var(--color-text)]">
                  Report {displayedRecipientName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-muted)] mb-1">
                  Reason for reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                >
                  <option value="Spam or Scam">Spam or Scam</option>
                  <option value="Harassment or Bullying">Harassment or Bullying</option>
                  <option value="Impersonation">Impersonation</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Other">Other Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-muted)] mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context for our community moderation review…"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 shadow-sm"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
