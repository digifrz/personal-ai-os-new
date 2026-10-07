import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  Home,
  LayoutDashboard,
  CheckSquare,
  FileText,
  FolderKanban,
  Calendar,
  Sparkles,
  Search,
  Target,
  GraduationCap,
  Users,
  Activity,
  Brain,
  BarChart3,
  Settings,
  Trash2,
  ChevronDown,
  Layers,
  LucideIcon,
  Bell,
  MessageSquare,
  Star,
  Clock,
} from 'lucide-react';
import { ViewTab } from '../types';

interface BreadcrumbItemInfo {
  id: ViewTab;
  label: string;
  section: string;
  icon: LucideIcon;
  color: string;
  badge?: string;
  description: string;
}

const TAB_METADATA: Record<ViewTab, BreadcrumbItemInfo> = {
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    section: 'Main',
    icon: LayoutDashboard,
    color: '#8B5CF6',
    description: 'System overview & quick actions',
  },
  search: {
    id: 'search',
    label: 'Search',
    section: 'Main',
    icon: Search,
    color: '#22D3EE',
    description: 'Universal keyword & voice search',
  },
  tasks: {
    id: 'tasks',
    label: 'Tasks',
    section: 'Productivity',
    icon: CheckSquare,
    color: '#34D399',
    description: 'Tasks, checklists & priorities',
  },
  notes: {
    id: 'notes',
    label: 'Notes',
    section: 'Productivity',
    icon: FileText,
    color: '#F59E0B',
    description: 'Markdown docs & scratchpad',
  },
  files: {
    id: 'files',
    label: 'Files',
    section: 'Productivity',
    icon: FolderKanban,
    color: '#60A5FA',
    description: 'Cloud documents & file vault',
  },
  calendar: {
    id: 'calendar',
    label: 'Calendar',
    section: 'Productivity',
    icon: Calendar,
    color: '#F472B6',
    description: 'Schedules, deadlines & agendas',
  },
  learning: {
    id: 'learning',
    label: 'Learning & Flashcards',
    section: 'Knowledge',
    icon: GraduationCap,
    color: '#C084FC',
    description: 'Spaced repetition & study decks',
  },
  goals: {
    id: 'goals',
    label: 'Goals & Milestones',
    section: 'Planning',
    icon: Target,
    color: '#FBBF24',
    description: 'Objectives & metric targets',
  },
  projects: {
    id: 'projects',
    label: 'Projects',
    section: 'Planning',
    icon: FolderKanban,
    color: '#38BDF8',
    description: 'Multi-step deliverables & pipelines',
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics',
    section: 'Planning',
    icon: BarChart3,
    color: '#4ADE80',
    description: 'Productivity velocity & stats',
  },
  activity: {
    id: 'activity',
    label: 'Activity History',
    section: 'Planning',
    icon: Activity,
    color: '#FDBA74',
    description: 'Audit logs & recent workspace events',
  },
  community: {
    id: 'community',
    label: 'The Lounge',
    section: 'Community',
    icon: Users,
    color: '#EC4899',
    description: 'Pulses, 24h stories, network & messages',
  },
  assistant: {
    id: 'assistant',
    label: 'AI Assistant',
    section: 'AI Brain',
    icon: Sparkles,
    color: '#A78BFA',
    description: 'Context-aware workspace AI & voice commands',
  },
  memory: {
    id: 'memory',
    label: 'AI Memory',
    section: 'AI Brain',
    icon: Brain,
    color: '#67E8F9',
    description: 'Persistent knowledge & long-term facts',
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    section: 'System',
    icon: Settings,
    color: '#94A3B8',
    description: 'Preferences, account mode & security',
  },
  trash: {
    id: 'trash',
    label: 'Trash',
    section: 'System',
    icon: Trash2,
    color: '#FB7185',
    description: 'Recycle bin & deleted items',
  },
  notifications: {
    id: 'notifications',
    label: 'Notifications',
    section: 'Planning',
    icon: Bell,
    color: '#F43F5E',
    description: 'System alerts & activity notices',
  },
  chats: {
    id: 'chats',
    label: 'Messages',
    section: 'Community',
    icon: MessageSquare,
    color: '#10B981',
    description: 'Direct conversations & messaging',
  },
  favorites: {
    id: 'favorites',
    label: 'Favorites',
    section: 'Productivity',
    icon: Star,
    color: '#F59E0B',
    description: 'Starred workspace items',
  },
  recent: {
    id: 'recent',
    label: 'Recent',
    section: 'Planning',
    icon: Clock,
    color: '#6366F1',
    description: 'Recently accessed resources',
  },
};

// Section siblings map
const SECTION_TABS: Record<string, ViewTab[]> = {
  Main: ['dashboard', 'search'],
  Productivity: ['tasks', 'notes', 'files', 'calendar', 'favorites'],
  Knowledge: ['learning'],
  Planning: ['goals', 'projects', 'analytics', 'activity', 'notifications', 'recent'],
  Community: ['community', 'chats'],
  'AI Brain': ['assistant', 'memory'],
  System: ['settings', 'trash'],
};

interface BreadcrumbNavProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  const currentMeta = TAB_METADATA[activeTab] || TAB_METADATA.dashboard;
  const CurrentIcon = currentMeta.icon;

  const siblingTabs = SECTION_TABS[currentMeta.section] || [activeTab];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className="w-full border-b border-[var(--color-border)]/50 bg-[var(--color-bg)]/40 px-4 py-2 sm:px-6 backdrop-blur-sm transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Breadcrumb Path Trail */}
        <ol className="flex items-center space-x-1.5 sm:space-x-2 text-[var(--color-muted)]">
          {/* Root: OS Command Center */}
          <li className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              title="Return to Personal AI OS Dashboard"
              className="group flex items-center gap-1.5 rounded-lg px-2 py-1 text-[var(--color-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-text)]"
            >
              <Home className="h-3.5 w-3.5 text-indigo-400 transition-transform group-hover:scale-110" />
              <span className="font-medium tracking-tight">OS</span>
            </button>
          </li>

          <li aria-hidden="true" className="text-[var(--color-border)]">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>

          {/* Section Category with Sibling Quick-Switcher */}
          <li className="relative flex items-center" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              title={`Switch within ${currentMeta.section}`}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[var(--color-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-text)]"
            >
              <Layers className="h-3 w-3 text-[var(--color-muted)]" />
              <span className="font-medium">{currentMeta.section}</span>
              {siblingTabs.length > 1 && (
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    isDropdownOpen ? 'rotate-180 text-[var(--color-text)]' : ''
                  }`}
                />
              )}
            </button>

            {/* Sibling dropdown popover */}
            {isDropdownOpen && siblingTabs.length > 1 && (
              <div className="absolute top-full left-0 z-50 mt-1 w-52 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-xl backdrop-blur-lg animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  {currentMeta.section} Modules
                </div>
                <div className="space-y-0.5">
                  {siblingTabs.map((tabId) => {
                    const tabMeta = TAB_METADATA[tabId];
                    const TabIcon = tabMeta.icon;
                    const isCurrent = tabId === activeTab;
                    return (
                      <button
                        key={tabId}
                        type="button"
                        onClick={() => {
                          setActiveTab(tabId);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                          isCurrent
                            ? 'bg-indigo-500/15 font-semibold text-indigo-400'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
                        }`}
                      >
                        <TabIcon
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: tabMeta.color }}
                        />
                        <span className="truncate">{tabMeta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </li>

          <li aria-hidden="true" className="text-[var(--color-border)]">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>

          {/* Current Active Location */}
          <li className="flex items-center">
            <div
              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-surface)]/80 px-2.5 py-1 font-semibold text-[var(--color-text)] shadow-xs border border-[var(--color-border)]/60"
              style={{
                borderLeftColor: currentMeta.color,
                borderLeftWidth: '3px',
              }}
            >
              <CurrentIcon
                className="h-3.5 w-3.5"
                style={{ color: currentMeta.color }}
              />
              <span className="tracking-tight">{currentMeta.label}</span>
            </div>
          </li>
        </ol>

        {/* Right side: Location context subtitle */}
        <div className="hidden items-center gap-2 text-[11px] text-[var(--color-muted)] md:flex">
          <span className="truncate font-mono text-[10px] opacity-70">
            root://workspace/{activeTab}
          </span>
          <span className="h-3 w-px bg-[var(--color-border)]" />
          <span className="truncate max-w-[280px]">
            {currentMeta.description}
          </span>
        </div>
      </div>
    </nav>
  );
};
