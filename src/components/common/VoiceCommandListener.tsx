import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Command,
  HelpCircle,
  X,
  CheckCircle2,
  Calendar,
  CheckSquare,
  Bot,
  Music,
  HardDrive,
  FileText,
  Video,
  Radio,
} from 'lucide-react';
import { ViewTab } from '../../types';

export interface VoiceCommandListenerProps {
  isListening: boolean;
  onToggleListening: (active: boolean) => void;
  onNavigate: (tab: ViewTab) => void;
  onOpenNewTask: (prefillTitle?: string) => void;
  onOpenNewNote: () => void;
  onOpenNewEvent: () => void;
  onOpenSpotify: () => void;
  onOpenGoogleWorkspace: () => void;
  onOpenVideoCall: () => void;
  onOpenAppHub: () => void;
}

interface CommandMatch {
  actionName: string;
  recognizedText: string;
  icon: any;
  timestamp: number;
}

export const VoiceCommandListener: React.FC<VoiceCommandListenerProps> = ({
  isListening,
  onToggleListening,
  onNavigate,
  onOpenNewTask,
  onOpenNewNote,
  onOpenNewEvent,
  onOpenSpotify,
  onOpenGoogleWorkspace,
  onOpenVideoCall,
  onOpenAppHub,
}) => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastMatch, setLastMatch] = useState<CommandMatch | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Audio chime feedback for recognized commands
  const playRecognitionChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  // Process natural language voice commands
  const processVoiceCommand = (text: string) => {
    const clean = text.toLowerCase().trim();
    if (!clean) return;

    // 1. Create New Task / Add Task
    if (
      clean.includes('create new task') ||
      clean.includes('new task') ||
      clean.includes('create a task') ||
      clean.includes('add task') ||
      clean.includes('create task')
    ) {
      // Extract optional prefilled title, e.g. "create task finish q3 roadmap"
      let prefill = '';
      const match = clean.match(/(?:create(?: new)? task|add task)(?:\s+(?:called|named|to|for)?\s*(.+))?/i);
      if (match && match[1]) {
        prefill = match[1].trim();
      }
      setLastMatch({
        actionName: prefill ? `Create Task: "${prefill}"` : 'Create New Task',
        recognizedText: clean,
        icon: CheckSquare,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onNavigate('tasks');
      onOpenNewTask(prefill);
      return;
    }

    // 2. Open Calendar / Show Schedule
    if (
      clean.includes('open calendar') ||
      clean.includes('show calendar') ||
      clean.includes('switch to calendar') ||
      clean.includes('go to calendar') ||
      clean.includes('view calendar') ||
      clean.includes('my calendar') ||
      clean.includes('open schedule')
    ) {
      setLastMatch({
        actionName: 'Open Calendar View',
        recognizedText: clean,
        icon: Calendar,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onNavigate('calendar');
      return;
    }

    // 3. Switch to Assistant / AI Chat
    if (
      clean.includes('switch to assistant') ||
      clean.includes('open assistant') ||
      clean.includes('switch assistant') ||
      clean.includes('go to assistant') ||
      clean.includes('talk to ai') ||
      clean.includes('chat with assistant') ||
      clean.includes('open ai')
    ) {
      setLastMatch({
        actionName: 'Switch to AI Assistant',
        recognizedText: clean,
        icon: Bot,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onNavigate('assistant');
      return;
    }

    // 4. Open Spotify / Play Focus Music
    if (
      clean.includes('open spotify') ||
      clean.includes('play music') ||
      clean.includes('focus music') ||
      clean.includes('start music') ||
      clean.includes('spotify player')
    ) {
      setLastMatch({
        actionName: 'Open Spotify OS Player',
        recognizedText: clean,
        icon: Music,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onOpenSpotify();
      return;
    }

    // 5. Open Google Workspace / Gmail / Drive Sync
    if (
      clean.includes('open google workspace') ||
      clean.includes('google workspace') ||
      clean.includes('open workspace hub') ||
      clean.includes('open drive') ||
      clean.includes('open gmail') ||
      clean.includes('sync google')
    ) {
      setLastMatch({
        actionName: 'Open Google Workspace Hub',
        recognizedText: clean,
        icon: HardDrive,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onOpenGoogleWorkspace();
      return;
    }

    // 6. Tasks View
    if (clean.includes('open tasks') || clean.includes('view tasks') || clean.includes('show tasks')) {
      setLastMatch({
        actionName: 'Navigate to Tasks',
        recognizedText: clean,
        icon: CheckSquare,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onNavigate('tasks');
      return;
    }

    // 7. Notes View or New Note
    if (clean.includes('new note') || clean.includes('create note') || clean.includes('take a note')) {
      setLastMatch({
        actionName: 'Create New Note',
        recognizedText: clean,
        icon: FileText,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onNavigate('notes');
      onOpenNewNote();
      return;
    }

    if (clean.includes('open notes') || clean.includes('view notes')) {
      setLastMatch({
        actionName: 'Navigate to Notes',
        recognizedText: clean,
        icon: FileText,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onNavigate('notes');
      return;
    }

    // 8. Start Video Call / Meeting
    if (
      clean.includes('start video call') ||
      clean.includes('start video') ||
      clean.includes('call someone') ||
      clean.includes('open video call') ||
      clean.includes('join meet')
    ) {
      setLastMatch({
        actionName: 'Start Live Video Call',
        recognizedText: clean,
        icon: Video,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onOpenVideoCall();
      return;
    }

    // 9. Open App Hub
    if (clean.includes('open app hub') || clean.includes('apps') || clean.includes('integrations')) {
      setLastMatch({
        actionName: 'Open OS App Hub',
        recognizedText: clean,
        icon: Command,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onOpenAppHub();
      return;
    }

    // 10. Dashboard View
    if (clean.includes('open dashboard') || clean.includes('go home') || clean.includes('show dashboard')) {
      setLastMatch({
        actionName: 'Navigate to Dashboard',
        recognizedText: clean,
        icon: Sparkles,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onNavigate('dashboard');
      return;
    }

    // 11. Files View
    if (clean.includes('open files') || clean.includes('view files') || clean.includes('storage')) {
      setLastMatch({
        actionName: 'Navigate to Files',
        recognizedText: clean,
        icon: HardDrive,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onNavigate('files');
      return;
    }

    // 12. Settings View
    if (clean.includes('open settings') || clean.includes('preferences')) {
      setLastMatch({
        actionName: 'Navigate to Settings',
        recognizedText: clean,
        icon: Command,
        timestamp: Date.now(),
      });
      playRecognitionChime();
      onNavigate('settings');
      return;
    }
  };

  // Keyboard shortcut: Press 'V' to toggle voice recognition (when not typing in an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      if ((e.key === 'v' || e.key === 'V') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onToggleListening(!isListening);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, onToggleListening]);

  // Setup Web Speech API SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            const finalTranscript = item[0].transcript;
            setTranscript(finalTranscript);
            setInterimTranscript('');
            processVoiceCommand(finalTranscript);
          } else {
            currentInterim += item[0].transcript;
          }
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          console.warn('Microphone permission denied for Web Speech API.');
          onToggleListening(false);
        } else if (event.error !== 'no-speech') {
          console.warn('SpeechRecognition error:', event.error);
        }
      };

      recognition.onend = () => {
        // Automatically restart if user still has voice mode active
        if (isListening) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Could not initialize SpeechRecognition:', e);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Sync isListening prop with SpeechRecognition service
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        // If already started, ignore error
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch {}
      setInterimTranscript('');
    }
  }, [isListening]);

  // If not listening and no recent match, render nothing or minimal banner
  if (!isListening && !lastMatch) return null;

  return (
    <>
      {/* Global Voice Command Floating HUD */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[130] w-[90%] max-w-lg animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto">
        <div className="rounded-2xl border border-violet-500/40 bg-zinc-950/95 p-3 px-4 shadow-2xl backdrop-blur-2xl text-white flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => onToggleListening(!isListening)}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all shrink-0 ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                    : 'bg-white/10 text-zinc-400'
                }`}
                title={isListening ? 'Stop voice listener (V)' : 'Start voice listener (V)'}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs tracking-tight text-violet-300">
                    Voice Command Listener
                  </span>
                  {isListening && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-1.5 py-0.2 text-[9px] font-bold text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 truncate">
                  {interimTranscript ? (
                    <span className="text-white font-medium italic">&quot;{interimTranscript}&quot;</span>
                  ) : transcript ? (
                    <span>Heard: &quot;{transcript}&quot;</span>
                  ) : (
                    <span>Say &quot;create new task&quot;, &quot;open calendar&quot;, or &quot;switch to assistant&quot;</span>
                  )}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                title="View Voice Commands Guide"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleListening(false);
                  setLastMatch(null);
                }}
                className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-time wave visualizer when listening */}
          {isListening && (
            <div className="flex items-center justify-center gap-1 h-3 py-1">
              {[4, 8, 14, 10, 16, 8, 12, 6, 14, 10, 6].map((height, i) => (
                <div
                  key={i}
                  style={{ height: `${height}px` }}
                  className="w-1 rounded-full bg-violet-400 animate-pulse [animation-duration:800ms]"
                />
              ))}
            </div>
          )}

          {/* Last Recognized Action Badge */}
          {lastMatch && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-violet-950/60 border border-violet-500/30 px-3 py-1.5 text-xs animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-emerald-400 font-bold truncate">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Executed: {lastMatch.actionName}</span>
              </div>
              <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                &quot;{lastMatch.recognizedText}&quot;
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Voice Commands Guide Modal */}
      {showHelp && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-violet-500/30 bg-zinc-950 p-6 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                  <Mic className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm">Natural Voice Commands</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Control your Personal AI OS hands-free using natural language input powered by the Web Speech API. Press <code className="text-violet-300 font-bold">V</code> anytime to toggle listening:
            </p>

            <div className="grid grid-cols-1 gap-2 text-xs max-h-72 overflow-y-auto pr-1">
              {[
                { cmd: 'create new task [title]', desc: 'Opens the task composer with your spoken task title', icon: CheckSquare },
                { cmd: 'open calendar', desc: 'Navigates directly to your schedule & timeline view', icon: Calendar },
                { cmd: 'switch to assistant', desc: 'Opens the workspace AI assistant ready to answer questions', icon: Bot },
                { cmd: 'open spotify / play music', desc: 'Opens the Spotify OS Player with your personal playlists', icon: Music },
                { cmd: 'open google workspace', desc: 'Opens Gmail composer and Google Calendar sync hub', icon: HardDrive },
                { cmd: 'open notes / create note', desc: 'Navigates to notes and spawns a new document', icon: FileText },
                { cmd: 'start video call', desc: 'Launches instant video meeting conference', icon: Video },
                { cmd: 'open app hub', desc: 'Opens the central launchpad for external integrations', icon: Command },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/5">
                    <Icon className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block font-bold text-white text-[11px] font-mono">
                        &quot;{item.cmd}&quot;
                      </strong>
                      <p className="text-[10px] text-zinc-400">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 text-xs"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
