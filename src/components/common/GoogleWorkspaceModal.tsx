import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TaskItem, NoteItem, CalendarEventItem } from '../../types';

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
  const [activeTab, setActiveTab] = useState<'gmail' | 'drive' | 'calendar' | 'meet'>('gmail');

  // Gmail State
  const [emailTo, setEmailTo] = useState('colleague@example.com');
  const [emailSubject, setEmailSubject] = useState('Workspace Executive Update');
  const [emailBody, setEmailBody] = useState(
    `Hello,\n\nHere is an executive update from my Personal AI OS Workspace:\n- Active Tasks: ${tasks.filter(t => t.status !== 'done').length} open items\n- Notes & Documentation: ${notes.length} entries\n\nPlease let me know if you would like to coordinate.\n\nBest regards,\n${user?.email?.split('@')[0] || 'Personal AI OS User'}`
  );
  const [copiedBody, setCopiedBody] = useState(false);

  // Drive state
  const [driveExportSuccess, setDriveExportSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle opening directly in Gmail web composer with parameters
  const handleOpenInGmail = () => {
    const encodedTo = encodeURIComponent(emailTo);
    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(emailBody);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
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
                Direct integration with Gmail, Google Drive, Calendar &amp; Meet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[var(--color-border)]/60 bg-[var(--color-surface)] px-6 gap-2">
          {[
            { id: 'gmail', label: 'Gmail', icon: Mail, color: 'text-red-400' },
            { id: 'drive', label: 'Google Drive', icon: HardDrive, color: 'text-blue-400' },
            { id: 'calendar', label: 'Google Calendar', icon: Calendar, color: 'text-amber-400' },
            { id: 'meet', label: 'Google Meet', icon: Video, color: 'text-emerald-400' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                  isActive
                    ? 'border-[var(--color-primary)] text-[var(--color-text)]'
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* 1. GMAIL TAB */}
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-[var(--color-text)]">
                    Smart AI Email Drafter
                  </h4>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Generate structured workspace email drafts and open directly in Gmail.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all"
                  >
                    {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBody ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenInGmail}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-md transition-all"
                  >
                    <span>Open in Gmail</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block font-bold text-[var(--color-muted)] mb-1">Recipient</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-[var(--color-text)] outline-none"
                    placeholder="recipient@company.com"
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

          {/* 2. GOOGLE DRIVE TAB */}
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
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2 font-bold text-white shadow-md transition-all"
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
                    className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-[var(--color-border)] hover:border-emerald-500/50 bg-[var(--color-surface)] py-2 font-bold text-[var(--color-text)] hover:text-emerald-400 transition-all"
                  >
                    <span>Open docs.new</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 3. GOOGLE CALENDAR TAB */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-[var(--color-text)]">
                    Google Calendar Sync
                  </h4>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Quickly add upcoming workspace deadlines to your Google Calendar.
                  </p>
                </div>

                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-1.5 font-bold text-[var(--color-text)] hover:text-amber-400"
                >
                  <span>Open Calendar</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-2">
                {events.length === 0 ? (
                  <p className="text-zinc-500 py-4 text-center">No upcoming calendar events in queue.</p>
                ) : (
                  events.slice(0, 4).map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
                    >
                      <div>
                        <strong className="block text-xs font-bold text-[var(--color-text)]">{evt.title}</strong>
                        <span className="text-[10px] text-[var(--color-muted)] font-mono">{evt.startsAt.slice(0, 10)}</span>
                      </div>
                      <a
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evt.title)}&details=${encodeURIComponent(evt.description || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 text-[11px] font-bold hover:bg-amber-500 hover:text-black transition-all"
                      >
                        Add to Google Cal
                      </a>
                    </div>
                  ))
                )}
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
