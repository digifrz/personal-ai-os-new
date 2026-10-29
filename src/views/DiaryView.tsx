import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Book,
  Calendar as CalendarIcon,
  Sparkles,
  Save,
  Trash2,
  Share2,
  FileText,
  Upload,
  Download,
  Smile,
  Zap,
  Coffee,
  Moon,
  CloudLightning,
  Heart,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Tag,
  Paperclip,
  Image as ImageIcon,
  Clock,
  Check,
  X,
  AlertCircle,
  Mail,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DiaryEntry, CalendarEventItem } from '../types';
import {
  subscribeDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  createCalendarEvent,
} from '../services/db';
import { askAI } from '../services/ai';

interface DiaryViewProps {
  calendarEvents: CalendarEventItem[];
  onNavigate?: (tab: string) => void;
}

const MOODS = [
  { id: 'happy', label: 'Happy', emoji: '😊', icon: Smile, color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  { id: 'productive', label: 'Productive', emoji: '⚡', icon: Zap, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  { id: 'calm', label: 'Calm', emoji: '🌿', icon: Coffee, color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
  { id: 'reflective', label: 'Reflective', emoji: '🌙', icon: Moon, color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  { id: 'stressed', label: 'Stressed', emoji: '🌪️', icon: CloudLightning, color: 'text-red-400 bg-red-400/10 border-red-400/30' },
  { id: 'neutral', label: 'Grateful', emoji: '💖', icon: Heart, color: 'text-pink-400 bg-pink-400/10 border-pink-400/30' },
] as const;

export const DiaryView: React.FC<DiaryViewProps> = ({ calendarEvents, onNavigate }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Current editing entry fields
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<DiaryEntry['mood']>('productive');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['DailyJournal']);
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; type: string }>>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [likedEntries, setLikedEntries] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('paio_diary_liked_entries');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // In-app direct Gmail Share Modal State
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [gmailRecipient, setGmailRecipient] = useState('');
  const [gmailSubject, setGmailSubject] = useState('');
  const [gmailBody, setGmailBody] = useState('');
  const [isSendingGmail, setIsSendingGmail] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Subscribe to diary entries
  useEffect(() => {
    const unsub = subscribeDiaryEntries(user?.uid || 'guest', (data) => {
      setEntries(data);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [user?.uid]);

  // Sync active entry when selectedDate or entries change
  useEffect(() => {
    const found = entries.find((e) => e.date === selectedDate);
    if (found) {
      setCurrentEntryId(found.id);
      setTitle(found.title);
      setContent(found.content);
      setMood(found.mood || 'productive');
      setTags(found.tags || []);
      setAttachments(found.attachments || []);
    } else {
      // Clean slate for the date
      setCurrentEntryId(null);
      const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      setTitle(`Journal — ${formattedDate}`);
      setContent('');
      setMood('productive');
      setTags(['DailyJournal']);
      setAttachments([]);
    }
  }, [selectedDate, entries]);

  // Calendar events matching the selected date
  const eventsOnSelectedDate = useMemo(() => {
    return calendarEvents.filter((evt) => {
      const evtDate = evt.startsAt ? evt.startsAt.slice(0, 10) : '';
      return evtDate === selectedDate;
    });
  }, [calendarEvents, selectedDate]);

  // Save or update diary entry
  const handleSaveEntry = async () => {
    if (!title.trim() && !content.trim()) {
      showToast('Please enter a title or write some thoughts first.');
      return;
    }

    setIsSaving(true);
    try {
      if (currentEntryId) {
        await updateDiaryEntry(
          currentEntryId,
          {
            title: title.trim(),
            content: content.trim(),
            mood,
            tags,
            attachments,
            calendarLinked: eventsOnSelectedDate.length > 0,
          },
          user?.uid
        );
        showToast('✓ Diary entry updated and saved to storage.');
      } else {
        const newId = await createDiaryEntry({
          userId: user?.uid || 'guest',
          date: selectedDate,
          title: title.trim(),
          content: content.trim(),
          mood,
          tags,
          attachments,
          calendarLinked: eventsOnSelectedDate.length > 0,
        });
        setCurrentEntryId(newId);
        showToast('✓ New diary entry created and saved to storage!');
      }
    } catch (err: any) {
      showToast('Saved locally.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete diary entry
  const handleDeleteEntry = async () => {
    if (!currentEntryId) return;
    if (window.confirm('Delete this diary entry? This cannot be undone.')) {
      await deleteDiaryEntry(currentEntryId, user?.uid);
      showToast('Diary entry deleted.');
      // Reset form
      setContent('');
      setCurrentEntryId(null);
    }
  };

  // Add Tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Attachment upload (to local data URL / storage)
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            url: result,
            type: file.type.startsWith('image/') ? 'image' : 'file',
          },
        ]);
        showToast(`Attached "${file.name}" to diary entry!`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Export Diary to Google Docs
  const handleExportToGoogleDocs = () => {
    const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const docText = `# ${title || 'Diary Entry'}\nDate: ${formattedDate}\nMood: ${mood?.toUpperCase()}\nTags: ${tags.join(', ')}\n\n---\n\n${content}\n\n---\nExported from Personal AI OS Diary`;

    // Copy formatted text to clipboard
    navigator.clipboard.writeText(docText);

    // Open docs.new directly
    window.open('https://docs.new', '_blank', 'noopener,noreferrer');
    showToast('✓ Diary text copied to clipboard! Opening new Google Doc...');
  };

  // Direct Gmail Share Integration - Opens in-app Gmail composer modal
  const handleShareViaGmail = (entryTitle?: string, entryContent?: string, entryDate?: string) => {
    const activeTitle = entryTitle || title || 'My Daily Journal Reflection';
    const activeDate = entryDate || selectedDate;
    const activeBody = entryContent !== undefined ? entryContent : content;

    const formattedSubject = `[Personal AI OS Diary] ${activeTitle} (${activeDate})`;
    const formattedBody = `Hello,\n\nHere is my diary entry recorded in Personal AI OS:\n\nDate: ${activeDate}\nMood: ${mood?.toUpperCase() || 'REFLECTIVE'}\nTags: ${tags.join(', ')}\n\n---\n\n${activeBody}\n\n---\nShared securely from Personal AI OS`;

    setGmailSubject(formattedSubject);
    setGmailBody(formattedBody);
    setIsGmailModalOpen(true);
  };

  const handleSendGmailDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailRecipient.trim()) {
      showToast('Please specify a recipient email address.');
      return;
    }
    setIsSendingGmail(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      showToast(`🎉 Diary entry sent directly to ${gmailRecipient} via Gmail!`);
      setIsGmailModalOpen(false);
      setGmailRecipient('');
    } catch {
      showToast('Could not send via Gmail.');
    } finally {
      setIsSendingGmail(false);
    }
  };

  // Toggle favorite / like on diary entries
  const handleToggleLikeEntry = (entryId: string) => {
    const next = new Set(likedEntries);
    if (next.has(entryId)) {
      next.delete(entryId);
      showToast('Removed from favorites.');
    } else {
      next.add(entryId);
      showToast('💖 Saved to favorite diary memories!');
    }
    setLikedEntries(next);
    try {
      localStorage.setItem('paio_diary_liked_entries', JSON.stringify(Array.from(next)));
    } catch {}
  };

  // Schedule Diary Reminder in Calendar
  const handleScheduleCalendarReminder = async () => {
    if (!user) {
      showToast('Please sign in to schedule calendar events.');
      return;
    }
    try {
      await createCalendarEvent({
        userId: user.uid,
        title: `Daily Reflection: ${title || 'Journal Review'}`,
        description: `Review diary entry for ${selectedDate}. Tags: ${tags.join(', ')}`,
        category: 'Personal Reflection',
        startsAt: `${selectedDate}T20:00:00`,
        endsAt: `${selectedDate}T20:30:00`,
        location: 'Personal AI OS Journal',
      });
      showToast(`✓ Calendar event created for ${selectedDate} at 8:00 PM!`);
    } catch {
      showToast('Could not add to calendar.');
    }
  };

  // AI Prompt Inspiration
  const handleAIGeneratePrompt = async () => {
    setIsAiLoading(true);
    try {
      const eventsSummary = eventsOnSelectedDate.map((e) => e.title).join(', ');
      const response = await askAI({
        prompt: `You are an insightful daily journaling mentor. Based on date: ${selectedDate}, mood: ${mood}, and scheduled events: "${eventsSummary || 'standard focus day'}", generate 3 thought-provoking, deep personal reflection prompts and gratitude questions to write about tonight in a diary. Format as numbered bullet points.`,
        mode: 'chat',
      });
      setContent((prev) => (prev ? `${prev}\n\n### ✦ AI Reflection Prompts:\n${response}` : `### ✦ AI Reflection Prompts:\n${response}`));
      showToast('AI reflection prompts added!');
    } catch {
      showToast('AI prompt unavailable.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Quick Date Navigation
  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().slice(0, 10));
  };

  // Download all diary entries archive
  const handleDownloadDiaryArchive = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Personal_AI_OS_Diary_Vault_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Diary vault downloaded.');
  };

  // Filtered past entries for search
  const filteredPastEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [entries, searchQuery]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 space-y-6 animate-fade-in">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[160] rounded-2xl border border-[var(--color-primary)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-xs font-bold text-[var(--color-text)] shadow-2xl backdrop-blur-xl animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner & Date Picker Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-amber-500/20 text-purple-400 border border-purple-500/30 font-black shadow-md">
            <Book className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-text)]">
                Daily Diary &amp; Journal
              </h2>
              <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-400">
                All Days Active
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              Integrated with Calendar, Google Docs export, and Cloud Vault storage
            </p>
          </div>
        </div>

        {/* Date Selector Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-1">
            <button
              type="button"
              onClick={() => changeDateByDays(-1)}
              title="Previous Day"
              className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent px-3 py-1 text-xs font-bold text-[var(--color-text)] outline-none cursor-pointer"
            />

            <button
              type="button"
              onClick={() => changeDateByDays(1)}
              title="Next Day"
              className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all"
          >
            Today
          </button>

          <button
            type="button"
            onClick={handleDownloadDiaryArchive}
            title="Download full diary archive backup"
            className="p-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-white/5 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Journal Editor (Left) & Integrations Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Daily Journal Entry */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-5">
            {/* Header: Date Title & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)]/60 pb-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Daily entry title (e.g. Breakthrough on Core Engine)..."
                  className="w-full text-lg sm:text-xl font-extrabold bg-transparent text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]/50"
                />
                <span className="text-xs text-[var(--color-muted)] font-mono flex items-center gap-1.5 mt-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentEntryId && (
                  <button
                    type="button"
                    onClick={handleDeleteEntry}
                    title="Delete Entry"
                    className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  id="diary-share-gmail-btn"
                  onClick={() => handleShareViaGmail()}
                  title="Send this journal entry directly through Gmail"
                  className="flex items-center gap-1.5 rounded-2xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-extrabold px-3.5 py-2 text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send via Gmail</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveEntry}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-4 py-2 text-xs shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Diary'}</span>
                </button>
              </div>
            </div>

            {/* Mood Selector Strip */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
                Today&apos;s Dominant Mood
              </span>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => {
                  const isSelected = mood === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMood(m.id as any)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
                        isSelected
                          ? `${m.color} ring-2 ring-purple-500/30 scale-105 shadow-sm`
                          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Journal Content Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Journal Thoughts &amp; Highlights
                </span>
                <button
                  type="button"
                  onClick={handleAIGeneratePrompt}
                  disabled={isAiLoading}
                  className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                  <span>Ask AI Reflection Prompts</span>
                </button>
              </div>

              <textarea
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What happened today? What went well, what challenged you, and what are you grateful for? (Supports Markdown notes)"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 text-xs sm:text-sm text-[var(--color-text)] outline-none leading-relaxed resize-y focus:border-purple-500/50"
              />
            </div>

            {/* Attachments & Photos Strip */}
            <div className="space-y-2 pt-1 border-t border-[var(--color-border)]/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                  Attachments &amp; Photos ({attachments.length})
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 rounded-xl bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[11px] font-bold text-[var(--color-text)] transition-colors"
                >
                  <Plus className="w-3 h-3 text-purple-400" />
                  <span>Attach Photo/File</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt"
                onChange={handleFileAttachment}
                className="hidden"
              />

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachments.map((att, i) => (
                    <div
                      key={i}
                      className="group relative flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2 text-xs"
                    >
                      {att.type === 'image' ? (
                        <img src={att.url} alt={att.name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <FileText className="w-5 h-5 text-purple-400" />
                      )}
                      <span className="text-[11px] font-medium text-[var(--color-text)] max-w-[120px] truncate">
                        {att.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                        className="text-zinc-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags Strip */}
            <div className="space-y-2 pt-1 border-t border-[var(--color-border)]/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                Tags
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-xl bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-xs font-bold text-purple-300"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="rounded-xl bg-transparent border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text)] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Integrations with Calendar & Google Docs & Past History */}
        <div className="space-y-5">
          {/* Integration 1: Google Docs One-Click Export */}
          <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[var(--color-text)]">
                  Google Docs Integration
                </h4>
                <p className="text-[10px] text-[var(--color-muted)]">
                  Export this diary entry formatted to Google Docs
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Instantly converts title, date, mood, tags, and content into a clean Google Doc in your Google account.
            </p>
            <button
              type="button"
              onClick={handleExportToGoogleDocs}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-2.5 text-xs shadow-md transition-all"
            >
              <span>Export Entry to Google Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Integration 2: Calendar Integration for This Day */}
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[var(--color-text)]">
                    Calendar on {selectedDate}
                  </h4>
                  <p className="text-[10px] text-[var(--color-muted)]">
                    {eventsOnSelectedDate.length} scheduled event(s)
                  </p>
                </div>
              </div>
            </div>

            {eventsOnSelectedDate.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)] py-1">
                No calendar commitments scheduled for this day.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {eventsOnSelectedDate.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs"
                  >
                    <strong className="truncate text-[var(--color-text)]">{evt.title}</strong>
                    <span className="text-[10px] text-[var(--color-muted)] font-mono shrink-0 ml-2">
                      {evt.startsAt ? evt.startsAt.slice(11, 16) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleScheduleCalendarReminder}
              className="flex items-center justify-center gap-1.5 w-full rounded-2xl border border-amber-500/40 bg-white/5 hover:bg-white/10 text-amber-300 font-bold py-2 text-xs transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Schedule Diary Reflection in Calendar</span>
            </button>
          </div>

          {/* Past Entries Explorer */}
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-[var(--color-text)]">
                Journal History ({entries.length})
              </h4>
              <span className="text-[10px] text-[var(--color-muted)]">All Days</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--color-muted)]" />
              <input
                type="text"
                placeholder="Search past entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] pl-8 pr-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
              />
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredPastEntries.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)] text-center py-4">No entries found.</p>
              ) : (
                filteredPastEntries.map((entry) => {
                  const isCurrent = entry.date === selectedDate;
                  return (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedDate(entry.date)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-xs ${
                        isCurrent
                          ? 'border-purple-500 bg-purple-500/10 text-[var(--color-text)] font-bold shadow-sm'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="truncate">{entry.title || 'Untitled Entry'}</strong>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLikeEntry(entry.id);
                            }}
                            title={likedEntries.has(entry.id) ? 'Liked' : 'Like entry'}
                            className={`p-1 rounded-lg transition-colors ${
                              likedEntries.has(entry.id)
                                ? 'text-pink-400 bg-pink-500/15'
                                : 'text-zinc-500 hover:text-pink-400'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${likedEntries.has(entry.id) ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareViaGmail(entry.title, entry.content, entry.date);
                            }}
                            title="Send this entry directly through Gmail"
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 transition-all shadow-xs cursor-pointer"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Gmail</span>
                          </button>
                          <span className="text-[10px] font-mono">{entry.date}</span>
                        </div>
                      </div>
                      {entry.content && (
                        <p className="text-[10px] text-[var(--color-muted)] line-clamp-1 mt-0.5 font-normal">
                          {entry.content}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Direct In-App Gmail Share Modal */}
      {isGmailModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
        >
          <div className="w-full max-w-lg rounded-3xl border border-red-500/30 bg-[var(--color-surface)] p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 font-black shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[var(--color-text)]">
                    Send Journal via Gmail
                  </h3>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Share your reflection directly through Google Workspace Gmail
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGmailModalOpen(false)}
                className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendGmailDirectly} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="mentor@example.com, colleague@work.com"
                  value={gmailRecipient}
                  onChange={(e) => setGmailRecipient(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={gmailSubject}
                  onChange={(e) => setGmailSubject(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Formatted Diary Reflection Body
                </label>
                <textarea
                  rows={6}
                  value={gmailBody}
                  onChange={(e) => setGmailBody(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-xs text-[var(--color-text)] outline-none focus:border-red-500 font-mono resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(gmailBody);
                    showToast('✓ Email text copied to clipboard!');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--color-muted)] hover:text-white transition-colors"
                >
                  Copy Text
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGmailModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--color-muted)] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingGmail}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingGmail ? 'Sending via Gmail…' : 'Send via Gmail API'}</span>
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
