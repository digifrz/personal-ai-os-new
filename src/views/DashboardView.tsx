import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  FileText,
  FolderKanban,
  Calendar,
  Sparkles,
  BarChart3,
  Target,
  Flame,
  Star,
  Clock,
  ArrowRight,
  Plus,
  Settings2,
  CloudSun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  TaskItem,
  NoteItem,
  FileItem,
  CalendarEventItem,
  GoalItem,
  ViewTab,
} from '../types';

interface DashboardViewProps {
  tasks: TaskItem[];
  notes: NoteItem[];
  files: FileItem[];
  events: CalendarEventItem[];
  goals: GoalItem[];
  setActiveTab: (tab: ViewTab) => void;
  onOpenNewTask: () => void;
  onOpenNewNote: () => void;
  onOpenNewEvent: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  notes,
  files,
  events,
  goals,
  setActiveTab,
  onOpenNewTask,
  onOpenNewNote,
  onOpenNewEvent,
}) => {
  const { profile, user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    'tasks',
    'notes',
    'weather',
    'clock',
    'calendar',
    'files',
    'ai',
    'goals',
  ]);
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [showWidgetModal, setShowWidgetModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = profile?.name || user?.email?.split('@')[0] || 'Friend';

  const openTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'trashed');
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const productivityScore = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const activeGoals = goals.filter((g) => g.status === 'active');
  const upcomingEvents = events
    .filter((e) => new Date(e.startsAt).getTime() >= currentTime.getTime())
    .slice(0, 3);
  const favoriteNotes = notes.filter((n) => n.isPinned && !n.isTrashed);

  const toggleWidgetVisibility = (id: string) => {
    setHiddenWidgets((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner / Customizer Bar */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
            {greeting}, {displayName} 👋
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
            Here's what needs your attention.
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right sm:border-l sm:border-[var(--color-border)] sm:pl-5">
            <span className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider block">
              Today
            </span>
            <strong className="text-sm font-bold text-[var(--color-text)] block">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </strong>
            <small className="text-xs font-semibold text-[var(--color-cyan)] block">
              {currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
            </small>
          </div>
          <button
            type="button"
            onClick={() => setShowWidgetModal(true)}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs font-bold text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-all shrink-0"
          >
            <Settings2 className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="hidden sm:inline">Customize widgets</span>
          </button>
        </div>
      </section>

      {/* Widgets Area */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-muted)]">
            Workspace Widgets
          </h2>
          <span className="text-xs text-[var(--color-muted)]">Live Overview</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {widgetOrder
            .filter((id) => !hiddenWidgets.includes(id))
            .map((widgetId) => {
              if (widgetId === 'tasks') {
                return (
                  <div
                    key="tasks"
                    onClick={() => setActiveTab('tasks')}
                    className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm hover:border-[var(--color-primary)] hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Tasks</span>
                      <CheckSquare className="w-4 h-4 text-[#34D399]" />
                    </div>
                    <strong className="mt-3 block text-2xl font-bold text-[var(--color-text)]">
                      {openTasks.length} <span className="text-xs font-normal text-[var(--color-muted)]">open</span>
                    </strong>
                    <p className="mt-1 text-[11px] text-[var(--color-muted)] truncate">
                      {openTasks[0]?.title || 'All caught up!'}
                    </p>
                  </div>
                );
              }
              if (widgetId === 'notes') {
                return (
                  <div
                    key="notes"
                    onClick={() => setActiveTab('notes')}
                    className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm hover:border-[var(--color-primary)] hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Notes</span>
                      <FileText className="w-4 h-4 text-[#F59E0B]" />
                    </div>
                    <strong className="mt-3 block text-2xl font-bold text-[var(--color-text)]">
                      {notes.length} <span className="text-xs font-normal text-[var(--color-muted)]">total</span>
                    </strong>
                    <p className="mt-1 text-[11px] text-[var(--color-muted)] truncate">
                      {notes[0]?.title || 'No notes created'}
                    </p>
                  </div>
                );
              }
              if (widgetId === 'weather') {
                return (
                  <div
                    key="weather"
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Weather</span>
                      <CloudSun className="w-4 h-4 text-[#FB923C]" />
                    </div>
                    <strong className="mt-3 block text-2xl font-bold text-[var(--color-text)]">
                      24°C
                    </strong>
                    <p className="mt-1 text-[11px] text-[var(--color-muted)] truncate">
                      Clear sky · Calm afternoon
                    </p>
                  </div>
                );
              }
              if (widgetId === 'clock') {
                return (
                  <div
                    key="clock"
                    onClick={() => setActiveTab('calendar')}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm cursor-pointer hover:border-[var(--color-cyan)] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Clock</span>
                      <Clock className="w-4 h-4 text-[#22D3EE]" />
                    </div>
                    <strong className="mt-3 block text-2xl font-bold text-[var(--color-cyan)]">
                      {currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </strong>
                    <p className="mt-1 text-[11px] text-[var(--color-muted)] truncate">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </p>
                  </div>
                );
              }
              if (widgetId === 'calendar') {
                return (
                  <div
                    key="calendar"
                    onClick={() => setActiveTab('calendar')}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm hover:border-[var(--color-primary)] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Events</span>
                      <Calendar className="w-4 h-4 text-[#F472B6]" />
                    </div>
                    <strong className="mt-3 block text-2xl font-bold text-[var(--color-text)]">
                      {upcomingEvents.length}
                    </strong>
                    <p className="mt-1 text-[11px] text-[var(--color-muted)] truncate">
                      {upcomingEvents[0]?.title || 'No upcoming meetings'}
                    </p>
                  </div>
                );
              }
              if (widgetId === 'files') {
                return (
                  <div
                    key="files"
                    onClick={() => setActiveTab('files')}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm hover:border-[var(--color-primary)] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Cloud Files</span>
                      <FolderKanban className="w-4 h-4 text-[#60A5FA]" />
                    </div>
                    <strong className="mt-3 block text-2xl font-bold text-[var(--color-text)]">
                      {files.length}
                    </strong>
                    <p className="mt-1 text-[11px] text-[var(--color-muted)] truncate">
                      {files[0]?.name || 'Storage ready'}
                    </p>
                  </div>
                );
              }
              if (widgetId === 'ai') {
                return (
                  <div
                    key="ai"
                    onClick={() => setActiveTab('assistant')}
                    className="rounded-2xl border border-[var(--color-ai)]/40 bg-[var(--color-ai-soft)]/30 p-4 shadow-sm hover:border-[var(--color-ai)] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-ai)] uppercase">AI Assistant</span>
                      <Sparkles className="w-4 h-4 text-[var(--color-ai)]" />
                    </div>
                    <strong className="mt-3 block text-lg font-bold text-[var(--color-text)]">
                      Ask anything
                    </strong>
                    <p className="mt-1 text-[11px] text-[var(--color-muted)] truncate">
                      Full workspace context
                    </p>
                  </div>
                );
              }
              if (widgetId === 'goals') {
                return (
                  <div
                    key="goals"
                    onClick={() => setActiveTab('goals')}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm hover:border-[var(--color-primary)] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Active Goals</span>
                      <Target className="w-4 h-4 text-[#FBBF24]" />
                    </div>
                    <strong className="mt-3 block text-2xl font-bold text-[var(--color-text)]">
                      {activeGoals.length}
                    </strong>
                    <p className="mt-1 text-[11px] text-[var(--color-muted)] truncate">
                      {activeGoals[0]?.title || 'Set a new objective'}
                    </p>
                  </div>
                );
              }
              return null;
            })}
        </div>
      </section>

      {/* AI Daily Brain Section */}
      <section className="rounded-3xl border border-[var(--color-ai)]/40 bg-[color-mix(in_srgb,var(--color-ai-soft)_55%,var(--color-surface))] p-6 sm:p-7 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-ai)]">
              ✦ AI Daily Brain
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--color-text)]">
              A calmer, synchronized plan for today.
            </h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Reading your real-time workspace signals and prioritizing your next best actions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('assistant')}
            className="self-start sm:self-center flex items-center gap-1.5 text-xs font-bold text-[var(--color-ai)] hover:underline shrink-0"
          >
            <span>Ask AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          <div
            onClick={() => setActiveTab('tasks')}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface)]/70 p-3.5 cursor-pointer hover:border-[var(--color-primary)] transition-all"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block text-xs font-bold text-[var(--color-text)] truncate">
                {openTasks.length > 0 ? `${openTasks.length} tasks needing attention` : 'Workspace all clear'}
              </strong>
              <small className="block text-[11px] text-[var(--color-muted)] truncate">
                {openTasks[0]?.title || 'Add a priority to move forward'}
              </small>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('calendar')}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface)]/70 p-3.5 cursor-pointer hover:border-[var(--color-primary)] transition-all"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-500/15 text-pink-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block text-xs font-bold text-[var(--color-text)] truncate">
                {upcomingEvents.length > 0 ? upcomingEvents[0].title : 'Protect deep work time'}
              </strong>
              <small className="block text-[11px] text-[var(--color-muted)] truncate">
                {upcomingEvents[0]
                  ? new Date(upcomingEvents[0].startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                  : 'Schedule an uninterrupted focus block'}
              </small>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('learning')}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface)]/70 p-3.5 cursor-pointer hover:border-[var(--color-primary)] transition-all"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block text-xs font-bold text-[var(--color-text)] truncate">
                Keep learning momentum
              </strong>
              <small className="block text-[11px] text-[var(--color-muted)] truncate">
                Active recall & flashcard session
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* Core Grid: Task & Note & File Overview */}
      <section className="grid sm:grid-cols-3 gap-5">
        <div
          onClick={() => setActiveTab('tasks')}
          className="group rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm hover:border-[var(--color-primary)] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between min-h-[220px]"
        >
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-bg-secondary)] text-[#34D399]">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="mt-5 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Tasks
            </span>
            <strong className="mt-2 block text-2xl font-bold text-[var(--color-text)]">
              {openTasks.length} open · {doneTasks.length} done
            </strong>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {openTasks.length > 0 ? `${openTasks.length} priorities pending` : 'All tasks completed!'}
            </p>
          </div>
          <div className="mt-5 flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] group-hover:underline">
            <span>Open tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('notes')}
          className="group rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm hover:border-[var(--color-primary)] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between min-h-[220px]"
        >
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-bg-secondary)] text-[#F59E0B]">
              <FileText className="w-5 h-5" />
            </div>
            <span className="mt-5 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Notes
            </span>
            <strong className="mt-2 block text-2xl font-bold text-[var(--color-text)]">
              {notes.length} total
            </strong>
            <p className="mt-1 text-xs text-[var(--color-muted)] truncate">
              {notes[0]?.title || 'No notes in workspace yet'}
            </p>
          </div>
          <div className="mt-5 flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] group-hover:underline">
            <span>Browse notes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('files')}
          className="group rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm hover:border-[var(--color-primary)] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between min-h-[220px]"
        >
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-bg-secondary)] text-[#60A5FA]">
              <FolderKanban className="w-5 h-5" />
            </div>
            <span className="mt-5 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Cloud Storage
            </span>
            <strong className="mt-2 block text-2xl font-bold text-[var(--color-text)]">
              {files.length} files stored
            </strong>
            <p className="mt-1 text-xs text-[var(--color-muted)] truncate">
              {files[0]?.name || 'Direct Firebase Storage integration'}
            </p>
          </div>
          <div className="mt-5 flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] group-hover:underline">
            <span>View files</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </section>

      {/* Daily productivity & Streaks & Goals */}
      <section className="grid lg:grid-cols-3 gap-5">
        {/* Productivity card */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Your Rhythm
              </span>
              <BarChart3 className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-[var(--color-text)]">
              Daily productivity
            </h3>
            <p className="mt-3 text-4xl font-extrabold text-[var(--color-text)]">
              {productivityScore}
              <span className="text-sm font-normal text-[var(--color-muted)]"> / 100</span>
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-[var(--color-muted)] mb-1.5">
                <span>Completed: {doneTasks.length}</span>
                <span>Total: {tasks.length}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-cyan)] transition-all duration-500"
                  style={{ width: `${productivityScore}%` }}
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className="mt-6 flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline"
          >
            <span>View analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Streaks */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-gold)]">
                Stay in motion
              </span>
              <Flame className="w-4 h-4 text-[var(--color-gold)]" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-[var(--color-text)]">
              Active Streaks
            </h3>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                <strong className="block text-3xl font-extrabold text-[var(--color-text)]">
                  12
                </strong>
                <span className="mt-1 block text-xs text-[var(--color-muted)]">
                  Day productivity streak
                </span>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                <strong className="block text-3xl font-extrabold text-[var(--color-cyan)]">
                  5
                </strong>
                <span className="mt-1 block text-xs text-[var(--color-muted)]">
                  Day learning streak
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className="mt-6 flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline"
          >
            <span>View activity history</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Today's Goals */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-gold)]">
                Plan your day
              </span>
              <Target className="w-4 h-4 text-[var(--color-gold)]" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-[var(--color-text)]">
              Today's Goals
            </h3>
            <div className="mt-4 space-y-2.5">
              {activeGoals.slice(0, 3).map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => setActiveTab('goals')}
                  className="flex items-center gap-2.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] cursor-pointer"
                >
                  <span className="text-[var(--color-gold)]">◎</span>
                  <span className="truncate">{goal.title}</span>
                  <span className="ml-auto text-[10px] text-[var(--color-muted)]">
                    {goal.progress}%
                  </span>
                </div>
              ))}
              {activeGoals.length === 0 && (
                <p className="text-xs text-[var(--color-muted)] py-2">
                  No active goals set. Start by defining an objective.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className="mt-6 flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline"
          >
            <span>Open goals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Connected OS Map */}
      <section className="rounded-3xl border border-[var(--color-ai)]/30 bg-[color-mix(in_srgb,var(--color-ai-soft)_25%,var(--color-surface))] p-6 sm:p-7 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
              The Bigger Picture
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--color-text)]">
              Your workspace, connected to your AI brain.
            </h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Everything you capture becomes context for better search, memory, tools, and real-time execution.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('assistant')}
            className="self-start sm:self-center flex items-center gap-1 text-xs font-bold text-[var(--color-ai)] hover:underline"
          >
            <span>Open AI Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
            <span className="text-xl">▦</span>
            <p className="mt-2 text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-muted)]">
              Workspace
            </p>
            <strong className="mt-1 block text-sm font-bold text-[var(--color-text)]">
              Capture &amp; Organize
            </strong>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[var(--color-muted)]">
                ▤ Notes
              </span>
              <span className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[var(--color-muted)]">
                ✓ Tasks
              </span>
              <span className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[var(--color-muted)]">
                ▰ Files
              </span>
              <span className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[var(--color-muted)]">
                ◷ Calendar
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-ai)]/40 bg-[var(--color-ai-soft)]/20 p-4">
            <span className="text-xl text-[var(--color-ai)]">✦</span>
            <p className="mt-2 text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-ai)]">
              AI Brain
            </p>
            <strong className="mt-1 block text-sm font-bold text-[var(--color-text)]">
              Understand Your Context
            </strong>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-lg border border-[var(--color-ai)]/30 px-2 py-1 text-[var(--color-ai)]">
                ⌕ Search
              </span>
              <span className="rounded-lg border border-[var(--color-ai)]/30 px-2 py-1 text-[var(--color-ai)]">
                🧠 Memory
              </span>
              <span className="rounded-lg border border-[var(--color-ai)]/30 px-2 py-1 text-[var(--color-ai)]">
                🎓 Learning
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-cyan)]/40 bg-[var(--color-bg-secondary)]/70 p-4">
            <span className="text-xl text-[var(--color-cyan)]">↗</span>
            <p className="mt-2 text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-cyan)]">
              Agent
            </p>
            <strong className="mt-1 block text-sm font-bold text-[var(--color-text)]">
              Move Work Forward
            </strong>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-lg border border-[var(--color-cyan)]/30 px-2 py-1 text-[var(--color-cyan)]">
                Automate
              </span>
              <span className="rounded-lg border border-[var(--color-cyan)]/30 px-2 py-1 text-[var(--color-cyan)]">
                Execute
              </span>
              <span className="rounded-lg border border-[var(--color-cyan)]/30 px-2 py-1 text-[var(--color-cyan)]">
                Reflect
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Footer */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
            Make it happen
          </span>
          <h3 className="mt-0.5 text-base font-bold text-[var(--color-text)]">
            Quick Actions
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenNewNote}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs font-bold text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-all"
          >
            <span>▤</span>
            <span>New note</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewTask}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs font-bold text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-all"
          >
            <span>✓</span>
            <span>New task</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs font-bold text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-all"
          >
            <span>▰</span>
            <span>Upload file</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewEvent}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs font-bold text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-all"
          >
            <span>◷</span>
            <span>Add event</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assistant')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-ai)]/50 bg-[var(--color-ai-soft)] px-3.5 py-2 text-xs font-bold text-[var(--color-ai)] hover:bg-[var(--color-ai)] hover:text-white transition-all shadow-sm"
          >
            <span>✦</span>
            <span>Ask AI</span>
          </button>
        </div>
      </section>

      {/* Widget Customizer Modal */}
      {showWidgetModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--color-bg)]/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--color-text)]">
              Customize Dashboard Widgets
            </h3>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Toggle the widgets you want visible on your command center.
            </p>

            <div className="mt-5 space-y-2 max-h-72 overflow-y-auto">
              {widgetOrder.map((id) => {
                const isVisible = !hiddenWidgets.includes(id);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-xs font-bold capitalize"
                  >
                    <span>{id}</span>
                    <button
                      type="button"
                      onClick={() => toggleWidgetVisibility(id)}
                      className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all ${
                        isVisible
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-white/5 text-[var(--color-muted)]'
                      }`}
                    >
                      {isVisible ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowWidgetModal(false)}
                className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
