import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Mic,
  Code2,
  Video,
  Sparkles,
  Flame,
  CheckCircle2,
  Tag,
  Radio,
  Clock,
  Send,
  Square,
  Play,
  RotateCcw,
} from 'lucide-react';
import { microDropsService } from '../../services/microDrops';
import { MicroDropArtifact } from '../../types';

interface QuickMicroDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  defaultTab?: 'voice' | 'hack' | 'video' | 'ai';
}

export const QuickMicroDropModal: React.FC<QuickMicroDropModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  defaultTab = 'voice',
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'hack' | 'video' | 'ai'>('voice');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [vibeEmoji, setVibeEmoji] = useState('⚡');
  
  // Voice simulation state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioRecorded, setAudioRecorded] = useState(false);

  // Hack state
  const [codeLanguage, setCodeLanguage] = useState('typescript');

  // Video state
  const [videoTitle, setVideoTitle] = useState('');
  const [videoTimestamp, setVideoTimestamp] = useState('02:45');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      resetForm();
    }
  }, [isOpen, defaultTab]);

  // Voice recording timer
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 15) {
            setIsRecording(false);
            setAudioRecorded(true);
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTagInput('');
    setTags([]);
    setVibeEmoji('⚡');
    setIsRecording(false);
    setRecordingSeconds(0);
    setAudioRecorded(false);
    setVideoTitle('');
    setVideoTimestamp('02:45');
  };

  const handleStartRecording = () => {
    if (navigator.vibrate) navigator.vibrate(40);
    setRecordingSeconds(0);
    setAudioRecorded(false);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    setIsRecording(false);
    setAudioRecorded(true);
    if (!content) {
      setContent('Voice Note: Explored fast zero-overhead event emitters and feeling super energized for the evening hackathon.');
    }
    if (!title) {
      setTitle('10s Voice Thought & Evening Energy');
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleKeyDownTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let dropType: MicroDropArtifact['type'] = 'diary_text';
    let finalTitle = title.trim();
    let finalContent = content.trim();

    if (activeTab === 'voice') {
      dropType = audioRecorded ? 'diary_voice' : 'diary_text';
      if (!finalTitle) finalTitle = audioRecorded ? '🎙️ 10s Voice Note' : 'Quick Journal Spark';
      if (!finalContent) finalContent = 'Feeling dialed in and in flow state.';
    } else if (activeTab === 'hack') {
      dropType = 'task_hack';
      if (!finalTitle) finalTitle = 'Cracked Hack / Terminal Win';
      if (!finalContent) finalContent = '// Code solved in flow state\nconsole.log("Bug squashed in 4 lines");';
    } else if (activeTab === 'video') {
      dropType = 'video_timestamp';
      if (!finalTitle) finalTitle = videoTitle.trim() || 'Media Reaction & Timestamp';
      if (!finalContent) finalContent = 'Golden takeaway captured directly from video flow.';
    } else if (activeTab === 'ai') {
      dropType = 'ai_prompt';
      if (!finalTitle) finalTitle = 'AI Prompt & Insight Gem';
      if (!finalContent) finalContent = 'High-density generative prompt and synthesized architectural result.';
    }

    if (navigator.vibrate) navigator.vibrate([40, 60]);

    microDropsService.addMicroDrop(dropType, finalTitle, finalContent, {
      audioSeconds: activeTab === 'voice' && audioRecorded ? recordingSeconds : undefined,
      codeLanguage: activeTab === 'hack' ? codeLanguage : undefined,
      videoTitle: activeTab === 'video' ? videoTitle : undefined,
      videoTimestamp: activeTab === 'video' ? videoTimestamp : undefined,
      vibeEmoji,
      tags: tags.length > 0 ? tags : ['FlowState'],
    });

    onShowToast(`⚡ Micro-Drop captured! Added to today's story recap.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[var(--color-text)] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/10">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--color-text)]">Zero-Friction Micro-Drop</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  2-SEC DROP
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Bite-sized artifacts that auto-stitch into your Daily Story Recap
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-[var(--color-surface)] border-b border-[var(--color-border)] text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
              activeTab === 'voice'
                ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice / Diary</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hack')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
              activeTab === 'hack'
                ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/30'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Code Hack</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
              activeTab === 'video'
                ? 'bg-rose-600 text-white font-semibold shadow-md shadow-rose-600/30'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Video Reaction</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
              activeTab === 'ai'
                ? 'bg-cyan-600 text-white font-semibold shadow-md shadow-cyan-600/30'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Prompt</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Vibe Emoji Selector */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">Vibe Aura Check:</span>
            <div className="flex items-center gap-2">
              {['⚡', '🔥', '🚀', '🧠', '☕', '✨', '💎'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setVibeEmoji(emoji)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-transform ${
                    vibeEmoji === emoji
                      ? 'bg-purple-500/20 border-2 border-purple-500 scale-110 shadow-sm'
                      : 'hover:bg-white/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: VOICE / DIARY */}
          {activeTab === 'voice' && (
            <div className="space-y-3">
              {/* Voice recording widget */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col items-center justify-center text-center gap-3">
                <div className="relative">
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-ping" />
                  )}
                  <button
                    type="button"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      isRecording
                        ? 'bg-rose-600 hover:bg-rose-700 text-white scale-105'
                        : audioRecorded
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {isRecording ? (
                      <Square className="w-6 h-6 fill-current" />
                    ) : audioRecorded ? (
                      <RotateCcw className="w-6 h-6" />
                    ) : (
                      <Mic className="w-7 h-7" />
                    )}
                  </button>
                </div>

                <div>
                  <div className="text-sm font-semibold">
                    {isRecording
                      ? `Recording Voice Thought (${recordingSeconds}s / 15s)`
                      : audioRecorded
                      ? `Audio Snippet Captured (${recordingSeconds || 8}s)`
                      : 'Tap Mic to Drop 10s Voice Thought'}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {isRecording
                      ? 'Speak freely... automatically parsed into today’s vibe aura!'
                      : audioRecorded
                      ? 'Audio transcribed and ready for your Daily Story.'
                      : 'Zero typing required — drop thoughts while walking or in bed.'}
                  </p>
                </div>

                {/* Animated waveform visualizer */}
                {isRecording && (
                  <div className="flex items-center gap-1 h-6">
                    {[40, 80, 55, 95, 30, 70, 90, 60, 45, 85, 100, 50, 75].map((height, i) => (
                      <span
                        key={i}
                        className="w-1 bg-purple-400 rounded-full animate-pulse"
                        style={{
                          height: `${height}%`,
                          animationDelay: `${i * 70}ms`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Thought Title / Mood
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midnight Clarity / Overcoming mental inertia"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Transcript or Quick Note
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What is the raw, honest thought in your head right now?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CODE HACK */}
          {activeTab === 'hack' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Hack Title / Bug Cracked
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Fixed Chromium Audio Throttling in WebKit"
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Language
                  </label>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="bash">Terminal / Bash</option>
                    <option value="rust">Rust</option>
                    <option value="sql">SQL / Postgres</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Snippet or Terminal Log
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste the breakthrough code snippet or terminal curl / error fix here..."
                  className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-[#0b0f19] border border-[var(--color-border)] text-emerald-400 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: VIDEO REACTION */}
          {activeTab === 'video' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Video Title or URL
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="e.g. Andrej Karpathy: Building Micrograd"
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Timestamp
                  </label>
                  <input
                    type="text"
                    value={videoTimestamp}
                    onChange={(e) => setVideoTimestamp(e.target.value)}
                    placeholder="04:25"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm font-mono text-center focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  The Key Takeaway / Reaction
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What clicked at this timestamp? Summarize in 1-2 punchy sentences..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: AI PROMPT */}
          {activeTab === 'ai' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Prompt Topic / Goal
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. High-Velocity State Machine for Micro-Interactions"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Prompt & Key Output Gem
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Prompt: 'Design zero-alloc event bus...' -> Model generated flawless 12-line solution."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              Hashtags & Categorization
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[var(--color-text)] flex items-center gap-1"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="hover:text-rose-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                placeholder="Type tag and press enter (e.g. DeepWork, BugSquash)"
                className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium border border-white/10"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Quick preset suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['#BugSquashed', '#StudyStreak', '#NeuroFlow', '#YouTubeBreakthrough', '#MidnightCode'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleAddTag(preset)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border border-white/5 hover:border-white/20 transition-all"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Drop Artifact ⚡</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
