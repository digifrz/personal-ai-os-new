import React, { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  Smile,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  ArrowRight,
  Share2,
  RefreshCw,
  Skull,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TaskItem, HabitItem, FinanceTransactionItem } from '../../types';
import { askAI } from '../../services/ai';

interface AIRoastHypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  habits: HabitItem[];
  transactions: FinanceTransactionItem[];
  onNavigateTab: (tab: string) => void;
}

export const AIRoastHypeModal: React.FC<AIRoastHypeModalProps> = ({
  isOpen,
  onClose,
  tasks,
  habits,
  transactions,
  onNavigateTab,
}) => {
  const { profile } = useAuth();
  const [mode, setMode] = useState<'roast' | 'hype' | 'stoic'>('roast');
  const [outputSpeech, setOutputSpeech] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const openTasks = tasks.filter((t) => t.status !== 'done');
  const highPriorityTasks = openTasks.filter((t) => t.priority === 'high');
  const completedTasks = tasks.filter((t) => t.status === 'done');

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingHabits = habits.filter((h) => !(h.completedDates || []).includes(todayStr));

  const generateContent = async (selectedMode: 'roast' | 'hype' | 'stoic') => {
    setIsGenerating(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    const userName = profile?.name || 'Farzan';
    let prompt = '';

    if (selectedMode === 'roast') {
      prompt = `You are a hilariously sassy, razor-sharp productivity comedian and tough-love coach (like Gordon Ramsay crossed with a Silicon Valley tech lead).
User: ${userName}.
Real Workspace Data:
- Open unfinished tasks (${openTasks.length}): ${openTasks.slice(0, 4).map((t) => `"${t.title}"`).join(', ') || 'No tasks listed, wow'}
- Critical urgent tasks pending (${highPriorityTasks.length}): ${highPriorityTasks.map((t) => t.title).join(', ') || 'None'}
- Habits neglected today: ${pendingHabits.map((h) => h.title).join(', ') || 'All checked'}
Write a funny, witty, playful, 3-paragraph roast of their procrastination habits. Make clever tech/pop culture analogies. End with a sharp challenge to finish their top task right now. Be hilarious, not genuinely mean.`;
    } else if (selectedMode === 'hype') {
      prompt = `You are an over-the-top, stadium-level Ultra Hype Man and fitness/startup hype beast.
User: ${userName}.
Data:
- Closed completed tasks: ${completedTasks.length} tasks crushed
- Active habit streaks: ${habits.map((h) => `${h.title} (${h.streakCount}d streak)`).join(', ') || 'Starting strong'}
Write a 3-paragraph, electrifying hype speech praising ${userName} like they just single-handedly landed a rocket on Mars. All caps energy, extreme motivation, absolute champion energy!`;
    } else {
      prompt = `You are Marcus Aurelius and Seneca reincarnated as an AI mentor.
User: ${userName}.
Open items: ${openTasks.length} tasks pending.
Write a serene, stoic, profound 3-paragraph reflection on focus, the brevity of human life, and taking virtuous action today without delay.`;
    }

    try {
      const res = await askAI({
        prompt,
        mode: 'chat',
        provider: 'gemini',
      });
      setOutputSpeech(res);
    } catch {
      if (selectedMode === 'roast') {
        setOutputSpeech(
          `Listen ${userName}, you have ${openTasks.length} tasks sitting in your queue like an abandoned shopping cart at 3 AM! "${openTasks[0]?.title || 'Your top task'}" has been waiting so long it's about to start charging you rent. Are you waiting for a constellation alignment or what? Close the tab, drink some water, and finish it right now!`
        );
      } else if (selectedMode === 'hype') {
        setOutputSpeech(
          `LET'S ABSOLUTELY GOOOO ${userName.toUpperCase()}! You closed out ${completedTasks.length} tasks like an unstoppable force of nature! Your daily streaks are turning into a legendary highlight reel. The universe is literally adjusting its physics to accommodate your momentum. Keep crushing it!`
        );
      } else {
        setOutputSpeech(
          `Do not act as if you had ten thousand years to throw away, ${userName}. Death stands at your elbow. Here is your task: ${openTasks[0]?.title || 'your duty'}. Approach it with calm deliberation and pure presence.`
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateContent(mode);
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
  }, [isOpen, mode]);

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(outputSpeech);
    utterance.rate = mode === 'hype' ? 1.15 : mode === 'roast' ? 1.05 : 0.9;
    utterance.pitch = mode === 'roast' ? 1.1 : mode === 'hype' ? 1.2 : 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-gradient-to-r from-orange-950/30 via-[var(--color-surface)] to-rose-950/30">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-2xl border shadow-md ${
              mode === 'roast'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : mode === 'hype'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
            }`}>
              {mode === 'roast' ? <Flame className="w-4 h-4" /> : mode === 'hype' ? <Zap className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--color-text)]">
                AI Next-Gen Motivation Coach
              </h3>
              <p className="text-[10px] text-[var(--color-muted)] font-mono">
                {mode === 'roast' ? '🔥 Gordon Ramsay Tough-Love Roast' : mode === 'hype' ? '⚡ Ultra Stadium Hype Man' : '🏛️ Stoic Emperor Marcus Aurelius'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="p-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] flex gap-2">
          <button
            type="button"
            onClick={() => setMode('roast')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              mode === 'roast'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Roast My Procrastination</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('hype')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              mode === 'hype'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Ultra Hype Man</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('stoic')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              mode === 'stoic'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Stoic Monk</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--color-muted)]">
              Real-Time AI Generation
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSpeech}
                disabled={isGenerating || !outputSpeech}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isSpeaking
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-indigo-500'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{isSpeaking ? 'Mute Audio' : 'Speak Aloud'}</span>
              </button>

              <button
                type="button"
                onClick={() => generateContent(mode)}
                disabled={isGenerating}
                className="p-1.5 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-all"
                title="Reroll punchline"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className={`p-5 rounded-3xl border leading-relaxed text-xs sm:text-sm whitespace-pre-wrap font-sans transition-all ${
            mode === 'roast'
              ? 'bg-rose-950/20 border-rose-500/30 text-rose-100'
              : mode === 'hype'
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-100 font-bold'
              : 'bg-indigo-950/20 border-indigo-500/30 text-indigo-100 font-serif'
          }`}>
            {outputSpeech || (isGenerating ? 'Scanning your tasks and crafting the roast...' : 'Ready.')}
          </div>

          {/* Quick Target Task Action */}
          {openTasks.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <span className="text-[10px] text-[var(--color-muted)] font-mono block">Target High-Impact Item</span>
                <p className="text-xs font-bold text-[var(--color-text)] truncate">{openTasks[0].title}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onNavigateTab('tasks');
                  onClose();
                }}
                className="rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] px-3 py-1.5 text-xs font-bold text-white shadow-sm flex items-center gap-1 shrink-0"
              >
                <span>Conquer Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between text-[11px] text-[var(--color-muted)]">
          <span>Personal AI OS Comedy &amp; Motivation Protocol</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[var(--color-text)] hover:underline"
          >
            Back to Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
