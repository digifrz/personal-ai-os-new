import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { CommunityPostItem } from '../../types';

interface ReportPostModalProps {
  post: CommunityPostItem;
  onClose: () => void;
  onSubmitReport: (postId: string, reason: string) => void;
}

const REPORT_REASONS = [
  'Spam or deceptive links',
  'Harassment or personal attack',
  'Hate speech or discrimination',
  'Inappropriate or sexually explicit content',
  'Misinformation or false claims',
  'Exposure of private personal information',
  'Other policy violation',
];

export const ReportPostModal: React.FC<ReportPostModalProps> = ({
  post,
  onClose,
  onSubmitReport,
}) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport(post.id, `${selectedReason}: ${additionalNotes}`);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[160] flex items-center justify-center bg-[var(--color-bg)]/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-[var(--color-text)]">
              Report Community Post
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-[var(--color-text)]">
              Thank you for reporting
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              Our moderation team will review this post according to The Lounge community rules.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Help us understand what is wrong with this post by <strong>{post.authorName}</strong>.
            </p>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[var(--color-muted)]">
                Select a reason
              </label>
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2.5 text-xs text-[var(--color-text)] cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="text-[var(--color-primary)]"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                Additional context (optional)
              </label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Provide any relevant details..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-all shadow-sm"
              >
                Submit report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
