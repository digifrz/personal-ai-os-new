import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VideoCallProvider, useVideoCall } from './context/VideoCallContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { BreadcrumbNav } from './components/BreadcrumbNav';
import { CommandBar } from './components/CommandBar';
import { AuthModal } from './components/AuthModal';
import { AboutAppModal } from './components/AboutAppModal';
import { AITopUpModal } from './components/AITopUpModal';
import { RulesPrivacyModal } from './components/lounge/RulesPrivacyModal';
import { VideoCallInterface } from './components/lounge/VideoCallInterface';
import { SpotifyOSPlayer } from './components/common/SpotifyOSPlayer';
import { GoogleWorkspaceModal } from './components/common/GoogleWorkspaceModal';
import { OSAppHubModal } from './components/common/OSAppHubModal';
import { FloatingAssistantWidget } from './components/common/FloatingAssistantWidget';
import { VoiceCommandListener } from './components/common/VoiceCommandListener';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { WindowManagerProvider, useWindowManager } from './context/WindowManagerContext';
import { OSWindowManagerCanvas } from './components/common/OSWindowManagerCanvas';
import { OSTaskbar } from './components/common/OSTaskbar';

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
import { DiaryView } from './views/DiaryView';
import { HabitsView } from './views/HabitsView';
import { FinanceView } from './views/FinanceView';
import { VisionBoardView } from './views/VisionBoardView';
import { DailyBriefingModal } from './components/common/DailyBriefingModal';
import { PremiumUpgradeModal } from './components/common/PremiumUpgradeModal';
import { AIRoastHypeModal } from './components/common/AIRoastHypeModal';
import { DecisionWheelModal } from './components/common/DecisionWheelModal';
import { AmbientSoundscapeStation } from './components/common/AmbientSoundscapeStation';
import { EmergencyFocusMode } from './components/common/EmergencyFocusMode';
import { NewUserQuickStartCard } from './components/common/NewUserQuickStartCard';

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
  HabitItem,
  FinanceTransactionItem,
  VisionBoardItem,
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
  listenToHabits,
  listenToTransactions,
  listenToVisionItems,
  toggleHabitDate,
  subscribeAIMemories,
  createActivityLog,
  createTask,
  updateTask,
} from './services/db';

function WorkspaceApp() {
  const { user, profile, loading: authLoading } = useAuth();
  const { osMode, openWindow } = useWindowManager();

  // Persist active tab across browser page refreshes
  const [activeTab, setActiveTab] = useState<ViewTab>(() => {
    try {
      const hash = window.location.hash.replace('#', '') as ViewTab;
      const validTabs: ViewTab[] = [
        'dashboard',
        'tasks',
        'notes',
        'habits',
        'finance',
        'vision',
        'diary',
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
  const [assistantNewChatTrigger, setAssistantNewChatTrigger] = useState(0);
  const [isLoungeRulesOpen, setIsLoungeRulesOpen] = useState(false);
  const [isAppHubOpen, setIsAppHubOpen] = useState(false);
  const [isSpotifyOpen, setIsSpotifyOpen] = useState(false);
  const [isGoogleWorkspaceOpen, setIsGoogleWorkspaceOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isDailyBriefingOpen, setIsDailyBriefingOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isRoastHypeOpen, setIsRoastHypeOpen] = useState(false);
  const [isDecisionWheelOpen, setIsDecisionWheelOpen] = useState(false);
  const [isSoundscapeOpen, setIsSoundscapeOpen] = useState(false);
  const [isEmergencyFocusOpen, setIsEmergencyFocusOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('personal-ai-os-sidebar-state') === 'collapsed';
    } catch {
      return false;
    }
  });
  const { startCall } = useVideoCall();
  const [visitCount] = useState<number>(() => {
    try {
      const prev = parseInt(localStorage.getItem('paio_user_visit_count') || '0', 10);
      const current = prev + 1;
      localStorage.setItem('paio_user_visit_count', current.toString());
      return current;
    } catch {
      return 1;
    }
  });
  const [hasDismissedQuickStart, setHasDismissedQuickStart] = useState<boolean>(() => {
    try {
      return localStorage.getItem('paio_dismissed_quick_start') === 'true';
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
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransactionItem[]>([]);
  const [visionItems, setVisionItems] = useState<VisionBoardItem[]>([]);
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

    const todayDate = new Date().toISOString().split('T')[0];
    const yestDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgoDate = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

    setHabits([
      {
        id: 'h-seed-1',
        userId: 'sample',
        title: 'Deep Work & Coding Sprint',
        category: 'productivity',
        frequency: 'daily',
        streakCount: 5,
        bestStreak: 14,
        completedDates: [todayDate, yestDate, twoDaysAgoDate],
        reminderTime: '09:00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'h-seed-2',
        userId: 'sample',
        title: 'Morning 20-min Cardio / Run',
        category: 'fitness',
        frequency: 'daily',
        streakCount: 3,
        bestStreak: 7,
        completedDates: [todayDate, yestDate],
        reminderTime: '07:30',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'h-seed-3',
        userId: 'sample',
        title: 'Read 20 pages (Philosophy / Tech)',
        category: 'learning',
        frequency: 'daily',
        streakCount: 8,
        bestStreak: 21,
        completedDates: [yestDate, twoDaysAgoDate],
        reminderTime: '21:00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'h-seed-4',
        userId: 'sample',
        title: 'Mindful Breathing & Posture Reset',
        category: 'mind',
        frequency: 'daily',
        streakCount: 4,
        bestStreak: 10,
        completedDates: [todayDate, yestDate],
        reminderTime: '22:00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    setTransactions([
      {
        id: 'tx-seed-1',
        userId: 'sample',
        type: 'income',
        amount: 4500,
        category: 'income',
        date: todayDate,
        note: 'Engineering Retainer Inflow',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'tx-seed-2',
        userId: 'sample',
        type: 'expense',
        amount: 49.99,
        category: 'tech',
        date: todayDate,
        note: 'Cloud Server Infrastructure',
        recurring: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'tx-seed-3',
        userId: 'sample',
        type: 'expense',
        amount: 84.50,
        category: 'food',
        date: yestDate,
        note: 'Organic Grocery Run',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'tx-seed-4',
        userId: 'sample',
        type: 'expense',
        amount: 15.00,
        category: 'tech',
        date: yestDate,
        note: 'Spotify Premium Family',
        recurring: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    setVisionItems([
      {
        id: 'vis-seed-1',
        userId: 'sample',
        title: 'Executive Focus Sanctuary',
        caption: 'Design and build world-class, high-impact systems from an ultra-minimalist workstation.',
        affirmation: 'I bring intense focus and effortless clarity to complex engineering.',
        category: 'career',
        targetYear: '2026',
        isPinned: true,
        imageUrl: '/src/assets/images/vision_deep_focus_1792340279405.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'vis-seed-2',
        userId: 'sample',
        title: 'Alpine Peak Expedition',
        caption: 'Reach the summit above the cloudline at sunrise. Continuous physical and mental fortitude.',
        affirmation: 'No mountain is too steep when I take consistent daily steps.',
        category: 'travel',
        targetYear: '2027',
        isPinned: true,
        imageUrl: '/src/assets/images/vision_mountain_peak_1792340279918.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'vis-seed-3',
        userId: 'sample',
        title: 'Boutique Creative Design Studio',
        caption: 'Lead an innovative architecture & software laboratory surrounded by inspiring peers and lush greenery.',
        affirmation: 'My creativity compounds daily into timeless, elegant products.',
        category: 'lifestyle',
        targetYear: '2027',
        isPinned: false,
        imageUrl: '/src/assets/images/vision_creative_studio_1792340280119.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'vis-seed-4',
        userId: 'sample',
        title: 'Autonomous Synthetic Intelligence',
        caption: 'Pioneer advanced multi-modal agent systems that amplify human productivity and creativity.',
        affirmation: 'I build at the absolute technological frontier.',
        category: 'career',
        targetYear: '2028',
        isPinned: false,
        imageUrl: '/src/assets/images/vision_cyber_neural_1792340279697.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
      listenToHabits(activeUid, (data) => data.length > 0 && setHabits(data)),
      listenToTransactions(activeUid, (data) => data.length > 0 && setTransactions(data)),
      listenToVisionItems(activeUid, (data) => data.length > 0 && setVisionItems(data)),
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

  const handleToggleTaskStatus = async (taskId: string) => {
    const t = tasks.find((item) => item.id === taskId);
    if (!t) return;
    const nextStatus: 'done' | 'open' = t.status === 'done' ? 'open' : 'done';
    setTasks((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, status: nextStatus } : item))
    );
    if (user) {
      try {
        await updateTask(taskId, { status: nextStatus });
      } catch (err) {
        console.warn('Update task error:', err);
      }
    }
  };

  const handleToggleHabit = async (habitId: string, dateStr: string, completedDates: string[]) => {
    try {
      const nextDates = await toggleHabitDate(habitId, dateStr, completedDates);
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, completedDates: nextDates } : h))
      );
    } catch (e) {
      console.warn('Toggle habit error:', e);
    }
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
            onOpenDailyBriefing={() => setIsDailyBriefingOpen(true)}
            onOpenRoastHype={() => setIsRoastHypeOpen(true)}
            onOpenDecisionWheel={() => setIsDecisionWheelOpen(true)}
            onOpenSoundscape={() => setIsSoundscapeOpen(true)}
            onOpenEmergencyFocus={() => setIsEmergencyFocusOpen(true)}
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
      case 'diary':
        return (
          <DiaryView
            calendarEvents={events}
            onNavigate={(tab) => setActiveTab(tab as any)}
          />
        );
      case 'habits':
        return (
          <HabitsView
            habits={habits}
            onOpenAIAdvice={() => setActiveTab('assistant')}
          />
        );
      case 'finance':
        return (
          <FinanceView
            transactions={transactions}
          />
        );
      case 'vision':
        return (
          <VisionBoardView
            items={visionItems}
            onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
          />
        );
      case 'integrations':
        return (
          <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-[var(--color-text)]">
                    Integrations &amp; Floating Apps Launchpad
                  </span>
                  <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
                    All-in-One OS
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Launch, float, and dock your real external applications anywhere across your workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAppHubOpen(true)}
                className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-2 text-xs shadow-md transition-all"
              >
                Open Hub Modal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Spotify OS Music', desc: 'Floating ambient beats & full song list playlist player', badge: 'Audio Flow', action: () => setIsSpotifyOpen(true), color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
                { name: 'Google Workspace', desc: 'Direct Gmail sender & Google Calendar bi-directional sync', badge: 'Productivity', action: () => setIsGoogleWorkspaceOpen(true), color: 'border-red-500/30 bg-red-500/5 text-red-400' },
                { name: 'Dual AI Assistant', desc: 'Gemini 3.8 Flash & ChatGPT multi-thread conversational reasoning', badge: 'Intelligence', action: () => setActiveTab('assistant'), color: 'border-violet-500/30 bg-violet-500/5 text-violet-400' },
                { name: 'Daily Reflection Diary', desc: 'Personal diary with calendar reflection & Google Docs sync', badge: 'Journaling', action: () => setActiveTab('diary'), color: 'border-purple-500/30 bg-purple-500/5 text-purple-400' },
                { name: 'Google Classroom & Meet', desc: 'Course assignments sync and online study meeting rooms', badge: 'Education', action: () => setActiveTab('learning'), color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
                { name: 'Google Drive Cloud Mode', desc: 'Browse Drive files and upload/share directly to Lounge', badge: 'Cloud Storage', action: () => setActiveTab('files'), color: 'border-blue-500/30 bg-blue-500/5 text-blue-400' },
              ].map((item, i) => (
                <div key={i} className={`p-5 rounded-3xl border ${item.color} space-y-3 flex flex-col justify-between shadow-sm hover:border-opacity-60 transition-all`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-[var(--color-text)]">{item.name}</h4>
                      <span className="text-[10px] font-bold opacity-80 rounded-full px-2 py-0.5 bg-white/5 border border-white/10">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted)] mt-1.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={item.action}
                    className="w-full rounded-xl bg-white/10 hover:bg-white/20 py-2 text-xs font-bold text-[var(--color-text)] transition-colors text-center"
                  >
                    Open / Float Anywhere
                  </button>
                </div>
              ))}
            </div>
          </div>
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
            openNewChatTrigger={assistantNewChatTrigger}
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
            onOpenDailyBriefing={() => setIsDailyBriefingOpen(true)}
            onOpenRoastHype={() => setIsRoastHypeOpen(true)}
            onOpenDecisionWheel={() => setIsDecisionWheelOpen(true)}
            onOpenSoundscape={() => setIsSoundscapeOpen(true)}
            onOpenEmergencyFocus={() => setIsEmergencyFocusOpen(true)}
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
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => {
          const next = !isSidebarCollapsed;
          setIsSidebarCollapsed(next);
          localStorage.setItem('personal-ai-os-sidebar-state', next ? 'collapsed' : 'expanded');
        }}
        onOpenIntegrations={() => setIsAppHubOpen(true)}
      />

      {/* Main Content Area - dynamically responsive when sidebar closes or collapses */}
      <div
        className={`flex flex-1 flex-col transition-all duration-300 w-full min-w-0 ${
          isSidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[256px]'
        }`}
      >
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
          onOpenAITopUp={() => {
            setAssistantNewChatTrigger((prev) => prev + 1);
            setActiveTab('assistant');
          }}
          onOpenDailyBriefing={() => setIsDailyBriefingOpen(true)}
          onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
          onOpenRoastHype={() => setIsRoastHypeOpen(true)}
          onOpenDecisionWheel={() => setIsDecisionWheelOpen(true)}
          onOpenSoundscape={() => setIsSoundscapeOpen(true)}
          onOpenEmergencyFocus={() => setIsEmergencyFocusOpen(true)}
          onOpenLoungeRules={() => setIsLoungeRulesOpen(true)}
          onOpenAppHub={() => setIsAppHubOpen(true)}
          onOpenSpotify={() => setIsSpotifyOpen(true)}
          onOpenGoogleWorkspace={() => setIsGoogleWorkspaceOpen(true)}
          onOpenVideoCall={() => startCall({ contactName: 'Live Video Meet', contactAvatar: '', type: 'video' })}
          onToggleVoiceListener={() => setIsVoiceListening((prev) => !prev)}
          isVoiceListening={isVoiceListening}
          notifications={notifications}
        />

        {/* Subtle Breadcrumb Navigation */}
        <BreadcrumbNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* First & Second-time user interactive quick-start onboarding */}
        {visitCount <= 2 && !hasDismissedQuickStart && (
          <NewUserQuickStartCard
            visitNumber={visitCount}
            onNavigate={(tab) => setActiveTab(tab as any)}
            onOpenSpotify={() => setIsSpotifyOpen(true)}
            onDismiss={() => {
              setHasDismissedQuickStart(true);
              try {
                localStorage.setItem('paio_dismissed_quick_start', 'true');
              } catch {}
            }}
          />
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
        onOpenAppHub={() => setIsAppHubOpen(true)}
        onOpenSpotify={() => setIsSpotifyOpen(true)}
        onOpenGoogleWorkspace={() => setIsGoogleWorkspaceOpen(true)}
        onOpenVideoCall={() => startCall({ contactName: 'Live Video Meet', contactAvatar: '', type: 'video' })}
        onToggleVoiceListener={() => setIsVoiceListening((prev) => !prev)}
        onOpenRoastHype={() => setIsRoastHypeOpen(true)}
        onOpenDecisionWheel={() => setIsDecisionWheelOpen(true)}
        onOpenSoundscape={() => setIsSoundscapeOpen(true)}
        onOpenEmergencyFocus={() => setIsEmergencyFocusOpen(true)}
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

      {/* Real-time Offline Connectivity Banner */}
      <OfflineIndicator />

      {/* WebRTC Video Call Interface (Full Modal & Draggable Floating Picture-in-Picture) */}
      <VideoCallInterface />

      {/* Global Voice Command Listener using Web Speech API */}
      <VoiceCommandListener
        isListening={isVoiceListening}
        onToggleListening={setIsVoiceListening}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenNewTask={(_prefillTitle) => {
          setIsTaskEditorOpen(true);
        }}
        onOpenNewNote={() => setIsNoteEditorOpen(true)}
        onOpenNewEvent={() => setIsEventEditorOpen(true)}
        onOpenSpotify={() => setIsSpotifyOpen(true)}
        onOpenGoogleWorkspace={() => setIsGoogleWorkspaceOpen(true)}
        onOpenVideoCall={() => startCall({ contactName: 'Voice Live Meet', contactAvatar: '', type: 'video' })}
        onOpenAppHub={() => setIsAppHubOpen(true)}
      />

      {/* Universal OS App Hub (Home for all apps: ChatGPT, Spotify, Google Workspace, Video Call, Canva, GitHub) */}
      <OSAppHubModal
        isOpen={isAppHubOpen}
        onClose={() => setIsAppHubOpen(false)}
        onOpenChatGPT={() => {
          setAssistantNewChatTrigger((prev) => prev + 1);
          setActiveTab('assistant');
        }}
        onOpenSpotify={() => setIsSpotifyOpen(true)}
        onOpenGoogleWorkspace={() => setIsGoogleWorkspaceOpen(true)}
        onOpenVideoCall={() => startCall({ contactName: 'Live Video Meet', contactAvatar: '', type: 'video' })}
      />

      {/* Persistent / Dockable Spotify Focus Music Player */}
      <SpotifyOSPlayer
        isOpen={isSpotifyOpen}
        onClose={() => setIsSpotifyOpen(false)}
      />

      {/* Google Workspace Hub (Gmail, Drive, Calendar, Meet) */}
      <GoogleWorkspaceModal
        isOpen={isGoogleWorkspaceOpen}
        onClose={() => setIsGoogleWorkspaceOpen(false)}
        tasks={tasks}
        notes={notes}
        events={events}
      />

      {/* Global Floating AI Assistant Widget (ChatGPT & Gemini) */}
      <FloatingAssistantWidget
        tasks={tasks}
        notes={notes}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
      />

      {/* Floating Multi-Window Desktop Canvas */}
      <OSWindowManagerCanvas
        tasks={tasks}
        notes={notes}
        habits={habits}
        transactions={transactions}
        onToggleTaskStatus={handleToggleTaskStatus}
        onToggleHabit={handleToggleHabit}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
      />

      {/* Persistent Bottom OS Taskbar & Running Windows Dock */}
      <OSTaskbar
        onOpenAppHub={() => setIsAppHubOpen(true)}
        onOpenSpotify={() => setIsSpotifyOpen(true)}
        onOpenAssistant={() => {
          openWindow({
            id: 'os_assistant',
            title: '✦ Floating OS AI Assistant',
            icon: '✦',
            component: 'assistant',
            defaultSize: { width: 440, height: 520 },
          });
        }}
        onOpenVoiceRoom={() => {
          openWindow({
            id: 'voice_stage',
            title: '🎙️ Lounge Voice Room: Live Audio Stage',
            icon: '🎙️',
            component: 'voice_room',
            defaultSize: { width: 560, height: 500 },
          });
        }}
        onOpenDirectChat={() => {
          setActiveTab('community');
        }}
        onOpenScratchpad={() => {
          openWindow({
            id: 'os_scratchpad',
            title: '📝 Quick OS Scratchpad',
            icon: '📝',
            component: 'scratchpad',
            defaultSize: { width: 420, height: 380 },
          });
        }}
        onOpenFiles={() => {
          openWindow({
            id: 'os_files',
            title: '📁 Cloud Vault & Quick Upload',
            icon: '📁',
            component: 'files',
            defaultSize: { width: 480, height: 420 },
          });
        }}
        onOpenTasks={() => {
          openWindow({
            id: 'os_tasks',
            title: '✅ Quick Tasks & Checklist',
            icon: '✅',
            component: 'tasks',
            defaultSize: { width: 440, height: 460 },
          });
        }}
        onOpenHabits={() => {
          openWindow({
            id: 'os_habits',
            title: '🔥 Today\'s Habits & Streaks',
            icon: '🔥',
            component: 'habits',
            defaultSize: { width: 440, height: 480 },
          });
        }}
        onOpenFinance={() => {
          openWindow({
            id: 'os_finance',
            title: '💵 Personal Finance & Cash Flow',
            icon: '💵',
            component: 'finance',
            defaultSize: { width: 460, height: 480 },
          });
        }}
        onOpenDailyBriefing={() => setIsDailyBriefingOpen(true)}
        onOpenRoastHype={() => setIsRoastHypeOpen(true)}
        onOpenDecisionWheel={() => setIsDecisionWheelOpen(true)}
        onOpenSoundscape={() => setIsSoundscapeOpen(true)}
      />

      {/* Autonomous Morning & Evening AI Executive Briefing */}
      <DailyBriefingModal
        isOpen={isDailyBriefingOpen}
        onClose={() => setIsDailyBriefingOpen(false)}
        tasks={tasks}
        events={events}
        habits={habits}
        transactions={transactions}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
      />

      {/* Premium & Pro Tier Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onShowToast={(msg) => logWorkspaceActivity('upgraded', 'membership', msg)}
      />

      {/* Next-Gen Humorous AI Motivation & Procrastination Roast Coach */}
      <AIRoastHypeModal
        isOpen={isRoastHypeOpen}
        onClose={() => setIsRoastHypeOpen(false)}
        tasks={tasks}
        habits={habits}
        transactions={transactions}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
      />

      {/* Next-Gen Decision Wheel of Destiny & Quantum Coin Flip */}
      <DecisionWheelModal
        isOpen={isDecisionWheelOpen}
        onClose={() => setIsDecisionWheelOpen(false)}
        tasks={tasks}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
      />

      {/* Next-Gen Spatial Audio Focus Station */}
      <AmbientSoundscapeStation
        isOpen={isSoundscapeOpen}
        onClose={() => setIsSoundscapeOpen(false)}
      />

      {/* Next-Gen Emergency Single-Task Lockdown Protocol */}
      <EmergencyFocusMode
        isOpen={isEmergencyFocusOpen}
        onClose={() => setIsEmergencyFocusOpen(false)}
        tasks={tasks}
        onCompleteTask={handleToggleTaskStatus}
      />
    </motion.div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VideoCallProvider>
        <WindowManagerProvider>
          <motion.div
            id="main-app-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="min-h-screen w-full"
          >
            <WorkspaceApp />
          </motion.div>
        </WindowManagerProvider>
      </VideoCallProvider>
    </AuthProvider>
  );
}
