import React from 'react';
import { BarChart3, TrendingUp, CheckSquare, FileText, FolderKanban, Calendar, Target } from 'lucide-react';
import { TaskItem, NoteItem, FileItem, CalendarEventItem, GoalItem } from '../types';

interface AnalyticsViewProps {
  tasks: TaskItem[];
  notes: NoteItem[];
  files: FileItem[];
  events: CalendarEventItem[];
  goals: GoalItem[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tasks,
  notes,
  files,
  events,
  goals,
}) => {
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const openTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'trashed');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const highPriority = tasks.filter((t) => t.priority === 'high').length;
  const mediumPriority = tasks.filter((t) => t.priority === 'medium').length;
  const lowPriority = tasks.filter((t) => t.priority === 'low').length;

  const workTasks = tasks.filter((t) => t.category === 'Work').length;
  const personalTasks = tasks.filter((t) => t.category === 'Personal').length;
  const learningTasks = tasks.filter((t) => t.category === 'Learning').length;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-cyan)]">
            Workspace Insights
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Analytics &amp; Output.
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Metrics tracking your completion velocity, category focus, and digital workspace volume.
          </p>
        </div>
      </section>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Completion Rate</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <strong className="mt-3 block text-3xl font-extrabold text-[var(--color-text)]">
            {completionRate}%
          </strong>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            {completedTasks.length} of {tasks.length} tasks done
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Knowledge Base</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <strong className="mt-3 block text-3xl font-extrabold text-[var(--color-text)]">
            {notes.length}
          </strong>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            Workspace notes recorded
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Cloud Assets</span>
            <FolderKanban className="w-4 h-4 text-blue-400" />
          </div>
          <strong className="mt-3 block text-3xl font-extrabold text-[var(--color-text)]">
            {files.length}
          </strong>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            Files in Firebase Storage
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Active Goals</span>
            <Target className="w-4 h-4 text-[var(--color-gold)]" />
          </div>
          <strong className="mt-3 block text-3xl font-extrabold text-[var(--color-gold)]">
            {goals.filter((g) => g.status === 'active').length}
          </strong>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            Milestones in progress
          </p>
        </div>
      </div>

      {/* Distribution Cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Priority breakdown */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
          <h3 className="text-sm font-bold text-[var(--color-text)]">
            Priority Distribution
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-red-400">High Priority</span>
                <span className="text-[var(--color-text)]">{highPriority}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${tasks.length ? (highPriority / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-400">Medium Priority</span>
                <span className="text-[var(--color-text)]">{mediumPriority}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${tasks.length ? (mediumPriority / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-emerald-400">Low Priority</span>
                <span className="text-[var(--color-text)]">{lowPriority}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${tasks.length ? (lowPriority / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
          <h3 className="text-sm font-bold text-[var(--color-text)]">
            Category Allocation
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-blue-400">Work</span>
                <span className="text-[var(--color-text)]">{workTasks}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${tasks.length ? (workTasks / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-purple-400">Learning</span>
                <span className="text-[var(--color-text)]">{learningTasks}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${tasks.length ? (learningTasks / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-400">Personal</span>
                <span className="text-[var(--color-text)]">{personalTasks}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${tasks.length ? (personalTasks / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
