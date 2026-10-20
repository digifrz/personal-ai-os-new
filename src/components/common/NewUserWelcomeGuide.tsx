import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  X,
  Sun,
  Bot,
  Users,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface NewUserWelcomeGuideProps {
  onNavigate: (tab: string) => void;
  onOpenDailyBriefing?: () => void;
}

export const NewUserWelcomeGuide: React.FC<NewUserWelcomeGuideProps> = ({
  onNavigate,
  onOpenDailyBriefing,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('paio_welcome_steps_completed');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('paio_welcome_guide_dismissed');
      if (dismissed === 'true') {
        setIsVisible(false);
        return;
      }

      // Check visit count
      const visitStr = localStorage.getItem('paio_user_visit_count');
      let count = visitStr ? parseInt(visitStr, 10) : 0;
      count += 1;
      localStorage.setItem('paio_user_visit_count', String(count));

      // Show for 1st or 2nd time users
      if (count <= 2) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('paio_welcome_guide_dismissed', 'true');
    } catch {}
  };

  const handleToggleStep = (stepIdx: number) => {
    const next = new Set(completedSteps);
    if (next.has(stepIdx)) {
      next.delete(stepIdx);
    } else {
      next.add(stepIdx);
    }
    setCompletedSteps(next);
    try {
      localStorage.setItem('paio_welcome_steps_completed', JSON.stringify(Array.from(next)));
    } catch {}
  };

  if (!isVisible) return null;

  const steps = [
    {
      idx: 1,
      title: 'Review your Daily Executive Briefing',
      desc: 'Get an autonomous morning summary of upcoming tasks, schedule, and focus priorities.',
      icon: Sun,
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
      action: () => {
        handleToggleStep(1);
        onOpenDailyBriefing?.();
      },
      actionLabel: 'Open Briefing',
    },
    {
      idx: 2,
      title: 'Ask your AI Assistant & Memory',
      desc: 'Use Gemini or GPT-4o to analyze tasks, synthesize notes, or teach the AI your preferences.',
      icon: Bot,
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
      action: () => {
        handleToggleStep(2);
        onNavigate('assistant');
      },
      actionLabel: 'Try Assistant',
    },
    {
      idx: 3,
      title: 'Explore The Lounge & Vision Board',
      desc: 'Discover community updates, Pulses short video stream, or pin your aesthetic goals.',
      icon: Users,
      color: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
      action: () => {
        handleToggleStep(3);
        onNavigate('community');
      },
      actionLabel: 'Explore Lounge',
    },
  ];

  const progressPercent = Math.round((completedSteps.size / steps.length) * 100);

  return (
    <div className="rounded-3xl border border-indigo-500/35 bg-gradient-to-r from-indigo-950/40 via-[var(--color-surface)] to-purple-950/30 p-5 sm:p-6 shadow-xl space-y-4 animate-fade-in text-xs select-none relative overflow-hidden">
      {/* Decorative top accent glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black shadow-md shadow-indigo-500/20 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-[var(--color-text)]">
                Welcome to Personal AI OS — Quick Start Guide
              </h3>
              <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-black text-cyan-400">
                New User Onboarding
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
              Complete these 3 starter actions to personalize your autonomous workspace experience.
            </p>
          </div>
        </div>

        {/* Progress & Dismiss */}
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400">
              {completedSteps.size}/{steps.length} Done
            </span>
            <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-muted)] hover:text-white transition-colors"
            title="Dismiss Welcome Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {steps.map((st) => {
          const isDone = completedSteps.has(st.idx);
          const Icon = st.icon;
          return (
            <div
              key={st.idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                isDone
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-indigo-500/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-xl border ${st.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <strong className="font-bold text-xs text-[var(--color-text)]">
                      Step {st.idx}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStep(st.idx)}
                    className="p-0.5 text-zinc-400 hover:text-white transition-colors"
                    title={isDone ? 'Mark as incomplete' : 'Mark as done'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
                    )}
                  </button>
                </div>

                <h4 className={`text-xs font-bold ${isDone ? 'line-through text-zinc-400' : 'text-[var(--color-text)]'}`}>
                  {st.title}
                </h4>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                  {st.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={st.action}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDone
                    ? 'border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                }`}
              >
                <span>{st.actionLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
