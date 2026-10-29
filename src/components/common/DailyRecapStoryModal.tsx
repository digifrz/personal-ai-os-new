import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Flame,
  CheckCircle2,
  Video,
  Brain,
  Share2,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Award,
  Layers,
  Heart,
  ExternalLink,
  Code2,
  Volume2,
} from 'lucide-react';
import { DailyRecapStory } from '../../types';

interface DailyRecapStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recap: DailyRecapStory;
  onShowToast: (msg: string) => void;
}

const STORY_SLIDES = [
  { id: 'vibe_aura', title: 'Daily Vibe & Aura' },
  { id: 'tasks_cracked', title: 'Hacks Cracked' },
  { id: 'video_media', title: 'Top Media' },
  { id: 'ai_superbrain', title: 'AI Super-Brain' },
  { id: 'prestige_badge', title: 'Today’s Badge' },
];

export const DailyRecapStoryModal: React.FC<DailyRecapStoryModalProps> = ({
  isOpen,
  onClose,
  recap,
  onShowToast,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTheme, setActiveTheme] = useState<DailyRecapStory['theme']>(recap.theme || 'cyberpunk_oled');
  const [copiedLink, setCopiedLink] = useState(false);
  const timerRef = useRef<number | null>(null);

  const SLIDE_DURATION_MS = 5500;

  useEffect(() => {
    if (!isOpen) return;
    setCurrentSlideIndex(0);
  }, [isOpen]);

  // Auto-advance story slides
  useEffect(() => {
    if (!isOpen || isPaused) return;

    timerRef.current = window.setTimeout(() => {
      if (currentSlideIndex < STORY_SLIDES.length - 1) {
        setCurrentSlideIndex((prev) => prev + 1);
      } else {
        // Paused at the end
        setIsPaused(true);
      }
    }, SLIDE_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, currentSlideIndex, isPaused]);

  if (!isOpen) return null;

  const nextSlide = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    if (currentSlideIndex < STORY_SLIDES.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleShareToInstagram = () => {
    if (navigator.vibrate) navigator.vibrate(25);
    const text = `🔥 Today's Daily Recap: ${recap.vibeTitle} (${recap.vibeScore}% Flow Vibe)\nStreak: ${recap.creationStreak} Days 🔥\nTop Hack: ${recap.tasksHacksCracked[0]?.title || 'Shipped features'}\nCrafted with Personal AI OS`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedLink(true);
    onShowToast('📸 Formatted for Instagram Stories! Story summary copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareToWhatsApp = () => {
    if (navigator.vibrate) navigator.vibrate(25);
    const text = `⚡ My Daily Recap Story: ${recap.vibeTitle}\nStreak: ${recap.creationStreak} Days 🔥 | Flow Vibe: ${recap.vibeScore}%\n"${recap.topAiInsight}"`;
    navigator.clipboard.writeText(text).catch(() => {});
    onShowToast('💬 Copied for WhatsApp Status! Ready to paste & post.');
  };

  const getThemeGradient = () => {
    switch (activeTheme) {
      case 'sunset_aura':
        return 'from-amber-600 via-rose-700 to-indigo-950';
      case 'emerald_matrix':
        return 'from-emerald-700 via-teal-900 to-black';
      case 'vaporwave':
        return 'from-pink-600 via-purple-800 to-cyan-950';
      case 'minimalist_noir':
        return 'from-zinc-900 via-black to-zinc-950';
      default:
        return 'from-purple-950 via-zinc-950 to-cyan-950';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-2xl animate-fade-in select-none"
    >
      {/* Phone-Format Vertical Story Container (Instagram & Spotify Wrapped aspect ratio) */}
      <div
        className={`relative w-full max-w-[420px] h-[88vh] max-h-[780px] rounded-[36px] border border-white/20 bg-gradient-to-b ${getThemeGradient()} p-6 shadow-2xl flex flex-col justify-between overflow-hidden text-white`}
      >
        {/* Glow ambient background aura */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/25 blur-3xl pointer-events-none" />

        {/* Top Header: Instagram/Spotify Wrapped Segmented Story Progress Bars */}
        <div className="relative z-20 space-y-3">
          <div className="flex items-center gap-1.5 w-full">
            {STORY_SLIDES.map((slide, idx) => {
              const isPast = idx < currentSlideIndex;
              const isCurrent = idx === currentSlideIndex;
              return (
                <div
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden cursor-pointer"
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      isPast ? 'w-full bg-white' : isCurrent ? 'w-full bg-gradient-to-r from-cyan-400 to-white' : 'w-0'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-xs backdrop-blur-md border border-white/10 font-black">
                ⚡
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-cyan-300 leading-none">
                  Daily Recap Story
                </p>
                <span className="text-[9px] text-zinc-400 font-mono">
                  {recap.date} · {recap.totalMicroDrops} Micro-Drops
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                title={isPaused ? 'Resume Story' : 'Pause Story'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                title="Close Story"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Story Body Canvas: Interactive Slide Views */}
        <div className="relative z-10 flex-1 my-4 flex flex-col justify-center animate-fade-in">
          {/* SLIDE 0: DAILY VIBE & AURA */}
          {currentSlideIndex === 0 && (
            <div className="space-y-6 text-center animate-scale-up">
              <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-300">
                Today’s Vibe Check
              </span>

              {/* Pulsing Aura Orb */}
              <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 blur-xl opacity-70 animate-pulse [animation-duration:3s]" />
                <div className="relative w-28 h-28 rounded-full border border-white/30 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl">
                  <span className="text-3xl font-black">{recap.vibeScore}%</span>
                  <span className="text-[9px] text-zinc-300 uppercase tracking-widest font-bold">Flow Vibe</span>
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                  {recap.vibeTitle}
                </h3>
                <p className="text-xs text-pink-300 font-bold mt-1.5">
                  &ldquo;{recap.moodAura}&rdquo;
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 block uppercase">
                  Creation Momentum
                </span>
                <p className="text-xs text-zinc-200 leading-snug">
                  You dropped thoughts, code hacks, and media timestamps with zero blank-page friction today.
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 1: HACKS & TASKS CRACKED TODAY */}
          {currentSlideIndex === 1 && (
            <div className="space-y-5 animate-scale-up">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  Execution Report
                </span>
                <h3 className="text-xl font-black">Hacks &amp; Tasks Cracked</h3>
                <p className="text-xs text-zinc-400">What you actually shipped into production today</p>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
                {recap.tasksHacksCracked.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white leading-snug">{task.title}</p>
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-zinc-300">
                        {task.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">Sprint Throughput</span>
                <span className="text-xs font-black text-white">Top 5% Gen-Z Focus</span>
              </div>
            </div>
          )}

          {/* SLIDE 2: TOP VIDEO & MEDIA CONSUMED */}
          {currentSlideIndex === 2 && (
            <div className="space-y-5 animate-scale-up">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                  Media &amp; Learning
                </span>
                <h3 className="text-xl font-black">Top Video Analyzed</h3>
                <p className="text-xs text-zinc-400">Synchronized takeaway captured without app switching</p>
              </div>

              <div className="p-4 rounded-3xl bg-black/50 border border-white/15 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <Video className="w-4 h-4" />
                  <span>{recap.topMediaWatched?.platform || 'YouTube'} Drop</span>
                  <span className="ml-auto font-mono text-[10px] text-zinc-400">
                    ⏱ {recap.topMediaWatched?.timestamp || '04:25'}
                  </span>
                </div>

                <strong className="block text-sm font-extrabold text-white leading-tight">
                  {recap.topMediaWatched?.title}
                </strong>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-extrabold uppercase text-zinc-400 block mb-1">
                    ✨ Key AI Takeaway
                  </span>
                  <p className="text-xs text-zinc-200 leading-relaxed italic">
                    &ldquo;{recap.topMediaWatched?.takeaway}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: AI SUPER-BRAIN MIND HIGHLIGHT */}
          {currentSlideIndex === 3 && (
            <div className="space-y-5 animate-scale-up text-center">
              <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300">
                Cognitive Synthesis
              </span>

              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-3xl bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-xl">
                <Brain className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-black">AI Super-Brain Highlight</h3>
                <p className="text-xs text-zinc-400 mt-1">Your deepest breakthrough synthesized from your notes &amp; prompts</p>
              </div>

              <div className="p-4 rounded-3xl bg-black/60 border border-purple-500/30 text-left space-y-2">
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
                  &ldquo;{recap.topAiInsight}&rdquo;
                </p>
                <span className="block text-[10px] font-bold text-purple-400">
                  Personal AI OS Knowledge Graph
                </span>
              </div>
            </div>
          )}

          {/* SLIDE 4: TODAY'S BADGE & FLEX CARD */}
          {currentSlideIndex === 4 && (
            <div className="space-y-5 text-center animate-scale-up">
              <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                Streak &amp; Achievement
              </span>

              <div className="relative mx-auto w-24 h-24 flex items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-black text-4xl shadow-2xl shadow-orange-500/30 border border-white/20">
                <span className="animate-bounce">{recap.unlockedBadge?.icon || '🔥'}</span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white">
                  {recap.unlockedBadge?.name || `${recap.creationStreak}-Day Streak`}
                </h3>
                <p className="text-xs text-zinc-300 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  {recap.unlockedBadge?.description || 'Maintained uninterrupted micro-drop momentum.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-amber-400">
                <Flame className="w-4 h-4 fill-amber-400 animate-pulse" />
                <span>Creation Streak: {recap.creationStreak} Days Continuous</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Tap Navigation & 1-Click Social Sharing */}
        <div className="relative z-20 space-y-3 pt-2 border-t border-white/10">
          {/* Aesthetic Theme Selector */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 text-[10px] font-bold uppercase">Aesthetic Theme</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'cyberpunk_oled', color: 'bg-purple-600' },
                { id: 'sunset_aura', color: 'bg-rose-500' },
                { id: 'emerald_matrix', color: 'bg-emerald-500' },
                { id: 'vaporwave', color: 'bg-cyan-500' },
                { id: 'minimalist_noir', color: 'bg-zinc-700' },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setActiveTheme(th.id as any)}
                  className={`w-4 h-4 rounded-full ${th.color} transition-transform ${
                    activeTheme === th.id ? 'ring-2 ring-white scale-125' : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Social Hook Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareToInstagram}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Copied Story!' : 'IG Story Card'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareToWhatsApp}
              className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Share to WhatsApp Status"
            >
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Tap navigation hints */}
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold px-1">
            <button
              type="button"
              onClick={prevSlide}
              disabled={currentSlideIndex === 0}
              className="hover:text-white transition-colors disabled:opacity-30"
            >
              ← Tap Left
            </button>
            <span className="font-mono text-zinc-500">
              {currentSlideIndex + 1} / {STORY_SLIDES.length}
            </span>
            <button
              type="button"
              onClick={nextSlide}
              disabled={currentSlideIndex === STORY_SLIDES.length - 1}
              className="hover:text-white transition-colors disabled:opacity-30"
            >
              Tap Right →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
