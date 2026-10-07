import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Check,
  Share2,
  Edit3,
  FolderInput,
  Copy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FileItem } from '../types';
import {
  uploadWorkspaceFile,
  uploadWorkspaceFileProgressAware,
  UploadProgressPayload,
  ActiveUploadController,
  createFolder,
  updateFile,
  deleteFile,
  createFlashcard,
} from '../services/db';
import { askAI } from '../services/ai';
import { recordRecentAccess } from '../services/recentAccess';

export interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  progressPercent: number;
  bytesTransferred: number;
  totalBytes: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'canceled';
  error?: string;
  controller?: ActiveUploadController;
  downloadUrl?: string;
}

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
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Top-Up Page for file actions (left-click on a file)
  const [selectedActionFile, setSelectedActionFile] = useState<FileItem | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const [targetFolderIdForFile, setTargetFolderIdForFile] = useState<string | null>(null);
  const [isCopiedShareLink, setIsCopiedShareLink] = useState(false);

  // Folder Move Modal state (move folder to another folder)
  const [movingFolder, setMovingFolder] = useState<FileItem | null>(null);
  const [targetFolderForFolder, setTargetFolderForFolder] = useState<string | null>(null);

  // Robust progress-aware upload queue state
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploadPanelMinimized, setIsUploadPanelMinimized] = useState(false);

  const allFolders = useMemo(() => {
    return files.filter((f) => f.itemType === 'folder' && !f.isTrashed);
  }, [files]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleSelectFileWithTracking = (file: FileItem) => {
    recordRecentAccess(
      {
        id: file.id,
        type: 'file',
        title: file.name,
        subtitle: file.itemType === 'folder' ? 'Folder' : formatSize(file.sizeBytes),
        sizeBytes: file.sizeBytes,
        mimeType: file.mimeType,
      },
      user?.uid
    );
    if (file.itemType === 'folder') {
      setCurrentFolderId(file.id);
    } else {
      setSelectedActionFile(file);
      setEditingFileName(file.name);
      setTargetFolderIdForFile(file.folderId || null);
    }
  };

  // Quick re-entry auto-open support from Dashboard Recently Accessed
  useEffect(() => {
    try {
      const targetId = localStorage.getItem('paio_open_file_id');
      if (targetId && files.length > 0) {
        const found = files.find((f) => f.id === targetId);
        if (found) {
          handleSelectFileWithTracking(found);
          localStorage.removeItem('paio_open_file_id');
        }
      }
    } catch {}
  }, [files]);

  const startSingleUpload = (queueItem: UploadQueueItem, userId: string, folderId: string | null) => {
    const controller = uploadWorkspaceFileProgressAware(
      userId,
      queueItem.file,
      folderId,
      (payload) => {
        setUploadQueue((prev) =>
          prev.map((item) => {
            if (item.id === queueItem.id) {
              return {
                ...item,
                progressPercent: payload.progressPercent,
                bytesTransferred: payload.bytesTransferred,
                totalBytes: payload.totalBytes,
                status: payload.status,
                error: payload.error,
                downloadUrl: payload.downloadUrl || item.downloadUrl,
              };
            }
            return item;
          })
        );
      }
    );

    setUploadQueue((prev) =>
      prev.map((item) => (item.id === queueItem.id ? { ...item, controller } : item))
    );

    controller.promise
      .then((createdItem) => {
        showToast(`"${createdItem.name}" uploaded successfully.`);
      })
      .catch((err) => {
        console.warn('Upload error caught:', err);
      });
  };

  const handleFileUpload = (selectedFiles: FileList | File[] | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const fileArray = Array.from(selectedFiles);
    const activeUserId = user?.uid || 'guest_user';

    const newItems: UploadQueueItem[] = fileArray.map((file) => ({
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      sizeBytes: file.size,
      progressPercent: 0,
      bytesTransferred: 0,
      totalBytes: file.size,
      status: 'pending',
    }));

    setUploadQueue((prev) => [...newItems, ...prev]);
    setIsUploadPanelMinimized(false);

    // Launch uploads
    newItems.forEach((item) => {
      startSingleUpload(item, activeUserId, currentFolderId);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRetryUpload = (itemId: string) => {
    const item = uploadQueue.find((q) => q.id === itemId);
    if (!item) return;
    const activeUserId = user?.uid || 'guest_user';
    setUploadQueue((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, status: 'pending', progressPercent: 0, error: undefined } : q))
    );
    startSingleUpload(item, activeUserId, currentFolderId);
  };

  const handleCancelUpload = (itemId: string) => {
    const item = uploadQueue.find((q) => q.id === itemId);
    if (!item) return;
    item.controller?.cancel();
    setUploadQueue((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, status: 'canceled', error: 'Upload canceled by user' } : q))
    );
  };

  const handleRemoveFromQueue = (itemId: string) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== itemId));
  };

  const activeUploadingItems = uploadQueue.filter(
    (q) => q.status === 'uploading' || q.status === 'pending' || q.status === 'processing'
  );
  const completedItems = uploadQueue.filter((q) => q.status === 'completed');
  const failedItems = uploadQueue.filter((q) => q.status === 'failed' || q.status === 'canceled');

  const overallUploadPercent = useMemo(() => {
    if (activeUploadingItems.length === 0) return 0;
    const total = activeUploadingItems.reduce((acc, cur) => acc + cur.totalBytes, 0);
    const transferred = activeUploadingItems.reduce((acc, cur) => acc + cur.bytesTransferred, 0);
    return total > 0 ? Math.min(99, Math.round((transferred / total) * 100)) : 0;
  }, [activeUploadingItems]);

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
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative rounded-3xl border-2 border-dashed p-7 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 ring-4 ring-[var(--color-primary)]/20 scale-[1.01]'
            : 'border-[var(--color-primary)]/40 bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-surface))] hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))]'
        }`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] group-hover:scale-110 transition-transform">
          <Upload className={`w-6 h-6 ${activeUploadingItems.length > 0 ? 'animate-bounce' : ''}`} />
        </div>
        <h3 className="mt-3 text-sm font-bold text-[var(--color-text)]">
          {isDragOver ? 'Release to upload to Cloud Storage' : 'Drop files here to upload to Cloud Storage'}
        </h3>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Or click to browse from your device. Supported: Images, PDFs, Videos, Audio, Docs.
        </p>

        {/* Live Active Progress Bar in Drop Zone */}
        {activeUploadingItems.length > 0 && (
          <div
            className="mt-4 max-w-md mx-auto space-y-1.5 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-xs font-bold text-[var(--color-primary)]">
              <span>Uploading {activeUploadingItems.length} file(s) to Firebase Storage…</span>
              <span>{overallUploadPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] via-indigo-500 to-[var(--color-cyan)] transition-all duration-300"
                style={{ width: `${overallUploadPercent}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Folder Navigation breadcrumb & Move Folder Action */}
      {currentFolderId && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] p-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentFolderId(null)}
              className="flex items-center gap-1 font-bold text-[var(--color-primary)] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All files</span>
            </button>
            <span>/</span>
            <span className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentFolder?.name || 'Folder'}</span>
            </span>
          </div>

          {currentFolder && (
            <button
              type="button"
              onClick={() => {
                setMovingFolder(currentFolder);
                setTargetFolderForFolder(null);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-all shadow-sm"
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>Move to another folder</span>
            </button>
          )}
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
                  onClick={() => handleSelectFileWithTracking(file)}
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
                onClick={() => handleSelectFileWithTracking(file)}
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
                    {file.itemType === 'file' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedActionFile(file);
                          setEditingFileName(file.name);
                          setTargetFolderIdForFile(file.folderId || null);
                        }}
                        className="text-[var(--color-primary)] font-bold hover:underline"
                      >
                        Options / Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMovingFolder(file);
                          setTargetFolderForFolder(null);
                        }}
                        className="text-[var(--color-primary)] font-bold hover:underline"
                      >
                        Move folder
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

      {/* Floating Progress-Aware Upload Manager Drawer */}
      {uploadQueue.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[160] w-80 sm:w-96 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-scale-up select-none">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2.5">
              {activeUploadingItems.length > 0 ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/40">
                  <Upload className="w-3.5 h-3.5 animate-bounce" />
                </div>
              ) : failedItems.length > 0 ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}
              <div>
                <p className="text-xs font-extrabold text-[var(--color-text)]">
                  {activeUploadingItems.length > 0
                    ? `Uploading ${activeUploadingItems.length} file${activeUploadingItems.length > 1 ? 's' : ''}…`
                    : failedItems.length > 0
                    ? `${failedItems.length} upload issue`
                    : `${completedItems.length} upload${completedItems.length > 1 ? 's' : ''} complete`}
                </p>
                <p className="text-[10px] text-[var(--color-muted)] font-mono">
                  {activeUploadingItems.length > 0
                    ? `${overallUploadPercent}% overall progress`
                    : 'Firebase Storage synced'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsUploadPanelMinimized(!isUploadPanelMinimized)}
                title={isUploadPanelMinimized ? 'Expand panel' : 'Minimize panel'}
                className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/10 transition-colors"
              >
                {isUploadPanelMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {activeUploadingItems.length === 0 && (
                <button
                  type="button"
                  onClick={() => setUploadQueue([])}
                  title="Dismiss manager"
                  className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Upload Queue Item List */}
          {!isUploadPanelMinimized && (
            <div className="max-h-72 overflow-y-auto p-3 space-y-2.5 divide-y divide-[var(--color-border)]/40 scrollbar-thin">
              {uploadQueue.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="shrink-0">{getFileIcon({ name: item.name, itemType: 'file' } as any)}</div>
                      <div className="min-w-0 truncate">
                        <span className="block truncate font-bold text-[var(--color-text)] text-[11px]">
                          {item.name}
                        </span>
                        <span className="block text-[10px] text-[var(--color-muted)] font-mono">
                          {formatSize(item.sizeBytes)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.status === 'uploading' || item.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => handleCancelUpload(item.id)}
                          className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-[10px] text-[var(--color-muted)] hover:text-red-400 font-medium transition-colors"
                          title="Cancel upload"
                        >
                          Cancel
                        </button>
                      ) : item.status === 'failed' || item.status === 'canceled' ? (
                        <button
                          type="button"
                          onClick={() => handleRetryUpload(item.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-primary)] text-white text-[10px] font-bold hover:brightness-110 transition-all shadow-sm"
                          title="Retry upload"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveFromQueue(item.id)}
                          className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/10"
                          title="Remove from list"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.status === 'failed'
                          ? 'bg-red-500'
                          : item.status === 'completed'
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-cyan)]'
                      }`}
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>

                  {/* Status Note */}
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    {item.status === 'uploading' && (
                      <span className="text-[var(--color-muted)]">
                        {item.progressPercent}% · {formatSize(item.bytesTransferred)} of {formatSize(item.totalBytes)}
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <span className="text-amber-400 font-semibold animate-pulse">
                        Finalizing entry in Cloud Storage…
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Uploaded &amp; Available
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span className="text-red-400 font-semibold truncate max-w-[220px]" title={item.error}>
                        {item.error || 'Upload error. Click Retry.'}
                      </span>
                    )}
                    {item.status === 'canceled' && (
                      <span className="text-[var(--color-muted)]">Canceled by user</span>
                    )}
                    {item.status === 'pending' && (
                      <span className="text-[var(--color-muted)]">Waiting to start…</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer when completed items exist */}
          {!isUploadPanelMinimized && completedItems.length > 0 && activeUploadingItems.length === 0 && (
            <div className="p-2 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex justify-end">
              <button
                type="button"
                onClick={() => setUploadQueue([])}
                className="text-[10px] font-bold text-[var(--color-muted)] hover:text-[var(--color-text)] px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
              >
                Clear completed
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          FILE ACTION TOP-UP PAGE (MODAL ON LEFT-CLICK FILE)
          Options: Edit Name, Share, Delete, Move to Folder, Preview & Download
      ========================================================================= */}
      {selectedActionFile && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setSelectedActionFile(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-5 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[var(--color-border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-bg-secondary)]">
                  {getFileIcon(selectedActionFile)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--color-text)] truncate max-w-xs sm:max-w-sm">
                    {selectedActionFile.name}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    {formatSize(selectedActionFile.sizeBytes)} · Uploaded {new Date(selectedActionFile.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActionFile(null)}
                className="rounded-xl p-1.5 text-[var(--color-muted)] hover:bg-white/10 hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions Grid */}
            <div className="space-y-4 text-xs">
              {/* Option 1: Edit Name (Rename) */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 space-y-2">
                <label className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Edit File Name</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingFileName}
                    onChange={(e) => setEditingFileName(e.target.value)}
                    className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] font-medium"
                    placeholder="Enter file name..."
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editingFileName.trim() || editingFileName.trim() === selectedActionFile.name) return;
                      await updateFile(selectedActionFile.id, { name: editingFileName.trim() });
                      showToast(`File renamed to "${editingFileName.trim()}"`);
                      setSelectedActionFile({ ...selectedActionFile, name: editingFileName.trim() });
                    }}
                    className="rounded-xl bg-[var(--color-primary)] px-4 py-2 font-bold text-white shadow-sm hover:opacity-95"
                  >
                    Save Name
                  </button>
                </div>
              </div>

              {/* Option 2: Share File */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Share File</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold">Secure Access Link</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedActionFile.downloadUrl || `${window.location.origin}/file/${selectedActionFile.id}`}
                    className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[11px] text-[var(--color-muted)] font-mono truncate"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = selectedActionFile.downloadUrl || `${window.location.origin}/file/${selectedActionFile.id}`;
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(url);
                        setIsCopiedShareLink(true);
                        setTimeout(() => setIsCopiedShareLink(false), 2000);
                        showToast('Share link copied to clipboard!');
                      }
                    }}
                    className="flex items-center gap-1 rounded-xl bg-purple-600 px-3.5 py-2 font-bold text-white shadow-sm hover:opacity-95"
                  >
                    {isCopiedShareLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedShareLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Option 3: Move to Folder */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 space-y-2">
                <label className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <FolderInput className="w-3.5 h-3.5 text-amber-400" />
                  <span>Move to Folder</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={targetFolderIdForFile || ''}
                    onChange={(e) => setTargetFolderIdForFile(e.target.value ? e.target.value : null)}
                    className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)] outline-none font-medium"
                  >
                    <option value="">📂 All Files (Root Directory)</option>
                    {allFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      await updateFile(selectedActionFile.id, { folderId: targetFolderIdForFile });
                      const destName = targetFolderIdForFile
                        ? allFolders.find((f) => f.id === targetFolderIdForFile)?.name || 'folder'
                        : 'Root Directory';
                      showToast(`Moved "${selectedActionFile.name}" to ${destName}`);
                      setSelectedActionFile(null);
                    }}
                    className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-black shadow-sm hover:opacity-95"
                  >
                    Move File
                  </button>
                </div>
              </div>

              {/* Option 4: Delete File */}
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-red-400 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete File</span>
                  </h4>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Move file to trash. You can restore it anytime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await handleTrashFile(selectedActionFile);
                    setSelectedActionFile(null);
                  }}
                  className="rounded-xl border border-red-500/40 bg-red-500/15 px-3.5 py-1.5 font-bold text-red-400 hover:bg-red-500/25 transition-colors"
                >
                  Move to Trash
                </button>
              </div>
            </div>

            {/* Quick Preview & Download Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)] text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  const target = selectedActionFile;
                  setSelectedActionFile(null);
                  setPreviewFile(target);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open Full Preview</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleAISummarizeFile(selectedActionFile);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--color-ai)]/40 bg-[var(--color-ai-soft)]/30 px-3.5 py-2 text-[var(--color-ai)] hover:bg-[var(--color-ai)] hover:text-white transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Summary</span>
                </button>

                {selectedActionFile.downloadUrl && (
                  <a
                    href={selectedActionFile.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={selectedActionFile.name}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-white shadow-sm hover:opacity-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MOVE FOLDER TO ANOTHER FOLDER MODAL
      ========================================================================= */}
      {movingFolder && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setMovingFolder(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-5 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                  <FolderInput className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--color-text)]">
                    Move Folder
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] truncate max-w-[220px]">
                    Moving &ldquo;{movingFolder.name}&rdquo;
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMovingFolder(null)}
                className="rounded-xl p-1.5 text-[var(--color-muted)] hover:bg-white/10 hover:text-[var(--color-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[var(--color-muted)] leading-relaxed">
                Select destination location for folder <strong>&ldquo;{movingFolder.name}&rdquo;</strong> and its contents:
              </p>

              <div className="space-y-1.5">
                <label className="font-bold text-[var(--color-text)]">Destination Folder:</label>
                <select
                  value={targetFolderForFolder || ''}
                  onChange={(e) => setTargetFolderForFolder(e.target.value ? e.target.value : null)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--color-text)] outline-none font-medium"
                >
                  <option value="">📂 All Files (Root Directory)</option>
                  {allFolders
                    .filter((f) => f.id !== movingFolder.id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)] text-xs font-bold">
              <button
                type="button"
                onClick={() => setMovingFolder(null)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (targetFolderForFolder === movingFolder.id) {
                    showToast('Cannot move folder into itself.');
                    return;
                  }
                  await updateFile(movingFolder.id, { folderId: targetFolderForFolder });
                  const destName = targetFolderForFolder
                    ? allFolders.find((f) => f.id === targetFolderForFolder)?.name || 'folder'
                    : 'All Files (Root)';
                  showToast(`Moved folder "${movingFolder.name}" to ${destName}`);
                  setMovingFolder(null);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-5 py-2 text-white shadow-md hover:opacity-95"
              >
                <FolderInput className="w-3.5 h-3.5" />
                <span>Move Folder</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
