import React from 'react';
import {
  X,
  Sparkles,
  Bot,
  Music,
  Mail,
  Video,
  ExternalLink,
  Layers,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Github,
  Palette,
  ArrowRight,
  Radio,
} from 'lucide-react';

export interface OSAppHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChatGPT: () => void;
  onOpenSpotify: () => void;
  onOpenGoogleWorkspace: () => void;
  onOpenVideoCall: () => void;
}

export const OSAppHubModal: React.FC<OSAppHubModalProps> = ({
  isOpen,
  onClose,
  onOpenChatGPT,
  onOpenSpotify,
  onOpenGoogleWorkspace,
  onOpenVideoCall,
}) => {
  if (!isOpen) return null;

  const APPS = [
    {
      id: 'chatgpt',
      name: 'OpenAI ChatGPT',
      category: 'External AI Assistant',
      badge: 'GPT-4o Engine',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      description: 'Multi-model reasoning assistant. Ask questions, draft code, and synthesize thoughts alongside Gemini.',
      icon: Bot,
      iconBg: 'bg-emerald-600 text-white',
      actionLabel: 'Launch ChatGPT',
      action: () => {
        onClose();
        onOpenChatGPT();
      },
      status: 'Ready & Linked',
    },
    {
      id: 'spotify',
      name: 'Spotify Focus Audio',
      category: 'OS Media Player',
      badge: 'Official Embed',
      badgeColor: 'bg-[#1DB954]/20 text-[#1DB954] border-[#1DB954]/40',
      description: 'Stream Deep Focus, Lofi Beats, and Brain Food playlists in a persistent dockable floating player.',
      icon: Music,
      iconBg: 'bg-[#1DB954] text-black',
      actionLabel: 'Open Spotify Player',
      action: () => {
        onClose();
        onOpenSpotify();
      },
      status: 'Audio Active',
    },
    {
      id: 'google',
      name: 'Google Workspace',
      category: 'Productivity Suite',
      badge: 'SSO Active',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      description: 'Compose and open Gmail drafts, export archives to Google Drive, sync Google Calendar, and launch Meet.',
      icon: Mail,
      iconBg: 'bg-red-600 text-white',
      actionLabel: 'Open Workspace Hub',
      action: () => {
        onClose();
        onOpenGoogleWorkspace();
      },
      status: 'Connected',
    },
    {
      id: 'videocall',
      name: 'Live WebRTC Video & Audio',
      category: 'Real-Time Communication',
      badge: 'E2EE Encrypted',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
      description: 'Peer-to-peer high-definition video calls with real microphone equalizer, screen share, and picture-in-picture.',
      icon: Video,
      iconBg: 'bg-indigo-600 text-white',
      actionLabel: 'Start Video Meet',
      action: () => {
        onClose();
        onOpenVideoCall();
      },
      status: 'WebRTC Online',
    },
    {
      id: 'canva',
      name: 'Canva Design Studio',
      category: 'Visual Graphics',
      badge: 'Design SDK',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      description: 'Generate high-res graphics, lounge story cards, and slide presentations directly in Canva.',
      icon: Palette,
      iconBg: 'bg-cyan-600 text-white',
      actionLabel: 'Open Canva Design',
      action: () => {
        window.open('https://www.canva.com', '_blank', 'noopener,noreferrer');
      },
      status: 'Web Ready',
    },
    {
      id: 'github',
      name: 'GitHub Cloud Integration',
      category: 'Developer Tools',
      badge: 'VCS Linked',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      description: 'Sync workspace code repositories, track project milestones, and link issue boards with git commits.',
      icon: Github,
      iconBg: 'bg-zinc-800 text-white border border-zinc-700',
      actionLabel: 'Open GitHub',
      action: () => {
        window.open('https://github.com', '_blank', 'noopener,noreferrer');
      },
      status: 'Cloud Ready',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]/70 bg-gradient-to-r from-[var(--color-surface-elevated)] via-[var(--color-surface)] to-[var(--color-surface-elevated)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary)] shadow-md">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-[var(--color-text)] tracking-tight">
                  OS App Hub &amp; Integrations
                </h2>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400">
                  Universal Hub
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Your home for all real external apps: ChatGPT, Spotify, Google Workspace, Video Calling, Canva &amp; GitHub.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Apps Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {APPS.map((app) => {
              const Icon = app.icon;
              return (
                <div
                  key={app.id}
                  className="flex flex-col justify-between rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm hover:border-[var(--color-primary)]/50 hover:shadow-xl transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-md ${app.iconBg}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${app.badgeColor}`}>
                        {app.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                        {app.name}
                      </h3>
                      <span className="text-[10px] font-mono text-[var(--color-muted)] block">
                        {app.category}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                      {app.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[var(--color-border)]/60 mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{app.status}</span>
                    </span>

                    <button
                      type="button"
                      onClick={app.action}
                      className="flex items-center gap-1 rounded-xl bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
                    >
                      <span>{app.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-muted)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero-Trust Client Authentication · All third-party services isolated</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] px-4 py-1.5 font-bold text-[var(--color-text)] text-xs transition-colors"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
