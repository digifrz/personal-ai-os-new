import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Plus,
  Bell,
  CheckSquare,
  FileText,
  FolderKanban,
  Calendar,
  LogOut,
  Settings,
  ChevronDown,
  ShieldCheck,
  Compass,
  Check,
  CheckCheck,
  Heart,
  MessageSquare,
  Radio,
  HardDrive,
  Trash2,
  Briefcase,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ViewTab, NotificationItem } from '../types';
import { markAllNotificationsRead, markNotificationRead } from '../services/db';
import { AccountSwitcher } from './AccountSwitcher';

interface TopbarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  onOpenCommandBar: () => void;
  onOpenNewTask: () => void;
  onOpenNewNote: () => void;
  onOpenNewEvent: () => void;
  onOpenAuth: () => void;
  onOpenAbout: () => void;
  onOpenAITopUp?: () => void;
  onOpenLoungeRules?: () => void;
  notifications: NotificationItem[];
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCommandBar,
  onOpenNewTask,
  onOpenNewNote,
  onOpenNewEvent,
  onOpenAuth,
  onOpenAbout,
  onOpenAITopUp,
  onOpenLoungeRules,
  notifications,
}) => {
  const { user, profile, logout, accountType, toggleAccountType } = useAuth();
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'lounge' | 'tasks'>('all');
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(new Set());

  // Realistic fallback notifications if user has zero or few
  const displayNotifications = useMemo(() => {
    const list: NotificationItem[] = [...notifications];
    if (list.length === 0) {
      list.push(
        {
          id: 'mock_notif_1',
          userId: user?.uid || 'local',
          type: 'lounge',
          title: 'Maya Lin reacted to your post ❤️',
          message: 'Maya Lin loved your insight on modular UI design in The Lounge.',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: 'mock_notif_2',
          userId: user?.uid || 'local',
          type: 'lounge',
          title: 'Alex Chen published a 24h Story 📻',
          message: 'Check out Alex’s new architecture preview in The Lounge stories rail.',
          isRead: false,
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
        {
          id: 'mock_notif_3',
          userId: user?.uid || 'local',
          type: 'tasks',
          title: 'Task Reminder: System Audit ✅',
          message: 'Quarterly architecture and cloud security review is scheduled for today.',
          isRead: true,
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        },
        {
          id: 'mock_notif_4',
          userId: user?.uid || 'local',
          type: 'files',
          title: 'Google Drive & Cloud Quota 💾',
          message: 'Cloud Vault: 500 MB space active and linked with Google Account.',
          isRead: true,
          createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        }
      );
    }
    return list.filter((n) => !localDismissed.has(n.id));
  }, [notifications, user?.uid, localDismissed]);

  const unreadCount = displayNotifications.filter((n) => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    return displayNotifications.filter((n) => {
      if (notifFilter === 'unread') return !n.isRead;
      if (notifFilter === 'lounge') return n.type === 'lounge' || n.title.includes('Lounge') || n.title.includes('Story') || n.title.includes('reacted');
      if (notifFilter === 'tasks') return n.type === 'tasks' || n.type === 'events' || n.title.includes('Task') || n.title.includes('Quota');
      return true;
    });
  }, [displayNotifications, notifFilter]);

  const handleMarkAllRead = async () => {
    if (user) {
      try {
        await markAllNotificationsRead(user.uid);
      } catch {}
    }
    // Also mark in local view
    displayNotifications.forEach((n) => (n.isRead = true));
    setShowNotifications(true);
  };

  const handleNotificationClick = (n: NotificationItem) => {
    n.isRead = true;
    if (user) {
      try {
        markNotificationRead(n.id);
      } catch {}
    }
    setShowNotifications(false);
    if (n.type === 'lounge' || n.title.includes('Lounge') || n.title.includes('Story')) {
      setActiveTab('community');
    } else if (n.type === 'tasks' || n.title.includes('Task')) {
      setActiveTab('tasks');
    } else if (n.type === 'files' || n.title.includes('Quota')) {
      setActiveTab('settings');
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'tasks':
        return 'Tasks';
      case 'notes':
        return 'Notes';
      case 'files':
        return 'Cloud Storage';
      case 'calendar':
        return 'Calendar & Alarms';
      case 'assistant':
        return 'AI Assistant';
      case 'search':
        return 'Workspace Search';
      case 'goals':
        return 'Goals & Milestones';
      case 'projects':
        return 'Projects';
      case 'learning':
        return 'Learning & Flashcards';
      case 'community':
        return 'Community';
      case 'activity':
        return 'Activity History';
      case 'analytics':
        return 'Analytics';
      case 'settings':
        return 'Settings';
      default:
        return 'Workspace';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--color-border)]/60 bg-[var(--color-bg)]/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Hamburger spacing on mobile + Current View Name */}
      <div className="flex items-center gap-3 pl-10 lg:pl-0">
        <h2 className="text-sm font-bold tracking-tight text-[var(--color-text)] sm:text-base">
          {getPageTitle()}
        </h2>
      </div>

      {/* Center: Search / Command bar trigger */}
      <div className="hidden md:flex items-center">
        <button
          type="button"
          onClick={onOpenCommandBar}
          className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-all w-80 shadow-sm"
        >
          <Search className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
          <span className="flex-1 text-left truncate">Search or run command…</span>
          <kbd className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--color-muted)] font-semibold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile search button */}
        <button
          type="button"
          onClick={onOpenCommandBar}
          aria-label="Open command bar"
          className="md:hidden p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Rules & Privacy button shown ONLY when visiting The Lounge */}
        {activeTab === 'community' && onOpenLoungeRules && (
          <button
            type="button"
            id="topbar-lounge-rules-btn"
            onClick={onOpenLoungeRules}
            title="Lounge community guidelines, safety & privacy rules"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all shadow-sm animate-fade-in"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Rules &amp; Privacy</span>
          </button>
        )}

        {/* Guide & Policies button */}
        <button
          type="button"
          id="topbar-guide-policies-btn"
          onClick={onOpenAbout}
          title="Learn what this app does, explore features & privacy policies"
          className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all shadow-sm"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Guide &amp; Policies</span>
        </button>

        {/* Ask AI Top-Up Pop-up button */}
        <button
          type="button"
          id="topbar-ask-ai-btn"
          onClick={onOpenAITopUp || (() => setActiveTab('assistant'))}
          title="Open contextual AI assistant for current page"
          className="flex items-center gap-1.5 rounded-xl border border-[var(--color-primary)]/50 bg-gradient-to-r from-[var(--color-primary)]/20 via-[var(--color-primary)]/30 to-[var(--color-cyan)]/20 px-3 py-1.5 text-xs font-bold text-white hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] transition-all shadow-sm group"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-cyan)] group-hover:text-white transition-colors animate-pulse" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>

        {/* Quick "+" Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            aria-label="Create item"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>

          {showPlusMenu && (
            <div
              onClick={() => setShowPlusMenu(false)}
              className="fixed inset-0 z-40"
            />
          )}

          {showPlusMenu && (
            <div className="absolute right-0 mt-2 z-50 w-48 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1.5 shadow-2xl space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setShowPlusMenu(false);
                  onOpenNewTask();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)] transition-colors"
              >
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>New Task</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPlusMenu(false);
                  onOpenNewNote();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)] transition-colors"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>New Note</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPlusMenu(false);
                  setActiveTab('files');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)] transition-colors"
              >
                <FolderKanban className="w-4 h-4 text-blue-400" />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPlusMenu(false);
                  onOpenNewEvent();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)] transition-colors"
              >
                <Calendar className="w-4 h-4 text-pink-400" />
                <span>Schedule Event</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-warning)] text-[9px] font-bold text-black">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 z-40"
            />
          )}

          {showNotifications && (
            <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-2xl space-y-3 animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]/70">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[var(--color-text)]">
                    Notification Center
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[var(--color-primary)]/20 px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-cyan)] hover:underline"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'unread', label: `Unread (${unreadCount})` },
                  { id: 'lounge', label: 'Lounge' },
                  { id: 'tasks', label: 'Tasks & Vault' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setNotifFilter(f.id as any)}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      notifFilter === f.id
                        ? 'bg-[var(--color-primary)] text-white shadow-sm'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Notification List */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {filteredNotifications.map((n) => {
                  const isLounge = n.type === 'lounge' || n.title.includes('Lounge') || n.title.includes('Story') || n.title.includes('reacted');
                  const isTask = n.type === 'tasks' || n.title.includes('Task');
                  const isFile = n.type === 'files' || n.title.includes('Drive') || n.title.includes('Quota');

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`group relative flex items-start gap-3 rounded-2xl border p-3 text-xs transition-all cursor-pointer ${
                        !n.isRead
                          ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10'
                          : 'border-[var(--color-border)]/60 bg-[var(--color-bg-secondary)]/40 hover:bg-[var(--color-surface)]'
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        isLounge ? 'bg-pink-500/15 text-pink-400' : isTask ? 'bg-emerald-500/15 text-emerald-400' : 'bg-cyan-500/15 text-cyan-400'
                      }`}>
                        {isLounge ? (
                          <Heart className="w-4 h-4 fill-pink-500/20" />
                        ) : isTask ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : isFile ? (
                          <HardDrive className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <strong className={`block text-xs font-bold truncate ${!n.isRead ? 'text-[var(--color-text)]' : 'text-[var(--color-text)]/80'}`}>
                            {n.title}
                          </strong>
                          {!n.isRead && (
                            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                          )}
                        </div>

                        <p className="text-[11px] text-[var(--color-muted)] leading-relaxed line-clamp-2">
                          {n.message}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-[10px] text-[var(--color-muted)]">
                          <span>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <span className="text-[var(--color-primary)] group-hover:underline font-semibold">
                            Open →
                          </span>
                        </div>
                      </div>

                      {/* Dismiss button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalDismissed((prev) => new Set([...prev, n.id]));
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--color-muted)] hover:text-white"
                        title="Dismiss"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {filteredNotifications.length === 0 && (
                  <div className="py-8 text-center text-xs text-[var(--color-muted)] space-y-1">
                    <Bell className="w-6 h-6 mx-auto text-[var(--color-muted)]/40" />
                    <p>No notifications in this category.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile / Auth Button */}
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 pr-2 hover:border-[var(--color-primary)] transition-all"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-6 w-6 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[10px] font-bold text-white">
                  {profile?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-[var(--color-muted)]" />
            </button>

            {showUserMenu && (
              <div
                onClick={() => setShowUserMenu(false)}
                className="fixed inset-0 z-40"
              />
            )}

            {showUserMenu && (
              <div className="absolute right-0 mt-2 z-50 w-56 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-2 shadow-2xl space-y-1">
                <div className="p-2 border-b border-[var(--color-border)] space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="block text-xs font-bold text-[var(--color-text)] truncate">
                      {profile?.name || 'Workspace Member'}
                    </strong>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      accountType === 'business'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-muted)] border border-[var(--color-border)]'
                    }`}>
                      {accountType === 'business' ? 'Business' : 'Personal'}
                    </span>
                  </div>
                  <small className="block text-[11px] text-[var(--color-muted)] truncate">
                    {user.email}
                  </small>
                </div>

                <button
                  type="button"
                  id="topbar-user-menu-toggle-mode-btn"
                  onClick={async () => {
                    await toggleAccountType();
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {accountType === 'business' ? (
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>{accountType === 'business' ? 'Switch to Personal' : 'Switch to Business'}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--color-primary)]">Toggle</span>
                </button>

                <button
                  type="button"
                  id="topbar-user-menu-about-btn"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenAbout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-[var(--color-muted)] hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>About & Privacy Policy</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setActiveTab('settings');
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Preferences</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
          >
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
