import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  User,
  Check,
  ChevronDown,
  Sparkles,
  BarChart3,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ViewTab } from '../types';

interface AccountSwitcherProps {
  onNavigateTab?: (tab: ViewTab) => void;
  className?: string;
  showDetailsDropdown?: boolean;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  onNavigateTab,
  className = '',
  showDetailsDropdown = true,
}) => {
  const { accountType, setAccountType, toggleAccountType, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectMode = async (type: 'personal' | 'business') => {
    if (type === accountType) return;
    await setAccountType(type);
    setToastMessage(
      type === 'business'
        ? '💼 Switched to Business Account (Creator Mode Active)'
        : '👤 Switched to Personal Account'
    );
    setTimeout(() => setToastMessage(null), 3000);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={dropdownRef}>
      {/* Visual Toast Notification on switch */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[160] flex items-center gap-2 rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-surface)] px-4 py-2.5 text-xs font-bold text-[var(--color-text)] shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
          <Sparkles className="w-4 h-4 text-[var(--color-primary)] animate-pulse shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Switcher: Segmented Toggle + Dropdown Caret */}
      <div className="flex items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-1 text-xs shadow-sm transition-all focus-within:ring-2 focus-within:ring-[var(--color-primary)]/40">
        {/* Personal Button */}
        <button
          type="button"
          id="topbar-account-personal-btn"
          onClick={() => handleSelectMode('personal')}
          className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 font-bold transition-all text-xs ${
            accountType === 'personal'
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
          title="Switch to Personal Account Mode"
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xs:inline">Personal</span>
        </button>

        {/* Business Button */}
        <button
          type="button"
          id="topbar-account-business-btn"
          onClick={() => handleSelectMode('business')}
          className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 font-bold transition-all text-xs ${
            accountType === 'business'
              ? 'bg-gradient-to-r from-[var(--color-primary)] to-indigo-600 text-white shadow-md'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
          title="Switch to Business Creator Account Mode"
        >
          <Briefcase className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xs:inline">Business</span>
          {accountType === 'business' && (
            <span className="hidden md:inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        {/* Dropdown toggle button */}
        {showDetailsDropdown && (
          <button
            type="button"
            id="topbar-account-dropdown-toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className={`rounded-xl p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-colors ${
              isOpen ? 'bg-[var(--color-surface)] text-[var(--color-text)]' : ''
            }`}
            title="Account Mode Details & Tools"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
                  Account Switcher
                </h4>
                <p className="text-[10px] text-[var(--color-muted)]">
                  Switch anytime between Personal &amp; Creator Business mode
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                accountType === 'business'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-muted)] border border-[var(--color-border)]'
              }`}
            >
              {accountType === 'business' ? 'Business Mode' : 'Personal Mode'}
            </span>
          </div>

          {/* Account Options List */}
          <div className="space-y-2">
            {/* 1. Personal Account Card */}
            <div
              onClick={() => handleSelectMode('personal')}
              className={`group flex items-start gap-3 rounded-2xl border p-3 cursor-pointer transition-all ${
                accountType === 'personal'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm'
                  : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-primary)]/40'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  accountType === 'personal'
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-[var(--color-surface)] text-[var(--color-muted)] group-hover:text-[var(--color-text)]'
                }`}
              >
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text)]">
                    Personal Account
                  </span>
                  {accountType === 'personal' && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed mt-0.5">
                  Standard workspace for private task management, notes, personal schedule, learning modules, and files.
                </p>
              </div>
            </div>

            {/* 2. Business Account Card */}
            <div
              onClick={() => handleSelectMode('business')}
              className={`group flex items-start gap-3 rounded-2xl border p-3 cursor-pointer transition-all ${
                accountType === 'business'
                  ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/10 via-[var(--color-primary)]/10 to-transparent shadow-sm'
                  : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-secondary)] hover:border-indigo-500/40'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  accountType === 'business'
                    ? 'bg-gradient-to-tr from-[var(--color-primary)] to-indigo-600 text-white shadow-md'
                    : 'bg-[var(--color-surface)] text-[var(--color-muted)] group-hover:text-[var(--color-text)]'
                }`}
              >
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[var(--color-text)]">
                      Business Account
                    </span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 text-[9px] font-bold">
                      Creator
                    </span>
                  </div>
                  {accountType === 'business' && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed mt-0.5">
                  Unlocks Content Analytics (Reach, Impressions, Retention), Pulses performance, Sponsorship rate calculator, and Creator Business Suite.
                </p>
              </div>
            </div>
          </div>

          {/* Quick action footer */}
          <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
            <span className="text-[11px] text-[var(--color-muted)]">
              {profile?.name ? `Signed in as @${profile.username || profile.name}` : 'Local Workspace'}
            </span>

            {accountType === 'business' && onNavigateTab ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateTab('community');
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Open Creator Suite</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleAccountType}
                className="text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                {accountType === 'business' ? 'Switch to Personal' : 'Switch to Business'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
