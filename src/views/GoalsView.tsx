import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Clock, Trash2, Edit2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoalItem } from '../types';
import { createGoal, updateGoal, deleteGoal } from '../services/db';

interface GoalsViewProps {
  goals: GoalItem[];
}

export const GoalsView: React.FC<GoalsViewProps> = ({ goals }) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Career');
  const [targetDate, setTargetDate] = useState('');
  const [progress, setProgress] = useState(0);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setCategory('Career');
    setTargetDate('');
    setProgress(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: GoalItem) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setCategory(goal.category);
    setTargetDate(goal.targetDate || '');
    setProgress(goal.progress);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    if (editingGoal) {
      await updateGoal(editingGoal.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        targetDate: targetDate || null,
        progress: Number(progress),
        status: Number(progress) >= 100 ? 'completed' : 'active',
      });
    } else {
      await createGoal({
        userId: user.uid,
        title: title.trim(),
        description: description.trim(),
        category,
        targetDate: targetDate || null,
        progress: Number(progress),
        status: Number(progress) >= 100 ? 'completed' : 'active',
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteGoal(id);
  };

  const handleIncrement = async (goal: GoalItem, delta: number) => {
    const nextProg = Math.min(100, Math.max(0, goal.progress + delta));
    await updateGoal(goal.id, {
      progress: nextProg,
      status: nextProg >= 100 ? 'completed' : 'active',
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-gold)]">
            Objectives &amp; Milestones
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Goals &amp; Ambitions.
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Define high-impact milestones and track your incremental progress.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New goal</span>
        </button>
      </section>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="flex flex-col justify-between rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm hover:border-[var(--color-primary)] transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-gold)] uppercase">
                  {goal.category}
                </span>
                <span className={`text-[10px] font-bold uppercase ${goal.status === 'completed' ? 'text-emerald-400' : 'text-[var(--color-cyan)]'}`}>
                  {goal.status}
                </span>
              </div>

              <h3 className="mt-3 text-base font-bold text-[var(--color-text)]">
                {goal.title}
              </h3>
              {goal.description && (
                <p className="mt-1 text-xs text-[var(--color-muted)] line-clamp-2">
                  {goal.description}
                </p>
              )}

              {/* Progress track */}
              <div className="mt-5 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[var(--color-muted)]">Progress</span>
                  <span className="text-[var(--color-text)]">{goal.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-cyan)] transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom tools */}
            <div className="mt-6 flex items-center justify-between pt-3 border-t border-[var(--color-border)]/60 text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleIncrement(goal, -10)}
                  className="rounded-lg border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  -10%
                </button>
                <button
                  type="button"
                  onClick={() => handleIncrement(goal, 10)}
                  className="rounded-lg border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  +10%
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(goal)}
                  className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(goal.id)}
                  className="text-[var(--color-muted)] hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {goals.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-[var(--color-border)] p-12 text-center text-xs text-[var(--color-muted)]">
            No goals defined yet. Click "New goal" to create your first target.
          </div>
        )}
      </div>

      {/* Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--color-bg)]/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-base font-bold text-[var(--color-text)]">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Read 12 books on physics"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why does this goal matter?"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                  >
                    <option value="Career">Career</option>
                    <option value="Learning">Learning</option>
                    <option value="Health">Health</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  Current Progress ({progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)]"
                >
                  Save goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
