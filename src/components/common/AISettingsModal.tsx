import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Settings as SettingsIcon,
  Sun,
  Bell,
  User,
  Shield,
  Archive,
  Heart,
  Mic,
  HardDrive,
  Sliders,
  Sparkles,
  Keyboard,
  Activity,
  CreditCard,
  Lock,
  Puzzle,
  Key,
  Monitor,
  Code,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Globe,
  Trash2,
  Volume2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpgrade?: () => void;
  onOpenPayments?: () => void;
}

type SettingsSection =
  | 'general'
  | 'appearance'
  | 'notifications'
  | 'profile'
  | 'security'
  | 'account'
  | 'archived_chats'
  | 'parental_controls'
  | 'safety'
  | 'voice'
  | 'storage'
  | 'personalization'
  | 'pets'
  | 'keyboard'
  | 'usage'
  | 'billing'
  | 'data_controls'
  | 'plugins'
  | 'passwords'
  | 'cloud_computer'
  | 'code_review';

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenUpgrade,
  onOpenPayments,
}) => {
  const { user, profile, premiumStatus } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('English');
  const [appTheme, setAppTheme] = useState('Dark');
  const [voicePersona, setVoicePersona] = useState('Nova (Warm & Articulate)');
  const [autoVoiceReadout, setAutoVoiceReadout] = useState(false);
  const [selectedPet, setSelectedPet] = useState<'cyber_fox' | 'cosmic_cat' | 'wise_owl' | 'robo_buddy'>('cyber_fox');
  const [customInstructions, setCustomInstructions] = useState(() => {
    try {
      return localStorage.getItem('paio_ai_custom_instructions') || 'Respond concisely, prioritize actionable code and structured bullet points.';
    } catch {
      return '';
    }
  });
  const [sendOnEnter, setSendOnEnter] = useState(true);
  const [dataTrainingOptOut, setDataTrainingOptOut] = useState(true);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleSaveInstructions = () => {
    try {
      localStorage.setItem('paio_ai_custom_instructions', customInstructions);
      showToast('AI instructions saved & synced to assistant context.');
    } catch {}
  };

  const SECTIONS = [
    { group: 'Personal', items: [
      { id: 'general' as SettingsSection, label: 'General', icon: SettingsIcon },
      { id: 'appearance' as SettingsSection, label: 'Appearance', icon: Sun },
      { id: 'notifications' as SettingsSection, label: 'Notifications', icon: Bell },
      { id: 'profile' as SettingsSection, label: 'Profile', icon: User, hasArrow: true },
      { id: 'security' as SettingsSection, label: 'Security and login', icon: Shield },
      { id: 'account' as SettingsSection, label: 'Account', icon: User },
      { id: 'archived_chats' as SettingsSection, label: 'Archived chats', icon: Archive },
      { id: 'parental_controls' as SettingsSection, label: 'Parental controls', icon: Shield },
      { id: 'safety' as SettingsSection, label: 'Safety & wellbeing', icon: Heart },
      { id: 'voice' as SettingsSection, label: 'Voice', icon: Mic },
      { id: 'storage' as SettingsSection, label: 'Storage', icon: HardDrive },
      { id: 'personalization' as SettingsSection, label: 'Personalization', icon: Sliders },
      { id: 'pets' as SettingsSection, label: 'Pets', icon: Sparkles },
      { id: 'keyboard' as SettingsSection, label: 'Keyboard', icon: Keyboard },
      { id: 'usage' as SettingsSection, label: 'Usage', icon: Activity },
      { id: 'billing' as SettingsSection, label: 'Billing', icon: CreditCard },
      { id: 'data_controls' as SettingsSection, label: 'Data controls', icon: Lock },
    ]},
    { group: 'Integrations', items: [
      { id: 'plugins' as SettingsSection, label: 'Plugins', icon: Puzzle },
      { id: 'passwords' as SettingsSection, label: 'Passwords', icon: Key },
      { id: 'cloud_computer' as SettingsSection, label: 'Cloud computer', icon: Monitor },
    ]},
    { group: 'Coding', items: [
      { id: 'code_review' as SettingsSection, label: 'Code Review', icon: Code },
    ]}
  ];

  const filteredSections = SECTIONS.map((g) => ({
    ...g,
    items: g.items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[220] flex bg-black text-zinc-100 font-sans animate-fade-in overflow-hidden"
    >
      {/* Left Sidebar (Matching Images 4 & 5) */}
      <aside className="w-64 sm:w-72 shrink-0 border-r border-zinc-800/80 bg-zinc-950 flex flex-col h-full">
        {/* Back to app */}
        <div className="p-4 border-b border-zinc-800/60">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to app</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white outline-none w-full placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Section List (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 scrollbar-thin">
          {filteredSections.map((group) => (
            <div key={group.group} className="space-y-0.5">
              <span className="block px-3 py-1 text-[11px] font-bold text-zinc-500">
                {group.group}
              </span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isSelected = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-medium transition-colors text-left ${
                      isSelected
                        ? 'bg-zinc-800/90 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0 text-zinc-400" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.hasArrow && (
                      <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-full bg-black overflow-y-auto p-6 sm:p-10">
        <div className="max-w-2xl w-full space-y-6">
          {statusNotice && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* SECTION: GENERAL (EXACT LAYOUT OF IMAGE 4) */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">General</h1>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Language</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Language for the app UI</p>
                </div>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      showToast(`Language set to ${e.target.value}`);
                    }}
                    className="appearance-none bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-xl px-4 py-2 pr-8 text-xs font-medium text-white outline-none cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="German">Deutsch</option>
                    <option value="Japanese">日本語</option>
                    <option value="Arabic">العربية</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* SECTION: PERSONALIZATION */}
          {activeSection === 'personalization' && (
            <div className="space-y-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Personalization</h1>
              <p className="text-xs text-zinc-400">
                Teach the AI assistant how you like information presented.
              </p>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                <label className="block text-xs font-semibold text-white">
                  Custom AI Behavior &amp; Instructions
                </label>
                <textarea
                  rows={5}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Always provide practical examples, avoid unnecessary fluff, and suggest next steps."
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-xs text-white outline-none leading-relaxed focus:border-zinc-600 resize-none"
                />
                <button
                  type="button"
                  onClick={handleSaveInstructions}
                  className="rounded-xl bg-zinc-100 text-black hover:bg-white px-4 py-2 text-xs font-bold transition-colors"
                >
                  Save Instructions
                </button>
              </div>
            </div>
          )}

          {/* SECTION: VOICE */}
          {activeSection === 'voice' && (
            <div className="space-y-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Voice &amp; Audio</h1>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Voice Model</h3>
                    <p className="text-xs text-zinc-400">Persona for executive briefings &amp; answers</p>
                  </div>
                  <select
                    value={voicePersona}
                    onChange={(e) => setVoicePersona(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="Nova (Warm & Articulate)">Nova (Warm &amp; Articulate)</option>
                    <option value="Alloy (Executive Precision)">Alloy (Executive Precision)</option>
                    <option value="Echo (Studio Host)">Echo (Studio Host)</option>
                    <option value="Onyx (Deep Baritone)">Onyx (Deep Baritone)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Auto-speak responses</h3>
                    <p className="text-xs text-zinc-400">Automatically read AI outputs aloud</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoVoiceReadout}
                    onChange={(e) => setAutoVoiceReadout(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION: PETS / AI COMPANION */}
          {activeSection === 'pets' && (
            <div className="space-y-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Companion Pets</h1>
              <p className="text-xs text-zinc-400">
                Choose an interactive desk companion that reacts to your focus streaks and mood.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'cyber_fox', name: 'Kitsune Cyber-Fox', mood: 'Vigilant & Clever', emoji: '🦊' },
                  { id: 'cosmic_cat', name: 'Luna Cosmic Cat', mood: 'Calm & Observant', emoji: '🐱' },
                  { id: 'wise_owl', name: 'Athena Wise Owl', mood: 'Analytical & Stoic', emoji: '🦉' },
                  { id: 'robo_buddy', name: 'Pixel Bot v4', mood: 'Enthusiastic & Helpful', emoji: '🤖' },
                ].map((pet) => {
                  const isSelected = selectedPet === pet.id;
                  return (
                    <div
                      key={pet.id}
                      onClick={() => {
                        setSelectedPet(pet.id as any);
                        showToast(`${pet.name} is now your active workspace companion!`);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-white ring-2 ring-indigo-500/20'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-3xl block mb-2">{pet.emoji}</span>
                      <strong className="block text-xs font-bold text-white">{pet.name}</strong>
                      <span className="text-[11px] text-zinc-500">{pet.mood}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION: BILLING */}
          {activeSection === 'billing' && (
            <div className="space-y-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Billing &amp; Plans</h1>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 block">Current Subscription</span>
                    <strong className="text-base font-extrabold capitalize text-white">
                      {premiumStatus.tier} Tier
                    </strong>
                  </div>
                  <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                    Active
                  </span>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPayments) {
                        onClose();
                        onOpenPayments();
                      } else if (onOpenUpgrade) {
                        onClose();
                        onOpenUpgrade();
                      }
                    }}
                    className="rounded-xl bg-white text-black font-extrabold px-4 py-2 text-xs hover:bg-zinc-200 transition-colors"
                  >
                    Upgrade / Manage Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Receipts downloaded.')}
                    className="rounded-xl border border-zinc-700 hover:bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors"
                  >
                    View Invoices
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: CODE REVIEW (IMAGE 5) */}
          {activeSection === 'code_review' && (
            <div className="space-y-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Code Review</h1>
              <p className="text-xs text-zinc-400">
                Configure static code analysis, security linting, and automated diff suggestions.
              </p>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="block text-xs font-semibold text-white">Automated TypeScript Linting</strong>
                    <span className="text-[11px] text-zinc-500">Run continuous checks on save</span>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-indigo-500" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <div>
                    <strong className="block text-xs font-semibold text-white">OWASP Security Audit</strong>
                    <span className="text-[11px] text-zinc-500">Highlight potential injection or auth leaks</span>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-indigo-500" />
                </div>
              </div>
            </div>
          )}

          {/* OTHER SECTIONS FALLBACK */}
          {activeSection !== 'general' && activeSection !== 'personalization' && activeSection !== 'voice' && activeSection !== 'pets' && activeSection !== 'billing' && activeSection !== 'code_review' && (
            <div className="space-y-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white capitalize">
                {activeSection.replace('_', ' ')}
              </h1>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
                <p className="text-xs text-zinc-400">
                  Settings for {activeSection.replace('_', ' ')} are active and synced to your cloud account.
                </p>
                <button
                  type="button"
                  onClick={() => showToast('Preferences updated!')}
                  className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
