import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  CheckSquare,
  FileText,
  FolderKanban,
  Calendar,
  ArrowRight,
  Mic,
  MicOff,
  Clock,
  X,
  Trash2,
  Layers,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { TaskItem, NoteItem, FileItem, CalendarEventItem, ViewTab } from '../types';
import { askAI } from '../services/ai';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

interface SearchViewProps {
  tasks: TaskItem[];
  notes: NoteItem[];
  files: FileItem[];
  events: CalendarEventItem[];
  setActiveTab: (tab: ViewTab) => void;
}

const SEARCH_HISTORY_KEY = 'personal_ai_os_search_history';
const DEFAULT_HISTORY = ['physics problem', 'quantum mechanics', 'meeting notes', 'project plan'];

export const SearchView: React.FC<SearchViewProps> = ({
  tasks,
  notes,
  files,
  events,
  setActiveTab,
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'notes' | 'files' | 'events'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Voice Search States
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Search History State
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_HISTORY;
  });

  // Save history to localStorage and Firestore
  const saveToHistory = (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;

    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage search history write warning:', err);
      }
      return updated;
    });

    // Optionally sync with Firestore if authenticated
    if (user?.uid) {
      try {
        const sanitizedId = clean.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40);
        const historyDocRef = doc(db, 'users', user.uid, 'search_history', sanitizedId);
        setDoc(
          historyDocRef,
          {
            query: clean,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});
      } catch {
        // silent fallback
      }
    }
  };

  const removeHistoryItem = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item !== termToRemove);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    if (user?.uid) {
      try {
        const sanitizedId = termToRemove.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40);
        deleteDoc(doc(db, 'users', user.uid, 'search_history', sanitizedId)).catch(() => {});
      } catch {
        // silent fallback
      }
    }
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // ignore
    }
  };

  // Voice Search Trigger
  const toggleVoiceSearch = () => {
    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setQuery(transcript);

        if (event.results[0] && event.results[0].isFinal) {
          saveToHistory(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (event.error !== 'aborted') {
          setSpeechError(`Voice recognition: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start voice recognition:', err);
      setIsListening(false);
      setSpeechError('Could not start microphone search. Please check your browser audio permissions.');
    }
  };

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const q = query.trim().toLowerCase();

  // Search Match Filtering
  const matchingTasks = tasks.filter((t) => {
    const matchesQuery = !q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'all' || (t.category || '').toLowerCase() === categoryFilter.toLowerCase();
    return matchesQuery && matchesCategory;
  });

  const matchingNotes = notes.filter((n) => {
    const matchesQuery =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.body.toLowerCase().includes(q) ||
      (n.tags || []).some((t) => t.toLowerCase().includes(q));
    const matchesCategory = categoryFilter === 'all' || (n.category || '').toLowerCase() === categoryFilter.toLowerCase();
    return matchesQuery && matchesCategory;
  });

  const matchingFiles = files.filter((f) => {
    return !q || f.name.toLowerCase().includes(q);
  });

  const matchingEvents = events.filter((e) => {
    const matchesQuery = !q || e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'all' || (e.category || '').toLowerCase() === categoryFilter.toLowerCase();
    return matchesQuery && matchesCategory;
  });

  // Extract distinct category tags across matching workspace items for secondary filtering
  const availableCategories = Array.from(
    new Set([
      ...tasks.map((t) => t.category).filter(Boolean),
      ...notes.map((n) => n.category).filter(Boolean),
      ...events.map((e) => e.category).filter(Boolean),
    ])
  );

  const handleAskAI = async () => {
    if (!q) return;
    saveToHistory(query);
    setAiLoading(true);
    try {
      const summary = await askAI({
        prompt:
          `Search query across workspace: "${query}". Based on matching items:\n` +
          `Tasks: ${matchingTasks.map((t) => t.title).join(', ')}\n` +
          `Notes: ${matchingNotes.map((n) => n.title).join(', ')}\n` +
          `Files: ${matchingFiles.map((f) => f.name).join(', ')}\n` +
          `Events: ${matchingEvents.map((e) => e.title).join(', ')}\n` +
          `Synthesize what the user needs to know about "${query}" in their workspace.`,
        mode: 'chat',
      });
      setAiAnswer(summary);
    } catch {
      setAiAnswer('Could not perform AI synthesis for this search.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectHistoryItem = (term: string) => {
    setQuery(term);
    saveToHistory(term);
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
            Search across tasks, notes, cloud files, calendar events, and voice-assisted queries.
          </p>
        </div>
      </section>

      {/* Voice Recognition Error Notice */}
      {speechError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{speechError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSpeechError(null)}
            className="rounded-lg p-1 hover:bg-red-500/20 text-red-400 hover:text-red-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Input Bar with Voice-to-Text Button */}
      <div className="relative">
        <div
          className={`flex items-center gap-2 rounded-2xl border bg-[var(--color-surface)] p-2.5 sm:p-3 shadow-lg transition-all ${
            isListening
              ? 'border-red-500 ring-4 ring-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.25)]'
              : 'border-[var(--color-primary)]/70 focus-within:ring-2 focus-within:ring-[var(--color-primary)]/25'
          }`}
        >
          <Search className="w-5 h-5 text-[var(--color-primary)] shrink-0 ml-1.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveToHistory(query);
                handleAskAI();
              }
            }}
            placeholder={
              isListening
                ? 'Listening... Speak your query clearly into the microphone'
                : 'Search by title, keywords, tags, or speak with microphone...'
            }
            className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] px-1"
          />

          {/* Clear query button */}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              title="Clear search"
              className="rounded-xl p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/40 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice-to-Text Button */}
          <button
            type="button"
            onClick={toggleVoiceSearch}
            title={isListening ? 'Stop voice recording' : 'Search with voice microphone'}
            className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all shrink-0 select-none ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 text-white animate-spin" />
                <span className="hidden sm:inline">Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="hidden sm:inline">Voice</span>
              </>
            )}
          </button>

          {/* AI Synthesize Button */}
          {query && (
            <button
              type="button"
              onClick={handleAskAI}
              disabled={aiLoading}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--color-ai)] px-3.5 py-2 text-xs font-bold text-white hover:bg-[var(--color-ai)]/90 transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiLoading ? 'Synthesizing…' : 'AI Synthesize'}</span>
            </button>
          )}
        </div>

        {/* Live Listening Pulse Wave Indicator */}
        {isListening && (
          <div className="mt-2 flex items-center gap-2 px-3 text-xs font-medium text-red-400">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>Microphone active • Speak your query to search or ask questions</span>
          </div>
        )}
      </div>

      {/* Search History Row */}
      {searchHistory.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-surface)]/60 p-3.5 space-y-2.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
              <Clock className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>Recent Searches</span>
            </div>
            <button
              type="button"
              onClick={clearAllHistory}
              className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-muted)] hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {searchHistory.map((term) => (
              <div
                key={term}
                onClick={() => handleSelectHistoryItem(term)}
                className={`group inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium cursor-pointer transition-all ${
                  query.toLowerCase() === term.toLowerCase()
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-text)] shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)]/60 hover:text-[var(--color-text)]'
                }`}
              >
                <Search className="w-3 h-3 text-[var(--color-muted)] group-hover:text-[var(--color-primary)]" />
                <span>{term}</span>
                <button
                  type="button"
                  onClick={(e) => removeHistoryItem(term, e)}
                  title={`Remove "${term}" from history`}
                  className="ml-1 rounded-md p-0.5 text-[var(--color-muted)] hover:text-red-400 hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
            Filter Results By Category
          </div>
          <span className="text-xs font-semibold text-[var(--color-primary)]">
            {totalMatches} matching {totalMatches === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Primary Type Filter Chips */}
        <div className="flex flex-wrap items-center gap-2.5">
          {[
            {
              id: 'all',
              label: 'All Categories',
              icon: Layers,
              count: matchingTasks.length + matchingNotes.length + matchingFiles.length + matchingEvents.length,
              color: 'text-[var(--color-primary)]',
            },
            {
              id: 'tasks',
              label: 'Tasks',
              icon: CheckSquare,
              count: matchingTasks.length,
              color: 'text-emerald-400',
            },
            {
              id: 'notes',
              label: 'Notes',
              icon: FileText,
              count: matchingNotes.length,
              color: 'text-amber-400',
            },
            {
              id: 'files',
              label: 'Files',
              icon: FolderKanban,
              count: matchingFiles.length,
              color: 'text-blue-400',
            },
            {
              id: 'events',
              label: 'Calendar Events',
              icon: Calendar,
              count: matchingEvents.length,
              color: 'text-pink-400',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border shadow-sm ${
                  isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-text)] ring-2 ring-[var(--color-primary)]/30'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[var(--color-primary)]' : tab.color}`} />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-border)] text-[var(--color-muted)]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Sub-Category Tags Filter Chips (e.g. Learning, Work, Personal) */}
        {availableCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-[var(--color-muted)] flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3" />
              Tag:
            </span>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                categoryFilter === 'all'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-text)] font-bold'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)]/60 text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              All Tags
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                  categoryFilter.toLowerCase() === cat.toLowerCase()
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/25 text-[var(--color-text)] font-bold'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]/60 text-[var(--color-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
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

