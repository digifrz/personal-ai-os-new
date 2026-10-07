import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  LayoutDashboard,
  CheckSquare,
  FileText,
  FolderKanban,
  Calendar,
  GraduationCap,
  Target,
  Users,
  Search,
  Lock,
  EyeOff,
  Server,
  FileCode,
  HeartHandshake,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Zap,
  Compass,
  Check,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Radio,
  HardDrive,
} from 'lucide-react';

interface AboutAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: any) => void;
  onOpenTour?: () => void;
}

type TabType = 'tour' | 'overview' | 'features' | 'privacy' | 'community' | 'terms';

interface TourStep {
  title: string;
  badge: string;
  desc: string;
  keyPoints: string[];
  icon: any;
  accent: string;
  targetTab?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: '1. Command Cockpit & Quick Actions',
    badge: 'Dashboard',
    desc: 'The centralized hub of your Personal AI OS. View today’s focus agenda, priority tasks, quick capture widgets, and active projects in a clean, glanceable interface.',
    keyPoints: [
      'Interactive widgets for tasks, notes, calendar, and learning streak',
      'Instant capture (⌘K) to search anything or create items without leaving your flow',
      'Dynamic light, dark, and OLED black theme support',
    ],
    icon: LayoutDashboard,
    accent: 'from-violet-500 to-indigo-600',
    targetTab: 'dashboard',
  },
  {
    title: '2. Grounded AI Copilot & Memory',
    badge: 'Gemini Engine',
    desc: 'Powered by Gemini models with server-side proxy resilience. It reads your real tasks, notes, calendar schedules, and AI memories to provide factual answers.',
    keyPoints: [
      'Workspace context-aware: asks and answers about your real schedule and files',
      'Persistent AI memory layer with full user visibility and toggle controls',
      'Zero telemetry: your private documents are never used for general public training',
    ],
    icon: Sparkles,
    accent: 'from-indigo-500 to-cyan-500',
    targetTab: 'assistant',
  },
  {
    title: '3. The Lounge & 24h Stories',
    badge: 'Social & Messaging',
    desc: 'A vibrant collaborative space in The Lounge. Share insights, publish 24-hour stories, join discussion rooms, and direct message fellow builders.',
    keyPoints: [
      '24-Hour Stories rail with instant preview and multi-session caching',
      'Lounge tabs: Feed, Explore grid, Post Creator, Direct Inbox, and Profile',
      'Real-time encrypted Direct Lounge Messages with double checkmarks & voice notes',
    ],
    icon: Radio,
    accent: 'from-purple-600 via-indigo-600 to-cyan-500',
    targetTab: 'community',
  },
  {
    title: '4. Cloud Vault & Storage Quotas',
    badge: 'Storage & Drive',
    desc: 'Every user is allocated 500 MB of cloud vault space. Upload documents, photos, audio, code files, and manage your storage with transparent MB counters.',
    keyPoints: [
      'Real-time quota monitoring showing exact MB used, remaining MB, and limits',
      'One-click storage cleanup tools, cache purging, and full data export',
      'Integrated with Google Drive and Workspace single sign-on anchor',
    ],
    icon: HardDrive,
    accent: 'from-blue-500 to-cyan-600',
    targetTab: 'files',
  },
  {
    title: '5. Add-ons & Google Integrations Hub',
    badge: 'Settings & Ecosystem',
    desc: 'Supercharge your OS by integrating Google Gmail, Google Drive, Gemini, ChatGPT, Canva, and Spotify under your authenticated Google account.',
    keyPoints: [
      'Single Sign-On anchor linking all workspace tools seamlessly',
      'Community profile directly accessible in Settings with instant editing',
      'Toggle integrations on/off with connection diagnostics and live sync status',
    ],
    icon: Layers,
    accent: 'from-emerald-500 to-teal-600',
    targetTab: 'settings',
  },
];

export const AboutAppModal: React.FC<AboutAppModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenTour,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('tour');
  const [currentTourIndex, setCurrentTourIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedClause, setCopiedClause] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem('has_seen_app_guide_v1', 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClause(id);
    setTimeout(() => setCopiedClause(null), 2000);
  };

  const featureList = [
    {
      icon: LayoutDashboard,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      title: 'Command Dashboard',
      tab: 'dashboard',
      description:
        'A high-level cockpit summarizing your daily focus, open tasks, upcoming calendar events, learning streak, and quick capture widgets.',
    },
    {
      icon: Sparkles,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      title: 'Workspace-Aware AI Copilot',
      tab: 'assistant',
      description:
        'Powered by Google Gemini models with fallback resilience. It contextually understands your real tasks, notes, and calendar events to deliver grounded answers.',
    },
    {
      icon: CheckSquare,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      title: 'Tasks & Kanban Boards',
      tab: 'tasks',
      description:
        'Full task management with Kanban columns, priority tags, subtask checklists, and one-click AI subtask breakdowns.',
    },
    {
      icon: FileText,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      title: 'Notes & Knowledge Base',
      tab: 'notes',
      description:
        'Rich markdown notes with pinned docs, categories, and instant AI executive summaries and action-item extraction.',
    },
    {
      icon: FolderKanban,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      title: 'Files & Asset Drive (500MB Quota)',
      tab: 'files',
      description:
        'Store, tag, search, and preview documents and images with local and cloud-backed persistence and detailed MB quota tracking.',
    },
    {
      icon: Calendar,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
      title: 'Calendar & Time Blocking',
      tab: 'calendar',
      description:
        'Interactive timeline, schedule appointments, set reminders, and generate AI-optimized daily agendas.',
    },
    {
      icon: GraduationCap,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      title: 'Learning Academy & Flashcards',
      tab: 'learning',
      description:
        'Master any concept with spaced repetition flashcards. Use AI to generate 3 high-yield cards from any topic in seconds.',
    },
    {
      icon: Target,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      title: 'Goals & Milestones (OKRs)',
      tab: 'goals',
      description:
        'Track strategic milestones with visual progress bars, target completion dates, and project alignments.',
    },
    {
      icon: Users,
      color: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20',
      title: 'The Lounge (Community & Stories)',
      tab: 'community',
      description:
        'The Lounge public square with 24-hour Stories, direct messaging, and interactive builder discussion rooms.',
    },
    {
      icon: Search,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      title: 'Global Search & Command Bar (⌘K)',
      tab: 'search',
      description:
        'Instant fuzzy search indexing tasks, notes, files, calendar entries, and community discussions in a single keystroke.',
    },
  ];

  const currentTour = TOUR_STEPS[currentTourIndex];

  return (
    <div
      id="about-app-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleDismiss}
    >
      <div
        id="about-app-modal-container"
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-surface-elevated)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 px-6 py-4 bg-[var(--color-surface)]/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--color-text)]">
                  Personal AI OS
                </h2>
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/40">
                  Interactive Guide &amp; Policies
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Structured system tour, architectural constitution, safety rules &amp; add-on policies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="about-app-modal-close-btn"
              onClick={handleDismiss}
              className="rounded-xl p-2 text-[var(--color-muted)] hover:bg-white/10 hover:text-[var(--color-text)] transition-colors"
              aria-label="Close guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center border-b border-[var(--color-border)]/60 px-6 bg-[var(--color-surface)]/40 overflow-x-auto gap-2 scrollbar-none">
          {[
            { id: 'tour', label: 'Interactive Tour', icon: Compass, badge: '5 Steps' },
            { id: 'overview', label: 'Architecture', icon: BookOpen },
            { id: 'features', label: 'Feature Directory', icon: Zap },
            { id: 'privacy', label: 'Privacy & Storage', icon: ShieldCheck },
            { id: 'community', label: 'Lounge Rules', icon: HeartHandshake },
            { id: 'terms', label: 'Terms & Quotas', icon: FileCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`about-tab-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-[var(--color-primary)] text-[var(--color-text)]'
                    : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--color-primary)]' : ''}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-white/5 text-[var(--color-muted)]'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-sm text-[var(--color-text)] leading-relaxed">
          {/* TAB: INTERACTIVE TOUR */}
          {activeTab === 'tour' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Progress step dots */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-primary)]">
                    Step {currentTourIndex + 1} of {TOUR_STEPS.length}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">•</span>
                  <span className="rounded-full bg-[var(--color-primary)]/15 px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-primary)]">
                    {currentTour.badge}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {TOUR_STEPS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentTourIndex(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === currentTourIndex ? 'w-8 bg-[var(--color-primary)]' : 'w-2 bg-[var(--color-border)] hover:bg-white/40'
                      }`}
                      aria-label={`Jump to step ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Main Step Feature Card */}
              <div className="relative rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface-elevated)] to-[var(--color-surface)] p-6 sm:p-8 shadow-xl space-y-5 overflow-hidden">
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${currentTour.accent} text-white shadow-lg`}>
                    <currentTour.icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-[var(--color-text)] tracking-tight">
                      {currentTour.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
                      {currentTour.desc}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                    Key Highlights &amp; Capabilities:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {currentTour.keyPoints.map((point, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-bg-secondary)]/50 p-3 text-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[var(--color-text)] font-medium leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--color-border)]/70">
                  <div className="flex items-center gap-2">
                    {currentTour.targetTab && onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => {
                          handleDismiss();
                          onNavigateTab(currentTour.targetTab);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all"
                      >
                        <span>Open {currentTour.badge} View</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentTourIndex === 0}
                      onClick={() => setCurrentTourIndex((p) => p - 1)}
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    {currentTourIndex < TOUR_STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentTourIndex((p) => p + 1)}
                        className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-md"
                      >
                        <span>Next Step</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDismiss}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Ready to Build</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-violet-950/20 to-transparent p-6 space-y-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                  <Zap className="w-4 h-4" />
                  Architectural Foundation
                </span>
                <h3 className="text-xl font-extrabold text-[var(--color-text)]">
                  A Modern Digital Operating System
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
                  Personal AI OS replaces fragmented productivity tools (spreadsheets, reminder apps, cloud notebooks, disjointed messaging clients) with a unified, cohesive workspace. Everything is persistent, offline-resilient, and authenticated through your verified Google Account.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 space-y-2">
                  <h4 className="text-xs font-bold text-[var(--color-text)] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Cloud Persistence</span>
                  </h4>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                    Powered by Firebase Firestore and Firebase Auth with strict owner-scoped security rules. Your tasks, notes, calendar events, flashcards, and uploaded files are synced live across your devices.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 space-y-2">
                  <h4 className="text-xs font-bold text-[var(--color-text)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--color-ai)]" />
                    <span>Server-Side Gemini 2.5 Intelligence</span>
                  </h4>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                    Zero client-side API key leakage. All AI interactions pass through our secure backend proxy route (<code className="text-[11px] text-[var(--color-cyan)]">/api/ai</code>) with contextual grounding across your active workspace documents.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FEATURES DIRECTORY */}
          {activeTab === 'features' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-[var(--color-text)]">
                    Workspace Module Directory
                  </h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    Explore all 10 unified modules built directly into your OS
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[var(--color-muted)] shrink-0" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search features…"
                    className="w-full bg-transparent outline-none text-xs text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featureList
                  .filter((f) => !searchQuery || f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((feat) => {
                    const Icon = feat.icon;
                    return (
                      <div
                        key={feat.tab}
                        className="group flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-4 hover:border-[var(--color-primary)] transition-all space-y-2.5"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${feat.color}`}>
                              <Icon className="w-4 h-4" />
                            </span>
                            <strong className="text-xs font-bold text-[var(--color-text)]">
                              {feat.title}
                            </strong>
                          </div>
                          <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                            {feat.description}
                          </p>
                        </div>

                        {onNavigateTab && (
                          <button
                            type="button"
                            onClick={() => {
                              handleDismiss();
                              onNavigateTab(feat.tab);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-primary)] hover:underline pt-1"
                          >
                            <span>Open Module</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB: PRIVACY & STORAGE */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1.5">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Privacy &amp; Cloud Data Storage</span>
                </h4>
                <p className="text-[var(--color-muted)] leading-relaxed">
                  You own 100% of your data. We never sell, monetize, or harvest user data, nor do we run background telemetry or tracking pixels.
                </p>
              </div>

              <div className="space-y-3 text-[var(--color-muted)]">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-[var(--color-text)] font-bold text-xs flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-cyan-400" />
                      <span>500 MB Personal Cloud Quota Policy</span>
                    </strong>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('500MB_QUOTA', 'quota')}
                      className="text-[10px] font-bold text-[var(--color-primary)] hover:underline"
                    >
                      {copiedClause === 'quota' ? 'Copied clause!' : 'Copy clause'}
                    </button>
                  </div>
                  <p className="leading-relaxed">
                    Every active account receives 500.00 MB of Cloud Drive storage. This covers documents, PDF research papers, code repositories, audio notes, and media uploads. You can inspect exact MB consumption breakdown at any time inside Settings &gt; Storage.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 space-y-2">
                  <strong className="text-[var(--color-text)] font-bold text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Granular Firestore Access Control (RBAC)</span>
                  </strong>
                  <p className="leading-relaxed">
                    All private collections (<code className="text-[10px] bg-white/10 px-1 py-0.5 rounded">/tasks</code>, <code className="text-[10px] bg-white/10 px-1 py-0.5 rounded">/notes</code>, <code className="text-[10px] bg-white/10 px-1 py-0.5 rounded">/files</code>, <code className="text-[10px] bg-white/10 px-1 py-0.5 rounded">/calendar_events</code>) require <code className="text-[10px] bg-white/10 px-1 py-0.5 rounded">request.auth.uid == resource.data.userId</code>. No other user or guest can query or access your private vault.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LOUNGE RULES */}
          {activeTab === 'community' && (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs">
              <div>
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  The Lounge Safety &amp; Community Rules
                </h3>
                <p className="text-[var(--color-muted)]">
                  Rules for respectful communication across public posts, 24-hour stories, and direct messages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: '1. Respect & Constructive Tone', desc: 'No harassment, hate speech, humiliation, or persistent insults. Critique ideas, not people.' },
                  { title: '2. Safe 24-Hour Stories', desc: 'Stories expire after 24 hours. Keep media respectful and free of sexually explicit or harmful material.' },
                  { title: '3. No Spam or False Engagement', desc: 'No repetitive affiliate links, unsolicited advertisements, or artificial upvote manipulation.' },
                  { title: '4. Instant Block & Report', desc: 'Block abusive accounts anytime via post options (···). Blocked users are immediately wiped from your feed.' },
                ].map((rule, idx) => (
                  <div key={idx} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 space-y-1">
                    <strong className="text-xs font-bold text-[var(--color-text)] block">{rule.title}</strong>
                    <p className="text-[var(--color-muted)] leading-relaxed">{rule.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TERMS */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs">
              <h3 className="text-base font-bold text-[var(--color-text)]">
                Terms of Use, Intellectual Property &amp; Add-ons
              </h3>

              <div className="space-y-3 text-[var(--color-muted)]">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 space-y-1">
                  <strong className="text-xs font-bold text-[var(--color-text)] block">1. 100% User Intellectual Ownership</strong>
                  <p className="leading-relaxed">
                    All intellectual property authored or uploaded by you remains your exclusive property. Personal AI OS claims zero rights, licenses, or ownership over your creative works, code, or documents.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 space-y-1">
                  <strong className="text-xs font-bold text-[var(--color-text)] block">2. Third-Party Add-ons Integration</strong>
                  <p className="leading-relaxed">
                    Integrations with Gmail, Google Drive, Gemini, ChatGPT, Canva, and Spotify execute under your explicit consent anchored to your signed-in Google account. Tokens are handled client-side and never stored on third-party telemetry servers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between border-t border-[var(--color-border)]/70 px-6 py-4 bg-[var(--color-surface)]/70 backdrop-blur-sm gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Telemetry &amp; Privacy Verified</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="about-app-modal-done-btn"
              onClick={handleDismiss}
              className="rounded-xl bg-[var(--color-primary)] px-6 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-md"
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
