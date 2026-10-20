import React, { useState } from 'react';
import {
  Sparkles,
  Music,
  Users,
  Settings,
  X,
  Check,
  ChevronRight,
  Compass,
} from 'lucide-react';

interface NewUserQuickStartCardProps {
  visitNumber: number;
  onNavigate: (tab: string) => void;
  onOpenSpotify: () => void;
  onDismiss: () => void;
}

export const NewUserQuickStartCard: React.FC<NewUserQuickStartCardProps> = ({
  visitNumber,
  onNavigate,
  onOpenSpotify,
  onDismiss,
}) => {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('paio_onboarding_completed_steps');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const markStep = (stepId: string) => {
    const next = new Set(completedSteps).add(stepId);
    setCompletedSteps(next);
    try {
      localStorage.setItem('paio_onboarding_completed_steps', JSON.stringify(Array.from(next)));
    } catch {}
  };

  const steps = [
    {
      id: 'ai',
      label: 'Ask AI Assistant',
      desc: 'Brainstorm or query with multimodal Gemini & GPT-4o',
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
      action: () => {
        markStep('ai');
        onNavigate('assistant');
      },
    },
    {
      id: 'music',
      label: 'Spotify Focus Music',
      desc: 'Listen to lo-fi beats & alpha waves without interruptions',
      icon: Music,
      color: 'text-[#1DB954] bg-[#1DB954]/15 border-[#1DB954]/30',
      action: () => {
        markStep('music');
        onOpenSpotify();
      },
    },
    {
      id: 'lounge',
      label: 'Visit The Lounge',
      desc: 'Connect with community members & creator profiles',
      icon: Users,
      color: 'text-pink-400 bg-pink-500/15 border-pink-500/30',
      action: () => {
        markStep('lounge');
        onNavigate('community');
      },
    },
    {
      id: 'settings',
      label: 'Customize Settings',
      desc: 'Themes, integrations & privacy policies',
      icon: Settings,
      color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
      action: () => {
        markStep('settings');
        onNavigate('settings');
      },
    },
  ];

  return (
    <div
      id="new-user-quick-start-card"
      className="mx-4 mt-3 sm:mx-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 p-4 sm:p-5 shadow-xl animate-fade-in space-y-3.5"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[var(--color-text)]">
                {visitNumber === 1 ? 'Welcome to Personal AI OS!' : 'Welcome Back! Quick Actions'}
              </h3>
              <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                {visitNumber === 1 ? '1st Experience' : '2nd Visit'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
              Everything runs locally and synchronized with your workspace. Click any quick start feature below:
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title="Dismiss onboarding tips"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Interactive Quick Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {steps.map((st) => {
          const Icon = st.icon;
          const isDone = completedSteps.has(st.id);
          return (
            <button
              key={st.id}
              type="button"
              onClick={st.action}
              className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all group ${
                isDone
                  ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50'
              }`}
            >
              <div className={`p-2 rounded-xl border shrink-0 ${st.color}`}>
                <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-[var(--color-text)] group-hover:text-indigo-300 transition-colors">
                    {st.label}
                  </strong>
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-[var(--color-muted)] leading-tight mt-1 line-clamp-2">
                  {st.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
