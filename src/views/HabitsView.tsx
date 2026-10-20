import React, { useState, useMemo } from 'react';
import {
  Flame,
  Plus,
  Check,
  RotateCcw,
  Sparkles,
  Calendar,
  Award,
  Trash2,
  Filter,
  CheckCircle2,
  TrendingUp,
  X,
  Clock,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HabitItem } from '../types';
import { createHabit, toggleHabitDate, deleteHabit } from '../services/db';

interface HabitsViewProps {
  habits: HabitItem[];
  onOpenAIAdvice?: () => void;
}

const CATEGORY_META: Record<HabitItem['category'], { label: string; color: string; border: string }> = {
  health: { label: 'Health', color: 'text-emerald-400', border: 'border-emerald-500/30' },
  mind: { label: 'Mind & Focus', color: 'text-violet-400', border: 'border-violet-500/30' },
  productivity: { label: 'Productivity', color: 'text-cyan-400', border: 'border-cyan-500/30' },
  fitness: { label: 'Fitness & Body', color: 'text-amber-400', border: 'border-amber-500/30' },
  learning: { label: 'Learning', color: 'text-blue-400', border: 'border-blue-500/30' },
};

export const HabitsView: React.FC<HabitsViewProps> = ({ habits }) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<HabitItem['category']>('health');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly'>('daily');
  const [newReminder, setNewReminder] = useState('08:00');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute past 7 days for the quick checklist
  const past7Days = useMemo(() => {
    const days: { dateStr: string; label: string; dayNum: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNum: d.getDate(),
      });
    }
    return days;
  }, []);

  // Compute 52-week activity heatmap data (last 364 days)
  const heatmapData = useMemo(() => {
    const weeks: Array<Array<{ dateStr: string; count: number }>> = [];
    const dateMap = new Map<string, number>();

    habits.forEach((h) => {
      (h.completedDates || []).forEach((d) => {
        dateMap.set(d, (dateMap.get(d) || 0) + 1);
      });
    });

    const totalDays = 52 * 7;
    let currentWeek: Array<{ dateStr: string; count: number }> = [];

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dStr = d.toISOString().split('T')[0];
      const count = dateMap.get(dStr) || 0;
      currentWeek.push({ dateStr: dStr, count });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    return weeks;
  }, [habits]);

  const filteredHabits = useMemo(() => {
    if (selectedCategory === 'all') return habits;
    return habits.filter((h) => h.category === selectedCategory);
  }, [habits, selectedCategory]);

  // Overall completion metrics
  const totalCompletedToday = useMemo(() => {
    return habits.filter((h) => (h.completedDates || []).includes(todayStr)).length;
  }, [habits, todayStr]);

  const maxStreak = useMemo(() => {
    return habits.reduce((max, h) => Math.max(max, h.streakCount || 0), 0);
  }, [habits]);

  const handleToggle = async (habitId: string, dateStr: string, completedDates: string[]) => {
    try {
      const isCurrentlyDone = (completedDates || []).includes(dateStr);
      await toggleHabitDate(habitId, dateStr, completedDates);
      if (!isCurrentlyDone) {
        showToast('Habit checked off for today! Keep the momentum alive 🔥');
      }
    } catch (e) {
      console.warn('Toggle habit error:', e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await createHabit({
        userId: user?.uid || 'guest_user',
        title: newTitle.trim(),
        category: newCategory,
        frequency: newFrequency,
        reminderTime: newReminder || undefined,
      });
      setNewTitle('');
      setIsCreateOpen(false);
      showToast(`"${newTitle.trim()}" added to your daily habits.`);
    } catch (e) {
      console.warn('Create habit error:', e);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Remove "${title}" from your daily habits?`)) return;
    try {
      await deleteHabit(id);
      showToast(`Removed "${title}".`);
    } catch (e) {
      console.warn('Delete habit error:', e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-16 right-6 z-50 rounded-2xl border border-emerald-500/40 bg-zinc-900/95 backdrop-blur-xl px-4 py-3 text-xs font-bold text-emerald-300 shadow-2xl animate-fade-in flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] font-medium">
            <span>Routines &amp; Discipline</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-400 font-bold">{totalCompletedToday} of {habits.length} done today</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-amber-400 font-bold">Max streak: {maxStreak} days</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text)] mt-1">
            Smart Habit Tracker
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            Build unshakeable daily rituals with visual streaks, completion heatmaps, and offline sync.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-2.5 text-xs font-black text-white shadow-lg hover:brightness-110 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
          </button>
        </div>
      </header>

      {/* Metric Highlights */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <span className="text-[11px] font-semibold text-[var(--color-muted)]">Active Habits</span>
          <p className="text-2xl font-black font-mono text-[var(--color-text)] mt-1 tabular-nums">{habits.length}</p>
          <span className="text-[10px] text-[var(--color-muted)]">Tracked rituals</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <span className="text-[11px] font-semibold text-[var(--color-muted)]">Today's Progress</span>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-1 tabular-nums">
            {habits.length > 0 ? Math.round((totalCompletedToday / habits.length) * 100) : 0}%
          </p>
          <span className="text-[10px] text-emerald-400/80">{totalCompletedToday} completed</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <span className="text-[11px] font-semibold text-[var(--color-muted)]">Top Current Streak</span>
          <p className="text-2xl font-black font-mono text-amber-400 mt-1 tabular-nums">{maxStreak} d</p>
          <span className="text-[10px] text-amber-400/80">Active consistency</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <span className="text-[11px] font-semibold text-[var(--color-muted)]">Year Consistency</span>
          <p className="text-2xl font-black font-mono text-cyan-400 mt-1 tabular-nums">
            {habits.reduce((acc, h) => acc + (h.completedDates?.length || 0), 0)}
          </p>
          <span className="text-[10px] text-cyan-400/80">Total check-ins</span>
        </div>
      </section>

      {/* 52-Week GitHub Style Habit Heatmap */}
      <section className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text)]">Annual Consistency Heatmap</h2>
            <p className="text-[11px] text-[var(--color-muted)]">Intensity of daily habit completions over the last 52 weeks</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted)] font-mono">
            <span>Less</span>
            <span className="h-2.5 w-2.5 rounded-sm bg-white/5 border border-white/10" />
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/30" />
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/60" />
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1 min-w-[720px]">
            {heatmapData.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day) => {
                  let bgClass = 'bg-white/5 border border-white/5';
                  if (day.count === 1) bgClass = 'bg-emerald-500/30 border border-emerald-500/30';
                  else if (day.count === 2) bgClass = 'bg-emerald-500/60 border border-emerald-500/40';
                  else if (day.count >= 3) bgClass = 'bg-emerald-500 border border-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]';

                  return (
                    <div
                      key={day.dateStr}
                      title={`${day.dateStr}: ${day.count} habit${day.count === 1 ? '' : 's'} completed`}
                      className={`h-3 w-3 rounded-sm cursor-pointer transition-transform hover:scale-125 ${bgClass}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          {['all', 'health', 'mind', 'productivity', 'fitness', 'learning'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all capitalize ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Habits List with 7-Day Matrix */}
      <div className="space-y-3">
        {filteredHabits.map((habit) => {
          const cat = CATEGORY_META[habit.category] || CATEGORY_META.health;
          const isDoneToday = (habit.completedDates || []).includes(todayStr);

          return (
            <div
              key={habit.id}
              className={`group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-[var(--color-surface)] border transition-all ${
                isDoneToday ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-[var(--color-border)] hover:border-white/20'
              }`}
            >
              {/* Left: Habit Info */}
              <div className="flex items-start gap-3.5 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggle(habit.id, todayStr, habit.completedDates)}
                  className={`mt-0.5 h-7 w-7 rounded-2xl border flex items-center justify-center shrink-0 transition-all ${
                    isDoneToday
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'border-[var(--color-border)] hover:border-emerald-500/60 bg-[var(--color-bg-secondary)]'
                  }`}
                  title={isDoneToday ? 'Completed today! Tap to undo' : 'Tap to complete today'}
                >
                  {isDoneToday && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-sm font-bold truncate ${isDoneToday ? 'text-emerald-300' : 'text-[var(--color-text)]'}`}>
                      {habit.title}
                    </h3>
                    <span className={`text-[10px] font-bold ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-[var(--color-muted)] font-mono capitalize">
                      · {habit.frequency}
                    </span>
                    {habit.reminderTime && (
                      <span className="text-[10px] text-[var(--color-muted)] font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {habit.reminderTime}
                      </span>
                    )}
                  </div>

                  {/* Streaks and Best */}
                  <div className="flex items-center gap-3 text-xs text-[var(--color-muted)] mt-1 font-mono">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Flame className="w-3.5 h-3.5" />
                      {habit.streakCount || 0} day streak
                    </span>
                    <span>· Best: {habit.bestStreak || 0} d</span>
                    <span>· Total: {habit.completedDates?.length || 0} days</span>
                  </div>
                </div>
              </div>

              {/* Right: Past 7 Days Quick Checklist */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  {past7Days.map((day) => {
                    const isDone = (habit.completedDates || []).includes(day.dateStr);
                    const isToday = day.dateStr === todayStr;

                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => handleToggle(habit.id, day.dateStr, habit.completedDates)}
                        title={`${day.dateStr}: ${isDone ? 'Completed' : 'Not completed'}`}
                        className={`flex flex-col items-center justify-center h-10 w-8 rounded-xl text-[10px] transition-all font-mono ${
                          isDone
                            ? 'bg-emerald-500 text-white font-bold shadow-sm'
                            : isToday
                            ? 'border border-dashed border-emerald-500/60 text-[var(--color-muted)]'
                            : 'text-[var(--color-muted)] hover:bg-white/5'
                        }`}
                      >
                        <span className="text-[9px] uppercase opacity-75">{day.label}</span>
                        <span className="text-[11px] font-bold">{day.dayNum}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(habit.id, habit.title)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-[var(--color-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete habit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredHabits.length === 0 && (
          <div className="p-12 text-center rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
            <Award className="w-10 h-10 text-[var(--color-muted)]/50 mx-auto" />
            <h3 className="text-sm font-bold text-[var(--color-text)]">No habits in this category</h3>
            <p className="text-xs text-[var(--color-muted)] max-w-sm mx-auto">
              Add your first daily ritual like reading, 10,000 steps, meditation, or code review to build streaks.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              Add First Habit
            </button>
          </div>
        )}
      </div>

      {/* Create Habit Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-base font-bold text-[var(--color-text)]">Add New Habit</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--color-text)] mb-1">Habit Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read 20 pages, Morning Run, Meditate"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--color-text)] outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--color-text)] mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                  >
                    <option value="health">Health</option>
                    <option value="mind">Mind &amp; Focus</option>
                    <option value="productivity">Productivity</option>
                    <option value="fitness">Fitness &amp; Body</option>
                    <option value="learning">Learning</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-text)] mb-1">Frequency</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                  >
                    <option value="daily">Every Day</option>
                    <option value="weekly">Weekly Target</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--color-text)] mb-1">Reminder Time</label>
                <input
                  type="time"
                  value={newReminder}
                  onChange={(e) => setNewReminder(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-muted)] hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
