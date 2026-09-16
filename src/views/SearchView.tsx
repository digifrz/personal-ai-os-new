import React, { useState } from 'react';
import { Search, Sparkles, CheckSquare, FileText, FolderKanban, Calendar, ArrowRight } from 'lucide-react';
import { TaskItem, NoteItem, FileItem, CalendarEventItem, ViewTab } from '../types';
import { askAI } from '../services/ai';

interface SearchViewProps {
  tasks: TaskItem[];
  notes: NoteItem[];
  files: FileItem[];
  events: CalendarEventItem[];
  setActiveTab: (tab: ViewTab) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  tasks,
  notes,
  files,
  events,
  setActiveTab,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'notes' | 'files' | 'events'>('all');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const q = query.trim().toLowerCase();

  const matchingTasks = tasks.filter(
    (t) => !q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
  );

  const matchingNotes = notes.filter(
    (n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || (n.tags || []).some((t) => t.includes(q))
  );

  const matchingFiles = files.filter(
    (f) => !q || f.name.toLowerCase().includes(q)
  );

  const matchingEvents = events.filter(
    (e) => !q || e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)
  );

  const handleAskAI = async () => {
    if (!q) return;
    setAiLoading(true);
    try {
      const summary = await askAI({
        prompt: `Search query across workspace: "${query}". Based on matching items:\n` +
          `Tasks: ${matchingTasks.map((t) => t.title).join(', ')}\n` +
          `Notes: ${matchingNotes.map((n) => n.title).join(', ')}\n` +
          `Files: ${matchingFiles.map((f) => f.name).join(', ')}\n` +
          `Events: ${matchingEvents.map((e) => e.title).join(', ')}\n` +
          `Synthesize what the user needs to know about "${query}" in their workspace.`,
        mode: 'chat',
      });
      setAiAnswer(summary);
    } catch (e) {
      setAiAnswer('Could not perform AI synthesis for this search.');
    } finally {
      setAiLoading(false);
    }
  };

  const totalMatches =
    (filterType === 'all' || filterType === 'tasks' ? matchingTasks.length : 0) +
    (filterType === 'all' || filterType === 'notes' ? matchingNotes.length : 0) +
    (filterType === 'all' || filterType === 'files' ? matchingFiles.length : 0) +
    (filterType === 'all' || filterType === 'events' ? matchingEvents.length : 0);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
            Universal Workspace Search
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Find anything instantly.
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Search across tasks, notes, cloud files, calendar events, and AI summaries.
          </p>
        </div>
      </section>

      {/* Search Input Bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-primary)]/70 bg-[var(--color-surface)] p-3 shadow-lg focus-within:ring-2 focus-within:ring-[var(--color-primary)]/25">
        <Search className="w-5 h-5 text-[var(--color-primary)] shrink-0 ml-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAskAI();
          }}
          placeholder="Search by title, keywords, tags, or ask AI a synthesis question..."
          className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
        />
        {query && (
          <button
            type="button"
            onClick={handleAskAI}
            disabled={aiLoading}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-ai)] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-ai)]/90 transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{aiLoading ? 'Synthesizing…' : 'AI Synthesize'}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'tasks', 'notes', 'files', 'events'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize transition-all border ${
              filterType === type
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-text)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)]/40'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* AI Answer Card */}
      {aiAnswer && (
        <div className="rounded-3xl border border-[var(--color-ai)]/40 bg-[var(--color-ai-soft)]/20 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-ai)]">
            <Sparkles className="w-4 h-4" />
            <span>AI Workspace Synthesis</span>
          </div>
          <p className="text-xs text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
            {aiAnswer}
          </p>
        </div>
      )}

      {/* Results Sections */}
      <div className="space-y-6">
        {/* Tasks matches */}
        {(filterType === 'all' || filterType === 'tasks') && matchingTasks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
              Tasks ({matchingTasks.length})
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {matchingTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setActiveTab('tasks')}
                  className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 cursor-pointer hover:border-[var(--color-primary)] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <div>
                      <strong className="block text-xs font-bold text-[var(--color-text)]">
                        {t.title}
                      </strong>
                      <small className="text-[11px] text-[var(--color-muted)]">
                        Priority: {t.priority} · {t.category}
                      </small>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes matches */}
        {(filterType === 'all' || filterType === 'notes') && matchingNotes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
              Notes ({matchingNotes.length})
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {matchingNotes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setActiveTab('notes')}
                  className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 cursor-pointer hover:border-[var(--color-primary)] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <div>
                      <strong className="block text-xs font-bold text-[var(--color-text)]">
                        {n.title}
                      </strong>
                      <small className="text-[11px] text-[var(--color-muted)] line-clamp-1">
                        {n.body}
                      </small>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files matches */}
        {(filterType === 'all' || filterType === 'files') && matchingFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
              Files ({matchingFiles.length})
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {matchingFiles.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setActiveTab('files')}
                  className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 cursor-pointer hover:border-[var(--color-primary)] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <FolderKanban className="w-4 h-4 text-blue-400" />
                    <div>
                      <strong className="block text-xs font-bold text-[var(--color-text)]">
                        {f.name}
                      </strong>
                      <small className="text-[11px] text-[var(--color-muted)]">
                        Cloud storage item
                      </small>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events matches */}
        {(filterType === 'all' || filterType === 'events') && matchingEvents.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
              Calendar Events ({matchingEvents.length})
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {matchingEvents.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setActiveTab('calendar')}
                  className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 cursor-pointer hover:border-[var(--color-primary)] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-pink-400" />
                    <div>
                      <strong className="block text-xs font-bold text-[var(--color-text)]">
                        {e.title}
                      </strong>
                      <small className="text-[11px] text-[var(--color-muted)]">
                        {new Date(e.startsAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {totalMatches === 0 && (
          <div className="rounded-3xl border border-dashed border-[var(--color-border)] p-12 text-center text-xs text-[var(--color-muted)]">
            No matching items found for "{query}".
          </div>
        )}
      </div>
    </div>
  );
};
