import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Search,
  Users,
  FileText,
  FolderKanban,
  CheckSquare,
  Calendar,
  Bell,
  GraduationCap,
  Target,
  BarChart3,
  Activity,
  Sparkles,
  Brain,
  Star,
  Clock,
  Trash2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ViewTab } from '../types';

interface SidebarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  unreadNotificationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unreadNotificationsCount,
}) => {
  const { user, profile, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('personal-ai-os-sidebar-state');
    if (savedState === 'collapsed') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('personal-ai-os-sidebar-state', nextState ? 'collapsed' : 'expanded');
  };

  const handleNavClick = (tab: ViewTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const sections = [
    {
      label: 'Main',
      links: [
        { id: 'dashboard' as ViewTab, label: 'Dashboard', icon: LayoutDashboard, color: '#8B5CF6' },
        { id: 'search' as ViewTab, label: 'Search', icon: Search, color: '#22D3EE' },
      ],
    },
    {
      label: 'Community',
      links: [
        { id: 'community' as ViewTab, label: 'The Lounge', icon: Users, color: '#F472B6' },
      ],
    },
    {
      label: 'Productivity',
      links: [
        { id: 'notes' as ViewTab, label: 'Notes', icon: FileText, color: '#F59E0B' },
        { id: 'files' as ViewTab, label: 'Files', icon: FolderKanban, color: '#60A5FA' },
        { id: 'tasks' as ViewTab, label: 'Tasks', icon: CheckSquare, color: '#34D399' },
        { id: 'calendar' as ViewTab, label: 'Calendar', icon: Calendar, color: '#F472B6' },
        {
          id: 'notifications' as ViewTab,
          label: 'Notifications',
          icon: Bell,
          color: '#FB923C',
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        },
      ],
    },
    {
      label: 'Learning',
      links: [
        { id: 'learning' as ViewTab, label: 'Learning', icon: GraduationCap, color: '#C084FC' },
      ],
    },
    {
      label: 'Planning',
      links: [
        { id: 'goals' as ViewTab, label: 'Goals', icon: Target, color: '#FBBF24' },
        { id: 'projects' as ViewTab, label: 'Projects', icon: FolderKanban, color: '#38BDF8' },
        { id: 'analytics' as ViewTab, label: 'Analytics', icon: BarChart3, color: '#4ADE80' },
        { id: 'activity' as ViewTab, label: 'Activity', icon: Activity, color: '#FDBA74' },
      ],
    },
    {
      label: 'AI Brain',
      links: [
        { id: 'assistant' as ViewTab, label: 'AI Assistant', icon: Sparkles, color: '#A78BFA' },
        { id: 'memory' as ViewTab, label: 'AI Memory', icon: Brain, color: '#67E8F9' },
      ],
    },
    {
      label: 'Utilities',
      links: [
        { id: 'favorites' as ViewTab, label: 'Favorites', icon: Star, color: '#FBBF24' },
        { id: 'recent' as ViewTab, label: 'Recent', icon: Clock, color: '#22D3EE' },
        { id: 'trash' as ViewTab, label: 'Trash', icon: Trash2, color: '#FB7185' },
      ],
    },
  ];

  const initials = profile?.name
    ? profile.name.trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        id="globalSidebarOpen"
        type="button"
        aria-label="Open navigation"
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)] shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          id="globalSidebarBackdrop"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[var(--color-overlay)] backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="globalSidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] transition-all duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed && !isMobileOpen ? 'lg:w-[72px]' : 'lg:w-[256px]'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between min-h-[72px] px-3.5 border-b border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className={`flex items-center gap-3 text-left overflow-hidden ${
              isCollapsed && !isMobileOpen ? 'justify-center w-full' : ''
            }`}
          >
            <span className="ai-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-bold text-[var(--color-primary-contrast)] shadow-md">
              ✦
            </span>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0">
                <strong className="block text-xs font-bold tracking-tight text-[var(--color-text)] truncate">
                  Personal AI OS
                </strong>
                <small className="block text-[10px] text-[var(--color-muted)] truncate">
                  My Workspace
                </small>
              </div>
            )}
          </button>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:grid h-7 w-7 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)] text-xs shrink-0"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Mobile close toggle */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation"
            className="lg:hidden p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {sections.map((sec) => (
            <div key={sec.label} className="space-y-1">
              {(!isCollapsed || isMobileOpen) && (
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-muted)]/70">
                  {sec.label}
                </p>
              )}
              {sec.links.map((link) => {
                const Icon = link.icon;
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => handleNavClick(link.id)}
                    title={link.label}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-text)] border border-[var(--color-primary)]/40 shadow-sm'
                        : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
                    } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
                      style={{ color: link.color }}
                    />
                    {(!isCollapsed || isMobileOpen) && (
                      <span className="truncate">{link.label}</span>
                    )}

                    {link.badge !== undefined && (
                      <span
                        className={`ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-warning)] px-1 text-[9px] font-bold text-black ${
                          isCollapsed && !isMobileOpen ? 'absolute top-1.5 right-1.5' : ''
                        }`}
                      >
                        {link.badge}
                      </span>
                    )}

                    {/* Glowing active indicator dot */}
                    {isActive && (!isCollapsed || isMobileOpen) && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer with settings, profile and signout */}
        <div className="shrink-0 p-2.5 border-t border-[var(--color-border)] space-y-1">
          <button
            type="button"
            onClick={() => handleNavClick('settings')}
            title="Settings"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-[var(--color-primary)]/15 text-[var(--color-text)] border border-[var(--color-primary)]/40'
                : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
            } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
          >
            <Settings className="w-4 h-4 text-[#C4B5FD] shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Settings</span>}
          </button>

          {user && (
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all ${
                isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''
              }`}
            >
              <LogOut className="w-4 h-4 text-[#FB923C] shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span>Sign out</span>}
            </button>
          )}

          {/* User profile preview */}
          {user && (
            <div
              onClick={() => handleNavClick('settings')}
              className={`mt-2 flex items-center gap-2.5 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface)]/60 p-2 cursor-pointer hover:border-[var(--color-primary)]/60 transition-all ${
                isCollapsed && !isMobileOpen ? 'justify-center p-1.5' : ''
              }`}
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-7 w-7 shrink-0 rounded-full object-cover border border-[var(--color-border)]"
                />
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-ai-soft)] text-xs font-bold text-[var(--color-secondary)]">
                  {initials}
                </span>
              )}
              {(!isCollapsed || isMobileOpen) && (
                <div className="min-w-0 flex-1 text-left">
                  <strong className="block text-xs font-bold text-[var(--color-text)] truncate">
                    {profile?.name || 'Workspace Member'}
                  </strong>
                  <small className="block text-[10px] text-[var(--color-muted)] truncate">
                    {user.email}
                  </small>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
