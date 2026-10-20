import React, { useState } from 'react';
import {
  Crown,
  Check,
  X,
  Sparkles,
  Zap,
  Shield,
  HardDrive,
  Radio,
  Volume2,
  Wand2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RealPaymentCheckoutModal } from './RealPaymentCheckoutModal';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { profile, premiumStatus, setPremiumTier } = useAuth();
  const currentTier = premiumStatus.tier;

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [checkoutData, setCheckoutData] = useState<{
    isOpen: boolean;
    planTitle: string;
    amount: number;
  }>({
    isOpen: false,
    planTitle: 'Pro Plan',
    amount: 12,
  });

  if (!isOpen) return null;

  const handleSelectTier = async (tier: 'free' | 'pro' | 'executive') => {
    if (tier === 'free') {
      await setPremiumTier('free');
      onShowToast('Switched to Starter Core plan.');
      setTimeout(() => onClose(), 600);
      return;
    }

    const price = tier === 'pro'
      ? (billingCycle === 'yearly' ? 12 : 15)
      : (billingCycle === 'yearly' ? 24 : 29);

    setCheckoutData({
      isOpen: true,
      planTitle: tier === 'pro' ? 'Personal AI OS Pro' : 'Personal AI OS Executive Unlimited',
      amount: price,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-4xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[var(--color-border)] bg-gradient-to-r from-amber-950/30 via-[var(--color-surface)] to-indigo-950/30 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight">
                Unlock Personal AI OS Pro
              </h2>
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-1 max-w-xl">
              Elevate your daily driver operating system with unrestricted Imagen 3 vision generation, voice briefings, and advanced cloud storage.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Billing Selector */}
        <div className="flex items-center justify-center gap-3 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 text-xs">
          <span className={billingCycle === 'monthly' ? 'font-bold text-[var(--color-text)]' : 'text-[var(--color-muted)]'}>
            Billed Monthly
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6 rounded-full bg-indigo-600 p-0.5 transition-colors relative"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex items-center gap-1.5">
            <span className={billingCycle === 'yearly' ? 'font-bold text-[var(--color-text)]' : 'text-[var(--color-muted)]'}>
              Billed Annually
            </span>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-black text-emerald-300">
              Save 25%
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Free Starter */}
          <div className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition-all ${
            currentTier === 'free' ? 'border-zinc-500 bg-zinc-900/30' : 'border-[var(--color-border)] bg-[var(--color-surface)]'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--color-muted)]">Starter Core</span>
                {currentTier === 'free' && (
                  <span className="text-[10px] font-bold text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono text-[var(--color-text)]">$0</span>
                <span className="text-[var(--color-muted)]">/ forever</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mt-1">
                Essential tools for personal productivity and note taking.
              </p>

              <div className="space-y-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tasks, Notes &amp; Calendar</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>500 MB Cloud Storage</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard Gemini AI Chat</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-muted)]">
                  <X className="w-4 h-4 text-zinc-600 shrink-0" />
                  <span>Imagen 3 Vision Generator</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-muted)]">
                  <X className="w-4 h-4 text-zinc-600 shrink-0" />
                  <span>Spoken Voice Briefings</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectTier('free')}
              className="w-full py-2 rounded-xl border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] hover:bg-white/5 transition-all"
            >
              Select Free
            </button>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="relative p-5 rounded-3xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-950/20 via-[var(--color-surface)] to-[var(--color-surface)] flex flex-col justify-between space-y-4 shadow-xl">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
              Most Popular
            </span>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Personal AI OS Pro</span>
                </span>
                {currentTier === 'pro' && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Active Plan
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono text-[var(--color-text)]">
                  ${billingCycle === 'yearly' ? '9' : '12'}
                </span>
                <span className="text-[var(--color-muted)]">/ month</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mt-1">
                Unrestricted intelligence, vision generator, and voice briefings.
              </p>

              <div className="space-y-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">Unlimited Imagen 3 Vision Art</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">Spoken Web Speech Briefings</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>10 GB Encrypted Cloud Vault</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Multi-Window OS Floating Panels</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Lounge Voice Room Stage Broadcasting</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectTier('pro')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-black text-white shadow-lg transition-all"
            >
              {currentTier === 'pro' ? 'Keep Pro Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Executive Unlimited */}
          <div className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition-all ${
            currentTier === 'executive' ? 'border-amber-500 bg-amber-950/20 shadow-xl' : 'border-[var(--color-border)] bg-[var(--color-surface)]'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Executive Tier</span>
                </span>
                {currentTier === 'executive' && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Active Plan
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono text-[var(--color-text)]">
                  ${billingCycle === 'yearly' ? '24' : '29'}
                </span>
                <span className="text-[var(--color-muted)]">/ month</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mt-1">
                For founders, researchers, and power users needing enterprise autonomy.
              </p>

              <div className="space-y-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">All Pro Features Included</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>50 GB Cloud Storage Vault</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Multi-Model AI (Gemini + GPT-4o)</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom Google Workspace Automations</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectTier('executive')}
              className="w-full py-2 rounded-xl border border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 text-xs font-bold text-amber-300 transition-all"
            >
              {currentTier === 'executive' ? 'Keep Executive' : 'Select Executive'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>30-Day Money-Back Guarantee</span>
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Cancel Anytime · No Contracts</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[var(--color-text)] hover:underline self-end sm:self-auto"
          >
            Close Window
          </button>
        </div>
      </div>

      {/* Real Payment Gateway Checkout Modal */}
      <RealPaymentCheckoutModal
        isOpen={checkoutData.isOpen}
        onClose={() => setCheckoutData((prev) => ({ ...prev, isOpen: false }))}
        planTitle={checkoutData.planTitle}
        amount={checkoutData.amount}
        currency="USD"
        onShowToast={onShowToast}
        onSuccess={() => {
          setCheckoutData((prev) => ({ ...prev, isOpen: false }));
          onClose();
        }}
      />
    </div>
  );
};
