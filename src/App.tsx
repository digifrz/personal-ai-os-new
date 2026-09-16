import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { CommandBar } from './components/CommandBar';
import { AuthModal } from './components/AuthModal';
import { StartupAnimation } from './components/StartupAnimation';
import { AuthGate } from './components/AuthGate';
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
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';

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
  createTask,
} from './services/db';

function WorkspaceApp() {
  const { user, profile, loading: authLoading } = useAuth();
  const [isStartupDone, setIsStartupDone] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');

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
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [isEventEditorOpen, setIsEventEditorOpen] = useState(false);

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
  }, []);

  // Listen to Firestore real-time collections when logged in
  useEffect(() => {
    if (!user) return;

    const unsubs = [
      listenToTasks(user.uid, (data) => data.length > 0 && setTasks(data)),
      listenToNotes(user.uid, (data) => data.length > 0 && setNotes(data)),
      listenToFiles(user.uid, (data) => setFiles(data)),
      listenToCalendarEvents(user.uid, (data) => data.length > 0 && setEvents(data)),
      listenToGoals(user.uid, (data) => data.length > 0 && setGoals(data)),
      listenToProjects(user.uid, (data) => data.length > 0 && setProjects(data)),
      listenToFlashcards(user.uid, (data) => data.length > 0 && setFlashcards(data)),
      listenToCommunityPosts((data) => data.length > 0 && setCommunityPosts(data)),
      listenToActivityLogs(user.uid, (data) => data.length > 0 && setActivityLogs(data)),
      listenToNotifications(user.uid, (data) => data.length > 0 && setNotifications(data)),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub && unsub());
    };
  }, [user]);

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
      case 'trash':
        return (
          <NotesView
            notes={notes}
            isEditorOpen={isNoteEditorOpen}
            onCloseEditor={() => setIsNoteEditorOpen(false)}
            onOpenEditor={() => setIsNoteEditorOpen(true)}
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
      case 'assistant':
      case 'memory':
        return (
          <AssistantView
            tasks={tasks}
            notes={notes}
            files={files}
            events={events}
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
        return <ActivityView logs={activityLogs} />;
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
        return <SettingsView />;
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

  // 1. Startup animation on application boot
  if (!isStartupDone) {
    return (
      <AnimatePresence mode="wait">
        <StartupAnimation onComplete={() => setIsStartupDone(true)} />
      </AnimatePresence>
    );
  }

  // 2. Session verification phase
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#080D18] text-[#F1F5F9]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#8B5CF6] border-t-transparent" />
          <p className="text-xs font-semibold text-[#94A3B8]">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  // 3. Authentication gating: App is only usable/openable after authentication
  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="auth-gate-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="min-h-screen w-full bg-[#080D18]"
        >
          <AuthGate />
        </motion.div>
      </AnimatePresence>
    );
  }

  // 4. Authenticated workspace
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
          notifications={notifications}
        />

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
    </motion.div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <motion.div
        id="main-app-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="min-h-screen w-full"
      >
        <WorkspaceApp />
      </motion.div>
    </AuthProvider>
  );
}
