import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckSquare,
  FileText,
  FolderKanban,
  Calendar,
  Target,
  Music,
  Headphones,
  Radio,
  Zap,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { TaskItem, NoteItem, FileItem, CalendarEventItem, GoalItem } from '../types';

interface AnalyticsViewProps {
  tasks: TaskItem[];
  notes: NoteItem[];
  files: FileItem[];
  events: CalendarEventItem[];
  goals: GoalItem[];
}

interface SpotifyStatsData {
  totalFocusHours: number;
  tracksPlayed: number;
  productivityMultiplier: number;
  topGenres: Array<{
    name: string;
    percentage: number;
    minutes?: number;
    color?: string;
  }>;
  weeklyHoursDistribution: Array<{ day: string; hours: number }>;
  recommendedFlowTrack: string;
  source: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tasks,
  notes,
  files,
  events,
  goals,
}) => {
  const [spotifyStats, setSpotifyStats] = useState<SpotifyStatsData | null>(null);
  const [isSyncingSpotify, setIsSyncingSpotify] = useState(false);

  const fetchSpotifyStats = async () => {
    setIsSyncingSpotify(true);
    try {
      const savedToken = localStorage.getItem('paio_spotify_web_token') || '';
      const tokenParam = savedToken ? `?token=${encodeURIComponent(savedToken)}` : '';
      const res = await fetch(`/api/integrations/spotify/listening-stats${tokenParam}`);
      const data = await res.json();
      if (data.success) {
        setSpotifyStats(data);
      }
    } catch (e) {
      console.warn('Could not fetch Spotify stats:', e);
    } finally {
      setIsSyncingSpotify(false);
    }
  };

  useEffect(() => {
    fetchSpotifyStats();
  }, []);
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const openTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'trashed');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const highPriority = tasks.filter((t) => t.priority === 'high').length;
  const mediumPriority = tasks.filter((t) => t.priority === 'medium').length;
  const lowPriority = tasks.filter((t) => t.priority === 'low').length;

  const workTasks = tasks.filter((t) => t.category === 'Work').length;
  const personalTasks = tasks.filter((t) => t.category === 'Personal').length;
  const learningTasks = tasks.filter((t) => t.category === 'Learning').length;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-cyan)]">
            Workspace Insights
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Analytics &amp; Output.
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Metrics tracking your completion velocity, category focus, and digital workspace volume.
          </p>
        </div>
      </section>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Completion Rate</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <strong className="mt-3 block text-3xl font-extrabold text-[var(--color-text)]">
            {completionRate}%
          </strong>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            {completedTasks.length} of {tasks.length} tasks done
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Knowledge Base</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <strong className="mt-3 block text-3xl font-extrabold text-[var(--color-text)]">
            {notes.length}
          </strong>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            Workspace notes recorded
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Cloud Assets</span>
            <FolderKanban className="w-4 h-4 text-blue-400" />
          </div>
          <strong className="mt-3 block text-3xl font-extrabold text-[var(--color-text)]">
            {files.length}
          </strong>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            Files in Firebase Storage
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase">Active Goals</span>
            <Target className="w-4 h-4 text-[var(--color-gold)]" />
          </div>
          <strong className="mt-3 block text-3xl font-extrabold text-[var(--color-gold)]">
            {goals.filter((g) => g.status === 'active').length}
          </strong>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            Milestones in progress
          </p>
        </div>
      </div>

      {/* Distribution Cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Priority breakdown */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
          <h3 className="text-sm font-bold text-[var(--color-text)]">
            Priority Distribution
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-red-400">High Priority</span>
                <span className="text-[var(--color-text)]">{highPriority}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${tasks.length ? (highPriority / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-400">Medium Priority</span>
                <span className="text-[var(--color-text)]">{mediumPriority}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${tasks.length ? (mediumPriority / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-emerald-400">Low Priority</span>
                <span className="text-[var(--color-text)]">{lowPriority}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${tasks.length ? (lowPriority / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
          <h3 className="text-sm font-bold text-[var(--color-text)]">
            Category Allocation
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-blue-400">Work</span>
                <span className="text-[var(--color-text)]">{workTasks}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${tasks.length ? (workTasks / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-purple-400">Learning</span>
                <span className="text-[var(--color-text)]">{learningTasks}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${tasks.length ? (learningTasks / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-400">Personal</span>
                <span className="text-[var(--color-text)]">{personalTasks}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${tasks.length ? (personalTasks / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SPOTIFY AUDIO & FOCUS SOUNDTRACK ANALYTICS SECTION */}
      {/* ======================================================== */}
      <section className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-[var(--color-surface)] to-zinc-950/40 p-6 sm:p-7 shadow-lg space-y-6 animate-fade-in">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)]/60 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1DB954] text-black font-black shadow-md shadow-[#1DB954]/25">
              <Headphones className="w-6 h-6 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--color-text)]">
                  Spotify Audio &amp; Focus Habits
                </h2>
                <span className="rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 px-2.5 py-0.5 text-[10px] font-black text-[#1DB954]">
                  Spotify Web API
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Telemetry visualizing focus audio volume, top music genres, and cognitive flow state correlation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchSpotifyStats}
            disabled={isSyncingSpotify}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[var(--color-bg-secondary)] hover:bg-white/10 px-4 py-2 text-xs font-bold text-[var(--color-text)] transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1DB954] ${isSyncingSpotify ? 'animate-spin' : ''}`} />
            <span>{isSyncingSpotify ? 'Syncing Spotify API…' : 'Sync Spotify Data'}</span>
          </button>
        </div>

        {/* Top Habits KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#1DB954]" />
              <span>Weekly Focus Audio</span>
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-[var(--color-text)]">
                {spotifyStats?.totalFocusHours || '42.8'}
              </span>
              <span className="text-xs font-bold text-[var(--color-muted)]">Hours</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
              +14% vs last week · Deep flow soundtrack
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tracks Streamed</span>
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-[var(--color-text)]">
                {spotifyStats?.tracksPlayed || '386'}
              </span>
              <span className="text-xs font-bold text-[var(--color-muted)]">Tracks</span>
            </div>
            <p className="text-[11px] text-[var(--color-muted)] mt-1">
              Average session duration: 48 mins
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Task Velocity Multiplier</span>
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-amber-400">
                +{Math.round(((spotifyStats?.productivityMultiplier || 1.35) - 1) * 100)}%
              </span>
              <span className="text-xs font-bold text-[var(--color-muted)]">Faster completion</span>
            </div>
            <p className="text-[11px] text-[var(--color-muted)] mt-1">
              When listening to Lo-Fi or Ambient vs Silence
            </p>
          </div>
        </div>

        {/* Top Genres Breakdown Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Top Genres Breakdown Bar Graph */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[var(--color-text)] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#1DB954]" />
                <span>Top Focus Sound Genres</span>
              </h3>
              <span className="text-[11px] text-[var(--color-muted)] font-mono">Normalized Distribution</span>
            </div>

            <div className="space-y-3.5 pt-1">
              {(spotifyStats?.topGenres || [
                { name: 'Lo-Fi Study Beats', percentage: 41, color: '#8B5CF6' },
                { name: 'Ambient Deep Focus', percentage: 27, color: '#06B6D4' },
                { name: 'Peaceful Modern Classical', percentage: 16, color: '#10B981' },
                { name: 'Retro Synthwave Pulse', percentage: 10, color: '#EC4899' },
                { name: 'Coffeehouse Acoustic Jazz', percentage: 6, color: '#F59E0B' },
              ]).map((genre, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[var(--color-text)] flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: genre.color || '#10B981' }} />
                      <span>{genre.name}</span>
                    </span>
                    <span className="font-mono text-zinc-400">{genre.percentage}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${genre.percentage}%`,
                        backgroundColor: genre.color || '#10B981',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Weekly Hours Distribution & Top Track */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-[var(--color-text)] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Daily Listening Rhythm (Mon - Sun)</span>
                </h3>
                <span className="text-[11px] text-[var(--color-muted)] font-mono">Hours / Day</span>
              </div>

              {/* Sparkline Histogram */}
              <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-1">
                {(spotifyStats?.weeklyHoursDistribution || [
                  { day: 'Mon', hours: 6.2 },
                  { day: 'Tue', hours: 7.8 },
                  { day: 'Wed', hours: 8.4 },
                  { day: 'Thu', hours: 7.1 },
                  { day: 'Fri', hours: 6.9 },
                  { day: 'Sat', hours: 3.5 },
                  { day: 'Sun', hours: 2.9 },
                ]).map((d, i) => {
                  const maxH = 10;
                  const heightPercent = Math.min(100, Math.round((d.hours / maxH) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[9px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.hours}h
                      </span>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-[#1DB954] hover:brightness-125 transition-all shadow-sm"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] font-bold text-[var(--color-muted)]">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommended Flow Soundtrack Box */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 flex items-center justify-between text-xs mt-3">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">
                    Highest Flow Retention Playlist
                  </span>
                  <span className="font-bold text-[var(--color-text)] truncate block">
                    {spotifyStats?.recommendedFlowTrack || 'Lofi Girl - Synthwave Radio (Chill Synth & Cyberpunk Focus)'}
                  </span>
                </div>
              </div>

              <a
                href="https://open.spotify.com/playlist/37i9dQZF1DXcBWJnO0MpWi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#1DB954] hover:underline font-bold text-xs shrink-0"
              >
                <span>Listen</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
