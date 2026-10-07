import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  MessageSquare,
  CheckSquare,
  FolderKanban,
  HardDrive,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Users,
  Clock,
  Settings2,
  Volume2,
  VolumeX,
  Plus,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { NotificationItem, ViewTab } from '../types';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  onNavigateTab: (tab: ViewTab) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  setNotifications,
  onNavigateTab,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      }))
    );
    showToast('All notifications marked as read');
  };

  const handleClearAll = () => {
    setNotifications([]);
    showToast('Cleared all notifications');
  };

  const handleToggleRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            isRead: !n.isRead,
            readAt: !n.isRead ? new Date().toISOString() : null,
          };
        }
        return n;
      })
    );
  };

  const handleDeleteNotification = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast('Notification dismissed');
  };

  const handleSimulateAlert = () => {
    const alerts: Array<Omit<NotificationItem, 'id' | 'createdAt'>> = [
      {
        userId: 'sample',
        type: 'messages',
        title: 'New Lounge Message',
        message: 'Sofia Chen: "Just uploaded the physics study guide. Have a look!"',
        linkTab: 'community',
        actorName: 'Sofia Chen',
        actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        isRead: false,
      },
      {
        userId: 'sample',
        type: 'tasks',
        title: 'Task Reminder: Complete problem set #4',
        message: 'Scheduled deadline is approaching in 1 hour.',
        linkTab: 'tasks',
        priority: 'urgent',
        isRead: false,
      },
      {
        userId: 'sample',
        type: 'storage',
        title: 'Storage Optimization Insight',
        message: 'You have 948.2 MB remaining of your 1,024 MB sandbox quota.',
        linkTab: 'settings',
        isRead: false,
      },
      {
        userId: 'sample',
        type: 'community',
        title: 'New Upvote in The Lounge',
        message: 'Marcus Vance upvoted your post "AI Prompt Framework"',
        linkTab: 'community',
        actorName: 'Marcus Vance',
        isRead: false,
      },
    ];

    const pick = alerts[Math.floor(Math.random() * alerts.length)];
    const newNotif: NotificationItem = {
      ...pick,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);
    showToast('Real-time notification arrived');
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return 'Yesterday';
    return `${diffDay}d ago`;
  };

  const getTypeMeta = (type?: string) => {
    switch (type) {
      case 'messages':
      case 'message':
      case 'chat':
        return {
          icon: MessageSquare,
          color: 'text-[var(--color-primary)]',
          bg: 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20',
          label: 'Lounge Messages',
        };
      case 'tasks':
      case 'task':
        return {
          icon: CheckSquare,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20',
          label: 'Task & Deadline',
        };
      case 'community':
        return {
          icon: Users,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/20',
          label: 'Community Social',
        };
      case 'files':
      case 'file':
        return {
          icon: FolderKanban,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/20',
          label: 'Files & Drive',
        };
      case 'storage':
        return {
          icon: HardDrive,
          color: 'text-purple-400',
          bg: 'bg-purple-500/10 border-purple-500/20',
          label: 'Storage Telemetry',
        };
      case 'ai':
        return {
          icon: Sparkles,
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/10 border-indigo-500/20',
          label: 'AI Copilot',
        };
      case 'system':
      default:
        return {
          icon: ShieldCheck,
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/20',
          label: 'System Sync',
        };
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Category filter
      if (selectedFilter === 'unread' && n.isRead) return false;
      if (selectedFilter === 'messages' && n.type !== 'messages' && n.type !== 'chat') return false;
      if (selectedFilter === 'tasks' && n.type !== 'tasks' && n.type !== 'task') return false;
      if (selectedFilter === 'community' && n.type !== 'community') return false;
      if (selectedFilter === 'files' && n.type !== 'files' && n.type !== 'file') return false;
      if (selectedFilter === 'storage' && n.type !== 'storage') return false;
      if (selectedFilter === 'system' && n.type !== 'system' && n.type !== 'ai') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchMsg = n.message.toLowerCase().includes(q);
        const matchActor = (n.actorName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchMsg && !matchActor) return false;
      }

      return true;
    });
  }, [notifications, selectedFilter, searchQuery]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-[var(--color-primary)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-xs font-medium text-[var(--color-text)] shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--color-text)]">
                Notifications &amp; Activity Alerts
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Socket
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Real-time workspace updates, direct chats, task deadlines, and storage quota telemetry.
            </p>
          </div>
        </div>

        {/* Global Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateAlert}
            title="Simulate incoming alert"
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] px-3 py-2 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Ping</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300 transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-rose-500/10 hover:text-rose-400 px-3 py-2 text-xs font-bold text-[var(--color-muted)] transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute notification chimes' : 'Unmute notification chimes'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-400" />
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'messages', label: 'Lounge Messages', count: notifications.filter((n) => n.type === 'messages' || n.type === 'chat').length },
            { id: 'tasks', label: 'Tasks', count: notifications.filter((n) => n.type === 'tasks' || n.type === 'task').length },
            { id: 'community', label: 'Social', count: notifications.filter((n) => n.type === 'community').length },
            { id: 'storage', label: 'Storage', count: notifications.filter((n) => n.type === 'storage').length },
            { id: 'system', label: 'System', count: notifications.filter((n) => n.type === 'system' || n.type === 'ai').length },
          ].map((cat) => {
            const isActive = selectedFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedFilter(cat.id)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white shadow-sm scale-102'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/40'
                }`}
              >
                <span>{cat.label}</span>
                {cat.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive ? 'bg-black/30 text-white' : 'bg-[var(--color-surface-elevated)] text-[var(--color-muted)]'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts or senders..."
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 py-1.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {filteredNotifications.map((notif) => {
          const meta = getTypeMeta(notif.type);
          const Icon = meta.icon;

          return (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.isRead) handleToggleRead(notif.id);
                if (notif.linkTab) onNavigateTab(notif.linkTab);
              }}
              className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border p-4 transition-all cursor-pointer ${
                notif.isRead
                  ? 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)]'
                  : 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 shadow-sm'
              }`}
            >
              {/* Unread Indicator Bar */}
              {!notif.isRead && (
                <span className="absolute left-0 top-3 bottom-3 w-1 bg-[var(--color-primary)] rounded-r-full" />
              )}

              {/* Left Details */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Avatar or Category Icon */}
                <div className="relative shrink-0 mt-0.5">
                  {notif.actorAvatar ? (
                    <img
                      src={notif.actorAvatar}
                      alt={notif.actorName || 'Sender'}
                      className="h-9 w-9 rounded-xl object-cover border border-[var(--color-border)]"
                    />
                  ) : (
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${meta.bg}`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                  )}

                  {!notif.isRead && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-black" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${meta.bg} ${meta.color}`}>
                      {meta.label}
                    </span>

                    {notif.priority === 'urgent' && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-black text-rose-400 animate-pulse">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Urgent
                      </span>
                    )}

                    <span className="text-[11px] text-[var(--color-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <h3 className={`text-sm font-bold truncate ${notif.isRead ? 'text-[var(--color-text)]' : 'text-white font-extrabold'}`}>
                    {notif.title}
                  </h3>

                  <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]/50">
                {notif.linkTab && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!notif.isRead) handleToggleRead(notif.id);
                      onNavigateTab(notif.linkTab!);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] transition-all"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3 text-[var(--color-primary)]" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => handleToggleRead(notif.id, e)}
                  title={notif.isRead ? 'Mark as unread' : 'Mark as read'}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all"
                >
                  <CheckCheck className={`w-4 h-4 ${notif.isRead ? 'text-emerald-400' : 'text-[var(--color-muted)]'}`} />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDeleteNotification(notif.id, e)}
                  title="Dismiss notification"
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-rose-500/15 hover:text-rose-400 p-1.5 text-[var(--color-muted)] transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/40 p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-elevated)] text-[var(--color-muted)]">
              <Bell className="w-6 h-6 opacity-40" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--color-text)]">
                No notifications in this filter
              </h3>
              <p className="text-xs text-[var(--color-muted)] max-w-sm mx-auto">
                {searchQuery
                  ? `No alerts matching "${searchQuery}". Try clearing your search query.`
                  : 'You are all caught up! New lounge chats, task deadlines, and storage notices will appear here.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSimulateAlert}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate Real Alert</span>
            </button>
          </div>
        )}
      </div>

      {/* Notification Preferences Card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              Alert Subscriptions &amp; Notification Rules
            </h3>
          </div>
          <span className="text-[11px] text-[var(--color-muted)]">
            Client-side preferences preserved locally
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3.5">
            <div>
              <strong className="block text-xs font-bold text-[var(--color-text)]">Lounge Direct Messages &amp; Social Alerts</strong>
              <span className="text-[10px] text-[var(--color-muted)]">Direct chats, likes &amp; story comments</span>
            </div>
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3.5">
            <div>
              <strong className="block text-xs font-bold text-[var(--color-text)]">Task Deadline Alerts</strong>
              <span className="text-[10px] text-[var(--color-muted)]">High-priority due items</span>
            </div>
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3.5">
            <div>
              <strong className="block text-xs font-bold text-[var(--color-text)]">Storage Quota Telemetry</strong>
              <span className="text-[10px] text-[var(--color-muted)]">Alerts when &gt; 80% used</span>
            </div>
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
