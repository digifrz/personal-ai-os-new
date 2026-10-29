import { MicroDropArtifact, DailyRecapStory, CreationBadge } from '../types';
import { askAI } from './ai';

const MICRO_DROPS_STORAGE_KEY = 'paio_micro_drops_v1';
const DAILY_RECAPS_STORAGE_KEY = 'paio_daily_recaps_v1';
const CREATION_STREAK_KEY = 'paio_creation_streak_v1';

const INITIAL_MICRO_DROPS: MicroDropArtifact[] = [
  {
    id: 'drop-1',
    userId: 'current_user',
    type: 'diary_text',
    title: 'Morning Mental Clarity & Intention',
    content: 'Woke up at 7 AM. Feeling sharp and dialed in. Goal today: crush the shared vibe rooms and finish zero-friction micro-drops.',
    metadata: {
      vibeEmoji: '⚡',
      tags: ['DailyJournal', 'Mindset'],
    },
    createdAt: new Date(Date.now() - 3600 * 1000 * 9).toISOString(),
    includedInRecap: true,
  },
  {
    id: 'drop-2',
    userId: 'current_user',
    type: 'task_hack',
    title: 'Fixed Off-Screen Audio Suspension Bug',
    content: 'Kept player iframe inside viewport bounds (opacity: 0.001) rather than -9999px. Chromium audio context stays 100% active on minimize!',
    metadata: {
      codeLanguage: 'typescript',
      tags: ['TypeScript', 'BugFix', 'WebAudio'],
    },
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    includedInRecap: true,
  },
  {
    id: 'drop-3',
    userId: 'current_user',
    type: 'video_timestamp',
    title: 'Reaction to Andrej Karpathy Micrograd Lecture',
    content: 'Saved timestamp 04:25 on backpropagation chain rule. The scalar graph representation is pure beauty.',
    metadata: {
      videoTitle: 'Neural Networks: Zero to Hero',
      videoTimestamp: '04:25',
      tags: ['AI', 'NeuralNetworks', 'DeepLearning'],
    },
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    includedInRecap: true,
  },
  {
    id: 'drop-4',
    userId: 'current_user',
    type: 'ai_prompt',
    title: 'Prompt: High-Speed Event Bus in React 19',
    content: 'AI synthesized an ultra-clean CustomEvent bus with type-safe payloads and zero bundle weight.',
    metadata: {
      tags: ['Architecture', 'PromptEngineering'],
    },
    createdAt: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString(),
    includedInRecap: true,
  },
];

const INITIAL_BADGES: CreationBadge[] = [
  {
    id: 'badge-streak-4',
    name: '4-Day Creation Streak 🔥',
    icon: '🔥',
    description: 'Consistently dropped thoughts, hacks, and learnings for 4 consecutive days.',
    unlockedAt: new Date().toISOString(),
    category: 'streak',
  },
  {
    id: 'badge-hacker',
    name: 'Code Alchemist ⚡',
    icon: '⚡',
    description: 'Cracked 3 critical technical bugs and shared reproducible logs in a single day.',
    unlockedAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    category: 'coding',
  },
  {
    id: 'badge-synthesizer',
    name: 'Media Synthesizer 🎬',
    icon: '🎬',
    description: 'Extracted high-density AI takeaways from 5 educational and dev videos.',
    unlockedAt: new Date(Date.now() - 3600 * 1000 * 20).toISOString(),
    category: 'video',
  },
  {
    id: 'badge-vibe-master',
    name: 'Shared Vibe Catalyst 🚀',
    icon: '🚀',
    description: 'Ignited group focus momentum in Shared Vibe Rooms with 10+ task cheers.',
    unlockedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    category: 'social',
  },
];

class MicroDropsService {
  private drops: MicroDropArtifact[] = [];
  private badges: CreationBadge[] = INITIAL_BADGES;
  private currentRecap: DailyRecapStory | null = null;
  private streakDays: number = 4;

  constructor() {
    this.load();
  }

  private load() {
    try {
      const storedDrops = localStorage.getItem(MICRO_DROPS_STORAGE_KEY);
      if (storedDrops) {
        const parsed = JSON.parse(storedDrops);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.drops = parsed;
        } else {
          this.drops = INITIAL_MICRO_DROPS;
        }
      } else {
        this.drops = INITIAL_MICRO_DROPS;
      }

      const storedStreak = localStorage.getItem(CREATION_STREAK_KEY);
      if (storedStreak) {
        this.streakDays = parseInt(storedStreak, 10) || 4;
      }

      const storedRecap = localStorage.getItem(DAILY_RECAPS_STORAGE_KEY);
      if (storedRecap) {
        this.currentRecap = JSON.parse(storedRecap);
      }
    } catch {
      this.drops = INITIAL_MICRO_DROPS;
    }
  }

  private save() {
    try {
      localStorage.setItem(MICRO_DROPS_STORAGE_KEY, JSON.stringify(this.drops));
      localStorage.setItem(CREATION_STREAK_KEY, String(this.streakDays));
      if (this.currentRecap) {
        localStorage.setItem(DAILY_RECAPS_STORAGE_KEY, JSON.stringify(this.currentRecap));
      }
      window.dispatchEvent(new CustomEvent('paio:microdrops-updated', { detail: this.drops }));
    } catch {}
  }

  public getDrops(): MicroDropArtifact[] {
    return this.drops;
  }

  public getStreakDays(): number {
    return this.streakDays;
  }

  public getBadges(): CreationBadge[] {
    return this.badges;
  }

  public getCurrentRecap(): DailyRecapStory | null {
    return this.currentRecap;
  }

  // Record a 2-second zero-friction micro-drop
  public addMicroDrop(
    type: MicroDropArtifact['type'],
    title: string,
    content: string,
    metadata: MicroDropArtifact['metadata'] = {}
  ): MicroDropArtifact {
    const newDrop: MicroDropArtifact = {
      id: 'drop-' + Date.now(),
      userId: 'current_user',
      type,
      title: title.trim() || 'Quick Micro-Drop',
      content: content.trim(),
      metadata,
      createdAt: new Date().toISOString(),
      includedInRecap: true,
    };

    this.drops.unshift(newDrop);
    this.save();
    return newDrop;
  }

  // Delete micro-drop
  public deleteMicroDrop(id: string) {
    this.drops = this.drops.filter((d) => d.id !== id);
    this.save();
  }

  // The 1-Click "Daily Recap Story" (The Spotify Wrapped / IG Stories Hook)
  public async generateDailyRecap(theme: DailyRecapStory['theme'] = 'cyberpunk_oled'): Promise<DailyRecapStory> {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayDrops = this.drops.filter((d) => {
      const dropDate = d.createdAt.slice(0, 10);
      return dropDate === todayStr || Math.abs(Date.now() - new Date(d.createdAt).getTime()) < 24 * 3600 * 1000;
    });

    const tasksCracked = todayDrops
      .filter((d) => d.type === 'task_hack')
      .map((d) => ({ title: d.title, tag: d.metadata?.tags?.[0] || 'Code' }));

    const diaryNotes = todayDrops.filter((d) => d.type === 'diary_text' || d.type === 'diary_voice');
    const videoDrops = todayDrops.filter((d) => d.type === 'video_timestamp');
    const aiPrompts = todayDrops.filter((d) => d.type === 'ai_prompt');

    // Context summary for AI synthesis
    const contextPrompt = `
Date: ${todayStr}
Total Micro-Drops Today: ${todayDrops.length}
Tasks / Hacks Cracked: ${tasksCracked.map((t) => t.title).join('; ') || 'Continuous architectural engineering'}
Diary Thoughts: ${diaryNotes.map((d) => d.content).join('; ') || 'High focus, disciplined output'}
Videos / Media Consumed: ${videoDrops.map((v) => `${v.metadata?.videoTitle || v.title}: ${v.content}`).join('; ') || 'TypeScript full stack deep-dive'}
AI Highlights: ${aiPrompts.map((p) => p.content).join('; ') || 'Event-driven React architecture'}
Streak: ${this.streakDays} Days 🔥
    `.trim();

    let aiTitle = 'Level 9 Neural Architect';
    let aiAura = 'Relentless Flow & Cosmic Clarity';
    let aiInsight = 'Decoupling background audio contexts and lowering capture friction unlocks exponential momentum.';
    let vibeScore = 96;

    try {
      const response = await askAI({
        prompt: `You are the Spotify Wrapped-style Daily Recap Story Engine for a Gen-Z high-performer. Analyze today's micro-drops and output a JSON object with:
"vibeTitle" (fun prestigious title under 4 words, e.g. "Level 9 Neural Architect", "Cyberpunk Flow Hacker"),
"vibeScore" (number 85-99),
"moodAura" (vibrant 3-5 word mood aura, e.g. "Relentless Flow & Cosmic Clarity"),
"topAiInsight" (1 punchy sentence summarizing their biggest learning or breakthrough today),
"shareableSummaryText" (a ready-to-post short caption with emojis for Instagram Stories or WhatsApp).
Return pure JSON only.`,
        mode: 'chat',
      });

      const clean = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed.vibeTitle) aiTitle = parsed.vibeTitle;
      if (parsed.moodAura) aiAura = parsed.moodAura;
      if (parsed.topAiInsight) aiInsight = parsed.topAiInsight;
      if (parsed.vibeScore) vibeScore = parsed.vibeScore;
    } catch (e) {
      console.warn('AI daily recap fallback:', e);
    }

    const recap: DailyRecapStory = {
      id: 'recap-' + todayStr + '-' + Date.now(),
      date: todayStr,
      theme,
      totalMicroDrops: todayDrops.length,
      creationStreak: this.streakDays,
      vibeScore,
      vibeTitle: aiTitle,
      vibeEmoji: '⚡',
      moodAura: aiAura,
      tasksHacksCracked:
        tasksCracked.length > 0
          ? tasksCracked
          : [
              { title: 'Solved background audio throttling bug', tag: 'Code' },
              { title: 'Shipped Shared Vibe Rooms with synchronized playback', tag: 'Ship' },
            ],
      topMediaWatched: {
        title: videoDrops[0]?.metadata?.videoTitle || 'TypeScript & Modern AI OS Engine',
        takeaway: videoDrops[0]?.content || 'Decouple background audio contexts to keep audio streaming continuously.',
        platform: 'YouTube',
        timestamp: videoDrops[0]?.metadata?.videoTimestamp || '04:25',
      },
      topAiInsight: aiInsight,
      audioDropsCount: todayDrops.filter((d) => d.type === 'diary_voice').length,
      unlockedBadge: {
        id: 'badge-today',
        name: `${this.streakDays}-Day Creation Streak 🔥`,
        icon: '🔥',
        description: 'Maintained uninterrupted micro-drop momentum across all workspace modules.',
        category: 'streak',
      },
      shareableSummaryText: `⚡ Today's Daily Recap: ${aiTitle} (${vibeScore}% Flow Vibe) | ${this.streakDays}-Day Creation Streak 🔥 | Shipped 2 major hacks in Personal AI OS`,
      generatedAt: new Date().toISOString(),
    };

    this.currentRecap = recap;
    this.save();
    return recap;
  }
}

export const microDropsService = new MicroDropsService();
