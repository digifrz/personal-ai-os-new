import React, { useState } from 'react';
import { FolderKanban, Plus, CheckCircle2, Clock, Trash2, Edit2, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProjectItem, ViewTab } from '../types';
import { createProject, updateProject, deleteProject } from '../services/db';

interface ProjectsViewProps {
  projects: ProjectItem[];
  setActiveTab: (tab: ViewTab) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, setActiveTab }) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectItem['status']>('active');
  const [progress, setProgress] = useState(0);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setTitle('');
    setDescription('');
    setStatus('active');
    setProgress(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proj: ProjectItem) => {
    setEditingProject(proj);
    setTitle(proj.title || proj.name || '');
    setDescription(proj.description || '');
    setStatus(proj.status);
    setProgress(proj.progress);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    if (editingProject) {
      await updateProject(editingProject.id, {
        name: title.trim(),
        title: title.trim(),
        description: description.trim(),
        status,
        progress: Number(progress),
      });
    } else {
      await createProject({
        userId: user.uid,
        name: title.trim(),
        title: title.trim(),
        description: description.trim(),
        status,
        progress: Number(progress),
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
            High-Level Workstreams
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Projects &amp; Initiatives.
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Coordinate multi-step missions, keep your deliverables on track, and monitor health.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New project</span>
        </button>
      </section>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="flex flex-col justify-between rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm hover:border-[var(--color-primary)] transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-primary)] uppercase">
                  {proj.status.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(proj)}
                    className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(proj.id)}
                    className="text-[var(--color-muted)] hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="mt-3 text-base font-bold text-[var(--color-text)]">
                {proj.title || proj.name}
              </h3>
              {proj.description && (
                <p className="mt-1 text-xs text-[var(--color-muted)] line-clamp-2">
                  {proj.description}
                </p>
              )}

              {/* Progress track */}
              <div className="mt-5 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[var(--color-muted)]">Progress</span>
                  <span className="text-[var(--color-text)]">{proj.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-cyan)] transition-all duration-300"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-[var(--color-border)]/60 text-xs">
              <span className="text-[11px] text-[var(--color-muted)]">
                Updated {new Date(proj.updatedAt).toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className="flex items-center gap-1 text-[var(--color-primary)] font-bold hover:underline"
              >
                <span>View Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-[var(--color-border)] p-12 text-center text-xs text-[var(--color-muted)]">
            No projects found. Click "New project" to set up your first workspace initiative.
          </div>
        )}
      </div>

      {/* Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--color-bg)]/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-base font-bold text-[var(--color-text)]">
                {editingProject ? 'Edit Project' : 'New Project'}
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
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Personal AI OS v1 Deployment"
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
                  placeholder="Scope, deliverables, and vision..."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  Progress ({progress}%)
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
                  Save project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
