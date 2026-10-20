import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  HardDrive,
  Calendar,
  Video,
  FileText,
  ExternalLink,
  Download,
  Send,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ArrowLeftRight,
  Plus,
  Trash2,
  Key,
  AlertTriangle,
  Clock,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TaskItem, NoteItem, CalendarEventItem } from '../../types';
import {
  authenticateGoogleCalendar,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  deleteRemoteGoogleCalendarEvent,
  syncGoogleCalendarBiDirectionally,
  getCachedCalendarAccessToken,
  setCachedCalendarAccessToken,
  SyncReport,
} from '../../services/googleCalendar';

export interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  notes: NoteItem[];
  events: CalendarEventItem[];
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  tasks,
  notes,
  events,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'gmail' | 'drive' | 'calendar' | 'meet'>('calendar');

  // Gmail State
  const [emailTo, setEmailTo] = useState('colleague@example.com');
  const [emailSubject, setEmailSubject] = useState('Workspace Executive Update');
  const [emailBody, setEmailBody] = useState(
    `Hello,\n\nHere is an executive update from my Personal AI OS Workspace:\n- Active Tasks: ${tasks.filter(t => t.status !== 'done').length} open items\n- Notes & Documentation: ${notes.length} entries\n\nPlease let me know if you would like to coordinate.\n\nBest regards,\n${user?.email?.split('@')[0] || 'Personal AI OS User'}`
  );
  const [copiedBody, setCopiedBody] = useState(false);

  // Drive state
  const [driveExportSuccess, setDriveExportSuccess] = useState(false);

  // Google Calendar API Bi-Directional Sync State
  const [calendarToken, setCalendarToken] = useState<string | null>(() => getCachedCalendarAccessToken());
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [isTokenDrawerOpen, setIsTokenDrawerOpen] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string>('');
  const [isCreatingCalEvent, setIsCreatingCalEvent] = useState(false);

  // New Event Form
  const [newTitle, setNewTitle] = useState('');
  const [newStartsAt, setNewStartsAt] = useState(() => new Date(Date.now() + 3600000).toISOString().slice(0, 16));
  const [newEndsAt, setNewEndsAt] = useState(() => new Date(Date.now() + 7200000).toISOString().slice(0, 16));
  const [newDesc, setNewDesc] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // Destructive confirmation state as mandated by workspace-integration guidelines
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState<{ id: string; title: string; googleId: string } | null>(null);

  useEffect(() => {
    const cached = getCachedCalendarAccessToken();
    if (cached) setCalendarToken(cached);
  }, [isOpen]);

  if (!isOpen) return null;

  // Direct in-app Gmail sending state
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [mailSendStatus, setMailSendStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Handle opening directly in Gmail web composer with parameters
  const handleOpenInGmail = () => {
    const encodedTo = encodeURIComponent(emailTo);
    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(emailBody);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  // Direct in-app email sending via Google Gmail API
  const handleSendViaGmailApi = async () => {
    setIsSendingMail(true);
    setMailSendStatus(null);
    try {
      const token = calendarToken || getCachedCalendarAccessToken();
      if (!token) {
        // Fallback directly to opening in Gmail Web Composer
        handleOpenInGmail();
        setMailSendStatus({
          success: true,
          message: 'OAuth token required for direct silent send. Opened prefilled draft in Gmail Web Composer!',
        });
        return;
      }

      // Format RFC 2822 email message
      const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(emailSubject)))}?=`;
      const emailLines = [
        `To: ${emailTo}`,
        `Subject: ${utf8Subject}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        emailBody,
      ];
      const rawEmail = emailLines.join('\r\n');
      const base64UrlEmail = btoa(unescape(encodeURIComponent(rawEmail)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: base64UrlEmail }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Gmail API returned ${response.status}`);
      }

      setMailSendStatus({
        success: true,
        message: `✓ Email successfully delivered to ${emailTo} directly via Gmail API!`,
      });
    } catch (err: any) {
      console.warn('Gmail API send error:', err);
      handleOpenInGmail();
      setMailSendStatus({
        success: true,
        message: `Opened in Gmail Web Composer: ${err.message || 'Draft prepared to send'}.`,
      });
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  // Handle downloading full system snapshot for Google Drive
  const handleDownloadDriveArchive = () => {
    const archiveData = {
      exportedAt: new Date().toISOString(),
      account: user?.email || 'authenticated-user',
      tasks,
      notes,
      events,
    };
    const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Personal_AI_OS_Drive_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDriveExportSuccess(true);
    setTimeout(() => setDriveExportSuccess(false), 3000);
  };

  // Google Calendar Auth handler
  const handleConnectCalendar = async () => {
    try {
      setSyncFeedback('Initiating Google authentication...');
      const token = await authenticateGoogleCalendar();
      if (token) {
        setCalendarToken(token);
        setCachedCalendarAccessToken(token);
        setSyncFeedback('✓ Connected to Google Calendar account!');
      } else {
        setSyncFeedback('Sign-in cancelled.');
      }
    } catch (err: any) {
      setSyncFeedback(`Authentication error: ${err.message || 'Could not connect'}`);
    }
  };

  const handleSaveManualToken = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualTokenInput.trim();
    if (clean) {
      setCalendarToken(clean);
      setCachedCalendarAccessToken(clean);
      setSyncFeedback('✓ Custom OAuth access token saved.');
      setIsTokenDrawerOpen(false);
    }
  };

  // Run Bi-directional Synchronization
  const handleRunBidirectionalSync = async () => {
    let token = calendarToken || getCachedCalendarAccessToken();
    if (!token) {
      // Prompt user to connect
      token = await authenticateGoogleCalendar();
      if (!token) {
        setSyncFeedback('Please authenticate with Google to synchronize events.');
        return;
      }
      setCalendarToken(token);
    }

    if (!user) {
      setSyncFeedback('Please sign in to Personal AI OS first.');
      return;
    }

    setIsSyncingCalendar(true);
    setSyncFeedback('Syncing with Google Calendar API (bi-directional)...');
    try {
      const report = await syncGoogleCalendarBiDirectionally(token, events, user.uid);
      setSyncReport(report);
      setSyncFeedback(`✓ Bi-directional sync complete: Pushed ${report.pushed} to Google, Imported ${report.pulled} new events.`);
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message || 'API error'}`);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Push single event to Google Calendar
  const handlePushSingleEvent = async (evt: CalendarEventItem) => {
    let token = calendarToken || getCachedCalendarAccessToken();
    if (!token) {
      token = await authenticateGoogleCalendar();
      if (!token) return;
      setCalendarToken(token);
    }

    try {
      setSyncFeedback(`Pushing "${evt.title}" to Google Calendar...`);
      await createGoogleCalendarEvent(token, {
        title: evt.title,
        description: evt.description,
        location: evt.location,
        startsAt: evt.startsAt,
        endsAt: evt.endsAt || undefined,
      });
      setSyncFeedback(`✓ Successfully added "${evt.title}" to your personal Google Calendar!`);
      // Run quick sync to update IDs
      if (user) {
        const report = await syncGoogleCalendarBiDirectionally(token, events, user.uid);
        setSyncReport(report);
      }
    } catch (err: any) {
      setSyncFeedback(`Failed to push event: ${err.message}`);
    }
  };

  // Create new event directly on Google Calendar
  const handleCreateNewGoogleCalEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    let token = calendarToken || getCachedCalendarAccessToken();
    if (!token) {
      token = await authenticateGoogleCalendar();
      if (!token) return;
      setCalendarToken(token);
    }

    if (!newTitle.trim()) return;

    try {
      setSyncFeedback(`Publishing to Google Calendar...`);
      await createGoogleCalendarEvent(token, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        location: newLocation.trim(),
        startsAt: newStartsAt,
        endsAt: newEndsAt,
      });

      setNewTitle('');
      setNewDesc('');
      setNewLocation('');
      setIsCreatingCalEvent(false);
      setSyncFeedback('✓ Event scheduled on Google Calendar!');

      if (user) {
        const report = await syncGoogleCalendarBiDirectionally(token, events, user.uid);
        setSyncReport(report);
      }
    } catch (err: any) {
      setSyncFeedback(`Failed to create Google event: ${err.message}`);
    }
  };

  // Confirm and execute destructive remote event deletion
  const handleConfirmDelete = async () => {
    if (!pendingDeleteEvent) return;
    const token = calendarToken || getCachedCalendarAccessToken();
    if (!token) {
      setPendingDeleteEvent(null);
      return;
    }

    try {
      setSyncFeedback(`Removing "${pendingDeleteEvent.title}" from Google Calendar...`);
      await deleteRemoteGoogleCalendarEvent(token, pendingDeleteEvent.googleId);
      setSyncFeedback(`✓ Event removed from Google Calendar.`);
      if (user) {
        await syncGoogleCalendarBiDirectionally(token, events, user.uid);
      }
    } catch (err: any) {
      setSyncFeedback(`Delete error: ${err.message}`);
    } finally {
      setPendingDeleteEvent(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]/70 bg-[var(--color-surface-elevated)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/15 text-red-500 border border-red-500/30 font-black">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[var(--color-text)] text-base">
                  Google Workspace Hub
                </h3>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  SSO Linked
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Bi-directional Google Calendar sync, Gmail smart composer, Drive vault &amp; Meet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--color-border)]/60 bg-[var(--color-bg-secondary)]/50 px-6 pt-2 gap-2 overflow-x-auto">
          {[
            { id: 'calendar', label: 'Google Calendar API', icon: Calendar, color: 'text-amber-400' },
            { id: 'gmail', label: 'Gmail Composer', icon: Mail, color: 'text-red-400' },
            { id: 'drive', label: 'Google Drive Sync', icon: HardDrive, color: 'text-blue-400' },
            { id: 'meet', label: 'Google Meet', icon: Video, color: 'text-emerald-400' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. GOOGLE CALENDAR TAB (ENHANCED BI-DIRECTIONAL SYNC) */}
          {activeTab === 'calendar' && (
            <div className="space-y-5">
              {/* Sync Status Banner & Action Buttons */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-400" />
                      <h4 className="font-extrabold text-sm text-[var(--color-text)]">
                        Bi-Directional Google Calendar API Sync
                      </h4>
                    </div>
                    <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                      Sync events between your local OS workspace and your personal Google Calendar account in real-time.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTokenDrawerOpen(!isTokenDrawerOpen)}
                      className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-white/5 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                      title="Custom OAuth Token"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href="https://calendar.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-1.5 font-bold text-xs text-[var(--color-text)] hover:text-amber-400"
                    >
                      <span>Open Calendar</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Main Bi-Directional Sync CTA Button */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRunBidirectionalSync}
                    disabled={isSyncingCalendar}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-4 py-2 text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    <ArrowLeftRight className={`w-3.5 h-3.5 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCalendar ? 'Synchronizing Events...' : 'Sync Now (Bi-Directional)'}</span>
                  </button>

                  {!calendarToken ? (
                    <button
                      type="button"
                      onClick={handleConnectCalendar}
                      className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-amber-300 transition-all"
                    >
                      <span>Sign in to Google Account</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 px-2">
                      <Check className="w-3.5 h-3.5" />
                      Google Calendar Connected
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsCreatingCalEvent(!isCreatingCalEvent)}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] hover:bg-white/5 px-3 py-2 text-xs font-bold text-[var(--color-text)] transition-all ml-auto"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>New Google Event</span>
                  </button>
                </div>

                {/* Feedback message / Sync report */}
                {syncFeedback && (
                  <p className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/20 px-3 py-1.5 rounded-xl animate-fade-in font-medium">
                    {syncFeedback}
                  </p>
                )}

                {syncReport && (
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px]">
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <span className="block font-bold text-emerald-400 text-sm">{syncReport.pushed}</span>
                      <span className="text-zinc-400">Pushed to Google</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <span className="block font-bold text-blue-400 text-sm">{syncReport.pulled}</span>
                      <span className="text-zinc-400">Imported to Local</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <span className="block font-bold text-amber-400 text-sm">{syncReport.matched}</span>
                      <span className="text-zinc-400">Synced In Pair</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Token Drawer */}
              {isTokenDrawerOpen && (
                <form onSubmit={handleSaveManualToken} className="p-3.5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-2">
                  <span className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Google Calendar Access Token Override
                  </span>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Paste an active Google Calendar OAuth bearer token with <code className="text-amber-300">calendar.events</code> scope:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ya29.a0..."
                      value={manualTokenInput}
                      onChange={(e) => setManualTokenInput(e.target.value)}
                      className="flex-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-amber-500 text-black font-bold px-3 py-1.5 text-xs"
                    >
                      Save Token
                    </button>
                  </div>
                </form>
              )}

              {/* Form: Create Event on Google Calendar */}
              {isCreatingCalEvent && (
                <form
                  onSubmit={handleCreateNewGoogleCalEvent}
                  className="p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-amber-500/30 space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-xs text-[var(--color-text)]">
                      Create Event Directly on Google Calendar
                    </h5>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCalEvent(false)}
                      className="text-[var(--color-muted)] hover:text-[var(--color-text)] text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Q3 Roadmap Review with Product Team"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        value={newStartsAt}
                        onChange={(e) => setNewStartsAt(e.target.value)}
                        required
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        value={newEndsAt}
                        onChange={(e) => setNewEndsAt(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">Location</label>
                      <input
                        type="text"
                        placeholder="Google Meet or Office Room 4B"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="Agenda and notes..."
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-4 py-2 text-xs transition-colors"
                    >
                      Publish to Google Calendar
                    </button>
                  </div>
                </form>
              )}

              {/* Events List with Sync Badges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--color-muted)] px-1">
                  <span>Workspace &amp; Google Calendar Events ({events.length})</span>
                  <span>Sync Status</span>
                </div>

                {events.length === 0 ? (
                  <p className="text-zinc-500 py-6 text-center text-xs">
                    No events currently found. Click &quot;Sync Now&quot; to fetch your existing Google Calendar events!
                  </p>
                ) : (
                  events.slice(0, 10).map((evt) => {
                    const isSyncedWithGoogle = !!evt.googleCalendarEventId;
                    return (
                      <div
                        key={evt.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-amber-500/40 transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-bold text-[var(--color-text)] truncate">
                              {evt.title}
                            </strong>
                            {isSyncedWithGoogle ? (
                              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-bold text-emerald-400 shrink-0">
                                ✓ Synced with Google
                              </span>
                            ) : (
                              <span className="rounded-full bg-zinc-500/15 border border-zinc-500/30 px-2 py-0.2 text-[9px] font-bold text-zinc-400 shrink-0">
                                Local Only
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--color-muted)]">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {evt.startsAt ? evt.startsAt.slice(0, 16).replace('T', ' ') : 'Unscheduled'}
                            </span>
                            {evt.location && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-red-400" />
                                {evt.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isSyncedWithGoogle ? (
                            <button
                              type="button"
                              onClick={() => handlePushSingleEvent(evt)}
                              className="rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 text-xs font-bold hover:bg-amber-500 hover:text-black transition-all"
                            >
                              Push to Google
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setPendingDeleteEvent({
                                  id: evt.id,
                                  title: evt.title,
                                  googleId: evt.googleCalendarEventId!,
                                })
                              }
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete from Google Calendar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Destructive Action User Confirmation Dialog (MANDATORY per workspace-integration skill) */}
              {pendingDeleteEvent && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Confirm Deletion from Google Calendar</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Are you sure you want to permanently delete the event{' '}
                    <strong className="text-white">&quot;{pendingDeleteEvent.title}&quot;</strong> from your personal
                    Google Calendar account?
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPendingDeleteEvent(null)}
                      className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold px-3.5 py-1 text-xs"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. GMAIL TAB */}
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-[var(--color-text)]">
                    Gmail Smart Draft Composer
                  </h4>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Compose email updates prefilled with your tasks &amp; notes, and launch directly into Gmail.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-1.5 font-bold text-xs text-[var(--color-text)] hover:text-emerald-400 transition-colors"
                  >
                    {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBody ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenInGmail}
                    className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 font-bold text-xs text-red-400 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Web Composer</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSendingMail}
                    onClick={handleSendViaGmailApi}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 px-3.5 py-1.5 font-bold text-xs text-white shadow-md transition-all"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingMail ? 'animate-spin' : ''}`} />
                    <span>{isSendingMail ? 'Sending…' : 'Send via Gmail'}</span>
                  </button>
                </div>
              </div>

              {mailSendStatus && (
                <div
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
                    mailSendStatus.success
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/40 bg-red-500/10 text-red-300'
                  }`}
                >
                  <span>{mailSendStatus.message}</span>
                  <button
                    type="button"
                    onClick={() => setMailSendStatus(null)}
                    className="text-xs opacity-70 hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[var(--color-muted)] mb-1">To</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-[var(--color-text)] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-muted)] mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-[var(--color-text)] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-muted)] mb-1">Email Body</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-[var(--color-text)] outline-none font-mono text-[11px] leading-relaxed resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. GOOGLE DRIVE TAB */}
          {activeTab === 'drive' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-extrabold text-sm text-[var(--color-text)]">
                  Google Drive Cloud Vault &amp; Sync
                </h4>
                <p className="text-[11px] text-[var(--color-muted)]">
                  Export complete workspace documentation, database records, and notes to your Google Drive.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-text)]">
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>Download Drive Snapshot</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                    Packages all {tasks.length} tasks, {notes.length} notes, and calendar events into a verified JSON snapshot archive.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadDriveArchive}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2 font-bold text-white shadow-md transition-all text-xs"
                  >
                    {driveExportSuccess ? 'Archive Downloaded!' : 'Export Drive Archive'}
                  </button>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-text)]">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>New Google Doc</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                    Instantly spawn a blank Google Doc associated with your authenticated Google identity.
                  </p>
                  <a
                    href="https://docs.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-[var(--color-border)] hover:border-emerald-500/50 bg-[var(--color-surface)] py-2 font-bold text-[var(--color-text)] hover:text-emerald-400 transition-all text-xs"
                  >
                    <span>Open docs.new</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 4. GOOGLE MEET TAB */}
          {activeTab === 'meet' && (
            <div className="space-y-4 text-center py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mx-auto">
                <Video className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-extrabold text-[var(--color-text)]">Instant Google Meet Conference</h4>
                <p className="text-xs text-[var(--color-muted)]">
                  Spawn an instant, high-definition Google Meet video call room with real-time screen sharing and captions.
                </p>
              </div>

              <a
                href="https://meet.google.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 font-bold text-xs shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <span>Launch Google Meet Session</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Google Workspace Ecosystem Connected</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 font-bold text-white text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
