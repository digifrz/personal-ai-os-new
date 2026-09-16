import React, { useState } from 'react';
import { X, Copy, Share2, Check } from 'lucide-react';
import { CommunityPostItem } from '../../types';

interface SharePostModalProps {
  post: CommunityPostItem;
  onClose: () => void;
  onShareToFeed: (post: CommunityPostItem) => void;
  onShowToast: (msg: string) => void;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({
  post,
  onClose,
  onShareToFeed,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/community#post-${post.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      onShowToast('In-app link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast('Could not copy link to clipboard.');
    }
  };

  const handleShare = () => {
    onShareToFeed(post);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[150] flex items-center justify-center bg-[var(--color-bg)]/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-cyan)]">
              In-app sharing
            </p>
            <h3 className="text-base font-bold text-[var(--color-text)]">
              Share with your Lounge
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

        <p className="text-xs text-[var(--color-muted)]">
          Share this post inside Personal AI OS or copy its direct link to revisit.
        </p>

        {/* Post Preview Snippet */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-[10px] font-bold text-[var(--color-primary)]">
              {post.authorName?.[0]?.toUpperCase() || 'U'}
            </span>
            <strong className="text-xs font-bold text-[var(--color-text)]">
              {post.authorName}
            </strong>
          </div>
          <p className="text-xs text-[var(--color-muted)] line-clamp-3">
            {post.content}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-2.5 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Share to my feed</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied to clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[var(--color-muted)]" />
                <span>Copy in-app link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
