import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  Calendar,
  Flame,
  Check,
  ArrowRight,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TaskItem, CalendarEventItem, HabitItem, FinanceTransactionItem } from '../../types';
import { askAI } from '../../services/ai';

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  events: CalendarEventItem[];
  habits: HabitItem[];
  transactions: FinanceTransactionItem[];
  onNavigateTab: (tab: string) => void;
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
  isOpen,
  onClose,
  tasks,
  events,
  habits,
  transactions,
  onNavigateTab,
}) => {
  const { profile } = useAuth();
  const [briefMode, setBriefMode] = useState<'morning' | 'evening'>(() => {
    const hour = new Date().getHours();
    return hour >= 17 ? 'evening' : 'morning';
  });

  const [aiBriefText, setAiBriefText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter today's relevant items
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== 'done'), [tasks]);
  const highPriorityTasks = useMemo(() => openTasks.filter((t) => t.priority === 'high'), [openTasks]);
  const completedTodayTasks = useMemo(() => tasks.filter((t) => t.status === 'done'), [tasks]);

  const todayEvents = useMemo(() => {
    return events.filter((e) => (e.startsAt || '').startsWith(todayStr));
  }, [events, todayStr]);

  const habitsDoneToday = useMemo(() => {
    return habits.filter((h) => (h.completedDates || []).includes(todayStr));
  }, [habits, todayStr]);

  // Generate or refresh AI executive briefing
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    let active = true;

    async function generateBrief() {
      setIsGenerating(true);
      const prompt =
        briefMode === 'morning'
          ? `You are Personal AI OS Executive Assistant. Generate a punchy, ultra-motivating 3-paragraph Morning Kickoff briefing for ${profile?.name || 'Farzan'}.
Summary data:
- High priority tasks today (${highPriorityTasks.length}): ${highPriorityTasks.slice(0, 3).map((t) => t.title).join(', ') || 'None pending'}
- Scheduled calendar events (${todayEvents.length}): ${todayEvents.map((e) => e.title).join(', ') || 'Open calendar day'}
- Active habits to conquer: ${habits.slice(0, 4).map((h) => h.title).join(', ') || 'Daily routines active'}
Give 1) The main focus directive for the day, 2) Time blocking recommendation, 3) An energizing 1-sentence closing power quote.`
          : `You are Personal AI OS Executive Assistant. Generate a calm, celebratory 3-paragraph Evening Wind-Down briefing for ${profile?.name || 'Farzan'}.
Summary data:
- Tasks completed today: ${completedTodayTasks.length} tasks finished
- Habits checked off today: ${habitsDoneToday.length} of ${habits.length} habits
Provide 1) Praise for today's accomplishments, 2) Gentle advice on disconnecting from screens for restorative sleep, 3) A thought to reflect on tomorrow.`;

      try {
        const res = await askAI({
          prompt,
          mode: 'chat',
          provider: 'gemini',
        });
        if (active) {
          setAiBriefText(res);
        }
      } catch {
        if (active) {
          setAiBriefText(
            briefMode === 'morning'
              ? `Good morning ${profile?.name || 'Farzan'}! You have ${highPriorityTasks.length} critical priority tasks awaiting your attention today, with ${todayEvents.length} calendar appointments scheduled. Your momentum starts with your first habit check-in. Conquer the highest-leverage task before noon!`
              : `Great work today, ${profile?.name || 'Farzan'}! You closed out ${completedTodayTasks.length} tasks and locked in ${habitsDoneToday.length} daily habits. Take pride in your consistency, step away from digital screens, and recharge for tomorrow.`
          );
        }
      } finally {
        if (active) setIsGenerating(false);
      }
    }

    generateBrief();

    return () => {
      active = false;
    };
  }, [isOpen, briefMode, profile?.name, highPriorityTasks.length, todayEvents.length, habits.length, completedTodayTasks.length, habitsDoneToday.length]);

  // Web Speech Text-to-Speech handler
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(aiBriefText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-gradient-to-r from-violet-950/40 via-[var(--color-surface)] to-cyan-950/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] tracking-tight">
                Personal AI OS Executive Briefing
              </h2>
              <p className="text-[11px] text-[var(--color-muted)] font-mono">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex rounded-2xl bg-[var(--color-bg-secondary)] p-1 border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setBriefMode('morning')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  briefMode === 'morning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-[var(--color-muted)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Morning</span>
              </button>
              <button
                type="button"
                onClick={() => setBriefMode('evening')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  briefMode === 'evening' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-[var(--color-muted)]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Evening</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <span className="text-[10px] text-[var(--color-muted)]">Open Tasks</span>
              <p className="text-xl font-bold font-mono text-[var(--color-text)] mt-0.5">{openTasks.length}</p>
              <span className="text-[10px] text-red-400 font-bold">{highPriorityTasks.length} urgent</span>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <span className="text-[10px] text-[var(--color-muted)]">Calendar Events</span>
              <p className="text-xl font-bold font-mono text-[var(--color-text)] mt-0.5">{todayEvents.length}</p>
              <span className="text-[10px] text-blue-400">Scheduled today</span>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <span className="text-[10px] text-[var(--color-muted)]">Habits Done</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{habitsDoneToday.length} / {habits.length}</p>
              <span className="text-[10px] text-emerald-400/80">Routines checked</span>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <span className="text-[10px] text-[var(--color-muted)]">Completed Tasks</span>
              <p className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{completedTodayTasks.length}</p>
              <span className="text-[10px] text-cyan-400/80">Done &amp; verified</span>
            </div>
          </div>

          {/* AI Executive Digest Card with Audio TTS Button */}
          <div className="p-5 rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-bg-secondary)] via-[var(--color-surface)] to-[var(--color-bg-secondary)] space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                  {briefMode === 'morning' ? '✦ Morning Strategic Synthesis' : '✦ Evening Reflection'}
                </span>
                {isGenerating && (
                  <span className="text-[10px] text-[var(--color-muted)] animate-pulse">
                    Synthesizing with Gemini...
                  </span>
                )}
              </div>

              {/* Web Speech Audio Play/Pause Button */}
              <button
                type="button"
                onClick={handleToggleSpeech}
                disabled={isGenerating || !aiBriefText}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isSpeaking
                    ? 'bg-rose-500 text-white shadow-rose-500/30 ring-2 ring-rose-500/40 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
                title={isSpeaking ? 'Stop spoken readout' : 'Read brief aloud via Web Speech'}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isSpeaking ? 'Pause Audio' : 'Listen Aloud'}</span>
              </button>
            </div>

            <div className="text-xs sm:text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap font-sans">
              {aiBriefText || (isGenerating ? 'Preparing your personalized daily directive...' : 'Brief ready.')}
            </div>
          </div>

          {/* Quick Action Jump Points */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider">
              Immediate Daily Actions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onNavigateTab('habits');
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-bg-secondary)] hover:bg-white/5 border border-[var(--color-border)] text-left transition-all group"
              >
                <div>
                  <p className="font-bold text-[var(--color-text)] group-hover:text-emerald-400 transition-colors">
                    Check Off Habits
                  </p>
                  <span className="text-[10px] text-[var(--color-muted)] font-mono">
                    {habits.length - habitsDoneToday.length} remaining
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-muted)] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateTab('tasks');
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-bg-secondary)] hover:bg-white/5 border border-[var(--color-border)] text-left transition-all group"
              >
                <div>
                  <p className="font-bold text-[var(--color-text)] group-hover:text-cyan-400 transition-colors">
                    Focus on Tasks
                  </p>
                  <span className="text-[10px] text-[var(--color-muted)] font-mono">
                    {highPriorityTasks.length} high priority
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-muted)] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateTab('finance');
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-bg-secondary)] hover:bg-white/5 border border-[var(--color-border)] text-left transition-all group"
              >
                <div>
                  <p className="font-bold text-[var(--color-text)] group-hover:text-violet-400 transition-colors">
                    Review Finances
                  </p>
                  <span className="text-[10px] text-[var(--color-muted)] font-mono">
                    Log daily expenses
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-muted)] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <span className="text-[11px] text-[var(--color-muted)]">
            Personal AI OS · Proactive Daily Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-[var(--color-primary-hover)] transition-all"
          >
            Start My Day
          </button>
        </div>
      </div>
    </div>
  );
};
