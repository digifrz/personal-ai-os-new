import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  File,
  CheckCircle2,
  FolderOpen,
  Calendar,
} from 'lucide-react';
import { NoteItem, FileItem } from '../types';
import { updateNote, deleteNote, updateFile, deleteFile } from '../services/db';

interface TrashViewProps {
  notes: NoteItem[];
  files: FileItem[];
  onLogActivity?: (action: string, entityType: string, entityTitle: string, details?: string) => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ notes, files, onLogActivity }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'files'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Only items where isTrashed is explicitly true
  const trashedNotes = notes.filter((n) => n.isTrashed === true);
  const trashedFiles = files.filter((f) => f.isTrashed === true);

  const totalTrashedCount = trashedNotes.length + trashedFiles.length;

  const handleRestoreNote = async (note: NoteItem) => {
    try {
      await updateNote(note.id, { isTrashed: false, isArchived: false });
      showToast(`Restored note "${note.title}" to Notes.`);
      onLogActivity?.('restored', 'note', note.title, 'Restored from Trash');
    } catch (e) {
      showToast('Failed to restore note.');
    }
  };

  const handlePermanentDeleteNote = async (note: NoteItem) => {
    if (!confirm(`Permanently delete "${note.title}"? This cannot be undone.`)) return;
    try {
      await deleteNote(note.id);
      showToast(`Permanently deleted note "${note.title}".`);
      onLogActivity?.('deleted', 'note', note.title, 'Permanently purged from Trash');
    } catch (e) {
      showToast('Failed to permanently delete note.');
    }
  };

  const handleRestoreFile = async (file: FileItem) => {
    try {
      await updateFile(file.id, { isTrashed: false, isArchived: false });
      showToast(`Restored file "${file.name}" to Files.`);
      onLogActivity?.('restored', 'file', file.name, 'Restored from Trash');
    } catch (e) {
      showToast('Failed to restore file.');
    }
  };

  const handlePermanentDeleteFile = async (file: FileItem) => {
    if (!confirm(`Permanently delete "${file.name}"? This cannot be undone.`)) return;
    try {
      await deleteFile(file.id, file.storagePath);
      showToast(`Permanently deleted file "${file.name}".`);
      onLogActivity?.('deleted', 'file', file.name, 'Permanently purged from Trash');
    } catch (e) {
      showToast('Failed to permanently delete file.');
    }
  };

  const handleEmptyAllTrash = async () => {
    if (totalTrashedCount === 0) return;
    if (
      !confirm(
        `Are you sure you want to permanently delete all ${totalTrashedCount} item(s) in Trash? This action cannot be reversed.`
      )
    )
      return;

    try {
      for (const n of trashedNotes) {
        await deleteNote(n.id);
      }
      for (const f of trashedFiles) {
        await deleteFile(f.id, f.storagePath);
      }
      showToast('Trash emptied successfully.');
      onLogActivity?.('purged', 'system', 'All Trash Items', `Purged ${totalTrashedCount} items`);
    } catch (e) {
      showToast('Error emptying trash.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[200] rounded-2xl border border-[var(--color-primary)] bg-[var(--color-surface-elevated)] px-4 py-3 text-xs font-bold text-[var(--color-text)] shadow-2xl animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-text)]">
              Trash &amp; Deleted Items
            </h1>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              Items deleted from Notes and Files are safely held here.
            </p>
          </div>
        </div>

        {totalTrashedCount > 0 && (
          <button
            type="button"
            onClick={handleEmptyAllTrash}
            className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all shadow-sm"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Empty Trash ({totalTrashedCount})</span>
          </button>
        )}
      </section>

      {/* Empty State when nothing is deleted */}
      {totalTrashedCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] py-20 px-6 text-center space-y-4 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-muted)]">
            <Trash2 className="w-8 h-8 opacity-40" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h2 className="text-lg font-bold text-[var(--color-text)]">Trash is empty</h2>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              There are no deleted notes or files. When you delete items from your workspace, they will be securely stored here until you choose to restore or permanently remove them.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Workspace clean &amp; synchronized</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs Filter */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-xl px-3.5 py-1.5 font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              All Items ({totalTrashedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`rounded-xl px-3.5 py-1.5 font-bold transition-all ${
                activeTab === 'notes'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Notes ({trashedNotes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`rounded-xl px-3.5 py-1.5 font-bold transition-all ${
                activeTab === 'files'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Files ({trashedFiles.length})
            </button>
          </div>

          {/* List of Trashed Notes */}
          {(activeTab === 'all' || activeTab === 'notes') && trashedNotes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Deleted Notes ({trashedNotes.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trashedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm space-y-3 hover:border-[var(--color-border-hover)] transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                          {note.category || 'Note'}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted)]">
                          {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-[var(--color-text)] line-clamp-1">
                        {note.title}
                      </h4>
                      <p className="mt-1 text-xs text-[var(--color-muted)] line-clamp-2">
                        {note.body || 'Empty note'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--color-border)]/60 pt-3">
                      <button
                        type="button"
                        onClick={() => handleRestoreNote(note)}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermanentDeleteNote(note)}
                        className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Forever</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List of Trashed Files */}
          {(activeTab === 'all' || activeTab === 'files') && trashedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
                <File className="w-3.5 h-3.5 text-cyan-400" />
                <span>Deleted Files ({trashedFiles.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trashedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm space-y-3 hover:border-[var(--color-border-hover)] transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                          {file.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted)]">
                          {((file.sizeBytes || 0) / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-[var(--color-text)] line-clamp-1">
                        {file.name}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
                        Deleted from workspace files
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--color-border)]/60 pt-3">
                      <button
                        type="button"
                        onClick={() => handleRestoreFile(file)}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermanentDeleteFile(file)}
                        className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Forever</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
