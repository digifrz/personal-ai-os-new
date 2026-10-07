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

function renderEmptyIcon(icon: LucideIcon | React.ReactNode) {
  if (!icon) return <Inbox className="h-6 w-6" />;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))) {
    const Component = icon as React.ComponentType<{ className?: string }>;
    return <Component className="h-6 w-6" />;
  }
  return <Inbox className="h-6 w-6" />;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = Inbox,
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
        {renderEmptyIcon(icon)}
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
