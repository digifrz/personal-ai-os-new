import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ViewTab, NotificationItem } from '../types';

interface TopbarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  onOpenCommandBar: () => void;
  onOpenNewTask: () => void;
  onOpenNewNote: () => void;
  onOpenNewEvent: () => void;
  onOpenAuth: () => void;
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
  notifications,
}) => {
  const { user, profile, logout } = useAuth();
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
        return 'The Lounge';
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

        {/* Ask AI quick button */}
        <button
          type="button"
          onClick={() => setActiveTab('assistant')}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--color-ai)]/50 bg-[var(--color-ai-soft)]/40 px-3 py-1.5 text-xs font-bold text-[var(--color-ai)] hover:bg-[var(--color-ai)] hover:text-white transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
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
            <div className="absolute right-0 mt-2 z-50 w-72 sm:w-80 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 shadow-2xl space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                <span className="text-xs font-bold text-[var(--color-text)]">
                  Notifications
                </span>
                <span className="text-[10px] text-[var(--color-muted)]">
                  {notifications.length} updates
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-bg-secondary)]/50 p-2.5 text-xs text-[var(--color-muted)]"
                  >
                    <strong className="block text-[var(--color-text)] font-semibold text-xs">
                      {n.title}
                    </strong>
                    <p className="text-[11px] mt-0.5">{n.message}</p>
                    <small className="text-[10px] opacity-60 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </small>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="py-4 text-center text-xs text-[var(--color-muted)]">
                    No new notifications.
                  </p>
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
              <div className="absolute right-0 mt-2 z-50 w-52 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-2 shadow-2xl space-y-1">
                <div className="p-2 border-b border-[var(--color-border)]">
                  <strong className="block text-xs font-bold text-[var(--color-text)] truncate">
                    {profile?.name || 'Workspace Member'}
                  </strong>
                  <small className="block text-[11px] text-[var(--color-muted)] truncate">
                    {user.email}
                  </small>
                </div>

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
