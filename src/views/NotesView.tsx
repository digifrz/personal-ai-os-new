import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Star,
  Trash2,
  Archive,
  Edit3,
  Sparkles,
  Tag,
  Clock,
  X,
  Check,
  Paperclip,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NoteItem } from '../types';
import { createNote, updateNote, deleteNote, createTask, createFlashcard } from '../services/db';
import { askAI } from '../services/ai';
import { EmptyState } from '../components/common/EmptyState';
import { recordRecentAccess } from '../services/recentAccess';

interface NotesViewProps {
  notes: NoteItem[];
  isEditorOpen: boolean;
  onCloseEditor: () => void;
  onOpenEditor: () => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  isEditorOpen,
  onCloseEditor,
  onOpenEditor,
}) => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'archived' | 'trash'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editor state
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Personal');
  const [color, setColor] = useState<'Blue' | 'Amber' | 'Green' | 'Purple'>('Blue');
  const [targetAt, setTargetAt] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleOpenCreate = () => {
    setEditingNote(null);
    setTitle('');
    setBody('');
    setCategory('Personal');
    setColor('Blue');
    setTargetAt('');
    setTags([]);
    onOpenEditor();
  };

  const handleOpenEdit = (note: NoteItem) => {
    recordRecentAccess(
      {
        id: note.id,
        type: 'note',
        title: note.title,
        subtitle: `${note.category} Note`,
        category: note.category,
        color: note.color,
      },
      user?.uid
    );
    setEditingNote(note);
    setTitle(note.title);
    setBody(note.body);
    setCategory(note.category);
    setColor(note.color);
    setTargetAt(note.targetAt || '');
    setTags(note.tags || []);
    onOpenEditor();
  };

  // Quick re-entry auto-open support from Dashboard Recently Accessed
  React.useEffect(() => {
    try {
      const targetId = localStorage.getItem('paio_open_note_id');
      if (targetId && notes.length > 0) {
        const found = notes.find((n) => n.id === targetId);
        if (found) {
          handleOpenEdit(found);
          localStorage.removeItem('paio_open_note_id');
        }
      }
    } catch {}
  }, [notes]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    try {
      if (editingNote) {
        await updateNote(editingNote.id, {
          title: title.trim(),
          body: body.trim(),
          category,
          color,
          targetAt: targetAt || null,
          tags,
        });
        showToast('Note updated.');
      } else {
        await createNote({
          userId: user.uid,
          title: title.trim(),
          body: body.trim(),
          category,
          color,
          targetAt: targetAt || null,
          tags,
          isPinned: false,
          isArchived: false,
          isTrashed: false,
        });
        showToast('Note created.');
      }
      onCloseEditor();
    } catch (err) {
      showToast('Failed to save note.');
    }
  };

  const handleTogglePin = async (note: NoteItem) => {
    await updateNote(note.id, { isPinned: !note.isPinned });
    showToast(note.isPinned ? 'Note unpinned' : 'Note pinned to favorites');
  };

  const handleToggleArchive = async (note: NoteItem) => {
    await updateNote(note.id, { isArchived: !note.isArchived, isTrashed: false });
    showToast(note.isArchived ? 'Note restored' : 'Note archived');
  };

  const handleTrashNote = async (note: NoteItem) => {
    await updateNote(note.id, { isTrashed: true, isArchived: false });
    showToast('Note moved to trash.');
  };

  const handlePermanentDelete = async (id: string) => {
    await deleteNote(id);
    showToast('Note permanently deleted.');
    if (editingNote?.id === id) onCloseEditor();
  };

  const handleRestoreFromTrash = async (note: NoteItem) => {
    await updateNote(note.id, { isTrashed: false, isArchived: false });
    showToast('Note restored from trash.');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // AI Helpers
  const handleAISummarize = async () => {
    if (!body.trim()) return showToast('Add note content first.');
    setAiLoading(true);
    try {
      const summary = await askAI({
        prompt: `Provide a concise, 3-bullet summary of this note:\n\nTitle: ${title}\nContent: ${body}`,
        mode: 'chat',
      });
      setBody((prev) => `${prev}\n\n### ✦ AI Summary:\n${summary}`);
      showToast('Summary generated.');
    } catch (e) {
      showToast('AI could not summarize note.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIExtractTasks = async () => {
    if (!user || !body.trim()) return showToast('Add note content first.');
    setAiLoading(true);
    try {
      const taskSuggestions = await askAI({
        prompt: `Extract actionable tasks from this note. Return each task formatted as [TASK: Title | Priority(high/medium/low) | Category]:\n\n${title}\n${body}`,
        mode: 'suggest_tasks',
      });

      // Parse matches or create default task
      const regex = /\[TASK:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\]/g;
      let match;
      let count = 0;
      while ((match = regex.exec(taskSuggestions)) !== null) {
        const [, taskTitle, priorityVal, taskCategory] = match;
        const validPriority = ['high', 'medium', 'low'].includes(priorityVal.toLowerCase())
          ? (priorityVal.toLowerCase() as 'high' | 'medium' | 'low')
          : 'medium';

        await createTask({
          userId: user.uid,
          title: taskTitle,
          description: `Extracted from note: ${title}`,
          status: 'open',
          priority: validPriority,
          category: taskCategory || category,
        });
        count++;
      }

      if (count === 0) {
        await createTask({
          userId: user.uid,
          title: `Action items from: ${title}`,
          description: body.slice(0, 200),
          status: 'open',
          priority: 'medium',
          category,
        });
        count = 1;
      }

      showToast(`Created ${count} task(s) from note! Check Tasks tab.`);
    } catch (e) {
      showToast('Could not extract tasks.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIToFlashcards = async () => {
    if (!user || !body.trim()) return showToast('Add note content first.');
    setAiLoading(true);
    try {
      const response = await askAI({
        prompt: `Create 2-3 study flashcards from this note. Format as: Front: [question/concept] | Back: [explanation/answer]:\n\n${title}\n${body}`,
        mode: 'study_quiz',
      });

      const lines = response.split('\n');
      for (const line of lines) {
        if (line.includes('|')) {
          const parts = line.split('|');
          const front = parts[0].replace(/Front:\s*/i, '').trim();
          const back = parts[1].replace(/Back:\s*/i, '').trim();
          if (front && back) {
            await createFlashcard({
              userId: user.uid,
              front,
              back,
            });
          }
        }
      }
      showToast('Flashcards generated into Learning Center!');
    } catch (e) {
      showToast('Could not generate flashcards.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyTemplate = (type: 'meeting' | 'plan' | 'journal') => {
    if (type === 'meeting') {
      setTitle('Meeting Notes: [Topic]');
      setBody('**Date:** ' + new Date().toLocaleDateString() + '\n**Attendees:** \n\n### Agenda\n- \n\n### Decisions\n- \n\n### Next Steps\n- [ ] ');
    } else if (type === 'plan') {
      setTitle('Project Plan: [Objective]');
      setBody('### Objective\n\n### Key Deliverables\n1. \n2. \n\n### Milestones & Timelines\n- \n\n### Risks\n- ');
    } else {
      setTitle('Daily Reflection: ' + new Date().toLocaleDateString());
      setBody('### What went well today?\n- \n\n### What challenged me?\n- \n\n### Tomorrow I will focus on:\n- ');
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || (n.tags || []).some((t) => t.includes(q));
      if (!match) return false;
    }

    if (activeFilter === 'all') {
      if (n.isTrashed || n.isArchived) return false;
    } else if (activeFilter === 'favorites') {
      if (n.isTrashed || n.isArchived || !n.isPinned) return false;
    } else if (activeFilter === 'archived') {
      if (!n.isArchived || n.isTrashed) return false;
    } else if (activeFilter === 'trash') {
      if (!n.isTrashed) return false;
    }

    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    if (colorFilter !== 'all' && n.color !== colorFilter) return false;

    return true;
  });

  const colorBorder = {
    Blue: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    Amber: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    Green: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    Purple: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[150] rounded-xl border border-[var(--color-primary)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-xs font-bold text-[var(--color-text)] shadow-xl animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
            Your thinking space
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Capture ideas, keep momentum.
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Write freely, organize what matters, and let AI turn your notes into execution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-muted)]">
            {notes.filter((n) => !n.isTrashed).length} notes · {notes.filter((n) => n.isPinned && !n.isTrashed).length} pinned
          </span>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New note</span>
          </button>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="flex flex-wrap items-center gap-2">
        {(['all', 'favorites', 'archived', 'trash'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all border ${
              activeFilter === filter
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-text)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)]/50'
            }`}
          >
            {filter === 'favorites' ? '★ Favorites' : filter}
          </button>
        ))}

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] outline-none"
        >
          <option value="all">Category: All</option>
          <option value="Planning">Planning</option>
          <option value="Personal">Personal</option>
          <option value="Work">Work</option>
          <option value="Learning">Learning</option>
        </select>

        <select
          value={colorFilter}
          onChange={(e) => setColorFilter(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] outline-none"
        >
          <option value="all">Colors: All</option>
          <option value="Blue">Blue</option>
          <option value="Amber">Amber</option>
          <option value="Green">Green</option>
          <option value="Purple">Purple</option>
        </select>

        <div className="ml-auto flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs focus-within:border-[var(--color-primary)]">
          <Search className="w-3.5 h-3.5 text-[var(--color-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes &amp; tags..."
            className="bg-transparent text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
          />
        </div>
      </section>

      {/* Notes Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note) => (
          <article
            key={note.id}
            className="group relative flex flex-col justify-between rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm hover:border-[var(--color-primary)] hover:-translate-y-0.5 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${colorBorder[note.color]}`}>
                  {note.category}
                </span>
                <button
                  type="button"
                  onClick={() => handleTogglePin(note)}
                  className={`text-sm ${note.isPinned ? 'text-amber-400' : 'text-[var(--color-muted)] hover:text-amber-400'}`}
                >
                  <Star className="w-4 h-4" fill={note.isPinned ? 'currentColor' : 'none'} />
                </button>
              </div>

              <h3
                onClick={() => handleOpenEdit(note)}
                className="mt-3 text-base font-bold text-[var(--color-text)] cursor-pointer hover:text-[var(--color-primary)] transition-colors"
              >
                {note.title}
              </h3>

              <p
                onClick={() => handleOpenEdit(note)}
                className="mt-1.5 text-xs text-[var(--color-muted)] line-clamp-3 leading-5 cursor-pointer"
              >
                {note.body}
              </p>

              {note.tags && note.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {note.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted)]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-[var(--color-border)]/60 text-[11px] text-[var(--color-muted)]">
              <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
              <div className="flex items-center gap-2">
                {activeFilter === 'trash' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRestoreFromTrash(note)}
                      className="text-[var(--color-primary)] font-bold hover:underline"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePermanentDelete(note.id)}
                      className="text-red-400 font-bold hover:underline"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(note)}
                      className="hover:text-[var(--color-text)]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(note)}
                      className="hover:text-[var(--color-text)]"
                    >
                      {note.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTrashNote(note)}
                      className="hover:text-red-400"
                    >
                      Trash
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}

        {filteredNotes.length === 0 && (
          <div className="col-span-full py-8">
            <EmptyState
              icon={FileText}
              title={searchQuery ? 'No matching notes' : 'No notes in this view'}
              description={
                searchQuery
                  ? 'Try searching with different keywords, tags, or clear your active filters.'
                  : 'Capture ideas, study insights, meeting agendas, and reflections in markdown.'
              }
              actionLabel={searchQuery ? 'Clear Search' : 'Create Note'}
              onAction={searchQuery ? () => setSearchQuery('') : handleOpenCreate}
            />
          </div>
        )}
      </section>

      {/* Rich Note Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--color-bg)]/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                  {editingNote ? 'Edit Note' : 'New Note'}
                </p>
                <h3 className="text-lg font-bold text-[var(--color-text)]">
                  {editingNote ? 'Modify workspace note' : 'Write something worth remembering'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseEditor}
                className="rounded-lg p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Templates */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--color-muted)] text-[11px]">Templates:</span>
              <button
                type="button"
                onClick={() => applyTemplate('meeting')}
                className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-[11px] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
              >
                Meeting
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('plan')}
                className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-[11px] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
              >
                Project Plan
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('journal')}
                className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-[11px] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
              >
                Reflection
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Note"
                  className="w-full bg-transparent text-xl font-bold text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                />
              </div>

              {/* Categories & Colors & Target Time */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                  <span>Category:</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-xs text-[var(--color-text)] outline-none"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Work">Work</option>
                    <option value="Planning">Planning</option>
                    <option value="Learning">Learning</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                  <span>Color:</span>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value as any)}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-xs text-[var(--color-text)] outline-none"
                  >
                    <option value="Blue">Blue</option>
                    <option value="Amber">Amber</option>
                    <option value="Green">Green</option>
                    <option value="Purple">Purple</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                  <span>Target Time:</span>
                  <input
                    type="datetime-local"
                    value={targetAt}
                    onChange={(e) => setTargetAt(e.target.value)}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-1 text-xs text-[var(--color-text)] outline-none"
                  />
                </div>
              </div>

              {/* Content Body */}
              <div>
                <textarea
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write something worth remembering..."
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-all leading-relaxed"
                />
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tags (press Enter)..."
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-muted)] hover:border-[var(--color-primary)]"
                  >
                    ＋ Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        onClick={() => handleRemoveTag(t)}
                        className="flex items-center gap-1 rounded-md bg-[var(--color-bg-secondary)] px-2 py-0.5 text-xs text-[var(--color-primary)] cursor-pointer hover:line-through"
                      >
                        #{t} ×
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Note Utilities */}
              <div className="rounded-2xl border border-[var(--color-ai)]/30 bg-[var(--color-ai-soft)]/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--color-ai)]">
                    ✦ AI Note Utilities
                  </span>
                  {aiLoading && (
                    <span className="text-[11px] text-[var(--color-muted)] animate-pulse">
                      Processing…
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={handleAISummarize}
                    className="rounded-lg border border-[var(--color-ai)]/40 bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-ai)]"
                  >
                    Summarize note
                  </button>
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={handleAIExtractTasks}
                    className="rounded-lg border border-[var(--color-ai)]/40 bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-ai)]"
                  >
                    Extract tasks
                  </button>
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={handleAIToFlashcards}
                    className="rounded-lg border border-[var(--color-ai)]/40 bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-ai)]"
                  >
                    Convert to flashcards
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-[var(--color-border)]">
                {editingNote ? (
                  <button
                    type="button"
                    onClick={() => handleTrashNote(editingNote)}
                    className="text-xs font-bold text-red-400 hover:underline"
                  >
                    Move to trash
                  </button>
                ) : <span />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onCloseEditor}
                    className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:border-[var(--color-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] shadow-sm"
                  >
                    Save note
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
