import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex min-h-[280px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] p-8 text-center bg-[var(--color-surface)]/50 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-bg-secondary)] text-[var(--color-muted)] mb-3 border border-[var(--color-border)]">
        {typeof Icon === 'function' ? <Icon className="h-6 w-6" /> : Icon}
      </div>
      <h3 className="text-sm font-bold text-[var(--color-text)] sm:text-base">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-[var(--color-muted)] leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
