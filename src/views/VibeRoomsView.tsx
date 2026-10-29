import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Flame,
  Video,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Circle,
  Plus,
  Send,
  Share2,
  Copy,
  ExternalLink,
  Volume2,
  VolumeX,
  Clock,
  Zap,
  HelpCircle,
  FlameKindling,
  Maximize2,
  Smile,
  ChevronRight,
  RefreshCw,
  Award,
  Radio,
  Sliders,
} from 'lucide-react';
import { vibeRoomService } from '../services/vibeRooms';
import { VibeRoom, VibeRoomSharedTask, VibeRoomMessage } from '../types';

interface VibeRoomsViewProps {
  onShowToast: (msg: string) => void;
  onOpenQuickDrop?: () => void;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number; // percentage 10% - 90%
}

export const VibeRoomsView: React.FC<VibeRoomsViewProps> = ({ onShowToast, onOpenQuickDrop }) => {
  const [rooms, setRooms] = useState<VibeRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<VibeRoom | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Sprint');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [showSynthesizer, setShowSynthesizer] = useState(false);
  const [synthesizerMode, setSynthesizerMode] = useState<'summary' | 'quiz' | 'roast'>('summary');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTabMobile, setActiveTabMobile] = useState<'video' | 'tasks' | 'chat'>('video');

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Sync from service
  const refreshRooms = () => {
    const all = vibeRoomService.getRooms();
    setRooms([...all]);
    setActiveRoom(vibeRoomService.getActiveRoom());
  };

  useEffect(() => {
    refreshRooms();

    const handleRoomUpdate = () => {
      refreshRooms();
    };

    window.addEventListener('paio:viberooms-updated', handleRoomUpdate);
    return () => window.removeEventListener('paio:viberooms-updated', handleRoomUpdate);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom?.chatMessages]);

  if (!activeRoom) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--color-text)]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400" />
          <p className="text-sm">Connecting to Shared Vibe Room...</p>
        </div>
      </div>
    );
  }

  // Handle Video Drop
  const handleDropVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) return;

    if (navigator.vibrate) navigator.vibrate(30);
    vibeRoomService.dropVideo(videoUrlInput.trim());
    setVideoUrlInput('');
    setShowVideoInput(false);
    onShowToast('🎬 Video dropped to room! Synced for all members.');
    refreshRooms();
  };

  // Toggle Video Play/Pause
  const handleTogglePlay = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    vibeRoomService.toggleVideoPlayback();
    refreshRooms();
  };

  // Trigger floating reaction burst
  const handleTriggerReaction = (emoji: string) => {
    if (navigator.vibrate) navigator.vibrate(25);
    const id = 'react-' + Date.now() + '-' + Math.random();
    const x = Math.floor(Math.random() * 70) + 15; // 15% to 85%
    setFloatingReactions((prev) => [...prev, { id, emoji, x }]);

    // Remove particle after animation
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);

    // Also post micro-interaction chat or bump reaction
    vibeRoomService.sendChatMessage(`${emoji} reacted to current moment!`);
    refreshRooms();
  };

  // Toggle shared task completion
  const handleToggleTask = (task: VibeRoomSharedTask) => {
    if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
    vibeRoomService.toggleTask(task.id);
    refreshRooms();
    if (!task.isCompleted) {
      onShowToast(`🔥 +1 Streak Flame! "${task.title}" cracked.`);
    }
  };

  // Add new sprint task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (navigator.vibrate) navigator.vibrate(25);
    vibeRoomService.addTask(newTaskTitle.trim(), newTaskCategory);
    setNewTaskTitle('');
    refreshRooms();
  };

  // Send Chat message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    vibeRoomService.sendChatMessage(chatInput.trim());
    setChatInput('');
    refreshRooms();
  };

  // React to existing chat message
  const handleReactToMessage = (msgId: string, emoji: string) => {
    if (navigator.vibrate) navigator.vibrate(20);
    vibeRoomService.reactToMessage(msgId, emoji);
    refreshRooms();
  };

  // AI Synthesizer trigger
  const handleRunSynthesizer = async (mode: 'summary' | 'quiz' | 'roast') => {
    setSynthesizerMode(mode);
    setIsSynthesizing(true);
    setSelectedQuizAnswers({});
    setShowQuizResults(false);

    try {
      await vibeRoomService.synthesizeGroupVibe(mode);
      refreshRooms();
      onShowToast(
        mode === 'summary'
          ? '✨ Group Vibe & Sprint Summary Synthesized!'
          : mode === 'quiz'
          ? '🧠 Study Quiz Generated from Room Flow!'
          : '🌶️ Playful Roast & Hype Check Ready!'
      );
    } catch {
      onShowToast('Synthesized with local room heuristics.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const copyRoomCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activeRoom.code);
      onShowToast(`Copied room code "${activeRoom.code}"!`);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto p-3 sm:p-5 space-y-4 text-[var(--color-text)]">
      {/* 1. TOP ROOM HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg">
        {/* Room Identity & Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">
            {activeRoom.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-[var(--color-text)]">{activeRoom.name}</h2>
              <button
                type="button"
                onClick={copyRoomCode}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-mono text-purple-300 transition-colors"
                title="Click to copy room code"
              >
                <span>{activeRoom.code}</span>
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1">{activeRoom.tagline}</p>
          </div>
        </div>

        {/* Member Avatar Pile & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center -space-x-2 overflow-hidden py-1">
            {activeRoom.members.map((m) => (
              <div key={m.id} className="relative group">
                <img
                  src={m.avatar}
                  alt={m.name}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-[var(--color-surface)] object-cover"
                />
                <span
                  className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-[var(--color-surface)] ${
                    m.status === 'hacking'
                      ? 'bg-emerald-400'
                      : m.status === 'deep_focus'
                      ? 'bg-purple-400'
                      : 'bg-amber-400'
                  }`}
                />
                {/* Hover Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                  <div className="px-2.5 py-1 rounded-lg bg-black/90 border border-white/10 text-[11px] text-white whitespace-nowrap shadow-xl">
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-gray-400 text-[10px]">{m.currentTask || m.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Group Flame Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold shadow-sm">
            <Flame className="w-4 h-4 fill-orange-400 animate-pulse" />
            <span>{activeRoom.sprint.streakFlameCount} Streak Flames</span>
          </div>

          {/* AI Group Vibe Synthesizer Button */}
          <button
            type="button"
            onClick={() => {
              setShowSynthesizer(true);
              if (!activeRoom.aiGroupVibe.weeklySummary) {
                handleRunSynthesizer('summary');
              }
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Group Vibe</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTabMobile('video')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 ${
            activeTabMobile === 'video' ? 'bg-purple-600 text-white font-semibold' : 'text-[var(--color-text-secondary)]'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Shared Video</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTabMobile('tasks')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 ${
            activeTabMobile === 'tasks' ? 'bg-purple-600 text-white font-semibold' : 'text-[var(--color-text-secondary)]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Sprint Tasks ({activeRoom.sharedTasks.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTabMobile('chat')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 ${
            activeTabMobile === 'chat' ? 'bg-purple-600 text-white font-semibold' : 'text-[var(--color-text-secondary)]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Live Chat</span>
        </button>
      </div>

      {/* 2. MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* LEFT / CENTER: SYNCHRONIZED VIDEO & SPRINT (Cols 8) */}
        <div
          className={`lg:col-span-8 flex flex-col space-y-4 overflow-y-auto pr-1 ${
            activeTabMobile === 'chat' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* VIDEO CANVAS CONTAINER */}
          <div
            className={`rounded-2xl bg-[#090d16] border border-purple-500/20 overflow-hidden shadow-xl relative flex flex-col ${
              activeTabMobile === 'tasks' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Video Canvas / Screen */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
              {/* Floating Reaction Bursts Container */}
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                {floatingReactions.map((react) => (
                  <div
                    key={react.id}
                    className="absolute bottom-4 text-3xl select-none animate-floatUp"
                    style={{ left: `${react.x}%` }}
                  >
                    {react.emoji}
                  </div>
                ))}
              </div>

              {/* YouTube / Media Iframe or Visualizer */}
              {activeRoom.activeVideo.url.includes('youtube.com') || activeRoom.activeVideo.url.includes('youtu.be') ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={activeRoom.activeVideo.thumbnailUrl}
                    alt={activeRoom.activeVideo.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="w-16 h-16 rounded-full bg-purple-600/90 hover:bg-purple-500 text-white flex items-center justify-center shadow-2xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all"
                    >
                      {activeRoom.activeVideo.isPlaying ? (
                        <Pause className="w-7 h-7 fill-current" />
                      ) : (
                        <Play className="w-7 h-7 fill-current ml-1" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                  <Video className="w-12 h-12 text-purple-400 animate-pulse" />
                  <p className="text-sm font-semibold">{activeRoom.activeVideo.title}</p>
                </div>
              )}

              {/* Video Title Bar Overlay */}
              <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500 text-white animate-pulse">
                    LIVE SYNC
                  </span>
                  <span className="text-xs font-semibold text-white drop-shadow truncate max-w-sm sm:max-w-md">
                    {activeRoom.activeVideo.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVideoInput(!showVideoInput)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 transition-colors"
                  >
                    + Drop Video
                  </button>
                </div>
              </div>

              {/* Live Playback Bar Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 to-transparent flex flex-col gap-1.5 z-20">
                {/* Progress bar with timestamp pins */}
                <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{
                      width: `${(activeRoom.activeVideo.currentSeconds / activeRoom.activeVideo.durationSeconds) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-white/80">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="hover:text-white transition-colors"
                      aria-label="Play or pause"
                    >
                      {activeRoom.activeVideo.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <span className="font-mono text-[11px]">
                      {formatTime(activeRoom.activeVideo.currentSeconds)} / {formatTime(activeRoom.activeVideo.durationSeconds)}
                    </span>
                  </div>

                  {/* Floating Reaction Bar (Directly on Video) */}
                  <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full border border-white/10 backdrop-blur-md">
                    <span className="text-[10px] text-gray-400 font-medium pl-1">React:</span>
                    {['🔥', '🚀', '💡', '🤯', '❤️', '⚡'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleTriggerReaction(emoji)}
                        className="hover:scale-125 active:scale-95 transition-transform text-sm"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="hover:text-white transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drop Video Input Expandable */}
            {showVideoInput && (
              <form onSubmit={handleDropVideo} className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex gap-2">
                <input
                  type="text"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="Paste YouTube or video link (e.g. https://www.youtube.com/watch?v=...)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
                >
                  Drop & Sync
                </button>
              </form>
            )}

            {/* AI Summarized Key Takeaways (Real-Time on Screen) */}
            <div className="p-4 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                    AI-Summarized Key Takeaways
                  </span>
                </div>
                <span className="text-[10px] text-[var(--color-text-secondary)]">No switching apps</span>
              </div>

              <div className="space-y-1.5">
                {activeRoom.activeVideo.aiTakeaways.map((takeaway, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-xs text-[var(--color-text)]"
                  >
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="leading-relaxed">{takeaway}</p>
                  </div>
                ))}
              </div>

              {/* Timestamp Anchors */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Anchors:
                </span>
                {activeRoom.activeVideo.timestamps.map((ts, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      vibeRoomService.seekVideo(ts.time);
                      refreshRooms();
                      onShowToast(`Jumped to ${formatTime(ts.time)}: ${ts.note}`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--color-surface-elevated)] hover:bg-purple-500/20 hover:border-purple-500/40 border border-[var(--color-border)] whitespace-nowrap transition-colors flex items-center gap-1"
                  >
                    <span className="font-mono text-purple-400">{formatTime(ts.time)}</span>
                    <span className="text-[11px] text-[var(--color-text-secondary)]">({ts.note})</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const note = prompt('Enter key takeaway for this timestamp:') || 'Key takeaway moment';
                    vibeRoomService.addVideoTimestamp(activeRoom.activeVideo.currentSeconds, note);
                    refreshRooms();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] border border-dashed border-white/20 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] whitespace-nowrap"
                >
                  + Stamp Current ({formatTime(activeRoom.activeVideo.currentSeconds)})
                </button>
              </div>
            </div>
          </div>

          {/* CO-WORKING & TASK STREAKS (FOCUS SPRINT TASK BOARD) */}
          <div
            className={`rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 shadow-lg space-y-4 ${
              activeTabMobile === 'video' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Sprint Board Header & Timer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                  <FlameKindling className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Co-Working Focus & Hacking Sprint</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Checking tasks triggers live streak flames & group celebration badges
                  </p>
                </div>
              </div>

              {/* Sprint Timer Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="font-mono text-xs font-bold">
                  {formatTime(activeRoom.sprint.secondsRemaining)} remaining
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                  Active Sprint
                </span>
              </div>
            </div>

            {/* Task Add Input */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Drop a live sprint task or hack to complete with friends..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] focus:outline-none focus:border-purple-500"
              />
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] focus:outline-none focus:border-purple-500"
              >
                <option value="Sprint">Sprint</option>
                <option value="BugFix">Bug Fix</option>
                <option value="Design">Design</option>
                <option value="Study">Study</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-md shadow-orange-500/20"
              >
                + Add Task
              </button>
            </form>

            {/* Shared Task List */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {activeRoom.sharedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    task.isCompleted
                      ? 'bg-emerald-950/15 border-emerald-500/30 text-emerald-200'
                      : 'bg-[var(--color-surface-elevated)] border-[var(--color-border)] text-[var(--color-text)] hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        task.isCompleted
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40'
                          : 'border-2 border-[var(--color-border)] hover:border-purple-500 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 fill-current" />
                    </button>
                    <div>
                      <p
                        className={`text-xs font-semibold leading-snug ${
                          task.isCompleted ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <img
                          src={task.authorAvatar}
                          alt={task.authorName}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="text-[10px] text-[var(--color-text-secondary)]">{task.authorName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[var(--color-text-secondary)]">
                          {task.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.isCompleted ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-emerald-400" />
                        Cracked!
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-medium transition-colors"
                      >
                        Mark Done 🔥
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: REAL-TIME CHAT & ACTIVITY STREAM (Cols 4) */}
        <div
          className={`lg:col-span-4 flex flex-col rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl overflow-hidden ${
            activeTabMobile === 'video' || activeTabMobile === 'tasks' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Chat Header */}
          <div className="p-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-[var(--color-text)]">Live Room Stream</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeRoom.members.length} peers connected
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto min-h-0 text-xs">
            {activeRoom.chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  msg.type === 'task_celebration'
                    ? 'bg-gradient-to-r from-orange-950/30 to-amber-950/20 border-orange-500/40 text-orange-200'
                    : msg.type === 'ai_synthesis'
                    ? 'bg-gradient-to-r from-purple-950/30 to-indigo-950/20 border-purple-500/40 text-purple-200'
                    : msg.type === 'video_drop'
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    : 'bg-[var(--color-surface-elevated)] border-[var(--color-border)] text-[var(--color-text)]'
                }`}
              >
                {/* Sender info */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="font-semibold text-[11px]">{msg.senderName}</span>
                    {msg.type === 'task_celebration' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/30 text-orange-300 font-bold uppercase">
                        STREAK BOOST 🔥
                      </span>
                    )}
                    {msg.type === 'ai_synthesis' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 font-bold uppercase">
                        AI SYNTH ✨
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--color-text-secondary)]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Content */}
                <p className="leading-relaxed pl-6">{msg.text}</p>

                {/* Emoji reactions */}
                <div className="flex items-center gap-1.5 mt-2 pl-6">
                  {Object.entries(msg.reactions || {}).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReactToMessage(msg.id, emoji)}
                      className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] flex items-center gap-1 transition-colors"
                    >
                      <span>{emoji}</span>
                      <span className="font-bold">{count}</span>
                    </button>
                  ))}
                  {/* Quick react buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {['🔥', '👏', '🚀'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => handleReactToMessage(msg.id, em)}
                        className="text-xs hover:scale-125 transition-transform"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message room or drop quick reaction..."
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. AI "GROUP VIBE" SYNTHESIZER MODAL / DRAWER */}
      {showSynthesizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className="w-full max-w-2xl bg-[var(--color-surface)] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[var(--color-text)] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-gradient-to-r from-purple-950/40 to-pink-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text)]">AI "Group Vibe" Synthesizer</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Analyzes collective notes, tasks & chats into summaries, quizzes & roasts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSynthesizer(false)}
                className="text-[var(--color-text-secondary)] hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Synthesizer Mode Switcher */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] text-xs font-medium">
              <button
                type="button"
                onClick={() => handleRunSynthesizer('summary')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  synthesizerMode === 'summary'
                    ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30'
                    : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Sprint Summary</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunSynthesizer('quiz')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  synthesizerMode === 'quiz'
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                    : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Interactive Study Quiz</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunSynthesizer('roast')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  synthesizerMode === 'roast'
                    ? 'bg-pink-600 text-white font-semibold shadow-md shadow-pink-600/30'
                    : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>Playful Roast & Hype</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {isSynthesizing ? (
                <div className="py-12 text-center space-y-3">
                  <Sparkles className="w-8 h-8 animate-spin mx-auto text-purple-400" />
                  <p className="text-sm font-semibold">Synthesizing group collective data...</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Analyzing active video takeaways, sprint tasks, and peer chat signals
                  </p>
                </div>
              ) : (
                <>
                  {/* MODE 1: SPRINT SUMMARY */}
                  {synthesizerMode === 'summary' && (
                    <div className="space-y-4">
                      {/* Vibe Score Header Card */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300">
                            GROUP FLOW STATE
                          </span>
                          <h4 className="text-xl font-black text-white">{activeRoom.aiGroupVibe.vibeLabel}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-black text-purple-300">
                            {activeRoom.aiGroupVibe.vibeScore}
                          </span>
                          <span className="text-xs text-gray-400">/100</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-xs text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
                        {activeRoom.aiGroupVibe.weeklySummary ||
                          'The group is maintaining peak momentum! High density of completed tasks and active peer collaboration.'}
                      </div>
                    </div>
                  )}

                  {/* MODE 2: INTERACTIVE STUDY QUIZ */}
                  {synthesizerMode === 'quiz' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-indigo-400" />
                          Study Pod Quiz (Generated from Active Media & Tasks)
                        </h4>
                        {showQuizResults && (
                          <span className="text-xs font-bold text-indigo-300">
                            Score: {Object.entries(selectedQuizAnswers).filter(([idx, ans]) => (activeRoom.aiGroupVibe.studyQuiz || [])[Number(idx)]?.answerIndex === ans).length} / {(activeRoom.aiGroupVibe.studyQuiz || []).length} Correct!
                          </span>
                        )}
                      </div>

                      {(activeRoom.aiGroupVibe.studyQuiz || []).map((q, qIndex) => (
                        <div
                          key={qIndex}
                          className="p-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] space-y-3"
                        >
                          <p className="text-xs font-semibold text-white">
                            {qIndex + 1}. {q.question}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, optIndex) => {
                              const isSelected = selectedQuizAnswers[qIndex] === optIndex;
                              const isCorrect = q.answerIndex === optIndex;
                              let btnClass = 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300';

                              if (showQuizResults) {
                                if (isCorrect) {
                                  btnClass = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-bold';
                                } else if (isSelected && !isCorrect) {
                                  btnClass = 'bg-rose-950/40 border-rose-500/60 text-rose-300';
                                }
                              } else if (isSelected) {
                                btnClass = 'bg-indigo-600 border-indigo-500 text-white font-semibold shadow-sm';
                              }

                              return (
                                <button
                                  key={optIndex}
                                  type="button"
                                  onClick={() => {
                                    if (showQuizResults) return;
                                    setSelectedQuizAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
                                  }}
                                  className={`text-left text-xs p-2.5 rounded-lg border transition-all ${btnClass}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {showQuizResults && (
                            <p className="text-[11px] text-gray-400 italic pt-1 border-t border-white/5">
                              💡 {q.explanation}
                            </p>
                          )}
                        </div>
                      ))}

                      <div className="flex justify-end gap-2 pt-2">
                        {!showQuizResults ? (
                          <button
                            type="button"
                            onClick={() => setShowQuizResults(true)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                          >
                            Check Answers
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRunSynthesizer('quiz')}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white"
                          >
                            Generate New Quiz 🔄
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MODE 3: PLAYFUL ROAST & HYPE */}
                  {synthesizerMode === 'roast' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-gradient-to-r from-pink-950/40 to-rose-950/40 border border-pink-500/30">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-pink-300">
                          GEN-Z TECH MENTOR ROAST
                        </span>
                        <p className="text-xs text-[var(--color-text)] whitespace-pre-wrap leading-relaxed mt-2 italic">
                          "{activeRoom.aiGroupVibe.playfulRoast ||
                            'You all have 4 open browser tabs on audio context lifecycles and yet the playlist keeps playing in 4D. Keep hacking, legends!'}"
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
              <span className="text-xs text-[var(--color-text-secondary)]">
                Vibe synced across {activeRoom.members.length} peers
              </span>
              <button
                type="button"
                onClick={() => setShowSynthesizer(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
