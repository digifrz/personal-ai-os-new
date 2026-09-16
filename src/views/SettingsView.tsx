import React, { useState, useEffect } from 'react';
import {
  User,
  Palette,
  LayoutGrid,
  Sparkles,
  Bell,
  Database,
  HardDrive,
  ShieldCheck,
  LogOut,
  Save,
  Check,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckSquare,
  FileText,
  Calendar,
  FolderKanban,
  Target,
  GraduationCap,
  Users,
  BarChart3,
  Sliders,
  Volume2,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { exportAllUserData, clearAllUserData } from '../services/db';

type SettingsTab =
  | 'profile'
  | 'appearance'
  | 'modules'
  | 'ai'
  | 'notifications'
  | 'system'
  | 'data';

const ACCENT_COLORS = [
  { name: 'Electric Violet', hex: '#8B5CF6' },
  { name: 'Cyber Cyan', hex: '#22D3EE' },
  { name: 'Emerald Forest', hex: '#10B981' },
  { name: 'Amber Sunset', hex: '#F59E0B' },
  { name: 'Rose Petal', hex: '#F43F5E' },
  { name: 'Indigo Deep', hex: '#6366F1' },
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

export const SettingsView: React.FC = () => {
  const { user, profile, logout, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Form states
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>(
    profile?.theme || 'dark'
  );
  const [accentColor, setAccentColor] = useState(
    profile?.accentColor || '#8B5CF6'
  );
  const [compactMode, setCompactMode] = useState(profile?.compactMode || false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [defaultTab, setDefaultTab] = useState('dashboard');

  // AI states
  const [aiTone, setAiTone] = useState(
    profile?.aiBehavior || 'Concise and analytical'
  );
  const [aiMemoryEnabled, setAiMemoryEnabled] = useState(
    profile?.aiMemoryEnabled ?? true
  );
  const [aiTemperature, setAiTemperature] = useState(0.7);

  // Notification states
  const [taskReminders, setTaskReminders] = useState(
    profile?.taskReminders ?? true
  );
  const [calendarReminders, setCalendarReminders] = useState(
    profile?.calendarReminders ?? true
  );
  const [pushNotifications, setPushNotifications] = useState(
    profile?.pushNotifications ?? true
  );
  const [communityNotifs, setCommunityNotifs] = useState(true);

  // Modules toggles ("all of this")
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({
    tasks: true,
    notes: true,
    files: true,
    calendar: true,
    assistant: true,
    goals: true,
    projects: true,
    learning: true,
    community: true,
    analytics: true,
  });

  // Action status
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  // Sync profile when loaded
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatarUrl || '');
      if (profile.theme) setThemeMode(profile.theme);
      if (profile.accentColor) setAccentColor(profile.accentColor);
      if (profile.compactMode !== undefined) setCompactMode(profile.compactMode);
      if (profile.aiBehavior) setAiTone(profile.aiBehavior);
      if (profile.aiMemoryEnabled !== undefined)
        setAiMemoryEnabled(profile.aiMemoryEnabled);
      if (profile.taskReminders !== undefined)
        setTaskReminders(profile.taskReminders);
      if (profile.calendarReminders !== undefined)
        setCalendarReminders(profile.calendarReminders);
      if (profile.pushNotifications !== undefined)
        setPushNotifications(profile.pushNotifications);
    }
  }, [profile]);

  // Handle Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setSaveLoading(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        bio: bio.trim(),
        username: username.trim().toLowerCase(),
        avatarUrl,
        theme: themeMode,
        accentColor,
        compactMode,
        aiBehavior: aiTone,
        aiMemoryEnabled,
        taskReminders,
        calendarReminders,
        pushNotifications,
        aiModel: 'Balanced (Gemini 3.6 Flash)',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle Data Export
  const handleExportData = async () => {
    if (!user) return;
    setExportLoading(true);
    try {
      const data = await exportAllUserData(user.uid);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal_ai_os_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExportLoading(false);
    }
  };

  // Handle Clear User Data
  const handleConfirmClear = async () => {
    if (!user) return;
    try {
      await clearAllUserData(user.uid);
      setClearSuccess(true);
      setClearModalOpen(false);
      setTimeout(() => setClearSuccess(false), 3000);
    } catch (err) {
      console.error('Clear data error:', err);
    }
  };

  const navItems = [
    { id: 'profile' as SettingsTab, label: 'Profile & Identity', icon: User },
    { id: 'appearance' as SettingsTab, label: 'Appearance & Themes', icon: Palette },
    { id: 'modules' as SettingsTab, label: 'Workspace Modules', icon: LayoutGrid },
    { id: 'ai' as SettingsTab, label: 'AI & Gemini Engine', icon: Sparkles },
    { id: 'notifications' as SettingsTab, label: 'Notifications & Audio', icon: Bell },
    { id: 'system' as SettingsTab, label: 'Architecture & Rules', icon: ShieldCheck },
    { id: 'data' as SettingsTab, label: 'Data & Privacy', icon: Database },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-3 py-0.5 text-xs font-bold text-[#A78BFA] mb-2">
            <Sliders className="w-3 h-3 text-[#8B5CF6]" />
            <span>Workspace System Configuration</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Settings &amp; Preferences
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Manage your personal profile, module visibility, Gemini 3.6 Flash neural proxy, and cloud security rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saveLoading}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{saveLoading ? 'Saving...' : 'Save Preferences'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      {/* Main Settings Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition-all text-left ${
                  isActive
                    ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-sm'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Panel */}
        <main className="lg:col-span-9 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
          {/* TAB 1: PROFILE & IDENTITY */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  Profile &amp; Identity
                </h2>
                <p className="text-xs text-[var(--color-muted)]">
                  Public and workspace credentials associated with your account.
                </p>
              </div>

              {/* Avatar Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[var(--color-muted)]">
                  Avatar Preset or Custom URL
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-bg-secondary)] flex items-center justify-center text-xl font-bold text-white shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span>{name ? name.charAt(0).toUpperCase() : 'U'}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`h-10 w-10 overflow-hidden rounded-xl border-2 transition-all ${
                          avatarUrl === url ? 'border-[var(--color-primary)] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-[11px] font-bold text-[var(--color-muted)] hover:text-white"
                    >
                      Clear Avatar
                    </button>
                  </div>
                </div>
              </div>

              {/* Profile Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Farzan"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                    Username Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[var(--color-muted)]">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="farzan"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] pl-7 pr-3.5 py-2.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'user@workspace.local'}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 px-3.5 py-2.5 text-xs text-[var(--color-muted)] outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    disabled
                    value={Intl.DateTimeFormat().resolvedOptions().timeZone}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 px-3.5 py-2.5 text-xs text-[var(--color-muted)] outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  Bio / Research Focus
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Theoretical physics, state estimation, and autonomous intelligent systems"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-all"
                />
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE & THEMES */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  Appearance &amp; Themes
                </h2>
                <p className="text-xs text-[var(--color-muted)]">
                  Tailor the visual presentation, color hierarchy, and spacing.
                </p>
              </div>

              {/* Theme Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2">
                  Color Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark Canvas', desc: 'Deep obsidian for low eye strain' },
                    { id: 'light', label: 'Light Mode', desc: 'High contrast crisp day theme' },
                    { id: 'system', label: 'OLED Black', desc: 'Maximized battery & contrast' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setThemeMode(t.id as any)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        themeMode === t.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-sm'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border)]/80'
                      }`}
                    >
                      <strong className="block text-xs font-bold text-[var(--color-text)]">
                        {t.label}
                      </strong>
                      <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                        {t.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Palette */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setAccentColor(c.hex)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                        accentColor === c.hex
                          ? 'border-[var(--color-text)] bg-[var(--color-surface-elevated)] scale-105'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-surface-elevated)]'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[var(--color-text)]">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Density & Sound */}
              <div className="space-y-4 pt-2 border-t border-[var(--color-border)]/60">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="block text-xs font-bold text-[var(--color-text)]">
                      Compact Density
                    </strong>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      Reduces margins and paddings for maximum information visibility.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => setCompactMode(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <strong className="block text-xs font-bold text-[var(--color-text)]">
                      Interactive Audio Cues
                    </strong>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      Soft tactile haptic clicks when completing tasks or creating notes.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WORKSPACE MODULES ("All of this") */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  Workspace Modules Configuration
                </h2>
                <p className="text-xs text-[var(--color-muted)]">
                  Customize every integrated tool in Personal AI OS to match your workflow.
                </p>
              </div>

              {/* Default Tab on Startup */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <strong className="block text-xs font-bold text-[var(--color-text)]">
                    Default Launch View
                  </strong>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    The view opened immediately after startup animation completes.
                  </p>
                </div>
                <select
                  value={defaultTab}
                  onChange={(e) => setDefaultTab(e.target.value)}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="dashboard">Dashboard Command Center</option>
                  <option value="tasks">Tasks &amp; Kanban</option>
                  <option value="notes">Quantum Notes</option>
                  <option value="assistant">AI Copilot</option>
                  <option value="calendar">Calendar &amp; Events</option>
                  <option value="community">The Lounge</option>
                </select>
              </div>

              {/* Module Toggles List */}
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'tasks', label: 'Tasks & Kanban', icon: CheckSquare, desc: 'Priority queues & deadlines' },
                  { key: 'notes', label: 'Quantum Notes', icon: FileText, desc: 'Markdown notebooks & tags' },
                  { key: 'files', label: 'Cloud Drive', icon: HardDrive, desc: 'Secure Firebase Storage sync' },
                  { key: 'calendar', label: 'Calendar Scheduling', icon: Calendar, desc: 'Deep work & time blocks' },
                  { key: 'assistant', label: 'AI Copilot', icon: Sparkles, desc: 'Gemini 3.6 Flash reasoning' },
                  { key: 'goals', label: 'Goals & OKRs', icon: Target, desc: 'Long-term milestones & tracking' },
                  { key: 'projects', label: 'Project Portfolio', icon: FolderKanban, desc: 'Team & personal roadmaps' },
                  { key: 'learning', label: 'Active Recall Flashcards', icon: GraduationCap, desc: 'Spaced repetition decks' },
                  { key: 'community', label: 'The Lounge', icon: Users, desc: 'Feed, direct DMs & stories' },
                  { key: 'analytics', label: 'Analytics & Heatmaps', icon: BarChart3, desc: 'Productivity metrics & audit logs' },
                ].map((m) => {
                  const Icon = m.icon;
                  const isEnabled = enabledModules[m.key];
                  return (
                    <div
                      key={m.key}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-primary)]">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="block text-xs font-bold text-[var(--color-text)]">
                            {m.label}
                          </strong>
                          <p className="text-[10px] text-[var(--color-muted)]">
                            {m.desc}
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) =>
                          setEnabledModules((prev) => ({
                            ...prev,
                            [m.key]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded accent-[var(--color-primary)] cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: AI & GEMINI ENGINE */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  AI &amp; Neural Copilot
                </h2>
                <p className="text-xs text-[var(--color-muted)]">
                  Configure server-side Gemini intelligence and reasoning parameters.
                </p>
              </div>

              {/* Model Status Card */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Active Model</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online &amp; Serving
                  </span>
                </div>
                <strong className="block text-sm font-bold text-[var(--color-text)]">
                  models/gemini-3.6-flash
                </strong>
                <p className="text-xs text-[var(--color-muted)]">
                  Proxied securely through <code>server/gemini.ts</code> with zero client API key exposure.
                </p>
              </div>

              {/* Persona / Tone Selector */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2">
                  Assistant Persona &amp; Tone
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { id: 'Concise and analytical', desc: 'Direct answers with technical precision' },
                    { id: 'Proactive Executive', desc: 'Anticipates deadlines and drafts action items' },
                    { id: 'Socratic Tutor', desc: 'Guides understanding through questions' },
                    { id: 'Creative Strategist', desc: 'Brainstorms innovative approaches & angles' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAiTone(p.id)}
                      className={`rounded-2xl border p-3.5 text-left transition-all ${
                        aiTone === p.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border)]/80'
                      }`}
                    >
                      <strong className="block text-xs font-bold text-[var(--color-text)]">
                        {p.id}
                      </strong>
                      <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">
                        {p.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Memory Retrieval & Temperature */}
              <div className="space-y-4 pt-2 border-t border-[var(--color-border)]/60">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="block text-xs font-bold text-[var(--color-text)]">
                      Workspace Memory Context
                    </strong>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      Allows Gemini to synthesize insights across your notes, tasks, and calendar.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiMemoryEnabled}
                    onChange={(e) => setAiMemoryEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-xs font-bold text-[var(--color-text)]">
                      Temperature ({aiTemperature})
                    </strong>
                    <span className="text-[11px] text-[var(--color-muted)]">
                      {aiTemperature < 0.4 ? 'Focused & Deterministic' : aiTemperature > 0.7 ? 'Exploratory & Creative' : 'Balanced'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.1"
                    value={aiTemperature}
                    onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                    className="w-full accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  Notifications &amp; Alerts
                </h2>
                <p className="text-xs text-[var(--color-muted)]">
                  Configure push alerts, task deadlines, and community mentions.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                  <div>
                    <strong className="block text-xs font-bold text-[var(--color-text)]">
                      Task Deadline Reminders
                    </strong>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      Alerts for high-priority tasks due within 24 hours.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={taskReminders}
                    onChange={(e) => setTaskReminders(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                  <div>
                    <strong className="block text-xs font-bold text-[var(--color-text)]">
                      Calendar Event Alarms
                    </strong>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      15-minute heads-up for scheduled deep work sessions.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={calendarReminders}
                    onChange={(e) => setCalendarReminders(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                  <div>
                    <strong className="block text-xs font-bold text-[var(--color-text)]">
                      The Lounge Social Mentions
                    </strong>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      Notifications when team members upvote or reply to posts.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={communityNotifs}
                    onChange={(e) => setCommunityNotifs(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM & ARCHITECTURE */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  System Architecture &amp; Security
                </h2>
                <p className="text-xs text-[var(--color-muted)]">
                  Real-time health status of cloud infrastructure and access policies.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Database</span>
                    <Database className="w-4 h-4 text-emerald-400" />
                  </div>
                  <strong className="block text-sm font-bold text-[var(--color-text)]">
                    Cloud Firestore
                  </strong>
                  <p className="mt-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Real-time listeners active
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Storage</span>
                    <HardDrive className="w-4 h-4 text-blue-400" />
                  </div>
                  <strong className="block text-sm font-bold text-[var(--color-text)]">
                    Firebase Cloud Storage
                  </strong>
                  <p className="mt-1 text-[11px] text-blue-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Encrypted asset storage
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Security</span>
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                  </div>
                  <strong className="block text-sm font-bold text-[var(--color-text)]">
                    Hardened ABAC Rules
                  </strong>
                  <p className="mt-1 text-[11px] text-purple-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                    firestore.rules enforced
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[var(--color-muted)] uppercase">AI Inference</span>
                    <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                  </div>
                  <strong className="block text-sm font-bold text-[var(--color-text)]">
                    Gemini 3.6 Flash
                  </strong>
                  <p className="mt-1 text-[11px] text-[#A78BFA] font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#A78BFA] animate-pulse" />
                    Express backend proxy
                  </p>
                </div>
              </div>

              {/* Architecture Info Callout */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 flex gap-3 text-xs text-[var(--color-muted)]">
                <Info className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--color-text)] block mb-1">
                    Access Control &amp; Token Verification
                  </strong>
                  All documents (`tasks`, `notes`, `files`, `calendar_events`, `goals`, `projects`, `learning_flashcards`) verify <code>request.auth.uid == resource.data.userId</code> to guarantee private sandbox isolation.
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DATA & PRIVACY */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  Data Portability &amp; Privacy
                </h2>
                <p className="text-xs text-[var(--color-muted)]">
                  Export backups or manage your persistent storage footprint.
                </p>
              </div>

              {/* Export Backup Card */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center text-emerald-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-[var(--color-text)]">
                      Export Full Workspace Backup (JSON)
                    </strong>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      Download an archive containing your tasks, notes, calendar, goals, flashcards, and AI interactions.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={exportLoading}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportLoading ? 'Compiling Archive...' : 'Download Backup'}</span>
                </button>
              </div>

              {/* Danger Zone */}
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-red-400">
                      Danger Zone: Reset Workspace Data
                    </strong>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      Permanently delete all tasks, notes, goals, and flashcards associated with your account.
                    </p>
                  </div>
                </div>

                {clearSuccess && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>All workspace data has been cleared.</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setClearModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-red-500/20 border border-red-500/40 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Workspace Data</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Clear Data Confirmation Modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold">Are you absolutely sure?</h3>
            </div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              This action will permanently delete all your tasks, notes, calendar events, goals, and study sessions from Cloud Firestore. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600"
              >
                Yes, Delete Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
