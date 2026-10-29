import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Search,
  Code2,
  Sparkles,
  Layers,
  ExternalLink,
  Copy,
  Check,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Eye,
  SlidersHorizontal,
  Bookmark,
  Share2,
} from 'lucide-react';
import { askAI } from '../../services/ai';

interface InteractiveSmartVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

interface VideoChapter {
  id: string;
  timeSeconds: number;
  title: string;
  codeSnippet?: string;
  smartFact: string;
}

const SAMPLE_CHAPTERS: VideoChapter[] = [
  {
    id: 'ch-1',
    timeSeconds: 0,
    title: 'Zero-Trust Architecture & Auth Handshake',
    codeSnippet: 'const auth = await verifyOAuthPKCE(code, verifier);',
    smartFact: 'OAuth 2.0 PKCE mitigates authorization code interception attacks on mobile apps.',
  },
  {
    id: 'ch-2',
    timeSeconds: 15,
    title: 'Unified Context Fabric Reactive Event Bus',
    codeSnippet: 'window.dispatchEvent(new CustomEvent("paio:context-fabric"));',
    smartFact: 'In-memory event buses achieve sub-4ms delta synchronization across browser tabs.',
  },
  {
    id: 'ch-3',
    timeSeconds: 30,
    title: 'Interruptible Voice Stream & Barge-in',
    codeSnippet: 'if (isSpeaking) { window.speechSynthesis.cancel(); }',
    smartFact: 'Barge-in allows users to interrupt AI generation in under 60ms without thread locks.',
  },
  {
    id: 'ch-4',
    timeSeconds: 45,
    title: 'WASM Code Execution & Virtual Sandbox',
    codeSnippet: 'const runner = new WebAssembly.Instance(module, importObject);',
    smartFact: 'WebAssembly execution isolates untrusted user scripts from main-thread memory.',
  },
];

export const InteractiveSmartVideoModal: React.FC<InteractiveSmartVideoModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSmartOverlay, setShowSmartOverlay] = useState(true);
  const [pacingMode, setPacingMode] = useState<'summary' | 'deep_dive' | 'code_walkthrough'>('deep_dive');
  const [copiedCode, setCopiedCode] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Active chapter based on current time
  const currentChapter =
    [...SAMPLE_CHAPTERS].reverse().find((c) => currentTime >= c.timeSeconds) || SAMPLE_CHAPTERS[0];

  // Search through video transcript and code
  const filteredChapters = SAMPLE_CHAPTERS.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.smartFact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.codeSnippet?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentTime((t) => {
          if (t >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return t + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const handleJumpToTime = (seconds: number) => {
    setCurrentTime(seconds);
    setIsPlaying(true);
    onShowToast?.(`Jumped to chapter at ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
  };

  const handleCopyCode = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    onShowToast?.('Code snippet copied from video frame!');
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const prompt = `Generate a concise, interactive executive recap of this developer session:
Topic: Next-Gen AI OS: Unified Context Fabric, Multi-Agent War Rooms & Barge-In Audio
Pacing Mode: ${pacingMode.toUpperCase()}

Provide 3 bullet points highlighting the architectural breakthroughs:`;

      const summary = await askAI({ prompt });
      setAiSummary(summary);
    } catch {
      setAiSummary('• Seamless cross-app context stream\n• Autonomous 4-agent strategic debate\n• Interruptible sub-10ms ambient voice streaming.');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9996] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-4xl h-[90vh] rounded-3xl bg-zinc-950 border border-indigo-500/30 flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-indigo-950/70 via-zinc-900 to-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight text-white">Smart Interactive Video</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Indexed Timeline
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Click code, search spoken words, and toggle Smart View overlay</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSmartOverlay(!showSmartOverlay)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showSmartOverlay
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Smart View {showSmartOverlay ? 'ON' : 'OFF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas & Smart View HUD */}
        <div className="relative aspect-video max-h-[46vh] bg-black flex items-center justify-center overflow-hidden border-b border-white/10">
          {/* Simulated Video Canvas Frame */}
          <div className="w-full h-full bg-gradient-to-tr from-zinc-950 via-zinc-900 to-slate-900 p-6 flex flex-col justify-between relative">
            {/* Top Video HUD Info */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30">
                1080p 60FPS · Zero-Trust Screencast
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {Math.floor(currentTime / 60)}:{String(currentTime % 60).padStart(2, '0')} / 1:00
              </span>
            </div>

            {/* Smart View Contextual Overlay Layer */}
            {showSmartOverlay && (
              <div className="p-4 rounded-2xl bg-black/75 border border-indigo-500/40 backdrop-blur-md max-w-lg mx-auto w-full space-y-2 animate-fade-in shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Smart View: Active Concept</span>
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400">Chapter {SAMPLE_CHAPTERS.indexOf(currentChapter) + 1} of 4</span>
                </div>

                <h4 className="font-bold text-xs sm:text-sm text-white">{currentChapter.title}</h4>
                <p className="text-[11px] text-zinc-300 leading-snug">{currentChapter.smartFact}</p>

                {currentChapter.codeSnippet && (
                  <div className="p-2 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-between font-mono text-xs text-cyan-300">
                    <code className="truncate mr-2">{currentChapter.codeSnippet}</code>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(currentChapter.codeSnippet!)}
                      className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-zinc-200 shrink-0 font-sans cursor-pointer flex items-center gap-1"
                    >
                      {copiedCode ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Center Play Button Overlay if Paused */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/50 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Play className="w-7 h-7 fill-current ml-1" />
                </button>
              </div>
            )}

            {/* Bottom Timeline scrubber */}
            <div className="space-y-1 z-10">
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => setCurrentTime(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 rounded-lg bg-white/20"
              />
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-white hover:text-indigo-400 font-bold"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <span>{currentChapter.title}</span>
                </div>
                <span>Drag timeline to jump</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section: Searchable Chapters & AI Pacing Control */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Search Timeline */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search spoken keywords or code (e.g. PKCE, WASM, Barge-in)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-indigo-400"
              />
            </div>

            {/* Pacing Modes */}
            <div className="flex items-center gap-1 bg-zinc-900 rounded-xl p-0.5 border border-white/10 text-[11px]">
              {(['summary', 'deep_dive', 'code_walkthrough'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPacingMode(mode)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                    pacingMode === mode ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={isSummarizing}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${isSummarizing ? 'animate-spin' : ''}`} />
              <span>{isSummarizing ? 'Synthesizing…' : 'AI Video Summary'}</span>
            </button>
          </div>

          {/* AI Summary Display if generated */}
          {aiSummary && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 whitespace-pre-line leading-relaxed font-sans animate-fade-in">
              {aiSummary}
            </div>
          )}

          {/* Indexed Chapters & Code List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredChapters.map((chapter) => {
              const isActive = currentChapter.id === chapter.id;
              return (
                <div
                  key={chapter.id}
                  onClick={() => handleJumpToTime(chapter.timeSeconds)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                    isActive
                      ? 'bg-indigo-950/50 border-indigo-500/60 shadow-md text-white'
                      : 'bg-zinc-900/70 border-white/5 hover:border-white/20 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-indigo-400 font-bold">
                      {Math.floor(chapter.timeSeconds / 60)}:{String(chapter.timeSeconds % 60).padStart(2, '0')}
                    </span>
                    <span className="text-zinc-500 uppercase tracking-wider text-[9px]">Click to Jump</span>
                  </div>

                  <h5 className="font-bold text-xs leading-tight">{chapter.title}</h5>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-snug">{chapter.smartFact}</p>

                  {chapter.codeSnippet && (
                    <div className="pt-1 flex items-center justify-between font-mono text-[10px] text-cyan-300">
                      <span className="truncate">{chapter.codeSnippet}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(chapter.codeSnippet!);
                        }}
                        className="text-zinc-400 hover:text-white shrink-0 ml-1"
                        title="Copy code"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
