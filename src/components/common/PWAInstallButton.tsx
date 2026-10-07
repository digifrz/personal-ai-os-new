import React, { useState } from 'react';
import { Download, Share2, X, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'pill' | 'sidebar' | 'icon';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 3000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (!isInstallable && !isIOS && !justInstalled) {
    return null;
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          title={isIOS ? 'Install Personal AI OS on iOS' : 'Install Personal AI OS App'}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 hover:text-white transition-all shadow-sm ${className}`}
        >
          {justInstalled ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </button>
      ) : variant === 'sidebar' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`group flex w-full items-center gap-3 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-violet-950/30 px-3 py-2 text-xs font-semibold text-indigo-200 hover:border-indigo-500/60 hover:text-white transition-all shadow-sm ${className}`}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
            <Download className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <span className="block truncate">Install App</span>
            <span className="block truncate text-[10px] text-[var(--color-muted)] font-normal">
              Offline access &amp; instant load
            </span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          title={isIOS ? 'Install Personal AI OS on iOS' : 'Install Personal AI OS App'}
          className={`flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:from-indigo-500/30 hover:to-violet-500/30 hover:text-white transition-all shadow-sm ${className}`}
        >
          {justInstalled ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Installed!</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              <span>Install App</span>
            </>
          )}
        </button>
      )}

      {/* iOS Safari Guided Install Sheet */}
      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text)]">
                  Install on iPhone / iPad
                </h3>
                <p className="text-xs text-[var(--color-muted)]">
                  Add Personal AI OS to your home screen
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs text-[var(--color-text)]">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
                  1
                </span>
                <p className="text-xs text-[var(--color-muted)]">
                  Tap the <strong className="text-[var(--color-text)]">Share</strong> icon{' '}
                  <Share2 className="inline h-3.5 w-3.5 text-indigo-400 align-text-bottom" /> in Safari's bottom toolbar.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
                  2
                </span>
                <p className="text-xs text-[var(--color-muted)]">
                  Scroll down the menu and select{' '}
                  <strong className="text-[var(--color-text)]">Add to Home Screen</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
                  3
                </span>
                <p className="text-xs text-[var(--color-muted)]">
                  Tap <strong className="text-[var(--color-text)]">Add</strong> in the top right to complete installation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
