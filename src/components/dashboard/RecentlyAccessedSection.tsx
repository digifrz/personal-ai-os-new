import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  FileText,
  CheckSquare,
  FolderKanban,
  ArrowRight,
  ExternalLink,
  History,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  RecentlyAccessedItem,
  getRecentlyAccessed,
  recordRecentAccess,
  clearRecentlyAccessed,
  formatRelativeTime,
} from '../../services/recentAccess';
import { TaskItem, NoteItem, FileItem, ViewTab } from '../../types';

interface RecentlyAccessedSectionProps {
  userId?: string;
  tasks: TaskItem[];
  notes: NoteItem[];
  files: FileItem[];
  onNavigateTab: (tab: ViewTab) => void;
  onOpenItem?: (type: 'note' | 'task' | 'file', id: string) => void;
}

export const RecentlyAccessedSection: React.FC<RecentlyAccessedSectionProps> = ({
  userId,
  tasks,
  notes,
  files,
  onNavigateTab,
  onOpenItem,
}) => {
  const [recentItems, setRecentItems] = useState<RecentlyAccessedItem[]>(() =>
    getRecentlyAccessed(userId)
  );

  // Listen for storage or custom events when items are clicked elsewhere
  useEffect(() => {
    const handleUpdate = () => {
      setRecentItems(getRecentlyAccessed(userId));
    };

    window.addEventListener('paio:recent-access-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('paio:recent-access-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [userId]);

  // If user has fewer than 5 recorded clicks, intelligently supplement with latest workspace items
  const displayItems = useMemo<RecentlyAccessedItem[]>(() => {
    if (recentItems.length >= 5) {
      return recentItems.slice(0, 5);
    }

    const recordedIds = new Set(recentItems.map((r) => `${r.type}:${r.id}`));
    const fallbackList: RecentlyAccessedItem[] = [];

    // Latest active tasks
    tasks
      .filter((t) => t.status !== 'trashed' && !recordedIds.has(`task:${t.id}`))
      .slice(0, 3)
      .forEach((t) => {
        fallbackList.push({
          id: t.id,
          type: 'task',
          title: t.title,
          subtitle: `${t.priority} priority • ${t.category}`,
          category: t.category,
          priority: t.priority,
          accessedAt: t.updatedAt || new Date().toISOString(),
        });
      });

    // Latest active notes
    notes
      .filter((n) => !n.isTrashed && !recordedIds.has(`note:${n.id}`))
      .slice(0, 3)
      .forEach((n) => {
        fallbackList.push({
          id: n.id,
          type: 'note',
          title: n.title,
          subtitle: `${n.category} Note`,
          category: n.category,
          color: n.color,
          accessedAt: n.updatedAt || new Date().toISOString(),
        });
      });

    // Latest active files
    files
      .filter((f) => !f.isTrashed && !recordedIds.has(`file:${f.id}`))
      .slice(0, 3)
      .forEach((f) => {
        fallbackList.push({
          id: f.id,
          type: 'file',
          title: f.name,
          subtitle: f.itemType === 'folder' ? 'Folder' : `${(f.sizeBytes / 1024).toFixed(0)} KB`,
          sizeBytes: f.sizeBytes,
          mimeType: f.mimeType,
          accessedAt: f.updatedAt || new Date().toISOString(),
        });
      });

    // Merge recorded clicks first, then fallbacks up to 5 items
    return [...recentItems, ...fallbackList].slice(0, 5);
  }, [recentItems, tasks, notes, files]);

  const handleItemClick = (item: RecentlyAccessedItem) => {
    // Record access immediately so it floats to the very top
    recordRecentAccess(
      {
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        category: item.category,
        priority: item.priority,
        sizeBytes: item.sizeBytes,
        mimeType: item.mimeType,
        color: item.color,
      },
      userId
    );

    // Persist quick open target ID for smooth direct re-entry
    try {
      if (item.type === 'note') {
        localStorage.setItem('paio_open_note_id', item.id);
        onOpenItem?.('note', item.id);
        onNavigateTab('notes');
      } else if (item.type === 'task') {
        localStorage.setItem('paio_open_task_id', item.id);
        onOpenItem?.('task', item.id);
        onNavigateTab('tasks');
      } else if (item.type === 'file') {
        localStorage.setItem('paio_open_file_id', item.id);
        onOpenItem?.('file', item.id);
        onNavigateTab('files');
      }
    } catch (e) {
      console.warn('Navigation error:', e);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentlyAccessed(userId);
    setRecentItems([]);
  };

  const getItemTypeStyles = (type: 'note' | 'task' | 'file') => {
    switch (type) {
      case 'note':
        return {
          icon: FileText,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/25',
          badge: 'Note',
          badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'task':
        return {
          icon: CheckSquare,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/25',
          badge: 'Task',
          badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'file':
        return {
          icon: FolderKanban,
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/25',
          badge: 'File',
          badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        };
    }
  };

  return (
    <section
      id="dashboard-recently-accessed-section"
      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-sm space-y-4 transition-all"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-sm">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold tracking-tight text-[var(--color-text)]">
                Recently Accessed
              </h3>
              <span className="rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-muted)]">
                Top 5
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Instant 1-click re-entry into your last viewed notes, tasks, or files
            </p>
          </div>
        </div>

        {recentItems.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold text-[var(--color-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Clear recently accessed history"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Grid of 5 Cards */}
      {displayItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-xs text-[var(--color-muted)]">
          <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p className="font-bold text-[var(--color-text)]">No recently accessed items yet</p>
          <p className="mt-1">Items you click across notes, tasks, and files will show up here for quick re-entry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {displayItems.map((item, index) => {
            const style = getItemTypeStyles(item.type);
            const Icon = style.icon;

            return (
              <div
                key={`${item.type}-${item.id}-${index}`}
                onClick={() => handleItemClick(item)}
                className="group relative flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 p-3.5 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)] hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer min-h-[140px]"
              >
                {/* Top Row: Type Badge + Relative Time */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${style.badgeBg}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{style.badge}</span>
                    </span>

                    <span className="text-[10px] font-semibold text-[var(--color-muted)] shrink-0 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatRelativeTime(item.accessedAt)}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-bold text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors leading-snug">
                    {item.title}
                  </h4>

                  {/* Subtitle / Context Tag */}
                  {item.subtitle && (
                    <p className="mt-1 text-[11px] text-[var(--color-muted)] truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {/* Bottom Row: Quick Re-entry button */}
                <div className="pt-2.5 mt-2 border-t border-[var(--color-border)]/50 flex items-center justify-between text-[11px]">
                  <span className="text-[10px] text-[var(--color-muted)] font-medium">
                    {item.category ? `#${item.category}` : `ID: ${item.id.slice(0, 4)}`}
                  </span>

                  <span className="flex items-center gap-1 font-bold text-[var(--color-primary)] group-hover:translate-x-0.5 transition-transform">
                    <span>Re-enter</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
