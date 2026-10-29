import React, { useState, useEffect } from 'react';
import {
  Zap,
  Flame,
  Sparkles,
  Mic,
  Code2,
  Video,
  Book,
  Plus,
  Share2,
  Copy,
  Trash2,
  Award,
  Layers,
  ChevronRight,
  Clock,
  Tag,
  CheckCircle2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { microDropsService } from '../services/microDrops';
import { MicroDropArtifact, CreationBadge, DailyRecapStory } from '../types';

interface MicroDropsViewProps {
  onShowToast: (msg: string) => void;
  onOpenQuickDrop: () => void;
  onOpenRecapStory: (recap: DailyRecapStory) => void;
}

export const MicroDropsView: React.FC<MicroDropsViewProps> = ({
  onShowToast,
  onOpenQuickDrop,
  onOpenRecapStory,
}) => {
  const [drops, setDrops] = useState<MicroDropArtifact[]>([]);
  const [badges, setBadges] = useState<CreationBadge[]>([]);
  const [streakDays, setStreakDays] = useState(4);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isGeneratingRecap, setIsGeneratingRecap] = useState(false);
  const [latestRecap, setLatestRecap] = useState<DailyRecapStory | null>(null);

  const loadData = () => {
    setDrops([...microDropsService.getDrops()]);
    setBadges([...microDropsService.getBadges()]);
    setStreakDays(microDropsService.getStreakDays());
    setLatestRecap(microDropsService.getCurrentRecap());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('paio:microdrops-updated', handleUpdate);
    return () => window.removeEventListener('paio:microdrops-updated', handleUpdate);
  }, []);

  const handleDelete = (id: string) => {
    microDropsService.deleteMicroDrop(id);
    loadData();
    onShowToast('Micro-drop removed.');
  };

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      onShowToast('Copied to clipboard!');
    }
  };

  // Generate or open today's story recap
  const handleLaunchDailyStory = async () => {
    if (navigator.vibrate) navigator.vibrate([40, 60]);
    setIsGeneratingRecap(true);
    try {
      const recap = await microDropsService.generateDailyRecap('cyberpunk_oled');
      setLatestRecap(recap);
      onOpenRecapStory(recap);
      onShowToast("✨ Generated today's Spotify-Wrapped style Story Recap!");
    } catch {
      onShowToast("Failed to generate recap, please try again.");
    } finally {
      setIsGeneratingRecap(false);
    }
  };

  const filteredDrops = drops.filter((d) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'voice') return d.type === 'diary_voice' || d.type === 'diary_text';
    if (selectedFilter === 'hack') return d.type === 'task_hack';
    if (selectedFilter === 'video') return d.type === 'video_timestamp';
    if (selectedFilter === 'ai') return d.type === 'ai_prompt';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8 text-[var(--color-text)]">
      {/* 1. HERO BANNER: ZERO-FRICTION DROPS & DAILY STORY RECAP */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-950/60 via-indigo-950/50 to-pink-950/40 border border-purple-500/30 shadow-2xl overflow-hidden">
        {/* Neon Glow Accents */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                MICRO-DROP ARTIFACTS
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold">
                <Flame className="w-4 h-4 fill-orange-400 animate-pulse" />
                <span>{streakDays}-Day Creation Streak</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Zero-Friction Drops & Auto-Generated Daily Recaps
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              No blank-page anxiety. Drop 10-second audio thoughts, terminal hacks, video timestamp reactions, and AI prompts
              throughout the day. At sunset, 1-click stitches everything into your shareable Daily Story Recap.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3">
            <button
              type="button"
              onClick={onOpenQuickDrop}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs shadow-lg backdrop-blur-md active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4 text-purple-400" />
              <span>⚡ 2-Sec Micro-Drop</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingRecap}
              onClick={handleLaunchDailyStory}
              className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs shadow-xl shadow-purple-600/30 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{isGeneratingRecap ? 'Stitching Story...' : '✨ 1-Click Story Recap'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. GAMIFIED STREAKS & BADGES SHOWCASE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold tracking-tight text-[var(--color-text)]">
              Creation Streaks & Unlocked Badges
            </h2>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {badges.filter((b) => b.unlockedAt).length} / {badges.length + 2} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{badge.icon}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  UNLOCKED
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  {badge.name}
                </h3>
                <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 mt-0.5">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}

          {/* Locked Badge Teaser */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 flex flex-col justify-between space-y-2 opacity-60">
            <div className="flex items-center justify-between">
              <span className="text-2xl grayscale">🌙</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                LOCKED (4/7)
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-300">Midnight Deep Hacker</h3>
              <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
                Drop 3 consecutive code hacks past 11 PM to unlock this prestige aura.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ARTIFACTS FEED & FILTER BAR */}
      <div className="space-y-4">
        {/* Filter Chips & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'all', label: `All Drops (${drops.length})`, icon: Layers },
              {
                id: 'voice',
                label: `Voice & Diary (${drops.filter((d) => d.type.startsWith('diary')).length})`,
                icon: Mic,
              },
              {
                id: 'hack',
                label: `Code Hacks (${drops.filter((d) => d.type === 'task_hack').length})`,
                icon: Code2,
              },
              {
                id: 'video',
                label: `Video Reactions (${drops.filter((d) => d.type === 'video_timestamp').length})`,
                icon: Video,
              },
              {
                id: 'ai',
                label: `AI Prompts (${drops.filter((d) => d.type === 'ai_prompt').length})`,
                icon: Sparkles,
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                    selectedFilter === f.id
                      ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30'
                      : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-elevated)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenQuickDrop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Drop Artifact</span>
          </button>
        </div>

        {/* Drops Timeline List */}
        {filteredDrops.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
            <Zap className="w-8 h-8 text-purple-400 mx-auto opacity-50" />
            <h3 className="text-sm font-semibold">No micro-drops in this category yet</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Tap the button below to drop a quick voice thought or terminal hack in 2 seconds.
            </p>
            <button
              type="button"
              onClick={onOpenQuickDrop}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white shadow-md hover:bg-purple-500"
            >
              + Drop First Artifact
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDrops.map((drop) => (
              <div
                key={drop.id}
                className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 shadow-md"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                        drop.type === 'diary_voice' || drop.type === 'diary_text'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : drop.type === 'task_hack'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : drop.type === 'video_timestamp'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {drop.metadata?.vibeEmoji || (
                        drop.type === 'task_hack' ? (
                          <Code2 className="w-4 h-4" />
                        ) : drop.type === 'video_timestamp' ? (
                          <Video className="w-4 h-4" />
                        ) : drop.type === 'ai_prompt' ? (
                          <Sparkles className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white line-clamp-1">{drop.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[var(--color-text-secondary)] font-mono">
                          {new Date(drop.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {drop.metadata?.codeLanguage && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            {drop.metadata.codeLanguage}
                          </span>
                        )}
                        {drop.metadata?.videoTimestamp && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                            ⏱️ {drop.metadata.videoTimestamp}
                          </span>
                        )}
                        {drop.metadata?.audioSeconds && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                            🎙️ {drop.metadata.audioSeconds}s audio
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(drop.content)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Copy content"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(drop.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete drop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                {drop.type === 'task_hack' ? (
                  <pre className="p-3 rounded-xl bg-[#090d16] border border-white/5 text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {drop.content}
                  </pre>
                ) : (
                  <p className="text-xs text-gray-200 leading-relaxed pl-1 whitespace-pre-wrap">
                    {drop.content}
                  </p>
                )}

                {/* Tags & Included in Recap Pill */}
                <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)] text-[10px]">
                  <div className="flex flex-wrap items-center gap-1">
                    {(drop.metadata?.tags || []).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-white/5 text-[var(--color-text-secondary)] font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <span className="flex items-center gap-1 text-purple-400 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-purple-400" />
                    In Daily Story
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
