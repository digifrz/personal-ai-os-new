import React, { useState } from 'react';
import { History, CheckSquare, FileText, FolderKanban, Calendar, Sparkles, Trash2, Filter } from 'lucide-react';
import { ActivityLogItem } from '../types';

interface ActivityViewProps {
  logs: ActivityLogItem[];
}

export const ActivityView: React.FC<ActivityViewProps> = ({ logs }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = logs.filter(
    (l) => filterType === 'all' || l.entityType.toLowerCase() === filterType.toLowerCase()
  );

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'note':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'file':
        return <FolderKanban className="w-4 h-4 text-blue-400" />;
      case 'calendar_event':
        return <Calendar className="w-4 h-4 text-pink-400" />;
      case 'ai_chat':
        return <Sparkles className="w-4 h-4 text-[var(--color-ai)]" />;
      default:
        return <History className="w-4 h-4 text-[var(--color-muted)]" />;
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
            Workspace Audit Trail
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Activity History.
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Real-time synchronization logs for all changes made in your private workspace.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'task', 'note', 'file', 'calendar_event'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize transition-all border ${
              filterType === type
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-text)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]'
            }`}
          >
            {type === 'calendar_event' ? 'Calendar' : type}
          </button>
        ))}
      </div>

      {/* Logs timeline */}
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-4">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3.5 pb-3 border-b border-[var(--color-border)]/60 last:border-0 last:pb-0"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg-secondary)]">
              {getIcon(log.entityType)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs text-[var(--color-text)] font-medium">
                <span className="font-bold capitalize">{log.action}</span>{' '}
                <span className="text-[var(--color-primary)] font-semibold">{log.entityTitle}</span>
              </p>
              <small className="text-[11px] text-[var(--color-muted)]">
                {new Date(log.timestamp).toLocaleString()}
              </small>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-xs text-[var(--color-muted)]">
            No activity records found yet. Actions you take will be streamed here in real-time.
          </div>
        )}
      </div>
    </div>
  );
};
