import React, { useState } from 'react';
import {
  X,
  Shield,
  Lock,
  Mic,
  Camera,
  Bell,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface RulesPrivacyModalProps {
  onClose: () => void;
  onOpenContact?: () => void;
}

const COMMUNITY_RULES = [
  {
    num: '01',
    title: 'Respect everyone',
    desc: 'Treat other members respectfully. Do not harass, bully, threaten, humiliate, repeatedly insult, or target someone because of who they are. Disagreements are allowed; personal attacks are not.',
  },
  {
    num: '02',
    title: 'No hate or discrimination',
    desc: 'Do not attack or promote hostility toward people based on race, religion, nationality, disability, gender, sexual orientation, or other protected characteristics. Debate ideas, not people.',
  },
  {
    num: '03',
    title: 'Share useful content',
    desc: 'Good posts include questions, explanations, tutorials, projects, learning resources, technology discussions, study tips, creative work, achievements and constructive opinions.',
  },
  {
    num: '04',
    title: 'No spam',
    desc: 'Do not repeatedly post the same content, unwanted advertisements, promotional messages, referral spam, repetitive comments or artificial engagement requests.',
  },
  {
    num: '05',
    title: "Don't manipulate engagement",
    desc: 'Do not artificially manipulate likes, reactions, followers, comments, views or trending rankings. Do not use fake accounts or automated systems.',
  },
  {
    num: '06',
    title: 'Share links responsibly',
    desc: 'Links should provide genuine value. Do not distribute scam links, phishing pages, malware, suspicious downloads, or deceptive websites.',
  },
  {
    num: '07',
    title: 'Protect personal information',
    desc: 'Never publicly share another person’s home address, phone number, passwords, authentication codes, private documents, or sensitive information.',
  },
  {
    num: '08',
    title: "Don't break the platform",
    desc: 'Do not bypass authentication or security policies, access another user’s private data, exploit vulnerabilities, or attack the service. Report security problems responsibly.',
  },
  {
    num: '09',
    title: "Don't abuse AI features",
    desc: 'Do not flood AI requests, overload the service, circumvent usage limits or use malicious automation. AI features exist to empower users.',
  },
  {
    num: '10',
    title: 'Respect intellectual property',
    desc: 'Only share content you have permission to share. Give appropriate credit, do not claim another person’s work as your own.',
  },
  {
    num: '11',
    title: 'Keep discussions constructive',
    desc: 'Arguments happen. Explain → provide evidence → discuss. Do not attack → insult → provoke. You do not have to agree with everyone.',
  },
  {
    num: '12',
    title: 'No dangerous or illegal activity',
    desc: 'Do not use The Lounge to facilitate harmful or illegal activities, including requests for instructions that could endanger people.',
  },
  {
    num: '13',
    title: 'Keep community appropriate',
    desc: 'Do not post explicit sexual content, pornography or sexually exploitative material. Keep community content appropriate for all members.',
  },
  {
    num: '14',
    title: 'No impersonation',
    desc: 'Do not pretend to be another user, moderator, developer, company representative or real person.',
  },
  {
    num: '15',
    title: 'No misleading information',
    desc: 'Do not intentionally spread false information designed to deceive or harm others. For important claims, provide sources where possible.',
  },
  {
    num: '16',
    title: "Don't abuse messaging",
    desc: 'Respect people’s boundaries. Do not repeatedly contact someone who does not want interaction, spam messages, or harass people.',
  },
  {
    num: '17',
    title: "Don't evade blocks or moderation",
    desc: 'If someone blocks you or a moderator restricts your account, do not create another account or use another method to bypass that restriction.',
  },
  {
    num: '18',
    title: 'Report problems',
    desc: 'Report harassment, spam, scams, security problems, inappropriate content, fake accounts or abuse. Do not start a public fight.',
  },
  {
    num: '19',
    title: "Don't abuse the Report system",
    desc: 'Reports should be genuine. Do not repeatedly report someone simply because you disagree with them.',
  },
  {
    num: '20',
    title: 'Moderation decisions',
    desc: 'Moderators may remove content, limit visibility, or take other reasonable actions to protect community safety, fairness and usefulness.',
  },
];

export const RulesPrivacyModal: React.FC<RulesPrivacyModalProps> = ({
  onClose,
  onOpenContact,
}) => {
  const [showQuickRules, setShowQuickRules] = useState(false);
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [camStatus, setCamStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [notifStatus, setNotifStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [cookieChoice, setCookieChoice] = useState<string>(
    localStorage.getItem('personal-ai-os-cookie-consent') || 'essential'
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const requestPermission = async (type: 'microphone' | 'camera' | 'notifications') => {
    if (type === 'notifications') {
      if (typeof Notification === 'undefined') {
        showToast('Notifications are not supported in this browser.');
        return;
      }
      try {
        const res = await Notification.requestPermission();
        setNotifStatus(res);
        showToast(res === 'granted' ? 'Notification permission granted!' : 'Notification permission denied.');
      } catch (e) {
        showToast('Could not request notifications.');
      }
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('Media permissions are not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        type === 'microphone' ? { audio: true } : { video: true }
      );
      stream.getTracks().forEach((t) => t.stop());
      if (type === 'microphone') setMicStatus('granted');
      if (type === 'camera') setCamStatus('granted');
      showToast(`${type === 'microphone' ? 'Microphone' : 'Camera'} permission granted.`);
    } catch {
      if (type === 'microphone') setMicStatus('denied');
      if (type === 'camera') setCamStatus('denied');
      showToast(`Permission denied for ${type}.`);
    }
  };

  const handleResetCookies = () => {
    localStorage.removeItem('personal-ai-os-cookie-consent');
    setCookieChoice('reset');
    showToast('Cookie choice reset to defaults.');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[150] flex items-center justify-center bg-[var(--color-bg)]/85 p-4 backdrop-blur-md overflow-y-auto"
    >
      {feedback && (
        <div className="fixed bottom-6 right-6 z-[200] rounded-xl border border-[var(--color-primary)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-xs font-bold text-[var(--color-text)] shadow-xl animate-fade-in">
          {feedback}
        </div>
      )}

      <div className="relative my-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--color-cyan)]">
              🌐 The Lounge Standards
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
              Community Rules, Privacy &amp; Controls
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuickRules(true)}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
            >
              📌 Quick rules
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Welcome Banner */}
        <section className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                👋 Welcome to The Lounge
              </p>
              <h3 className="text-lg font-bold text-[var(--color-text)]">
                Build a community worth being part of. 🚀
              </h3>
            </div>
          </div>
          <p className="text-xs text-[var(--color-muted)] leading-relaxed">
            The Lounge is for learning, questions, ideas, technology discussions, projects, resources, achievements, support and meaningful connections.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold text-[var(--color-text)]">
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1">
              🤝 Respect members
            </span>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1">
              🧠 Share useful content
            </span>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1">
              🔒 Protect privacy
            </span>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1">
              🛡️ Keep the platform safe
            </span>
          </div>
        </section>

        {/* 20 Community Rules */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                📜 The Lounge Rules
              </p>
              <h3 className="text-lg font-bold text-[var(--color-text)]">
                A clear standard for participation
              </h3>
            </div>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-xs font-bold text-[var(--color-muted)]">
              20 rules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {COMMUNITY_RULES.map((rule) => (
              <div
                key={rule.num}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-1.5 hover:border-[var(--color-primary)]/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-[var(--color-primary)]">
                    {rule.num}
                  </span>
                  <strong className="text-xs font-bold text-[var(--color-text)]">
                    {rule.title}
                  </strong>
                </div>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                  {rule.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Principles Grid */}
        <section className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
            ⭐ Community Principles
          </p>
          <h3 className="text-base font-bold text-[var(--color-text)]">
            Learn. Create. Connect. Help. Respect. Protect. Improve.
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
              <strong className="block text-[var(--color-text)]">📖 Learn</strong>
              <span className="text-[10px] text-[var(--color-muted)]">Share knowledge freely</span>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
              <strong className="block text-[var(--color-text)]">🛠️ Create</strong>
              <span className="text-[10px] text-[var(--color-muted)]">Show your real work</span>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
              <strong className="block text-[var(--color-text)]">🔗 Connect</strong>
              <span className="text-[10px] text-[var(--color-muted)]">Find peers &amp; mentors</span>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
              <strong className="block text-[var(--color-text)]">🤝 Help</strong>
              <span className="text-[10px] text-[var(--color-muted)]">Answer and guide</span>
            </div>
          </div>
        </section>

        {/* Browser Permissions Controls */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
              Your Browser Controls
            </p>
            <h3 className="text-base font-bold text-[var(--color-text)]">
              Device Permissions
            </h3>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              The Lounge requests access only when you actively choose those features (e.g., recording a voice message or uploading a camera capture).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Microphone */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text)]">
                <Mic className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Microphone</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)]">
                Used only for recorded voice messages in private chat.
              </p>
              <button
                type="button"
                onClick={() => requestPermission('microphone')}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)]"
              >
                {micStatus === 'granted' ? '✓ Granted' : 'Request access'}
              </button>
            </div>

            {/* Camera */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text)]">
                <Camera className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Camera</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)]">
                Used only when capturing photos or videos for stories.
              </p>
              <button
                type="button"
                onClick={() => requestPermission('camera')}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)]"
              >
                {camStatus === 'granted' ? '✓ Granted' : 'Request access'}
              </button>
            </div>

            {/* Notifications */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text)]">
                <Bell className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Notifications</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)]">
                Used for instant direct message notifications and alerts.
              </p>
              <button
                type="button"
                onClick={() => requestPermission('notifications')}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)]"
              >
                {notifStatus === 'granted' ? '✓ Granted' : 'Request access'}
              </button>
            </div>
          </div>
        </section>

        {/* Cookies & Contact Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-muted)]">
          <div className="flex items-center gap-2">
            <span>Cookies: Essential only</span>
            <button
              type="button"
              onClick={handleResetCookies}
              className="text-[11px] font-bold text-[var(--color-primary)] hover:underline"
            >
              Reset cookie choice
            </button>
          </div>

          <div className="flex items-center gap-3">
            {onOpenContact && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenContact();
                }}
                className="flex items-center gap-1 font-bold text-[var(--color-cyan)] hover:underline"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Contact support &amp; reports</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Quick Rules Mini Dialog */}
      {showQuickRules && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                  📌 Short Version
                </p>
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  The Lounge in 10 Points
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickRules(false)}
                className="p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-2 text-xs text-[var(--color-text)]">
              <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2">
                🤝 Respect other members
              </li>
              <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2">
                🚫 No harassment, hate or bullying
              </li>
              <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2">
                🛑 No spam, scams or malicious links
              </li>
              <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2">
                🔒 Protect private information
              </li>
              <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2">
                🧠 Share useful and meaningful content
              </li>
              <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2">
                📚 Respect creators and intellectual property
              </li>
              <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2">
                🛡️ Don't access others' private data
              </li>
              <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2">
                🤖 Don't abuse AI or platform APIs
              </li>
              <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2">
                💬 Respect people's boundaries in DMs
              </li>
              <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2">
                🚨 Report problems instead of escalating them
              </li>
            </ul>

            <button
              type="button"
              onClick={() => setShowQuickRules(false)}
              className="w-full rounded-xl bg-[var(--color-primary)] py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
