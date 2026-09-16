import React, { useState } from 'react';
import { X, Send, Shield, Lock, MessageSquare, CheckCircle } from 'lucide-react';

interface ContactSupportModalProps {
  initialTopic?: string;
  onClose: () => void;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  initialTopic = 'General support',
  onClose,
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    const subject = `[Personal AI OS ${topic}] Support Request from ${name}`;
    const body = `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}\n\n---\nSent from Personal AI OS Lounge`;
    const mailtoUrl = `mailto:farzancfarzanc@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;
    setStatus('Your email client was opened with the message prepared for sending.');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[160] flex items-center justify-center bg-[var(--color-bg)]/85 p-4 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative my-8 w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
              We’re here to help
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Contact &amp; Support
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Quick Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTopic('General support')}
            className={`rounded-2xl border p-4 text-left transition-all ${
              topic === 'General support'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-primary)]/50'
            }`}
          >
            <MessageSquare className="w-5 h-5 text-[var(--color-primary)] mb-2" />
            <strong className="block text-xs font-bold text-[var(--color-text)]">
              General support
            </strong>
            <p className="mt-1 text-[11px] text-[var(--color-muted)] leading-relaxed">
              Workspace behavior, account settings, or app features.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTopic('Privacy and data')}
            className={`rounded-2xl border p-4 text-left transition-all ${
              topic === 'Privacy and data'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-cyan-500/50'
            }`}
          >
            <Lock className="w-5 h-5 text-cyan-400 mb-2" />
            <strong className="block text-xs font-bold text-[var(--color-text)]">
              Privacy and data
            </strong>
            <p className="mt-1 text-[11px] text-[var(--color-muted)] leading-relaxed">
              Data exports, deletion requests, or privacy standards.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTopic('Security report')}
            className={`rounded-2xl border p-4 text-left transition-all ${
              topic === 'Security report'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-emerald-500/50'
            }`}
          >
            <Shield className="w-5 h-5 text-emerald-400 mb-2" />
            <strong className="block text-xs font-bold text-[var(--color-text)]">
              Security report
            </strong>
            <p className="mt-1 text-[11px] text-[var(--color-muted)] leading-relaxed">
              Responsible disclosure of suspected vulnerabilities.
            </p>
          </button>
        </div>

        {/* Message Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Farzan"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
              Topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            >
              <option value="General support">General support</option>
              <option value="Privacy and data">Privacy and data</option>
              <option value="Security report">Security report</option>
              <option value="Community moderation">Community moderation</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
              Message Details
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help? Include details or steps..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {status && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{status}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              Close
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Prepare email →</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
