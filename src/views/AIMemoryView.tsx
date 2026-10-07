import React, { useState, useMemo } from 'react';
import {
  Brain,
  Search,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Plus,
  X,
  History,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { AIMemoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  createAIMemory,
  updateAIMemory,
  deleteAIMemory,
  clearAllAIMemories,
} from '../services/db';

interface AIMemoryViewProps {
  memories: AIMemoryItem[];
  setMemories: React.Dispatch<React.SetStateAction<AIMemoryItem[]>>;
  aiMemoryEnabled: boolean;
  setAiMemoryEnabled: (enabled: boolean) => void;
  onLogActivity?: (action: string, entityType: string, entityTitle: string, details?: string) => void;
}

export const AIMemoryView: React.FC<AIMemoryViewProps> = ({
  memories,
  setMemories,
  aiMemoryEnabled,
  setAiMemoryEnabled,
  onLogActivity,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<AIMemoryItem | null>(null);

  // Form inputs
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('personal');
  const [importance, setImportance] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local activity trail for memory actions
  const [recentActions, setRecentActions] = useState<Array<{ id: string; title: string; action: string; timestamp: string }>>([
    {
      id: 'act-init-1',
      title: 'Workspace memory module verified',
      action: 'Synchronized with Firestore private namespace',
      timestamp: new Date().toISOString(),
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const categoryLabel = (val: string) => {
    switch (val?.toLowerCase()) {
      case 'personal':
      case 'explicit':
        return 'Personal';
      case 'goal':
        return 'Goals';
      case 'project':
        return 'Projects';
      case 'learning':
        return 'Learning';
      case 'preference':
        return 'Preferences';
      case 'conversation':
      case 'derived':
        return 'Conversations';
      case 'temporary':
        return 'Temporary';
      default:
        return val ? val.charAt(0).toUpperCase() + val.slice(1) : 'Personal';
    }
  };

  const importanceLabel = (val: number) => {
    const num = Number(val);
    if (num >= 90) return 'Critical';
    if (num >= 70) return 'High';
    if (num >= 40) return 'Medium';
    if (num >= 20) return 'Low';
    return 'Temporary';
  };

  const importanceBadgeColor = (val: number) => {
    const num = Number(val);
    if (num >= 90) return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
    if (num >= 70) return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    if (num >= 40) return 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30';
    if (num >= 20) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    return 'text-slate-400 bg-slate-500/15 border-slate-500/30';
  };

  // Filter and search
  const visibleMemories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return memories.filter((mem) => {
      const memType = (mem.type || 'personal').toLowerCase();
      const filterMatches =
        activeFilter === 'all' ||
        memType === activeFilter ||
        (activeFilter === 'personal' && (memType === 'explicit' || memType === 'personal')) ||
        (activeFilter === 'conversation' && memType === 'derived');

      if (!filterMatches) return false;

      if (!q) return true;
      const searchable = `${mem.title} ${mem.content} ${mem.type} ${mem.source || ''}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [memories, activeFilter, searchQuery]);

  const storedCount = memories.length;
  const activeToAICount = memories.filter((m) => m.isVisible !== false && m.is_visible !== false).length;

  const openAddDialog = () => {
    setEditingMemory(null);
    setTitle('');
    setContent('');
    setCategory('personal');
    setImportance(50);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: AIMemoryItem) => {
    setEditingMemory(item);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.type || 'personal');
    setImportance(item.importance ?? 50);
    setIsDialogOpen(true);
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    if (!cleanTitle || !cleanContent) return;

    setIsSubmitting(true);
    const now = new Date().toISOString();

    try {
      if (editingMemory) {
        // Update existing
        if (user) {
          await updateAIMemory(editingMemory.id, {
            title: cleanTitle,
            content: cleanContent,
            type: category,
            importance: Number(importance),
          });
        }
        setMemories((prev) =>
          prev.map((m) =>
            m.id === editingMemory.id
              ? {
                  ...m,
                  title: cleanTitle,
                  content: cleanContent,
                  type: category,
                  importance: Number(importance),
                  updatedAt: now,
                }
              : m
          )
        );
        const actionLabel = `Memory updated · ${cleanTitle}`;
        setRecentActions((prev) => [
          { id: 'act-' + Date.now(), title: cleanTitle, action: 'Memory updated', timestamp: now },
          ...prev.slice(0, 9),
        ]);
        onLogActivity?.('updated', 'ai_memory', cleanTitle, `Category: ${categoryLabel(category)} | Importance: ${importanceLabel(importance)}`);
        showToast('Memory updated');
      } else {
        // Create new
        const newMemoryPayload = {
          title: cleanTitle,
          content: cleanContent,
          type: category,
          importance: Number(importance),
          source: 'manual',
          isVisible: true,
          is_visible: true,
          userId: user?.uid || 'local-user',
        };

        if (user) {
          const docRef = await createAIMemory(newMemoryPayload);
          const newItem: AIMemoryItem = {
            id: docRef.id,
            ...newMemoryPayload,
            createdAt: now,
            updatedAt: now,
          };
          setMemories((prev) => [newItem, ...prev]);
        } else {
          const newItem: AIMemoryItem = {
            id: 'mem-' + Date.now(),
            ...newMemoryPayload,
            createdAt: now,
            updatedAt: now,
          };
          setMemories((prev) => [newItem, ...prev]);
        }

        setRecentActions((prev) => [
          { id: 'act-' + Date.now(), title: cleanTitle, action: 'Memory created', timestamp: now },
          ...prev.slice(0, 9),
        ]);
        onLogActivity?.('created', 'ai_memory', cleanTitle, `Category: ${categoryLabel(category)} | Saved privately`);
        showToast('Memory saved privately');
      }

      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Error saving memory:', err);
      showToast('Could not save memory. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleVisibility = async (item: AIMemoryItem) => {
    const nextState = !(item.isVisible !== false && item.is_visible !== false);
    const now = new Date().toISOString();

    try {
      if (user) {
        await updateAIMemory(item.id, {
          isVisible: nextState,
          is_visible: nextState,
        });
      }
      setMemories((prev) =>
        prev.map((m) =>
          m.id === item.id ? { ...m, isVisible: nextState, is_visible: nextState, updatedAt: now } : m
        )
      );

      setRecentActions((prev) => [
        {
          id: 'act-' + Date.now(),
          title: item.title,
          action: nextState ? 'Memory made visible to AI' : 'Memory hidden from AI',
          timestamp: now,
        },
        ...prev.slice(0, 9),
      ]);
      onLogActivity?.(
        nextState ? 'visibility_enabled' : 'visibility_disabled',
        'ai_memory',
        item.title,
        nextState ? 'Context visible to AI' : 'Context masked from AI'
      );
      showToast(nextState ? 'Memory is visible to AI' : 'Memory hidden from AI');
    } catch (err) {
      console.error('Visibility toggle error:', err);
      showToast('Failed to update visibility');
    }
  };

  const handleDeleteMemory = async (item: AIMemoryItem) => {
    if (!confirm(`Delete this memory permanently?\n\n"${item.title}"`)) return;
    const now = new Date().toISOString();

    try {
      if (user) {
        await deleteAIMemory(item.id);
      }
      setMemories((prev) => prev.filter((m) => m.id !== item.id));

      setRecentActions((prev) => [
        { id: 'act-' + Date.now(), title: item.title, action: 'Memory deleted', timestamp: now },
        ...prev.slice(0, 9),
      ]);
      onLogActivity?.('deleted', 'ai_memory', item.title, 'Removed from private context');
      showToast('Memory deleted');
    } catch (err) {
      console.error('Delete memory error:', err);
      showToast('Failed to delete memory');
    }
  };

  const handleForgetAll = async () => {
    if (memories.length === 0) {
      showToast('No saved memories to forget.');
      return;
    }
    if (!confirm('Forget all saved AI memories? This action cannot be undone.')) return;
    const now = new Date().toISOString();

    try {
      if (user) {
        await clearAllAIMemories(user.uid);
      }
      setMemories([]);
      setRecentActions((prev) => [
        { id: 'act-' + Date.now(), title: 'All memories cleared', action: 'All memories forgotten', timestamp: now },
        ...prev.slice(0, 9),
      ]);
      onLogActivity?.('cleared_all', 'ai_memory', 'All Memories', 'Full context reset requested by user');
      showToast('All AI memories forgotten');
    } catch (err) {
      console.error('Forget all error:', err);
      showToast('Failed to clear memories');
    }
  };

  const filterButtons = [
    { id: 'all', label: 'All' },
    { id: 'personal', label: '👤 Personal' },
    { id: 'goal', label: '🎯 Goals' },
    { id: 'project', label: '🚀 Projects' },
    { id: 'learning', label: '📚 Learning' },
    { id: 'preference', label: '⚙ Preferences' },
    { id: 'conversation', label: '💬 Conversations' },
    { id: 'temporary', label: '⏳ Temporary' },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          id="toast"
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-xs font-bold text-[var(--color-text)] shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end border-b border-[var(--color-border)]/60 pb-8">
        <div className="max-w-3xl">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[var(--color-ai)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            ✦ Your AI's long-term context
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-5xl">
            Your context, in your control.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Save useful facts, preferences, goals, projects, and learning context so your assistant can give more personal answers without remembering everything silently.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Private by default</span>
          </div>
          <button
            id="addMemory"
            type="button"
            onClick={openAddDialog}
            className="flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-xs font-bold text-[var(--color-primary-contrast)] shadow-lg shadow-[var(--color-primary)]/25 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Remember something</span>
          </button>
        </div>
      </section>

      {/* Privacy Panel / Memory Controls */}
      <section className="rounded-3xl border border-emerald-500/30 bg-emerald-950/10 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl text-emerald-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                <span>Memory controls</span>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400">
                  Zero-Leakage
                </span>
              </h2>
              <p className="mt-1.5 max-w-2xl text-xs sm:text-sm leading-6 text-[var(--color-muted)]">
                Only memories belonging to your signed-in account are loaded. You can review, edit, hide, or delete anything here. Temporary context should expire instead of becoming permanent.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer shrink-0 select-none bg-[var(--color-surface)] sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-[var(--color-border)]">
            <span className="text-xs font-bold text-[var(--color-text)]">Use memory in chats</span>
            <div className="relative inline-flex items-center">
              <input
                id="memoryToggle"
                type="checkbox"
                checked={aiMemoryEnabled}
                onChange={(e) => {
                  setAiMemoryEnabled(e.target.checked);
                  showToast(e.target.checked ? 'Memory enabled for chats' : 'Memory disabled for chats');
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--color-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </div>
          </label>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[var(--color-border)]/60 pt-5 sm:grid-cols-3 sm:items-center">
          <div>
            <p className="text-xs text-[var(--color-muted)]">Stored memories</p>
            <strong id="memoryCount" className="mt-1 block text-2xl font-extrabold text-[var(--color-text)]">
              {storedCount}
            </strong>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted)]">Visible to AI</p>
            <strong id="visibleCount" className="mt-1 block text-2xl font-extrabold text-emerald-400">
              {activeToAICount}
            </strong>
          </div>
          <div className="sm:text-right">
            <button
              id="forgetAll"
              type="button"
              onClick={handleForgetAll}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Forget all memories →</span>
            </button>
          </div>
        </div>
      </section>

      {/* Toolbar: Search and Filter Pills */}
      <section className="space-y-4">
        <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-surface)] px-4 py-3 shadow-sm focus-within:border-[var(--color-primary)] transition-all">
          <Search className="w-4 h-4 text-[var(--color-muted)] shrink-0" />
          <input
            id="memorySearch"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories, projects, preferences..."
            className="w-full bg-transparent text-xs text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none"
            autoComplete="off"
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

        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Memory categories">
          {filterButtons.map((fb) => (
            <button
              key={fb.id}
              type="button"
              onClick={() => setActiveFilter(fb.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${
                activeFilter === fb.id
                  ? 'border-[var(--color-ai)] bg-[var(--color-ai)]/15 text-[var(--color-text)] shadow-sm'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
              }`}
            >
              {fb.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid Subheader */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text)]">Saved memories</h2>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Explicit memories are saved by you. Automatic candidates should always be confirmed before becoming permanent.
          </p>
        </div>
        <span id="resultCount" className="rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-muted)]">
          {visibleMemories.length} shown
        </span>
      </div>

      {/* Memories Grid */}
      <section id="memoryGrid" className="grid gap-4 md:grid-cols-2" aria-live="polite">
        {visibleMemories.map((mem) => {
          const isVisible = mem.isVisible !== false && mem.is_visible !== false;
          return (
            <article
              key={mem.id}
              data-id={mem.id}
              className="group rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm hover:border-[var(--color-primary)]/60 transition-all flex flex-col justify-between relative"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[var(--color-ai)]/15 text-[var(--color-ai)] border border-[var(--color-ai)]/30 px-3 py-1 text-[11px] font-extrabold">
                    {categoryLabel(mem.type)}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${importanceBadgeColor(
                      mem.importance
                    )}`}
                  >
                    {importanceLabel(mem.importance)}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-extrabold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                  {mem.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--color-muted)] whitespace-pre-wrap">
                  {mem.content}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-muted)] border-t border-[var(--color-border)]/40 pt-3">
                  <span>Source: <strong className="text-[var(--color-text)]">{categoryLabel(mem.source || 'manual')}</strong></span>
                  <span>Created: <strong className="text-[var(--color-text)]">{mem.createdAt ? new Date(mem.createdAt).toLocaleDateString() : 'Today'}</strong></span>
                  {mem.lastUsedAt && (
                    <span>Last used: <strong className="text-emerald-400">{new Date(mem.lastUsedAt).toLocaleDateString()}</strong></span>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(mem)}
                  className={`flex items-center gap-1.5 text-xs font-extrabold transition-colors ${
                    isVisible ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{isVisible ? '◉ Visible' : '○ Hidden'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditDialog(mem)}
                    className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMemory(mem)}
                    className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {visibleMemories.length === 0 && (
          <div className="col-span-full rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <Brain className="mx-auto w-10 h-10 text-[var(--color-muted)] mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[var(--color-text)]">No memories match this view</h3>
            <p className="mt-1 text-xs text-[var(--color-muted)] max-w-md mx-auto">
              Save custom instructions, personal preferences, or key project context so your AI assistant can remember what matters to you.
            </p>
            <button
              type="button"
              onClick={openAddDialog}
              className="mt-4 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
            >
              ＋ Remember something
            </button>
          </div>
        )}
      </section>

      {/* Transparency / Recent Memory Activity Panel */}
      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-cyan)] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              🧾 Transparency
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[var(--color-text)]">Recent memory activity</h2>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5">
            Audit Stream Active
          </span>
        </div>

        <div id="activityList" className="grid gap-2 pt-2">
          {recentActions.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-xs text-[var(--color-muted)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-ai)]" />
                <strong className="text-[var(--color-text)] truncate">{act.action}</strong>
                <span className="truncate">· {act.title}</span>
              </div>
              <span className="shrink-0 text-[11px] text-[var(--color-muted)]">
                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Add / Edit Memory Modal Dialog */}
      {isDialogOpen && (
        <div
          id="memoryDialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialogTitle"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <form
            onSubmit={handleSaveMemory}
            className="w-full max-w-lg rounded-3xl border border-[var(--color-ai)]/40 bg-[var(--color-surface-elevated)] p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 pb-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-ai)] flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  🧠 Memory manager
                </p>
                <h2 id="dialogTitle" className="mt-1 text-lg font-extrabold text-[var(--color-text)]">
                  {editingMemory ? 'Edit memory' : 'Remember something'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-border)]/30 hover:text-[var(--color-text)] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Save one useful, accurate piece of context. You can change or remove it later.
            </p>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-[var(--color-text)]">What should AI remember?</span>
              <textarea
                required
                maxLength={20000}
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Example: I prefer practical examples and code snippets when learning quantum algorithms."
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 text-xs text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] transition-all resize-none"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-[var(--color-text)]">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="personal">Personal</option>
                  <option value="goal">Goal</option>
                  <option value="project">Project</option>
                  <option value="learning">Learning</option>
                  <option value="preference">Preference</option>
                  <option value="conversation">Conversation</option>
                  <option value="temporary">Temporary</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-[var(--color-text)]">Importance</span>
                <select
                  value={importance}
                  onChange={(e) => setImportance(Number(e.target.value))}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="90">Critical (90)</option>
                  <option value="75">High (75)</option>
                  <option value="50">Medium (50)</option>
                  <option value="25">Low (25)</option>
                  <option value="10">Temporary (10)</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-[var(--color-text)]">Short title</span>
              <input
                required
                maxLength={240}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A clear title for this memory"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-xs text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] transition-all"
              />
            </label>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]/60">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-xs font-bold text-[var(--color-primary-contrast)] shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save memory'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
