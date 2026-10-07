import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Check,
  CheckCheck,
  Radio,
  Sparkles,
  ArrowRight,
  Shield,
  MessageSquare,
} from 'lucide-react';

export interface LoungeSocialNotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
  actorId: string;
  actorName: string;
  actorUsername: string;
  actorAvatar?: string;
  message: string;
  targetPostId?: string;
  targetPostTitle?: string;
  targetPostSnippet?: string;
  timestamp: string;
  isRead: boolean;
  isFollowingBack?: boolean;
}

interface LoungeNotificationsTabProps {
  onNavigateToPost?: (postId: string) => void;
  onNavigateToInbox?: () => void;
  onShowToast: (msg: string) => void;
}

const INITIAL_SOCIAL_NOTIFS: LoungeSocialNotification[] = [
  {
    id: 's-notif-1',
    type: 'like',
    actorId: 'user-sofia',
    actorName: 'Sofia Chen',
    actorUsername: 'sofia_quantum',
    actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    message: 'liked your post',
    targetPostId: 'cp-1',
    targetPostTitle: 'My Daily Workspace Review Prompt Framework',
    targetPostSnippet: 'I ask the AI Copilot every evening: "Review today\'s completed tasks..."',
    timestamp: '5m ago',
    isRead: false,
  },
  {
    id: 's-notif-2',
    type: 'comment',
    actorId: 'user-alex',
    actorName: 'Alex Chen',
    actorUsername: 'alex_chen',
    actorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    message: 'commented: "Phenomenal breakdown! Integrating this into my physics pipeline."',
    targetPostId: 'cp-1',
    targetPostTitle: 'My Daily Workspace Review Prompt Framework',
    timestamp: '24m ago',
    isRead: false,
  },
  {
    id: 's-notif-3',
    type: 'follow',
    actorId: 'user-marcus',
    actorName: 'Marcus Rivera',
    actorUsername: 'mrivera_dev',
    actorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    message: 'started following you.',
    timestamp: '1h ago',
    isRead: false,
    isFollowingBack: false,
  },
  {
    id: 's-notif-4',
    type: 'like',
    actorId: 'user-maya',
    actorName: 'Maya Lin',
    actorUsername: 'mayalin',
    actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    message: 'liked your 24-hour Story.',
    timestamp: '3h ago',
    isRead: true,
  },
  {
    id: 's-notif-5',
    type: 'mention',
    actorId: 'user-emily',
    actorName: 'Dr. Emily Watson',
    actorUsername: 'emily_med',
    actorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    message: 'mentioned you in a discussion: "@farzan how are you handling state persistence?"',
    targetPostId: 'cp-2',
    timestamp: '5h ago',
    isRead: true,
  },
  {
    id: 's-notif-6',
    type: 'message',
    actorId: 'user-alex',
    actorName: 'Alex Chen',
    actorUsername: 'alex_chen',
    actorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    message: 'sent you a direct message in The Lounge.',
    timestamp: 'Yesterday',
    isRead: true,
  },
];

export const LoungeNotificationsTab: React.FC<LoungeNotificationsTabProps> = ({
  onNavigateToPost,
  onNavigateToInbox,
  onShowToast,
}) => {
  const [notifications, setNotifications] = useState<LoungeSocialNotification[]>(INITIAL_SOCIAL_NOTIFS);
  const [filter, setFilter] = useState<'all' | 'likes' | 'comments' | 'follows'>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onShowToast('All social notifications marked as read.');
  };

  const toggleFollowBack = (id: string, _actorName: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isFollowingBack: !n.isFollowingBack } : n))
    );
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'likes') return n.type === 'like';
    if (filter === 'comments') return n.type === 'comment';
    if (filter === 'follows') return n.type === 'follow';
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 pb-4">
        <div>
          <h2 className="text-xl font-black text-[var(--color-text)] flex items-center gap-2">
            <span>Activity &amp; Notifications</span>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-[10px] font-black text-white">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-xs text-[var(--color-muted)]">
            Likes, comments, new followers, and community mentions
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-muted)] hover:text-white hover:border-[var(--color-primary)] transition-all shadow-sm"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 text-xs font-bold">
        {[
          { id: 'all', label: 'All' },
          { id: 'likes', label: 'Likes ❤️' },
          { id: 'comments', label: 'Comments 💬' },
          { id: 'follows', label: 'Followers 👥' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id as any)}
            className={`rounded-xl px-4 py-2 transition-all border ${
              filter === f.id
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-[var(--color-border)]/40 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm">
        {filteredNotifs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Heart className="w-8 h-8 text-[var(--color-muted)] mx-auto opacity-40" />
            <p className="text-xs font-bold text-[var(--color-muted)]">No notifications in this filter.</p>
          </div>
        ) : (
          filteredNotifs.map((notif) => {
            return (
              <div
                key={notif.id}
                className={`flex items-center justify-between gap-3 p-4 transition-colors ${
                  !notif.isRead
                    ? 'bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10'
                    : 'hover:bg-[var(--color-bg-secondary)]/50'
                }`}
              >
                {/* Actor Avatar with Type Badge */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={notif.actorAvatar}
                      alt={notif.actorName}
                      className="h-11 w-11 rounded-full object-cover border border-white/10"
                    />
                    {/* Badge */}
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-md">
                      {notif.type === 'like' && <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />}
                      {notif.type === 'comment' && <MessageCircle className="w-2.5 h-2.5 text-[var(--color-cyan)]" />}
                      {notif.type === 'follow' && <UserPlus className="w-2.5 h-2.5 text-[var(--color-primary)]" />}
                      {notif.type === 'mention' && <AtSign className="w-2.5 h-2.5 text-amber-400" />}
                      {notif.type === 'message' && <MessageSquare className="w-2.5 h-2.5 text-emerald-400" />}
                    </div>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs text-[var(--color-text)] leading-snug">
                      <strong className="font-extrabold text-white mr-1.5">{notif.actorName}</strong>
                      <span className="text-[var(--color-text)]/90">{notif.message}</span>
                    </p>
                    <p className="text-[10px] text-[var(--color-muted)] font-medium">
                      {notif.timestamp}
                    </p>
                  </div>
                </div>

                {/* Right Action (Follow button, message button, or post preview snippet) */}
                <div className="shrink-0 flex items-center gap-2">
                  {notif.type === 'follow' && (
                    <button
                      type="button"
                      onClick={() => toggleFollowBack(notif.id, notif.actorName)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm ${
                        notif.isFollowingBack
                          ? 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]'
                          : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
                      }`}
                    >
                      {notif.isFollowingBack ? 'Following' : 'Follow Back'}
                    </button>
                  )}

                  {notif.type === 'message' && onNavigateToInbox && (
                    <button
                      type="button"
                      onClick={onNavigateToInbox}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-cyan)] hover:border-[var(--color-cyan)] transition-all"
                    >
                      Reply
                    </button>
                  )}

                  {(notif.type === 'like' || notif.type === 'comment' || notif.type === 'mention') &&
                    notif.targetPostId && (
                      <button
                        type="button"
                        onClick={() => onNavigateToPost?.(notif.targetPostId!)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-primary)] text-[var(--color-muted)] hover:text-white transition-all"
                        title="View post"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
