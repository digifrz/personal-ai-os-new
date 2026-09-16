import React, { useState, useRef } from 'react';
import {
  FolderKanban,
  Upload,
  FolderPlus,
  Search,
  Star,
  Trash2,
  Archive,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileCode,
  File,
  X,
  ChevronRight,
  Folder,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FileItem } from '../types';
import {
  uploadWorkspaceFile,
  createFolder,
  updateFile,
  deleteFile,
  createFlashcard,
} from '../services/db';
import { askAI } from '../services/ai';

interface FilesViewProps {
  files: FileItem[];
}

export const FilesView: React.FC<FilesViewProps> = ({ files }) => {
  const { user } = useAuth();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorite' | 'archive' | 'trash'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleFileUpload = async (selectedFiles: FileList | null) => {
    if (!user || !selectedFiles || selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(`Uploading ${selectedFiles.length} file(s) to Firebase Storage…`);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        await uploadWorkspaceFile(user.uid, file, currentFolderId);
      }
      showToast('Files uploaded successfully to Cloud Storage.');
    } catch (err: any) {
      console.error('File upload error:', err);
      showToast('Failed to upload file. Check storage connectivity.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateFolder = async () => {
    if (!user) return;
    const name = prompt('Folder name:');
    if (!name?.trim()) return;
    try {
      await createFolder(user.uid, name.trim(), currentFolderId);
      showToast(`Folder "${name.trim()}" created.`);
    } catch (err) {
      showToast('Could not create folder.');
    }
  };

  const handleToggleFavorite = async (file: FileItem) => {
    await updateFile(file.id, { isFavorite: !file.isFavorite });
    showToast(file.isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleToggleArchive = async (file: FileItem) => {
    await updateFile(file.id, { isArchived: !file.isArchived, isTrashed: false });
    showToast(file.isArchived ? 'Restored from archive' : 'File archived');
  };

  const handleTrashFile = async (file: FileItem) => {
    await updateFile(file.id, { isTrashed: true, isArchived: false });
    showToast('File moved to trash.');
  };

  const handleRestoreFile = async (file: FileItem) => {
    await updateFile(file.id, { isTrashed: false, isArchived: false });
    showToast('File restored.');
  };

  const handlePermanentDelete = async (file: FileItem) => {
    if (!confirm(`Permanently delete "${file.name}"? This cannot be undone.`)) return;
    await deleteFile(file.id, file.storagePath);
    showToast('File permanently deleted.');
  };

  const handleRename = async (file: FileItem) => {
    const nextName = prompt('New name:', file.name);
    if (!nextName?.trim() || nextName.trim() === file.name) return;
    await updateFile(file.id, { name: nextName.trim() });
    showToast('File renamed.');
  };

  // AI File Summarizer
  const handleAISummarizeFile = async (file: FileItem) => {
    showToast(`Analyzing ${file.name} with AI…`);
    try {
      const summary = await askAI({
        prompt: `Provide a detailed summary and next useful actions for this workspace file: ${file.name} (type: ${file.mimeType}, size: ${file.sizeBytes} bytes).`,
        mode: 'chat',
      });
      alert(`AI Insights for ${file.name}:\n\n${summary}`);
    } catch (e) {
      showToast('AI could not analyze file.');
    }
  };

  // Filter files
  const currentFolder = currentFolderId ? files.find((f) => f.id === currentFolderId) : null;

  const filteredFiles = files.filter((f) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!f.name.toLowerCase().includes(q)) return false;
    }

    if (activeFilter === 'all') {
      if (f.isTrashed || f.isArchived) return false;
      // If we are browsing inside a folder, only show items inside it
      if (currentFolderId) {
        return f.folderId === currentFolderId;
      } else {
        return !f.folderId;
      }
    } else if (activeFilter === 'favorite') {
      return !f.isTrashed && !f.isArchived && f.isFavorite;
    } else if (activeFilter === 'archive') {
      return f.isArchived && !f.isTrashed;
    } else if (activeFilter === 'trash') {
      return f.isTrashed;
    }

    if (typeFilter !== 'all') {
      if (typeFilter === 'folder' && f.itemType !== 'folder') return false;
      if (typeFilter === 'image' && !f.mimeType?.startsWith('image/')) return false;
      if (typeFilter === 'pdf' && !f.name.toLowerCase().endsWith('.pdf')) return false;
      if (typeFilter === 'video' && !f.mimeType?.startsWith('video/')) return false;
      if (typeFilter === 'audio' && !f.mimeType?.startsWith('audio/')) return false;
    }

    return true;
  });

  // Sort
  filteredFiles.sort((a, b) => {
    // Folders always first
    if (a.itemType === 'folder' && b.itemType !== 'folder') return -1;
    if (a.itemType !== 'folder' && b.itemType === 'folder') return 1;

    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'size') return (b.sizeBytes || 0) - (a.sizeBytes || 0);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const getFileIcon = (item: FileItem) => {
    if (item.itemType === 'folder') return <Folder className="w-6 h-6 text-[#FBBF24]" />;
    if (item.mimeType?.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-[#60A5FA]" />;
    if (item.name.toLowerCase().endsWith('.pdf')) return <FileText className="w-6 h-6 text-[#FB7185]" />;
    if (item.mimeType?.startsWith('video/')) return <Video className="w-6 h-6 text-[#A78BFA]" />;
    if (item.mimeType?.startsWith('audio/')) return <Music className="w-6 h-6 text-[#34D399]" />;
    if (item.name.match(/\.(ts|tsx|js|jsx|json|html|css|py)$/)) return <FileCode className="w-6 h-6 text-[#22D3EE]" />;
    return <File className="w-6 h-6 text-[#94A3B8]" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalBytes = files.filter((f) => f.itemType === 'file' && !f.isTrashed).reduce((sum, f) => sum + (f.sizeBytes || 0), 0);

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
            Your digital workspace
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Everything in one place.
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Upload, organize, preview, and manage your private cloud files directly in Firebase Storage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-muted)]">
            {files.filter((f) => f.itemType === 'file' && !f.isTrashed).length} files · {formatSize(totalBytes)} used
          </span>
          <button
            type="button"
            onClick={handleCreateFolder}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-bold text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-all"
          >
            <FolderPlus className="w-4 h-4 text-[var(--color-gold)]" />
            <span>Folder</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>
      </section>

      {/* Drag and Drop Zone */}
      <section
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="group relative rounded-3xl border-2 border-dashed border-[var(--color-primary)]/40 bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-surface))] p-7 text-center cursor-pointer hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))] transition-all"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] group-hover:scale-110 transition-transform">
          <Upload className="w-6 h-6" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-[var(--color-text)]">
          Drop files here to upload to Cloud Storage
        </h3>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Or click to browse from your device. Supported: Images, PDFs, Videos, Audio, Docs.
        </p>

        {isUploading && (
          <p className="mt-3 text-xs font-bold text-[var(--color-cyan)] animate-pulse">
            {uploadProgress}
          </p>
        )}
      </section>

      {/* Folder Navigation breadcrumb */}
      {currentFolderId && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className="flex items-center gap-1 font-bold text-[var(--color-primary)] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All files</span>
          </button>
          <span>/</span>
          <span className="font-bold text-[var(--color-text)]">{currentFolder?.name || 'Folder'}</span>
        </div>
      )}

      {/* Filters & Search */}
      <section className="flex flex-wrap items-center gap-2">
        {(['all', 'favorite', 'archive', 'trash'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => {
              setActiveFilter(filter);
              setCurrentFolderId(null);
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all border ${
              activeFilter === filter
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-text)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)]/50'
            }`}
          >
            {filter === 'favorite' ? '★ Favorites' : filter}
          </button>
        ))}

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] outline-none"
        >
          <option value="all">Types: All</option>
          <option value="folder">Folders</option>
          <option value="image">Images</option>
          <option value="pdf">PDF Documents</option>
          <option value="video">Videos</option>
          <option value="audio">Audio</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] outline-none"
        >
          <option value="recent">Sort: Recent</option>
          <option value="name">Sort: Name A–Z</option>
          <option value="size">Sort: Size</option>
        </select>

        <div className="ml-auto flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs focus-within:border-[var(--color-primary)]">
          <Search className="w-3.5 h-3.5 text-[var(--color-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="bg-transparent text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
          />
        </div>
      </section>

      {/* Files Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFiles.map((file) => (
          <article
            key={file.id}
            className="group relative flex flex-col justify-between rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm hover:border-[var(--color-primary)] hover:-translate-y-0.5 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div
                  onClick={() => {
                    if (file.itemType === 'folder') {
                      setCurrentFolderId(file.id);
                    } else {
                      setPreviewFile(file);
                    }
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-bg-secondary)] cursor-pointer group-hover:scale-105 transition-transform"
                >
                  {getFileIcon(file)}
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFavorite(file)}
                  className={`text-sm ${file.isFavorite ? 'text-amber-400' : 'text-[var(--color-muted)] hover:text-amber-400'}`}
                >
                  <Star className="w-4 h-4" fill={file.isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              <h3
                onClick={() => {
                  if (file.itemType === 'folder') {
                    setCurrentFolderId(file.id);
                  } else {
                    setPreviewFile(file);
                  }
                }}
                className="mt-4 text-sm font-bold text-[var(--color-text)] cursor-pointer truncate hover:text-[var(--color-primary)] transition-colors"
              >
                {file.name}
              </h3>

              <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                {file.itemType === 'folder' ? 'Folder' : formatSize(file.sizeBytes)} · {new Date(file.updatedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-[var(--color-border)]/60 text-[11px] text-[var(--color-muted)]">
              {activeFilter === 'trash' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleRestoreFile(file)}
                    className="text-[var(--color-primary)] font-bold hover:underline"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePermanentDelete(file)}
                    className="text-red-400 font-bold hover:underline"
                  >
                    Delete permanently
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {file.itemType === 'file' && (
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        className="hover:text-[var(--color-text)]"
                      >
                        Preview
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRename(file)}
                      className="hover:text-[var(--color-text)]"
                    >
                      Rename
                    </button>
                    {file.downloadUrl && (
                      <a
                        href={file.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={file.name}
                        className="hover:text-[var(--color-cyan)]"
                      >
                        Download
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTrashFile(file)}
                    className="text-[var(--color-muted)] hover:text-red-400"
                  >
                    Trash
                  </button>
                </>
              )}
            </div>
          </article>
        ))}

        {filteredFiles.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-[var(--color-border)] p-12 text-center text-xs text-[var(--color-muted)]">
            No files or folders found.
          </div>
        )}
      </section>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[var(--color-bg)]/85 p-4 backdrop-blur-md">
          <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
                  Cloud File Preview
                </p>
                <h3 className="text-base font-bold text-[var(--color-text)] truncate max-w-lg">
                  {previewFile.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="rounded-lg p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Media Body */}
            <div className="flex-1 my-4 flex items-center justify-center bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden p-4 min-h-[300px]">
              {previewFile.mimeType?.startsWith('image/') && previewFile.downloadUrl ? (
                <img
                  src={previewFile.downloadUrl}
                  alt={previewFile.name}
                  className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg"
                />
              ) : previewFile.name.toLowerCase().endsWith('.pdf') && previewFile.downloadUrl ? (
                <iframe
                  src={previewFile.downloadUrl}
                  title={previewFile.name}
                  className="h-[60vh] w-full border-0 rounded-lg"
                />
              ) : previewFile.mimeType?.startsWith('video/') && previewFile.downloadUrl ? (
                <video
                  src={previewFile.downloadUrl}
                  controls
                  className="max-h-[60vh] w-auto max-w-full rounded-lg"
                />
              ) : previewFile.mimeType?.startsWith('audio/') && previewFile.downloadUrl ? (
                <audio src={previewFile.downloadUrl} controls className="w-full max-w-md" />
              ) : (
                <div className="text-center space-y-2 p-8">
                  <File className="w-12 h-12 text-[var(--color-muted)] mx-auto opacity-50" />
                  <p className="text-xs text-[var(--color-muted)]">
                    Direct viewer not supported for this file format.
                  </p>
                  {previewFile.downloadUrl && (
                    <a
                      href={previewFile.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)]"
                    >
                      Download &amp; Open
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* AI Assistant Hook */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => handleAISummarizeFile(previewFile)}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--color-ai)]/40 bg-[var(--color-ai-soft)]/40 px-3.5 py-2 text-xs font-bold text-[var(--color-ai)] hover:bg-[var(--color-ai)] hover:text-white transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Summarize with AI</span>
              </button>

              {previewFile.downloadUrl && (
                <a
                  href={previewFile.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={previewFile.name}
                  className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-cyan)] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download file</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
