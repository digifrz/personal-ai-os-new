import React, { useState } from 'react';
import {
  X,
  Palette,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Lock,
  MessageSquare,
  Zap,
  Volume2,
  VolumeX,
  Check,
  AlertTriangle,
  FileText,
  Search,
  Star,
  UserX,
  Flag,
} from 'lucide-react';

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientAvatar?: string;
  onClearChat?: () => void;
  onBlockUser?: () => void;
  onReportUser?: () => void;
  onShowToast: (msg: string) => void;
}

export const THEMES = [
  { id: 'dark', name: 'Classic Dark', color: '#18181b', preview: 'bg-zinc-900 border-zinc-700' },
  { id: 'emerald', name: 'Emerald Glow', color: '#064e3b', preview: 'bg-emerald-950 border-emerald-700' },
  { id: 'violet', name: 'Cyberpunk Violet', color: '#4c1d95', preview: 'bg-violet-950 border-violet-700' },
  { id: 'sunset', name: 'Sunset Orange', color: '#7c2d12', preview: 'bg-amber-950 border-amber-700' },
  { id: 'oled', name: 'Midnight OLED', color: '#000000', preview: 'bg-black border-zinc-800' },
  { id: 'oceanic', name: 'Oceanic Blue', color: '#0c4a6e', preview: 'bg-sky-950 border-sky-700' },
];

export const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  isOpen,
  onClose,
  recipientName,
  recipientAvatar,
  onClearChat,
  onBlockUser,
  onReportUser,
  onShowToast,
}) => {
  const [selectedTheme, setSelectedTheme] = useState(() => {
    try {
      return localStorage.getItem('lounge_chat_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [vanishMode, setVanishMode] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [activeStatus, setActiveStatus] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [muteDuration, setMuteDuration] = useState('8 hours');
  const [autoDownloadMedia, setAutoDownloadMedia] = useState(true);
  const [highQualityMedia, setHighQualityMedia] = useState(true);
  const [awayAutoResponder, setAwayAutoResponder] = useState(false);
  const [quickReplies, setQuickReplies] = useState([
    { shortcut: '/hi', text: 'Hey there! Thanks for reaching out in The Lounge.' },
    { shortcut: '/pricing', text: 'My standard consulting rate is $150/hr or $1,200/day.' },
    { shortcut: '/portfolio', text: 'Check out my full portfolio and projects in my Lounge profile!' },
  ]);
  const [newShortcut, setNewShortcut] = useState('');
  const [newReplyText, setNewReplyText] = useState('');

  if (!isOpen) return null;

  const handleSelectTheme = (themeId: string) => {
    setSelectedTheme(themeId);
    try {
      localStorage.setItem('lounge_chat_theme', themeId);
    } catch {}
    onShowToast(`Theme changed to ${THEMES.find((t) => t.id === themeId)?.name}`);
  };

  const handleExportTranscript = () => {
    const transcript = `--- Lounge Chat Transcript with ${recipientName} ---\nExport Date: ${new Date().toLocaleString()}\nStatus: Verified Encrypted\n---------------------------------------------\n`;
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lounge_Chat_${recipientName.replace(/\s+/g, '_')}_Transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('✓ Chat transcript exported as .txt file');
  };

  const handleAddQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcut.trim() || !newReplyText.trim()) return;
    const formattedShortcut = newShortcut.startsWith('/') ? newShortcut : `/${newShortcut}`;
    setQuickReplies((prev) => [...prev, { shortcut: formattedShortcut, text: newReplyText.trim() }]);
    setNewShortcut('');
    setNewReplyText('');
    onShowToast(`Saved quick reply: ${formattedShortcut}`);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-3">
            {recipientAvatar ? (
              <img src={recipientAvatar} alt={recipientName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-sm">
                {recipientName[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-sm text-[var(--color-text)] flex items-center gap-1.5">
                <span>Chat Settings:</span>
                <span className="text-pink-400">{recipientName}</span>
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>End-to-End Encrypted</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: Chat Themes & Wallpaper */}
          <div className="space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Chat Theme &amp; Color Style</span>
            </span>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${
                    selectedTheme === theme.id
                      ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30'
                      : 'border-[var(--color-border)] hover:bg-white/5'
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-full border shadow-inner flex items-center justify-center ${theme.preview}`}
                  >
                    {selectedTheme === theme.id && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--color-text)] truncate w-full text-center">
                    {theme.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Privacy & Chat Safety */}
          <div className="space-y-3 border-t border-[var(--color-border)]/60 pt-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Privacy &amp; Vanish Controls</span>
            </span>

            <div className="space-y-2">
              {/* Vanish Mode */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div>
                  <strong className="block text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                    <span>Vanish Mode</span>
                    <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded-md">Ephemereal</span>
                  </strong>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                    Messages disappear right after they are seen when you close the chat.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !vanishMode;
                    setVanishMode(next);
                    onShowToast(`Vanish mode ${next ? 'activated' : 'deactivated'}.`);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    vanishMode ? 'bg-purple-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      vanishMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Read Receipts */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div>
                  <strong className="block text-xs font-bold text-[var(--color-text)]">Read Receipts</strong>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                    Let others see when you&apos;ve read their messages in direct conversations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReadReceipts(!readReceipts);
                    onShowToast(`Read receipts ${!readReceipts ? 'enabled' : 'disabled'}.`);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    readReceipts ? 'bg-emerald-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      readReceipts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div>
                  <strong className="block text-xs font-bold text-[var(--color-text)]">Show Active Status</strong>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                    Allow contacts to see when you are online in The Lounge.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveStatus(!activeStatus);
                    onShowToast(`Active status ${!activeStatus ? 'visible' : 'hidden'}.`);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    activeStatus ? 'bg-emerald-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      activeStatus ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Notifications & Sounds */}
          <div className="space-y-3 border-t border-[var(--color-border)]/60 pt-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Notifications &amp; Mute</span>
            </span>

            <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div>
                <strong className="block text-xs font-bold text-[var(--color-text)]">
                  Mute Notifications
                </strong>
                <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                  Silence sound alerts and incoming badges from this thread.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isMuted && (
                  <select
                    value={muteDuration}
                    onChange={(e) => setMuteDuration(e.target.value)}
                    className="text-[11px] rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 text-[var(--color-text)]"
                  >
                    <option value="1 hour">1 hour</option>
                    <option value="8 hours">8 hours</option>
                    <option value="1 day">1 day</option>
                    <option value="Until turned back on">Indefinite</option>
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsMuted(!isMuted);
                    onShowToast(`Chat ${!isMuted ? 'muted' : 'unmuted'}.`);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    isMuted ? 'bg-amber-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      isMuted ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Business Quick Replies (Creator tools) */}
          <div className="space-y-3 border-t border-[var(--color-border)]/60 pt-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Saved Quick Replies (Creator &amp; Business)</span>
            </span>

            <div className="space-y-2">
              {quickReplies.map((qr, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-mono font-bold text-cyan-400">{qr.shortcut}</span>
                    <p className="text-[11px] text-[var(--color-muted)] truncate">{qr.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickReplies(quickReplies.filter((_, idx) => idx !== i))}
                    className="text-zinc-500 hover:text-red-400 p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <form onSubmit={handleAddQuickReply} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="/shortcut"
                  value={newShortcut}
                  onChange={(e) => setNewShortcut(e.target.value)}
                  className="w-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1.5 text-xs text-[var(--color-text)] outline-none font-mono"
                />
                <input
                  type="text"
                  placeholder="Full quick message reply..."
                  value={newReplyText}
                  onChange={(e) => setNewReplyText(e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 text-xs transition-colors shrink-0"
                >
                  Add
                </button>
              </form>
            </div>
          </div>

          {/* Section 5: Conversation Actions & Safety */}
          <div className="space-y-2 border-t border-[var(--color-border)]/60 pt-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-pink-400" />
              <span>Chat Management &amp; Safety</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportTranscript}
                className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2.5 text-xs font-bold text-[var(--color-text)] hover:bg-white/5 transition-colors text-left"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Export Chat Transcript (.txt)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear message history for this conversation?')) {
                    onClearChat?.();
                    onShowToast('✓ Chat history cleared.');
                    onClose();
                  }
                }}
                className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors text-left"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Chat History</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(`Block ${recipientName}? You will not receive messages from them.`)) {
                    onBlockUser?.();
                    onClose();
                  }
                }}
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors text-left"
              >
                <UserX className="w-4 h-4" />
                <span>Block {recipientName}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onReportUser?.();
                  onClose();
                }}
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/40 p-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors text-left"
              >
                <Flag className="w-4 h-4 text-orange-400" />
                <span>Report Conversation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between text-xs text-[var(--color-muted)]">
          <span>Settings applied live to this conversation</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[var(--color-text)] hover:underline"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
