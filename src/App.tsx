import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VideoCallProvider } from './context/VideoCallContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { BreadcrumbNav } from './components/BreadcrumbNav';
import { CommandBar } from './components/CommandBar';
import { AuthModal } from './components/AuthModal';
import { AboutAppModal } from './components/AboutAppModal';
import { AITopUpModal } from './components/AITopUpModal';
import { RulesPrivacyModal } from './components/lounge/RulesPrivacyModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { DashboardView } from './views/DashboardView';
import { TasksView } from './views/TasksView';
import { NotesView } from './views/NotesView';
import { FilesView } from './views/FilesView';
import { CalendarView } from './views/CalendarView';
import { AssistantView } from './views/AssistantView';
import { SearchView } from './views/SearchView';
import { GoalsView } from './views/GoalsView';
import { ProjectsView } from './views/ProjectsView';
import { LearningView } from './views/LearningView';
import { CommunityView } from './views/CommunityView';
import { ActivityView } from './views/ActivityView';
import { AIMemoryView } from './views/AIMemoryView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { TrashView } from './views/TrashView';

import {
  TaskItem,
  NoteItem,
  FileItem,
  CalendarEventItem,
  GoalItem,
  ProjectItem,
  FlashcardItem,
  CommunityPostItem,
  ActivityLogItem,
  AIMemoryItem,
  NotificationItem,
  ViewTab,
} from './types';

import {
  listenToTasks,
  listenToNotes,
  listenToFiles,
  listenToCalendarEvents,
  listenToGoals,
  listenToProjects,
  listenToFlashcards,
  listenToCommunityPosts,
  listenToActivityLogs,
  listenToNotifications,
  subscribeAIMemories,
  createActivityLog,
  createTask,
} from './services/db';

function WorkspaceApp() {
  const { user, profile, loading: authLoading } = useAuth();

  // Persist active tab across browser page refreshes
  const [activeTab, setActiveTab] = useState<ViewTab>(() => {
    try {
      const hash = window.location.hash.replace('#', '') as ViewTab;
      const validTabs: ViewTab[] = [
        'dashboard',
        'tasks',
        'notes',
        'files',
        'calendar',
        'assistant',
        'search',
        'goals',
        'projects',
        'learning',
        'community',
        'activity',
        'memory',
        'analytics',
        'settings',
      ];
      if (hash && validTabs.includes(hash)) return hash;
      const stored = localStorage.getItem('personal_ai_os_active_tab') as ViewTab;
      if (stored && validTabs.includes(stored)) return stored;
    } catch {
      // fallback
    }
    return 'dashboard';
  });

  useEffect(() => {
    try {
      localStorage.setItem('personal_ai_os_active_tab', activeTab);
      window.location.hash = activeTab;
    } catch {
      // ignore
    }
  }, [activeTab]);

  // Manual force-refresh state to re-sync local state with Firebase in case of data inconsistencies
  const [syncKey, setSyncKey] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleForceRefresh = () => {
    setIsSyncing(true);
    setSyncKey((prev) => prev + 1);
    logWorkspaceActivity(
      'synced',
      'system',
      'Workspace Synchronized',
      'Manually forced re-sync with Firebase Cloud'
    );
    setTimeout(() => {
      setIsSyncing(false);
    }, 900);
  };

  // Dynamic theme & accent application
  useEffect(() => {
    if (profile?.theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    if (profile?.accentColor) {
      document.documentElement.style.setProperty('--color-primary', profile.accentColor);
    }
  }, [profile?.theme, profile?.accentColor]);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [isEventEditorOpen, setIsEventEditorOpen] = useState(false);
  const [isAITopUpOpen, setIsAITopUpOpen] = useState(false);
  const [isLoungeRulesOpen, setIsLoungeRulesOpen] = useState(false);
  const [hasSeenGuide, setHasSeenGuide] = useState(() => {
    try {
      return localStorage.getItem('has_seen_app_guide_v1') === 'true';
    } catch {
      return false;
    }
  });

  // Workspace Real-time Data
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPostItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [memories, setMemories] = useState<AIMemoryItem[]>([]);
  const [aiMemoryEnabled, setAiMemoryEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ai_memory_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleSetAiMemoryEnabled = (enabled: boolean) => {
    setAiMemoryEnabled(enabled);
    try {
      localStorage.setItem('ai_memory_enabled', String(enabled));
    } catch {}
  };

  const logWorkspaceActivity = (
    action: string,
    entityType: string,
    entityTitle: string,
    details?: string
  ) => {
    const newLog: ActivityLogItem = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: user?.uid || 'local',
      action,
      entityType,
      entityTitle,
      details,
      source: user ? 'Firestore Sync' : 'Client Synchronization',
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    if (user) {
      createActivityLog({
        userId: user.uid,
        action,
        entityType,
        entityTitle,
        details,
        source: 'Cloud Synchronization',
      }).catch((e) => console.warn('Activity logging notice:', e));
    }
  };

  // Seed sample data for immediate interactive preview
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    // Initial mock state if not yet populated from Firestore
    setTasks([
      {
        id: 't-1',
        userId: 'sample',
        title: 'Complete physics problem set #4',
        description: 'Solve problems on wave functions and boundary conditions',
        status: 'open',
        priority: 'high',
        category: 'Learning',
        dueAt: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-2',
        userId: 'sample',
        title: 'Review Firebase Cloud Storage migration',
        description: 'Verify file upload rules and token security',
        status: 'open',
        priority: 'medium',
        category: 'Work',
        dueAt: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-3',
        userId: 'sample',
        title: 'Set up Personal AI OS routines',
        description: 'Configure morning review prompts and deep work blocks',
        status: 'done',
        priority: 'low',
        category: 'Personal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    setNotes([
      {
        id: 'n-1',
        userId: 'sample',
        title: 'Quantum Mechanics Lecture Insights',
        body: 'Key equation: iℏ ∂ψ/∂t = Ĥψ. Probability amplitude corresponds to the square modulus of the wave function.',
        category: 'Learning',
        color: 'Purple',
        isPinned: true,
        isArchived: false,
        isTrashed: false,
        tags: ['physics', 'quantum', 'study'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'n-2',
        userId: 'sample',
        title: 'AI Operating System Architectural Design',
        body: 'Principles: unified local context, proactive assistance, single-pane command center, offline-capable fallback.',
        category: 'Planning',
        color: 'Blue',
        isPinned: true,
        isArchived: false,
        isTrashed: false,
        tags: ['engineering', 'design'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    setEvents([
      {
        id: 'e-1',
        userId: 'sample',
        title: 'Deep Work: Physics Problem Set',
        startsAt: `${today}T14:00:00.000Z`,
        endsAt: `${today}T16:00:00.000Z`,
        category: 'learning',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: 'Quiet Study Desk',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'e-2',
        userId: 'sample',
        title: 'Weekly Systems Review',
        startsAt: `${today}T17:30:00.000Z`,
        endsAt: `${today}T18:15:00.000Z`,
        category: 'work',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: 'Virtual Desk',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    setGoals([
      {
        id: 'g-1',
        userId: 'sample',
        title: 'Master Quantum Field Theory fundamentals',
        description: 'Complete syllabus and solve 50 practice problems',
        category: 'Learning',
        progress: 65,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'g-2',
        userId: 'sample',
        title: 'Launch Personal AI OS workspace',
        description: 'Full-stack deployment with Firebase Firestore and Gemini AI',
        category: 'Career',
        progress: 90,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    setProjects([
      {
        id: 'p-1',
        userId: 'sample',
        name: 'Autonomous Systems Research',
        title: 'Autonomous Systems Research',
        description: 'Investigating state estimation and control synthesis algorithms',
        status: 'active',
        progress: 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    setFlashcards([
      {
        id: 'f-1',
        userId: 'sample',
        front: "What is Schrödinger's time-dependent wave equation?",
        back: 'iℏ ∂ψ/∂t = Ĥψ, describing how the quantum state of a physical system changes in time.',
        isMastered: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'f-2',
        userId: 'sample',
        front: 'What is the physical meaning of the wave function modulus squared |ψ|²?',
        back: 'It represents the probability density of finding a particle at a given point in space.',
        isMastered: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    setCommunityPosts([
      {
        id: 'cp-1',
        userId: 'sample',
        authorId: 'user-0',
        authorName: 'Farzan',
        title: 'My Daily Workspace Review Prompt Framework',
        content: 'I ask the AI Copilot every evening: "Review today\'s completed tasks, calculate my velocity, and suggest 3 high-leverage priorities for tomorrow morning."',
        tags: ['AI Prompts'],
        likesCount: 14,
        upvotes: 14,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      },
    ]);

    setNotifications([
      {
        id: 'notif-1',
        userId: 'sample',
        type: 'system',
        title: 'Firebase Connected',
        message: 'Firestore and Storage synchronized in real-time.',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    setMemories([
      {
        id: 'mem-seed-1',
        userId: 'sample',
        title: 'TypeScript code preferences',
        content: 'Prefers practical TypeScript examples and concise code snippets when learning new concepts.',
        type: 'preference',
        importance: 85,
        source: 'manual',
        isVisible: true,
        is_visible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mem-seed-2',
        userId: 'sample',
        title: 'Quantum Computing Focus',
        content: 'Currently studying Schrödinger wave equations, probability densities, and quantum state evolution.',
        type: 'project',
        importance: 90,
        source: 'manual',
        isVisible: true,
        is_visible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mem-seed-3',
        userId: 'sample',
        title: 'Workspace Design Ethos',
        content: 'Values distraction-free layouts, high contrast typography, and offline-first persistence.',
        type: 'personal',
        importance: 70,
        source: 'manual',
        isVisible: true,
        is_visible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    setActivityLogs([
      {
        id: 'log-seed-1',
        userId: 'sample',
        action: 'synced',
        entityType: 'system',
        entityTitle: 'Workspace Namespace Initialized',
        details: 'Verified isolated tenant permissions and Firestore replication',
        source: 'Cloud Synchronization',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'log-seed-2',
        userId: 'sample',
        action: 'created',
        entityType: 'task',
        entityTitle: 'Complete physics problem set #4',
        details: 'Priority: high | Category: Learning',
        source: 'Client Synchronization',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'log-seed-3',
        userId: 'sample',
        action: 'updated',
        entityType: 'ai_memory',
        entityTitle: 'TypeScript code preferences',
        details: 'Importance: High (85) | Visibility: Enabled',
        source: 'Memory Controller',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ]);
  }, []);

  // Listen to Firestore real-time collections or local cache fallback
  useEffect(() => {
    const activeUid = user?.uid || 'guest_user';

    const unsubs = [
      listenToTasks(activeUid, (data) => data.length > 0 && setTasks(data)),
      listenToNotes(activeUid, (data) => data.length > 0 && setNotes(data)),
      listenToFiles(activeUid, (data) => setFiles(data)),
      listenToCalendarEvents(activeUid, (data) => data.length > 0 && setEvents(data)),
      listenToGoals(activeUid, (data) => data.length > 0 && setGoals(data)),
      listenToProjects(activeUid, (data) => data.length > 0 && setProjects(data)),
      listenToFlashcards(activeUid, (data) => data.length > 0 && setFlashcards(data)),
      listenToCommunityPosts((data) => data.length > 0 && setCommunityPosts(data)),
      listenToActivityLogs(activeUid, (data) => data.length > 0 && setActivityLogs(data)),
      listenToNotifications(activeUid, (data) => data.length > 0 && setNotifications(data)),
      subscribeAIMemories(activeUid, (data) => setMemories(data)),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub && unsub());
    };
  }, [user, syncKey]);

  // Global Keyboard Shortcuts (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandBarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick action from CommandBar
  const handleQuickTask = async (title: string) => {
    logWorkspaceActivity('created', 'task', title, 'Added via Command Bar');
    if (user) {
      await createTask({
        userId: user.uid,
        title,
        status: 'open',
        priority: 'medium',
        category: 'Work',
      });
    } else {
      setTasks((prev) => [
        {
          id: 'temp-' + Date.now(),
          userId: 'local',
          title,
          status: 'open',
          priority: 'medium',
          category: 'Work',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setActiveTab('tasks');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            tasks={tasks}
            notes={notes}
            files={files}
            events={events}
            goals={goals}
            setActiveTab={setActiveTab}
            onOpenNewTask={() => setIsTaskEditorOpen(true)}
            onOpenNewNote={() => setIsNoteEditorOpen(true)}
            onOpenNewEvent={() => setIsEventEditorOpen(true)}
          />
        );
      case 'tasks':
        return (
          <TasksView
            tasks={tasks}
            isEditorOpen={isTaskEditorOpen}
            onCloseEditor={() => setIsTaskEditorOpen(false)}
            onOpenEditor={() => setIsTaskEditorOpen(true)}
            onReorderTasks={(newTasks) => setTasks(newTasks)}
          />
        );
      case 'notes':
      case 'favorites':
        return (
          <NotesView
            notes={notes}
            isEditorOpen={isNoteEditorOpen}
            onCloseEditor={() => setIsNoteEditorOpen(false)}
            onOpenEditor={() => setIsNoteEditorOpen(true)}
          />
        );
      case 'trash':
        return (
          <TrashView
            notes={notes}
            files={files}
            onLogActivity={logWorkspaceActivity}
          />
        );
      case 'files':
        return <FilesView files={files} />;
      case 'calendar':
        return (
          <CalendarView
            events={events}
            isEditorOpen={isEventEditorOpen}
            onCloseEditor={() => setIsEventEditorOpen(false)}
            onOpenEditor={() => setIsEventEditorOpen(true)}
          />
        );
      case 'memory':
        return (
          <AIMemoryView
            memories={memories}
            setMemories={setMemories}
            aiMemoryEnabled={aiMemoryEnabled}
            setAiMemoryEnabled={handleSetAiMemoryEnabled}
            onLogActivity={logWorkspaceActivity}
          />
        );
      case 'assistant':
        return (
          <AssistantView
            tasks={tasks}
            notes={notes}
            files={files}
            events={events}
            memories={memories}
            aiMemoryEnabled={aiMemoryEnabled}
            onNavigate={(tab) => setActiveTab(tab as ViewTab)}
            onLogActivity={logWorkspaceActivity}
          />
        );
      case 'search':
        return (
          <SearchView
            tasks={tasks}
            notes={notes}
            files={files}
            events={events}
            setActiveTab={setActiveTab}
          />
        );
      case 'goals':
        return <GoalsView goals={goals} />;
      case 'projects':
        return <ProjectsView projects={projects} setActiveTab={setActiveTab} />;
      case 'learning':
        return <LearningView flashcards={flashcards} />;
      case 'community':
        return <CommunityView posts={communityPosts} onNavigate={(tab) => setActiveTab(tab as any)} />;
      case 'activity':
      case 'recent':
      case 'notifications':
        return (
          <ActivityView
            logs={activityLogs}
            setLogs={setActivityLogs}
            onForceRefresh={handleForceRefresh}
            isSyncing={isSyncing}
            notifications={notifications}
            setNotifications={setNotifications}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            initialTab={activeTab === 'notifications' ? 'notifications' : 'activity'}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            tasks={tasks}
            notes={notes}
            files={files}
            events={events}
            goals={goals}
          />
        );
      case 'settings':
        return (
          <SettingsView
            files={files}
            notes={notes}
            tasks={tasks}
            posts={communityPosts}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onOpenAbout={() => setIsAboutModalOpen(true)}
            onForceRefresh={handleForceRefresh}
            isSyncing={isSyncing}
          />
        );
      default:
        return (
          <DashboardView
            tasks={tasks}
            notes={notes}
            files={files}
            events={events}
            goals={goals}
            setActiveTab={setActiveTab}
            onOpenNewTask={() => setIsTaskEditorOpen(true)}
            onOpenNewNote={() => setIsNoteEditorOpen(true)}
            onOpenNewEvent={() => setIsEventEditorOpen(true)}
          />
        );
    }
  };

  // If verifying session initial token, render a lightweight non-blocking loader
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#080D18] text-[#F1F5F9]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#8B5CF6] border-t-transparent" />
          <p className="text-xs font-semibold text-[#94A3B8]">Loading Personal AI OS...</p>
        </div>
      </div>
    );
  }

  // Workspace renders immediately with interactive state
  return (
    <motion.div
      id="workspace-container"
      key="workspace-main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex min-h-screen w-full bg-[var(--color-bg)] text-[var(--color-text)]"
    >
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadNotificationsCount={notifications.filter((n) => !n.isRead).length}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onForceRefresh={handleForceRefresh}
        isSyncing={isSyncing}
      />

      {/* Main Content Area - shifts on desktop to accommodate sidebar */}
      <div className="flex flex-1 flex-col transition-all duration-200 lg:pl-[256px]">
        {/* Top Header */}
        <Topbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCommandBar={() => setIsCommandBarOpen(true)}
          onOpenNewTask={() => setIsTaskEditorOpen(true)}
          onOpenNewNote={() => setIsNoteEditorOpen(true)}
          onOpenNewEvent={() => setIsEventEditorOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenAbout={() => setIsAboutModalOpen(true)}
          onOpenAITopUp={() => setIsAITopUpOpen(true)}
          onOpenLoungeRules={() => setIsLoungeRulesOpen(true)}
          notifications={notifications}
        />

        {/* Subtle Breadcrumb Navigation */}
        <BreadcrumbNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* First-time visitor welcome banner */}
        {!hasSeenGuide && (
          <div
            id="new-user-welcome-banner"
            className="mx-4 mt-3 sm:mx-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/50 via-violet-950/40 to-indigo-900/30 p-3 px-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[var(--color-text)]">
                  Welcome to Personal AI OS!
                </p>
                <p className="text-[11px] sm:text-xs text-[var(--color-muted)]">
                  Discover what this app does, explore key features, and review our zero-tracking privacy policies.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="explore-guide-banner-btn"
                onClick={() => setIsAboutModalOpen(true)}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-white/5 px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] shadow-sm transition-all"
              >
                Guide & Policies
              </button>
              <button
                type="button"
                id="dismiss-guide-banner-btn"
                onClick={() => {
                  setHasSeenGuide(true);
                  try {
                    localStorage.setItem('has_seen_app_guide_v1', 'true');
                  } catch {}
                }}
                className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page View with Resilience Boundary */}
        <main className="flex-1 pb-16">
          <ErrorBoundary fallbackTitle="View Encountered an Unexpected Interruption">
            {renderActiveView()}
          </ErrorBoundary>
        </main>
      </div>

      {/* Universal Command Bar Modal (⌘K) */}
      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        setActiveTab={setActiveTab}
        onQuickTask={handleQuickTask}
        onQuickAI={(prompt) => {
          setActiveTab('assistant');
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* About App, Features, Privacy & Policies Modal */}
      <AboutAppModal
        isOpen={isAboutModalOpen}
        onClose={() => {
          setIsAboutModalOpen(false);
          setHasSeenGuide(true);
        }}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Contextual Ask AI Top-Up Pop-up Modal */}
      <AITopUpModal
        isOpen={isAITopUpOpen}
        onClose={() => setIsAITopUpOpen(false)}
        activeTab={activeTab}
        onNavigateToFullAI={() => {
          setIsAITopUpOpen(false);
          setActiveTab('assistant');
        }}
        tasks={tasks}
        notes={notes}
        files={files}
        events={events}
      />

      {/* Lounge Community Rules & Privacy Policy Modal */}
      <RulesPrivacyModal
        isOpen={isLoungeRulesOpen}
        onClose={() => setIsLoungeRulesOpen(false)}
      />
    </motion.div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VideoCallProvider>
        <motion.div
          id="main-app-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="min-h-screen w-full"
        >
          <WorkspaceApp />
        </motion.div>
      </VideoCallProvider>
    </AuthProvider>
  );
}
