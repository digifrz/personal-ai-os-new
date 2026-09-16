import React from 'react';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'feed' | 'chat' | 'table';
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'card',
  count = 3,
  className = '',
}) => {
  const items = Array.from({ length: count });

  if (type === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 animate-pulse"
          >
            <div className="h-5 w-5 rounded-lg bg-[var(--color-border)] shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded-md bg-[var(--color-border)]" />
              <div className="h-2.5 w-2/3 rounded-md bg-[var(--color-border)]/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'feed') {
    return (
      <div className={`space-y-4 ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--color-border)] shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-28 rounded-md bg-[var(--color-border)]" />
                <div className="h-2.5 w-20 rounded-md bg-[var(--color-border)]/60" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded-md bg-[var(--color-border)]/80" />
              <div className="h-3 w-5/6 rounded-md bg-[var(--color-border)]/80" />
              <div className="h-3 w-3/4 rounded-md bg-[var(--color-border)]/60" />
            </div>
            <div className="h-28 rounded-2xl bg-[var(--color-border)]/40" />
            <div className="flex items-center gap-4 pt-2">
              <div className="h-7 w-16 rounded-xl bg-[var(--color-border)]/60" />
              <div className="h-7 w-16 rounded-xl bg-[var(--color-border)]/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chat') {
    return (
      <div className={`space-y-3 p-4 ${className}`}>
        {items.map((_, i) => {
          const isMine = i % 2 === 1;
          return (
            <div
              key={i}
              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-pulse`}
            >
              <div
                className={`h-12 rounded-2xl bg-[var(--color-border)] ${
                  isMine ? 'w-2/3 bg-[var(--color-primary)]/20' : 'w-1/2'
                }`}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Default 'card' mode
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {items.map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-2xl bg-[var(--color-border)]" />
            <div className="h-4 w-12 rounded-full bg-[var(--color-border)]/70" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-2/3 rounded-md bg-[var(--color-border)]" />
            <div className="h-3 w-full rounded-md bg-[var(--color-border)]/60" />
          </div>
          <div className="h-6 w-1/3 rounded-lg bg-[var(--color-border)]/50 pt-2" />
        </div>
      ))}
    </div>
  );
};
