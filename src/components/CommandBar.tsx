import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  CheckSquare,
  FileText,
  FolderKanban,
  Calendar,
  ArrowRight,
  X,
  Brain,
  Activity,
  Compass,
  Mic,
  MicOff,
  Layers,
  Music,
  Video,
  Mail,
  Bot,
  Flame,
  DollarSign,
  Waves,
  Dices,
  ShieldAlert,
  Zap,
  Code2,
} from 'lucide-react';
import { ViewTab } from '../types';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: ViewTab) => void;
  onQuickTask?: (title: string) => void;
  onQuickAI?: (prompt: string) => void;
  onOpenTour?: () => void;
  onOpenAppHub?: () => void;
  onOpenSpotify?: () => void;
  onOpenGoogleWorkspace?: () => void;
  onOpenVideoCall?: () => void;
  onToggleVoiceListener?: () => void;
  onOpenRoastHype?: () => void;
  onOpenDecisionWheel?: () => void;
  onOpenSoundscape?: () => void;
  onOpenEmergencyFocus?: () => void;
  onOpenContextFabric?: () => void;
  onOpenSmartVideo?: () => void;
  onOpenAmbientVoice?: () => void;
  onOpenQuickDrop?: () => void;
  onOpenRecapStory?: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onQuickTask,
  onQuickAI,
  onOpenTour,
  onOpenAppHub,
  onOpenSpotify,
  onOpenGoogleWorkspace,
  onOpenVideoCall,
  onToggleVoiceListener,
  onOpenRoastHype,
  onOpenDecisionWheel,
  onOpenSoundscape,
  onOpenEmergencyFocus,
  onOpenContextFabric,
  onOpenSmartVideo,
  onOpenAmbientVoice,
  onOpenQuickDrop,
  onOpenRecapStory,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceCommand = () => {
    setVoiceNotice(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('Voice commanding requires Chrome, Edge, or Safari with microphone permissions.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice('Listening… Speak your command now');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setQuery(transcript);
        setSelectedIndex(0);
      };

      recognition.onerror = (event: any) => {
        console.warn('CommandBar voice recognition notice:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceNotice('Microphone permission denied. Please allow microphone access in your browser.');
        } else if (event.error !== 'aborted') {
          setVoiceNotice(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setTimeout(() => setVoiceNotice(null), 3000);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Voice command start notice:', err);
      setIsListening(false);
      setVoiceNotice('Could not start microphone. Check browser permissions.');
    }
  };

  const defaultSuggestions = [
    {
      id: 'task',
      label: 'Create a task',
      hint: 'e.g., Prepare presentation slides for tomorrow',
      icon: CheckSquare,
      color: '#34D399',
      action: (text: string) => {
        if (onQuickTask && text) {
          onQuickTask(text);
        } else {
          setActiveTab('tasks');
        }
      },
    },
    {
      id: 'habits',
      label: 'Smart Habit Tracker & Streaks',
      hint: 'Check off daily rituals and view 52-week consistency heatmap',
      icon: Flame,
      color: '#F97316',
      action: () => setActiveTab('habits'),
    },
    {
      id: 'finance',
      label: 'Personal Finance & Budget Ledger',
      hint: 'Track income, expenses, subscriptions & net cash flow',
      icon: DollarSign,
      color: '#10B981',
      action: () => setActiveTab('finance'),
    },
    {
      id: 'vision',
      label: 'Vision Board & Aspirations',
      hint: 'Pin motivational images, affirmations & AI inspiration',
      icon: Sparkles,
      color: '#EC4899',
      action: () => setActiveTab('vision'),
    },
    {
      id: 'roast',
      label: 'AI Motivation Coach & Workspace Roast',
      hint: 'Humorous Gordon Ramsay roast, stadium hype & stoic wisdom',
      icon: Flame,
      color: '#F43F5E',
      action: () => onOpenRoastHype && onOpenRoastHype(),
    },
    {
      id: 'wheel',
      label: 'Decision Wheel of Destiny',
      hint: 'Spinning fortune wheel & quantum coin flip to eliminate hesitation',
      icon: Dices,
      color: '#8B5CF6',
      action: () => onOpenDecisionWheel && onOpenDecisionWheel(),
    },
    {
      id: 'soundscape',
      label: 'Spatial Audio Focus Synthesizer',
      hint: 'Generative cyberpunk rain, 432Hz alpha waves & ambient cafe',
      icon: Waves,
      color: '#06B6D4',
      action: () => onOpenSoundscape && onOpenSoundscape(),
    },
    {
      id: 'lockdown',
      label: 'Emergency Deep Focus Lockdown',
      hint: 'Distraction-free 25-minute Pomodoro protocol on single top task',
      icon: ShieldAlert,
      color: '#E11D48',
      action: () => onOpenEmergencyFocus && onOpenEmergencyFocus(),
    },
    {
      id: 'viberooms',
      label: 'Shared Vibe Rooms (Co-Working & Watch Party)',
      hint: 'Sync YouTube/videos, live sprint task streaks & AI group vibe synthesizer',
      icon: Flame,
      color: '#EC4899',
      action: () => setActiveTab('viberooms'),
    },
    {
      id: 'quick-microdrop',
      label: 'Quick Micro-Drop (2-Sec Capture)',
      hint: 'Capture 10s voice thought, terminal code hack, video reaction, or AI prompt',
      icon: Zap,
      color: '#8B5CF6',
      action: () => onOpenQuickDrop && onOpenQuickDrop(),
    },
    {
      id: 'microdrops',
      label: 'Micro-Drops Feed & Creation Streaks',
      hint: 'Timeline of daily artifacts, 4-day creation streak & unlockable badges',
      icon: Sparkles,
      color: '#A855F7',
      action: () => setActiveTab('microdrops'),
    },
    {
      id: 'daily-story-recap',
      label: 'Daily Story Recap (Spotify Wrapped Style)',
      hint: 'Full-screen visual story with mood aura, cracked hacks & top video takeaway',
      icon: Sparkles,
      color: '#EC4899',
      action: () => onOpenRecapStory && onOpenRecapStory(),
    },
    {
      id: 'warrooms',
      label: 'Multi-Agent War Room',
      hint: 'Autonomous strategic debate with Architect, Security, and UX agents',
      icon: Zap,
      color: '#F59E0B',
      action: () => setActiveTab('warrooms'),
    },
    {
      id: 'simulation',
      label: 'Interactive Simulation Sandbox',
      hint: 'Run JS/Python in sandbox & test graphical network topology',
      icon: Code2,
      color: '#38BDF8',
      action: () => setActiveTab('simulation'),
    },
    {
      id: 'fabric',
      label: 'Unified Context Fabric HUD',
      hint: 'Cross-app memory stream & real-time correlation engine',
      icon: Brain,
      color: '#06B6D4',
      action: () => (onOpenContextFabric ? onOpenContextFabric() : setActiveTab('fabric')),
    },
    {
      id: 'smart-video',
      label: 'Smart Interactive Video Studio',
      hint: 'Deep-searchable screencast, clickable code timeline & Smart View overlay',
      icon: Video,
      color: '#818CF8',
      action: () => onOpenSmartVideo && onOpenSmartVideo(),
    },
    {
      id: 'voice-stream',
      label: 'Ambient Interruptible Voice Stream',
      hint: 'Low-latency barge-in conversational voice with spatial audio orb',
      icon: Mic,
      color: '#EC4899',
      action: () => onOpenAmbientVoice && onOpenAmbientVoice(),
    },
    {
      id: 'search',
      label: 'Search the workspace',
      hint: 'Search notes, files, events & memories',
      icon: Search,
      color: '#22D3EE',
      action: () => setActiveTab('search'),
    },
    {
      id: 'ai',
      label: 'Ask AI Assistant',
      hint: 'e.g., What is blocking my active project?',
      icon: Sparkles,
      color: '#A78BFA',
      action: (text: string) => {
        if (onQuickAI && text) {
          onQuickAI(text);
        } else {
          setActiveTab('assistant');
        }
      },
    },
    {
      id: 'notes',
      label: 'Open Notes',
      hint: 'Capture working ideas and reflections',
      icon: FileText,
      color: '#F59E0B',
      action: () => setActiveTab('notes'),
    },
    {
      id: 'files',
      label: 'Manage Files',
      hint: 'Browse documents in Firebase Cloud Storage',
      icon: FolderKanban,
      color: '#60A5FA',
      action: () => setActiveTab('files'),
    },
    {
      id: 'calendar',
      label: 'View Calendar',
      hint: 'Schedule focused study time or events',
      icon: Calendar,
      color: '#F472B6',
      action: () => setActiveTab('calendar'),
    },
    {
      id: 'memory',
      label: 'AI Memory Context',
      hint: 'Your context, in your control · preferences & goals',
      icon: Brain,
      color: '#67E8F9',
      action: () => setActiveTab('memory'),
    },
    {
      id: 'activity',
      label: 'Activity History',
      hint: 'Real-time synchronization logs for your private workspace',
      icon: Activity,
      color: '#FDBA74',
      action: () => setActiveTab('activity'),
    },
    {
      id: 'app_hub',
      label: 'OS Apps Hub & Integrations',
      hint: 'Home for ChatGPT, Spotify, Google Workspace, Video Calling, Canva, GitHub',
      icon: Layers,
      color: '#8B5CF6',
      action: () => {
        if (onOpenAppHub) onOpenAppHub();
        else setActiveTab('settings');
      },
    },
    {
      id: 'spotify',
      label: 'Spotify Focus Music Player',
      hint: 'Stream Deep Focus, Lo-Fi beats, and ambient background music',
      icon: Music,
      color: '#1DB954',
      action: () => {
        if (onOpenSpotify) onOpenSpotify();
      },
    },
    {
      id: 'chatgpt',
      label: 'ChatGPT External Assistant',
      hint: 'Ask OpenAI GPT-4o or toggle multi-model consensus engine',
      icon: Bot,
      color: '#10B981',
      action: () => setActiveTab('assistant'),
    },
    {
      id: 'google_workspace',
      label: 'Google Workspace Hub',
      hint: 'Compose Gmail drafts, export Drive backups, sync Calendar & Meet',
      icon: Mail,
      color: '#EF4444',
      action: () => {
        if (onOpenGoogleWorkspace) onOpenGoogleWorkspace();
      },
    },
    {
      id: 'video_call',
      label: 'Start Instant Video Meet',
      hint: 'High-definition WebRTC video and audio call with screen sharing',
      icon: Video,
      color: '#6366F1',
      action: () => {
        if (onOpenVideoCall) onOpenVideoCall();
      },
    },
    {
      id: 'voice_command',
      label: 'Start Voice Control Listener',
      hint: 'Speak commands: "create new task", "open calendar", "switch to assistant" (Web Speech API)',
      icon: Mic,
      color: '#8B5CF6',
      action: () => {
        if (onToggleVoiceListener) onToggleVoiceListener();
      },
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = defaultSuggestions.filter(
    (item) =>
      !query ||
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.hint.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (index: number) => {
    const item = filtered[index];
    if (item) {
      item.action(query);
      onClose();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0) {
        handleSelect(selectedIndex);
      } else if (query.trim()) {
        if (onQuickAI) onQuickAI(query);
        else setActiveTab('assistant');
        onClose();
      }
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[var(--color-bg)]/80 p-4 sm:p-6 backdrop-blur-md transition-opacity pt-[12vh]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl transition-all"
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(139,92,246,0.15)',
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
              Universal Command
            </p>
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              What should we move forward?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice status banner if active */}
        {voiceNotice && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span>{voiceNotice}</span>
            </span>
            <button
              type="button"
              onClick={() => setVoiceNotice(null)}
              className="text-xs text-indigo-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input box */}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[var(--color-primary)]/70 bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30">
          <Search className="w-5 h-5 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type or speak a command, task, or question..."
            className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
          />

          {/* Voice Command Microphone Button */}
          <button
            type="button"
            onClick={toggleVoiceCommand}
            title={isListening ? 'Stop listening' : 'Speak voice command (Microphone)'}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                : 'text-[var(--color-muted)] hover:text-indigo-400 hover:bg-white/5'
            }`}
          >
            {isListening ? (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">Listening…</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">Voice</span>
              </>
            )}
          </button>

          <kbd className="hidden sm:inline-block rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
            Esc
          </kbd>
        </div>

        {/* Suggestions list */}
        <div className="mt-4 space-y-1.5 max-h-72 overflow-y-auto">
          {filtered.map((item, index) => {
            const Icon = item.icon;
            const isSelected = index === selectedIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(index)}
                className={`flex w-full items-center gap-3.5 rounded-xl p-2.5 text-left transition-all ${
                  isSelected
                    ? 'bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/40 text-[var(--color-text)]'
                    : 'border border-transparent text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
                }`}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-elevated)]"
                  style={{ color: item.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs font-bold text-[var(--color-text)]">
                    {item.label}
                  </strong>
                  <small className="block text-[11px] text-[var(--color-muted)] truncate">
                    {query ? `Apply to "${query}"` : item.hint}
                  </small>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-muted)] opacity-50" />
              </button>
            );
          })}
          {filtered.length === 0 && query && (
            <button
              type="button"
              onClick={() => {
                if (onQuickAI) onQuickAI(query);
                else setActiveTab('assistant');
                onClose();
              }}
              className="flex w-full items-center gap-3.5 rounded-xl border border-[var(--color-ai)]/40 bg-[var(--color-ai-soft)]/40 p-3 text-left"
            >
              <Sparkles className="w-4 h-4 text-[var(--color-ai)]" />
              <div className="min-w-0 flex-1">
                <strong className="block text-xs font-bold text-[var(--color-text)]">
                  Ask AI about "{query}"
                </strong>
                <small className="block text-[11px] text-[var(--color-muted)]">
                  Get assistance with workspace context
                </small>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--color-ai)]" />
            </button>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-muted)]">
          <span>Tip: Press <b>Enter</b> to run or <b>Esc</b> to dismiss</span>
          <span>Shortcut: <b>⌘K</b></span>
        </div>
      </div>
    </div>
  );
};
