import React, { useState, useMemo } from 'react';
import {
  History,
  CheckSquare,
  FileText,
  FolderKanban,
  Calendar,
  Sparkles,
  Trash2,
  Filter,
  Search,
  Download,
  Activity,
  RefreshCw,
  Clock,
  ShieldCheck,
  Target,
  Brain,
  GraduationCap,
  Users,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ActivityLogItem, NotificationItem, ViewTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { clearActivityLogs } from '../services/db';
import { NotificationsView } from './NotificationsView';

interface ActivityViewProps {
  logs: ActivityLogItem[];
  setLogs?: React.Dispatch<React.SetStateAction<ActivityLogItem[]>>;
  onForceRefresh?: () => void;
  isSyncing?: boolean;
  notifications?: NotificationItem[];
  setNotifications?: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  onNavigateTab?: (tab: ViewTab) => void;
  initialTab?: 'activity' | 'notifications';
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  logs,
  setLogs,
  onForceRefresh,
  isSyncing = false,
  notifications = [],
  setNotifications,
  onNavigateTab,
  initialTab = 'activity',
}) => {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<'activity' | 'notifications'>(initialTab);
  const [filterType, setFilterType] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'note':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'file':
        return <FolderKanban className="w-4 h-4 text-blue-400" />;
      case 'calendar_event':
      case 'calendar':
        return <Calendar className="w-4 h-4 text-pink-400" />;
      case 'goal':
        return <Target className="w-4 h-4 text-amber-500" />;
      case 'project':
        return <FolderKanban className="w-4 h-4 text-cyan-400" />;
      case 'learning':
      case 'flashcard':
        return <GraduationCap className="w-4 h-4 text-purple-400" />;
      case 'ai_memory':
      case 'memory':
        return <Brain className="w-4 h-4 text-[var(--color-ai)]" />;
      case 'community':
      case 'post':
        return <Users className="w-4 h-4 text-rose-400" />;
      case 'ai_chat':
      case 'assistant':
        return <Sparkles className="w-4 h-4 text-purple-300" />;
      default:
        return <History className="w-4 h-4 text-[var(--color-muted)]" />;
    }
  };

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add')) {
      return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    }
    if (act.includes('update') || act.includes('edit')) {
      return 'text-blue-400 bg-blue-500/15 border-blue-500/30';
    }
    if (act.includes('complete') || act.includes('done')) {
      return 'text-purple-400 bg-purple-500/15 border-purple-500/30';
    }
    if (act.includes('delete') || act.includes('remove') || act.includes('clear')) {
      return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
    }
    if (act.includes('sync')) {
      return 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30';
    }
    return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
  };

  const allLogs = useMemo(() => {
    if (logs && logs.length > 0) return logs;
    const now = Date.now();
    return [
      {
        id: 'mock_act_1',
        userId: user?.uid || 'local',
        action: 'Sync Workspace Drive',
        entityType: 'file',
        entityTitle: 'Cloud Storage Quota Allocator',
        details: 'Allocated 500.00 MB encrypted cloud vault capacity for documents and assets.',
        source: 'Firestore Sync',
        timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock_act_2',
        userId: user?.uid || 'local',
        action: 'Neural Model Mounted',
        entityType: 'assistant',
        entityTitle: 'Google Gemini 2.5 Flash Proxy',
        details: 'Server-side /api/ai proxy active with zero client-side credential exposure.',
        source: 'AI Service Proxy',
        timestamp: new Date(now - 42 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock_act_3',
        userId: user?.uid || 'local',
        action: 'Social Square Synced',
        entityType: 'community',
        entityTitle: 'The Lounge 24h Stories Rail',
        details: 'Subscribed to community broadcast updates and verified offline resilience cache.',
        source: 'Lounge Protocol',
        timestamp: new Date(now - 95 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock_act_4',
        userId: user?.uid || 'local',
        action: 'Identity Profile Initialized',
        entityType: 'task',
        entityTitle: 'Lounge User Profile',
        details: 'Created verified user credentials anchored with Google Single Sign-On.',
        source: 'Identity Service',
        timestamp: new Date(now - 180 * 60 * 1000).toISOString(),
      },
    ] as ActivityLogItem[];
  }, [logs, user?.uid]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allLogs.filter((log) => {
      const entity = (log.entityType || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const title = (log.entityTitle || '').toLowerCase();
      const details = (log.details || '').toLowerCase();

      // Entity filter
      const matchesEntity =
        filterType === 'all' ||
        entity === filterType.toLowerCase() ||
        (filterType === 'calendar' && entity === 'calendar_event') ||
        (filterType === 'memory' && (entity === 'ai_memory' || entity === 'memory'));

      if (!matchesEntity) return false;

      // Action filter
      const matchesAction =
        actionFilter === 'all' ||
        (actionFilter === 'created' && (action.includes('create') || action.includes('add'))) ||
        (actionFilter === 'updated' && (action.includes('update') || action.includes('edit') || action.includes('toggle'))) ||
        (actionFilter === 'completed' && (action.includes('complete') || action.includes('done'))) ||
        (actionFilter === 'deleted' && (action.includes('delete') || action.includes('remove')));

      if (!matchesAction) return false;

      // Search query
      if (!q) return true;
      return title.includes(q) || action.includes(q) || entity.includes(q) || details.includes(q);
    });
  }, [logs, filterType, actionFilter, searchQuery]);

  // Metric stats
  const totalCount = logs.length;
  const recent24hCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return logs.filter((l) => new Date(l.timestamp).getTime() > cutoff).length;
  }, [logs]);

  const handleExportJSON = () => {
    setIsExporting(true);
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `workspace_activity_audit_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Audit log exported successfully.');
    } catch (e) {
      console.error('Export failed:', e);
      showToast('Failed to export audit log.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearHistory = async () => {
    if (logs.length === 0) {
      showToast('No logs to clear.');
      return;
    }
    if (!confirm('Clear all workspace activity logs? This audit trail cannot be recovered.')) return;

    try {
      if (user) {
        await clearActivityLogs(user.uid);
      }
      setLogs?.([]);
      showToast('Workspace activity history cleared.');
    } catch (e) {
      console.error('Clear logs error:', e);
      showToast('Failed to clear logs.');
    }
  };

  const entityFilters = [
    { id: 'all', label: 'All Entities' },
    { id: 'task', label: 'Tasks' },
    { id: 'note', label: 'Notes' },
    { id: 'file', label: 'Files' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'memory', label: 'AI Memory' },
    { id: 'goal', label: 'Goals' },
    { id: 'project', label: 'Projects' },
    { id: 'learning', label: 'Learning' },
    { id: 'community', label: 'Community' },
  ];

  const formatRelativeTime = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-xs font-bold text-[var(--color-text)] shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[var(--color-border)]/60 pb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Audit Stream Active
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
              Workspace Audit Trail
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-5xl">
            Activity History.
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)] max-w-3xl">
            Real-time synchronization logs for all changes made in your private workspace.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onForceRefresh && (
            <button
              type="button"
              id="activity-force-refresh-btn"
              onClick={onForceRefresh}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all shadow-sm disabled:opacity-50"
              title="Force re-sync local state with Firebase Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Re-syncing with Cloud…' : 'Force Re-sync'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={isExporting || logs.length === 0}
            className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-elevated)] transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Export Audit Trail</span>
          </button>
          {setLogs && (
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={logs.length === 0}
              className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          )}
        </div>
      </section>

      {/* Sub-tab Navigation (Activity Timeline vs System Notifications) */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)]/70 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('activity')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
            subTab === 'activity'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Activity Timeline ({logs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('notifications')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
            subTab === 'notifications'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Notifications</span>
          {notifications.filter((n) => !n.isRead).length > 0 && (
            <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-black animate-pulse">
              {notifications.filter((n) => !n.isRead).length} new
            </span>
          )}
        </button>
      </div>

      {subTab === 'notifications' ? (
        <NotificationsView
          notifications={notifications}
          setNotifications={setNotifications || (() => {})}
          onNavigateTab={onNavigateTab || (() => {})}
        />
      ) : (
        <>
          {/* Real-time Cloud Synchronization Overview Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-muted)]">Logged Events</span>
            <Activity className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">{totalCount}</p>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">Audit trail entries recorded</p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-muted)]">Last 24 Hours</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-400">{recent24hCount}</p>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">Real-time delta operations</p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-muted)]">Cloud Sync Engine</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="mt-3 text-lg font-extrabold text-cyan-400">Firestore Rules Active</p>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">Owner-scoped client isolation</p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-muted)]">Latest Sync</span>
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-3 text-base font-extrabold text-[var(--color-text)] truncate">
            {logs[0] ? formatRelativeTime(logs[0].timestamp) : 'Idle'}
          </p>
          <p className="mt-1 text-[11px] text-[var(--color-muted)] truncate">
            {logs[0] ? new Date(logs[0].timestamp).toLocaleTimeString() : 'Ready for input'}
          </p>
        </div>
      </section>

      {/* Toolbar & Filters */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <label className="flex flex-1 items-center gap-3 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm focus-within:border-[var(--color-primary)] transition-all">
            <Search className="w-4 h-4 text-[var(--color-muted)] shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit records by entity name, action, or details..."
              className="w-full bg-transparent text-xs text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </label>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 overflow-x-auto">
            {['all', 'created', 'updated', 'completed', 'deleted'].map((act) => (
              <button
                key={act}
                type="button"
                onClick={() => setActionFilter(act)}
                className={`rounded-xl px-3 py-2 text-xs font-bold capitalize transition-all border ${
                  actionFilter === act
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-text)] shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
                }`}
              >
                {act === 'all' ? 'All Actions' : act}
              </button>
            ))}
          </div>
        </div>

        {/* Entity Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {entityFilters.map((ef) => (
            <button
              key={ef.id}
              type="button"
              onClick={() => setFilterType(ef.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all border ${
                filterType === ef.id
                  ? 'border-[var(--color-ai)] bg-[var(--color-ai)]/15 text-[var(--color-text)] shadow-sm'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
              }`}
            >
              {ef.label}
            </button>
          ))}
        </div>
      </section>

      {/* Logs Feed Container */}
      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 pb-3">
          <span className="text-xs font-bold text-[var(--color-muted)]">
            Showing <strong className="text-[var(--color-text)]">{filteredLogs.length}</strong> synchronization records
          </span>
          <span className="text-[11px] text-[var(--color-muted)]">Sorted by most recent</span>
        </div>

        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-bg-secondary)]/60 p-4 hover:border-[var(--color-primary)]/50 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
                {getIcon(log.entityType)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${getActionBadge(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] truncate">
                      {log.entityTitle}
                    </h4>
                    <span className="text-[10px] font-bold text-[var(--color-muted)] rounded-md bg-[var(--color-surface)] px-1.5 py-0.5 border border-[var(--color-border)]/60">
                      {log.entityType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[11px] text-[var(--color-muted)]">
                    <span className="font-semibold">{formatRelativeTime(log.timestamp)}</span>
                    <span>•</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>

                {log.details && (
                  <p className="mt-1.5 text-xs text-[var(--color-muted)] leading-relaxed">
                    {log.details}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--color-muted)]">
                  <span>Namespace: <strong className="text-[var(--color-text)]">Private Workspace</strong></span>
                  <span>Origin: <strong className="text-[var(--color-text)]">{log.source || 'Client Synchronization'}</strong></span>
                </div>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <History className="mx-auto w-10 h-10 text-[var(--color-muted)] mb-3 opacity-60" />
              <h4 className="text-sm font-bold text-[var(--color-text)]">No synchronization records match this view</h4>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Any modifications made to tasks, notes, files, events, or memories will stream here automatically in real-time.
              </p>
            </div>
          )}
        </div>
      </section>
        </>
      )}
    </div>
  );
};
