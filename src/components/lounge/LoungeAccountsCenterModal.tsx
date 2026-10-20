import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  Shield,
  Lock,
  Globe,
  Bell,
  Check,
  ChevronRight,
  ExternalLink,
  DollarSign,
  CreditCard,
  Building,
  Mail,
  Phone,
  Link as LinkIcon,
  Sparkles,
  Sliders,
  Eye,
  EyeOff,
  Share2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoungeAccountsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onOpenPayments?: () => void;
}

export const LoungeAccountsCenterModal: React.FC<LoungeAccountsCenterModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onOpenPayments,
}) => {
  const { user, profile, accountType, setAccountType } = useAuth();
  const [activeSection, setActiveSection] = useState<'profiles' | 'business_tools' | 'privacy' | 'monetization'>('profiles');

  // Business Profile customization states
  const [businessCategory, setBusinessCategory] = useState<string>(() => {
    try {
      return localStorage.getItem('lounge_biz_category') || 'Digital Creator';
    } catch {
      return 'Digital Creator';
    }
  });

  const [businessEmail, setBusinessEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('lounge_biz_email') || user?.email || 'contact@creator.lounge';
    } catch {
      return user?.email || 'contact@creator.lounge';
    }
  });

  const [businessPhone, setBusinessPhone] = useState<string>(() => {
    try {
      return localStorage.getItem('lounge_biz_phone') || '+1 (555) 019-2834';
    } catch {
      return '+1 (555) 019-2834';
    }
  });

  const [businessWebsite, setBusinessWebsite] = useState<string>(() => {
    try {
      return localStorage.getItem('lounge_biz_website') || 'https://lounge.me/creator';
    } catch {
      return 'https://lounge.me/creator';
    }
  });

  const [actionButtonType, setActionButtonType] = useState<string>(() => {
    try {
      return localStorage.getItem('lounge_biz_action_btn') || 'Book Now';
    } catch {
      return 'Book Now';
    }
  });

  const [isPrivateAccount, setIsPrivateAccount] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lounge_privacy_is_private') === 'true';
    } catch {
      return false;
    }
  });

  const [allowMentions, setAllowMentions] = useState<'everyone' | 'following' | 'nobody'>('everyone');
  const [filterOffensiveComments, setFilterOffensiveComments] = useState(true);

  if (!isOpen) return null;

  const handleSaveBusinessProfile = () => {
    try {
      localStorage.setItem('lounge_biz_category', businessCategory);
      localStorage.setItem('lounge_biz_email', businessEmail);
      localStorage.setItem('lounge_biz_phone', businessPhone);
      localStorage.setItem('lounge_biz_website', businessWebsite);
      localStorage.setItem('lounge_biz_action_btn', actionButtonType);
    } catch {}
    onShowToast('✓ Lounge Business Profile & Contact options updated!');
  };

  const handleTogglePrivacy = (isPrivate: boolean) => {
    setIsPrivateAccount(isPrivate);
    try {
      localStorage.setItem('lounge_privacy_is_private', String(isPrivate));
    } catch {}
    onShowToast(`Lounge profile is now ${isPrivate ? '🔒 Private' : '🌐 Public'}.`);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-4xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-gradient-to-r from-purple-950/40 via-[var(--color-surface)] to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-black shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-[var(--color-text)]">
                  Lounge Accounts Center
                </h2>
                <span className="rounded-full bg-pink-500/15 border border-pink-500/30 px-2 py-0.5 text-[10px] font-bold text-pink-400">
                  Lounge OS
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Manage personal vs business profiles, contact options, payments &amp; privacy
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two Column Layout: Navigation tabs + Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Navigation Sidebar */}
          <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 p-3 space-y-1 shrink-0 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
              Account Architecture
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('profiles')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all text-left ${
                activeSection === 'profiles'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span>Profile &amp; Mode Switch</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('business_tools')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all text-left ${
                activeSection === 'business_tools'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4" />
                <span>Business &amp; Creator Suite</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('monetization')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all text-left ${
                activeSection === 'monetization'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4" />
                <span>Payments &amp; Invoicing</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('privacy')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all text-left ${
                activeSection === 'privacy'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4" />
                <span>Privacy &amp; Security</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </aside>

          {/* Right Content Area */}
          <main className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* ======================================================== */}
            {/* SECTION 1: PROFILES & MODE SWITCH */}
            {/* ======================================================== */}
            {activeSection === 'profiles' && (
              <div className="space-y-6 animate-fade-in">
                {/* Active Profile Card */}
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
                      Lounge Primary Identity
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                      accountType === 'business'
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                        : 'border-blue-500/40 bg-blue-500/15 text-blue-400'
                    }`}>
                      {accountType === 'business' ? '💼 Professional Business' : '👤 Personal Account'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Avatar" className="h-14 w-14 rounded-full object-cover border-2 border-purple-500/40" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                        {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'L'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-base text-[var(--color-text)]">
                        {profile?.name || user?.email?.split('@')[0] || 'Lounge Explorer'}
                      </h3>
                      <p className="text-xs text-pink-400 font-medium">
                        @{profile?.name?.toLowerCase().replace(/\s+/g, '') || 'member'} · {businessCategory}
                      </p>
                      <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                        {user?.email || 'Connected to Personal AI OS Workspace'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Type Switcher */}
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <h4 className="text-sm font-extrabold text-[var(--color-text)]">
                    Account Type &amp; Professional Switch
                  </h4>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                    Distinguish between personal casual browsing and a dedicated business profile with audience insights, custom action buttons, and payment integration.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        await setAccountType('personal');
                        onShowToast('✓ Switched to Personal Lounge Profile');
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                        accountType === 'personal'
                          ? 'border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500/50'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-blue-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 font-bold">
                          <User className="w-5 h-5" />
                        </span>
                        {accountType === 'personal' && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[10px]">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div>
                        <strong className="block text-xs font-bold text-[var(--color-text)]">Personal Account</strong>
                        <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                          Follow creators, share stories, save inspirations, and chat directly.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await setAccountType('business');
                        onShowToast('✓ Switched to Professional Business Suite');
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                        accountType === 'business'
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/50'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
                          <Briefcase className="w-5 h-5" />
                        </span>
                        {accountType === 'business' && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div>
                        <strong className="block text-xs font-bold text-[var(--color-text)]">Professional / Business Account</strong>
                        <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                          Professional dashboard, reach analytics, business contact bar, and monetization.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 2: BUSINESS & CREATOR SUITE */}
            {/* ======================================================== */}
            {activeSection === 'business_tools' && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-[var(--color-text)]">
                        Lounge Professional Details &amp; Contact Bar
                      </h4>
                      <p className="text-xs text-[var(--color-muted)]">
                        Configure public contact buttons displayed on your Lounge profile.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-purple-500/15 text-purple-400 text-[10px] font-bold">
                      Publicly Visible
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                        Professional Category
                      </label>
                      <select
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                      >
                        <option value="Digital Creator">Digital Creator</option>
                        <option value="Software Engineer & AI Architect">Software Engineer &amp; AI Architect</option>
                        <option value="Product Designer">Product Designer</option>
                        <option value="Entrepreneur / Founder">Entrepreneur / Founder</option>
                        <option value="Agency & Studio">Agency &amp; Studio</option>
                        <option value="Brand & E-commerce">Brand &amp; E-commerce</option>
                        <option value="Author & Researcher">Author &amp; Researcher</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[var(--color-text)] mb-1 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Business Email</span>
                        </label>
                        <input
                          type="email"
                          value={businessEmail}
                          onChange={(e) => setBusinessEmail(e.target.value)}
                          placeholder="business@domain.com"
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--color-text)] mb-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Business Phone / WhatsApp</span>
                        </label>
                        <input
                          type="text"
                          value={businessPhone}
                          onChange={(e) => setBusinessPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text)] mb-1 flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Website or Portfolio URL</span>
                      </label>
                      <input
                        type="url"
                        value={businessWebsite}
                        onChange={(e) => setBusinessWebsite(e.target.value)}
                        placeholder="https://yourportfolio.com"
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                        Primary Profile Action Button
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Book Now', 'Contact Us', 'View Services', 'Send Payment', 'Hire Me'].map((btn) => (
                          <button
                            key={btn}
                            type="button"
                            onClick={() => setActionButtonType(btn)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              actionButtonType === btn
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                                : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
                            }`}
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSaveBusinessProfile}
                        className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md hover:brightness-110 transition-all"
                      >
                        Save Business Profile Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 3: MONETIZATION & REAL PAYMENT SYSTEMS */}
            {/* ======================================================== */}
            {activeSection === 'monetization' && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-[var(--color-text)]">
                        Lounge Payment Systems &amp; Real App Integrations
                      </h4>
                      <p className="text-xs text-[var(--color-muted)]">
                        Connect real payment processors (Stripe, PayPal, Apple Pay, Google Pay) to accept payments directly.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                      Active Gateways
                    </span>
                  </div>

                  {/* Payment Methods Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#635BFF] text-white font-black text-xs">
                            S
                          </div>
                          <div>
                            <strong className="block text-xs font-bold text-[var(--color-text)]">Stripe Connect</strong>
                            <span className="text-[10px] text-[var(--color-muted)]">Credit/Debit, Apple Pay, Google Pay</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Ready
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-muted)]">
                        Accept seamless one-click payments and instant client checkout sessions.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0070BA] text-white font-black text-xs">
                            P
                          </div>
                          <div>
                            <strong className="block text-xs font-bold text-[var(--color-text)]">PayPal Checkout</strong>
                            <span className="text-[10px] text-[var(--color-muted)]">PayPal.me &amp; One-Touch Checkout</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                          Connected
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-muted)]">
                        Direct global peer-to-peer transfers and creator tip jars.
                      </p>
                    </div>
                  </div>

                  {/* Launch Payment Hub Button */}
                  {onOpenPayments && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPayments();
                        }}
                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-black text-white shadow-md hover:brightness-110 transition-all cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Open Complete Payment &amp; Checkout System →</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 4: PRIVACY & SAFETY */}
            {/* ======================================================== */}
            {activeSection === 'privacy' && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <h4 className="text-sm font-extrabold text-[var(--color-text)]">
                    Lounge Account Privacy
                  </h4>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <div>
                      <strong className="block text-xs font-bold text-[var(--color-text)]">Private Profile</strong>
                      <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                        When active, only approved followers can see your posts and stories in The Lounge.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePrivacy(!isPrivateAccount)}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                        isPrivateAccount ? 'bg-purple-600' : 'bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          isPrivateAccount ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-[var(--color-text)]">
                      Allow Mentions &amp; Tags
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'everyone', label: 'Everyone' },
                        { id: 'following', label: 'People You Follow' },
                        { id: 'nobody', label: 'No One' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setAllowMentions(opt.id as any)}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                            allowMentions === opt.id
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-muted)]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] mt-2">
                    <div>
                      <strong className="block text-xs font-bold text-[var(--color-text)]">Smart Filter Hidden Words</strong>
                      <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                        Automatically hide offensive comments, spam, and unsolicited messages.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFilterOffensiveComments(!filterOffensiveComments)}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                        filterOffensiveComments ? 'bg-purple-600' : 'bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          filterOffensiveComments ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between text-xs text-[var(--color-muted)]">
          <span>Lounge Accounts Center · Private &amp; Cryptographically Secured</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[var(--color-text)] hover:underline"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
