import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  User,
  Users,
  Shield,
  Key,
  Lock,
  CreditCard,
  Share2,
  Sliders,
  CheckCircle2,
  Smartphone,
  ExternalLink,
  Briefcase,
  Sparkles,
  ArrowLeft,
  Eye,
  Mail,
  Calendar,
  Layers,
  HelpCircle,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface LoungeAccountsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpgrade?: () => void;
  onOpenPayments?: () => void;
}

type SubScreen =
  | 'main'
  | 'profiles'
  | 'connected'
  | 'accounts'
  | 'personal_details'
  | 'password_security'
  | 'two_factor'
  | 'info_permissions'
  | 'ad_preferences'
  | 'payments'
  | 'business_tools';

export const LoungeAccountsCenterModal: React.FC<LoungeAccountsCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenUpgrade,
  onOpenPayments,
}) => {
  const { user, profile, accountType, toggleAccountType } = useAuth();
  const [subScreen, setSubScreen] = useState<SubScreen>('main');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [profileCategory, setProfileCategory] = useState<'personal' | 'creator' | 'business'>(
    accountType === 'business' ? 'business' : 'personal'
  );
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const displayName = profile?.name || user?.displayName || 'Workspace Member';
  const handleName = profile?.username || user?.email?.split('@')[0] || 'member';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-md animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-md max-h-[92vh] rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden text-[var(--color-text)]">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)]/60 px-5 bg-[var(--color-surface)]/80 backdrop-blur-md">
          {subScreen !== 'main' ? (
            <button
              type="button"
              onClick={() => setSubScreen('main')}
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="font-mono text-base font-black tracking-widest bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-400 bg-clip-text text-transparent">
              LOUNGE
            </span>
          </div>

          <div className="w-5" />
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {statusNotice && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* SCREEN: MAIN */}
          {subScreen === 'main' && (
            <div className="space-y-5">
              {/* Branding Intro */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-pink-400">∞ Lounge</span>
                </div>
                <h2 className="text-xl font-extrabold text-[var(--color-text)] tracking-tight">
                  Accounts Center
                </h2>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Manage your connected experiences and account settings across Lounge profiles,
                  personal, creator, and business modes.{' '}
                  <span className="text-pink-400 font-semibold cursor-pointer hover:underline">
                    Learn more
                  </span>
                </p>
              </div>

              {/* Profiles Card */}
              <div
                onClick={() => setSubScreen('profiles')}
                className="group flex items-center justify-between p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-pink-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={displayName}
                      className="h-11 w-11 rounded-full object-cover border border-pink-500/30"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 font-bold text-white text-sm shadow-md">
                      {displayName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <strong className="block text-sm font-bold text-[var(--color-text)]">
                      Profiles
                    </strong>
                    <span className="text-xs text-[var(--color-muted)]">
                      {displayName}, @{handleName}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-pink-400 transition-colors" />
              </div>

              {/* Connected Experiences */}
              <div
                onClick={() => setSubScreen('connected')}
                className="group flex items-center justify-between p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-purple-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-[var(--color-text)]">
                      Connected experiences
                    </strong>
                    <span className="text-[11px] text-[var(--color-muted)]">
                      Cross-posting, synced logins, verified links
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-purple-400 transition-colors" />
              </div>

              {/* Account Settings List */}
              <div className="space-y-2">
                <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-muted)] px-1">
                  Account settings
                </span>

                <div className="divide-y divide-[var(--color-border)]/60 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
                  {/* Accounts & Mode Switcher */}
                  <div
                    onClick={() => setSubScreen('accounts')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-[var(--color-muted)]" />
                      <span className="text-xs font-semibold text-[var(--color-text)]">Accounts &amp; Profiles</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>

                  {/* Personal Details */}
                  <div
                    onClick={() => setSubScreen('personal_details')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-[var(--color-muted)]" />
                      <span className="text-xs font-semibold text-[var(--color-text)]">Personal details</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>

                  {/* Password and Security */}
                  <div
                    onClick={() => setSubScreen('password_security')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-[var(--color-muted)]" />
                      <span className="text-xs font-semibold text-[var(--color-text)]">Password and security</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>

                  {/* Your Information & Permissions */}
                  <div
                    onClick={() => setSubScreen('info_permissions')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-[var(--color-muted)]" />
                      <span className="text-xs font-semibold text-[var(--color-text)]">Your information and permissions</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>

                  {/* Ad Preferences */}
                  <div
                    onClick={() => setSubScreen('ad_preferences')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Sliders className="w-4 h-4 text-[var(--color-muted)]" />
                      <span className="text-xs font-semibold text-[var(--color-text)]">Ad &amp; content reach preferences</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>

                  {/* Lounge Pay & Payments */}
                  <div
                    onClick={() => setSubScreen('payments')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-[var(--color-text)]">Lounge Pay &amp; Payments</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>

                  {/* Business & Creator Tools */}
                  <div
                    onClick={() => setSubScreen('business_tools')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-semibold text-[var(--color-text)]">Business &amp; Creator tools</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: PASSWORD & SECURITY (MATCHING IMAGE 2) */}
          {subScreen === 'password_security' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--color-text)]">Password and security</h3>
                <p className="text-xs text-[var(--color-muted)]">
                  Manage login credentials, multi-factor verification, and session alerts.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] px-1">
                  Login &amp; Recovery
                </span>
                <div className="divide-y divide-[var(--color-border)]/60 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
                  <div
                    onClick={() => showNotice('Password change link emailed to your inbox.')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-semibold">Change password</span>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>

                  <div
                    onClick={() => setSubScreen('two_factor')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors bg-pink-500/5 border-l-2 border-pink-500"
                  >
                    <div>
                      <span className="block text-xs font-bold text-[var(--color-text)]">
                        Two-factor authentication
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {twoFactorEnabled ? 'Active (Authenticator App)' : 'Off'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>

                  <div
                    onClick={() => showNotice('Credentials remembered securely on this device.')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-semibold">Saved login</span>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] px-1">
                  Security checks
                </span>
                <div className="divide-y divide-[var(--color-border)]/60 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
                  <div
                    onClick={() => showNotice('Active device: Personal AI OS Chrome Web Session (Current)')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-semibold">Where you&apos;re logged in</span>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>

                  <div
                    onClick={() => showNotice('Login alerts enabled for new browser sign-ins.')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-semibold">Login alerts</span>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>

                  <div
                    onClick={() => showNotice('Security checkup complete: Zero suspicious activities found.')}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-semibold">Security Checkup</span>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: TWO FACTOR AUTHENTICATION */}
          {subScreen === 'two_factor' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-pink-400" />
                <h3 className="text-base font-extrabold">Two-Factor Authentication</h3>
              </div>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                Add an extra layer of protection to your Lounge profile and personal workspace.
              </p>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold">Authenticator App</span>
                    <span className="text-[11px] text-[var(--color-muted)]">
                      Google Authenticator, 1Password, Duo
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !twoFactorEnabled;
                      setTwoFactorEnabled(next);
                      showNotice(next ? 'Two-Factor Authentication enabled!' : 'Two-Factor Authentication disabled.');
                    }}
                    className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                      twoFactorEnabled ? 'bg-pink-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white transition-transform ${
                        twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: ACCOUNTS & PROFILE SWITCHING */}
          {subScreen === 'accounts' && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold">Manage Lounge Accounts</h3>
              <p className="text-xs text-[var(--color-muted)]">
                Seamlessly toggle between Personal mode, Creator studio, and Business operations.
              </p>

              <div className="space-y-2">
                {[
                  {
                    id: 'personal',
                    label: 'Personal Profile',
                    desc: 'Casual discussions, personal interests, direct chats',
                    icon: User,
                  },
                  {
                    id: 'creator',
                    label: 'Creator Account',
                    desc: 'Stories, audience insights, public pulses, tips',
                    icon: Sparkles,
                  },
                  {
                    id: 'business',
                    label: 'Business & Brand',
                    desc: 'Commercial products, sponsored campaigns, invoicing',
                    icon: Briefcase,
                  },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = profileCategory === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={async () => {
                        setProfileCategory(type.id as any);
                        if (type.id === 'business' && accountType !== 'business') {
                          await toggleAccountType();
                        } else if (type.id !== 'business' && accountType === 'business') {
                          await toggleAccountType();
                        }
                        showNotice(`Switched active profile type to ${type.label}`);
                      }}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-pink-500 bg-pink-500/10 text-pink-300 ring-2 ring-pink-500/20'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="block text-xs font-bold text-[var(--color-text)]">
                          {type.label}
                        </strong>
                        <span className="text-[11px] text-[var(--color-muted)]">{type.desc}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN: PAYMENTS & BILLING */}
          {subScreen === 'payments' && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Lounge Pay &amp; Billing
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Manage your payment methods, creator subscriptions, and workspace invoices.
              </p>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold block text-[var(--color-text)]">
                      Saved Payment Method
                    </span>
                    <span className="text-[11px] text-[var(--color-muted)] font-mono">
                      Visa ending in 4242 · Exp 12/28
                    </span>
                  </div>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Default
                  </span>
                </div>

                <div className="pt-2 border-t border-[var(--color-border)]/60 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPayments) {
                        onClose();
                        onOpenPayments();
                      } else {
                        showNotice('Payment modal opened');
                      }
                    }}
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white transition-colors"
                  >
                    Open Checkout Gateway
                  </button>
                  <button
                    type="button"
                    onClick={() => showNotice('Invoices downloaded to your local files.')}
                    className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-semibold hover:bg-white/5 transition-colors"
                  >
                    Invoices
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: PERSONAL DETAILS */}
          {subScreen === 'personal_details' && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold">Personal Details</h3>
              <p className="text-xs text-[var(--color-muted)]">
                Lounge uses this info to verify your identity and protect account integrity.
              </p>

              <div className="divide-y divide-[var(--color-border)]/60 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden text-xs">
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-[var(--color-muted)]">Email</span>
                  <strong className="text-[var(--color-text)] font-mono">{user?.email || 'Farzan@ai-os.dev'}</strong>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-[var(--color-muted)]">Phone</span>
                  <span className="text-[var(--color-text)]">+1 (555) •••-9281</span>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-[var(--color-muted)]">Birthday</span>
                  <span className="text-[var(--color-text)]">Confidential (18+)</span>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-[var(--color-muted)]">Identity Confirmation</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Member
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: BUSINESS & CREATOR TOOLS */}
          {subScreen === 'business_tools' && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                Professional &amp; Creator Dashboard
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Review audience engagement, scheduled publications, and monetization metrics.
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">Monthly Reach</span>
                  <strong className="block text-lg font-black text-pink-400">14.8K</strong>
                  <span className="text-[10px] text-emerald-400 font-semibold">+24% vs last mo</span>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">Post Engagement</span>
                  <strong className="block text-lg font-black text-indigo-400">8.2%</strong>
                  <span className="text-[10px] text-emerald-400 font-semibold">High affinity</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => showNotice('Creator Studio opened in your workspace.')}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md transition-all"
              >
                Launch Creator Studio
              </button>
            </div>
          )}

          {/* OTHER SUBSCREENS FALLBACK */}
          {(subScreen === 'connected' || subScreen === 'info_permissions' || subScreen === 'ad_preferences' || subScreen === 'profiles') && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold capitalize">
                {subScreen.replace('_', ' ')}
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Configure your Lounge privacy, data export, and cross-platform syncing options.
              </p>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-2 text-xs">
                <p className="text-[var(--color-text)]">
                  All settings are synced end-to-end to your private personal account.
                </p>
                <button
                  type="button"
                  onClick={() => showNotice('Preferences saved securely!')}
                  className="rounded-xl bg-pink-600 hover:bg-pink-500 px-4 py-2 text-xs font-bold text-white transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
