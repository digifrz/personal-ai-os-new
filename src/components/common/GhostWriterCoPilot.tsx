import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Sparkles,
  Flame,
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  Send,
  Zap,
  Coffee,
  Lightbulb,
  Radio,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { dynamicSoundtrack } from '../../services/soundtrack.service';

interface GhostMessage {
  id: string;
  sender: 'ghost' | 'user';
  text: string;
  timestamp: string;
  tag?: string;
}

const WITTY_ROASTS = [
  "System breached. Task complete. Go grab a chai before you over-engineer the next one.",
  "Warning: Detected 17 open tabs in your brain. Closing 3 background existential crises.",
  "Look at you actually checking off tasks instead of just re-coloring them.",
  "Your productivity graph just spiked. Even the algorithm is mildly impressed.",
  "1-Line Hint: If the bug takes more than 15 minutes, you missed a missing semicolon or a stale prop.",
  "Focus mode initiated. Don't open Twitter. I am watching your keystrokes.",
  "Drop locked in the vault. Future you will thank current you for documenting that.",
];

export interface GhostWriterCoPilotProps {
  activeTab?: string;
  onOpenTasks?: () => void;
  onOpenNotes?: () => void;
  tasks?: any[];
  notes?: any[];
  onShowToast?: (msg: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const GhostWriterCoPilot: React.FC<GhostWriterCoPilotProps> = ({
  activeTab,
  onOpenTasks,
  onOpenNotes,
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    setInternalIsOpen(val);
    if (!val && propOnClose) propOnClose();
  };
  const [isMinimized, setIsMinimized] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTimeout, setToastTimeout] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<GhostMessage[]>([
    {
      id: 'init-1',
      sender: 'ghost',
      text: "Ghost-Writer co-pilot online. I'll roast your procrastination and toast your wins. What's on deck today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tag: 'SYSTEM',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Trigger playful speech bubble toasts on workspace events
  const triggerToast = (text: string) => {
    setToastMessage(text);
    if (toastTimeout) clearTimeout(toastTimeout);
    const t = setTimeout(() => {
      setToastMessage(null);
    }, 6000);
    setToastTimeout(t);
  };

  useEffect(() => {
    // Listen for custom task completion events
    const handleTaskCompleted = (e: any) => {
      const taskTitle = e.detail?.title || 'task';
      const toast = `System breached. "${taskTitle}" completed! Go grab a chai before you over-engineer the next one.`;
      triggerToast(toast);
      dynamicSoundtrack.playHapticSound('task_complete');

      setMessages((prev) => [
        ...prev,
        {
          id: 'ghost_' + Date.now(),
          sender: 'ghost',
          text: toast,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tag: 'STREAK',
        },
      ]);
    };

    const handleMicroDrop = (e: any) => {
      const toast = "Artifact secured in your daily stream. Spotify-style recap is brewing.";
      triggerToast(toast);
      dynamicSoundtrack.playHapticSound('drop');
    };

    window.addEventListener('paio:task-completed', handleTaskCompleted);
    const handleOpenReq = () => setIsOpen(true);
    window.addEventListener('paio:open-ghostwriter', handleOpenReq);
    window.addEventListener('paio:microdrop-created', handleMicroDrop);

    return () => {
      window.removeEventListener('paio:task-completed', handleTaskCompleted);
      window.removeEventListener('paio:open-ghostwriter', handleOpenReq);
      window.removeEventListener('paio:microdrop-created', handleMicroDrop);
    };
  }, []);

  // Occasional witty co-pilot reminder on tab switch
  useEffect(() => {
    if (activeTab) {
      dynamicSoundtrack.onTabChanged(activeTab);
    }
  }, [activeTab]);

  const handleSendPrompt = (promptText?: string) => {
    const text = (promptText || inputText).trim();
    if (!text) return;

    const userMsg: GhostMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    dynamicSoundtrack.playHapticSound('click');

    // Ghost-Writer witty response generation
    setTimeout(() => {
      let reply = "Solid plan. Keep moving, don't let analysis paralysis eat your afternoon.";
      const lower = text.toLowerCase();
      if (lower.includes('roast') || lower.includes('procrastinat')) {
        reply = "You've switched views 4 times in 5 minutes looking for dopamine. Pick one task and finish it before the timer resets!";
      } else if (lower.includes('hint') || lower.includes('bug') || lower.includes('stuck')) {
        reply = "Classic blocker. Step away from the monitor for 90 seconds. The answer usually hits you when you look at the ceiling.";
      } else if (lower.includes('chai') || lower.includes('coffee') || lower.includes('break')) {
        reply = "Approved by Ghost-Writer protocol. Take 5 minutes. But don't open short-form reels or you're toast.";
      } else if (lower.includes('mantra') || lower.includes('focus')) {
        reply = "Mantra of the hour: 'Done is better than perfect, shipped is better than shelved.'";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'ghost_' + Date.now(),
          sender: 'ghost',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tag: 'CO-PILOT',
        },
      ]);
      dynamicSoundtrack.playHapticSound('click');
    }, 400);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  return (
    <>
      {/* Playful Floating Toast Notification Bubble */}
      {toastMessage && !isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          className="fixed bottom-16 right-5 z-[9990] max-w-sm cursor-pointer rounded-2xl border border-pink-500/40 bg-zinc-950/85 p-3.5 shadow-2xl backdrop-blur-2xl transition-all hover:scale-105 animate-bounce-subtle"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shrink-0 shadow-md">
              <Flame className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-pink-400">
                  Ghost-Writer Co-Pilot
                </span>
                <span className="text-[9px] text-zinc-500">tap to open</span>
              </div>
              <p className="text-xs font-semibold text-zinc-100 mt-0.5 leading-snug">
                {toastMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setToastMessage(null);
              }}
              className="text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Interactive Glassmorphism Terminal Window */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-[9990] w-full max-w-sm sm:max-w-md rounded-3xl border border-white/10 bg-zinc-950/85 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-fade-in font-sans select-none max-h-[520px]">
          {/* Terminal Window Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-purple-950/60 via-zinc-900/60 to-pink-950/40">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-1.5 ml-1">
                <Terminal className="w-3.5 h-3.5 text-pink-400" />
                <span className="font-mono text-xs font-black tracking-tight text-white">
                  ghost-writer@terminal:~$
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick Action Prompt Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 border-b border-white/5 bg-zinc-900/40 scrollbar-none text-[10px]">
                <button
                  type="button"
                  onClick={() => handleSendPrompt('Give me a playful roast of my productivity habits.')}
                  className="shrink-0 flex items-center gap-1 rounded-full border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 text-pink-300 hover:bg-pink-500/20 transition-all font-semibold"
                >
                  <Flame className="w-3 h-3" />
                  <span>Roast My Flow</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendPrompt('Give me a 1-line hack for whatever bug or note I am writing.')}
                  className="shrink-0 flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-cyan-300 hover:bg-cyan-500/20 transition-all font-semibold"
                >
                  <Lightbulb className="w-3 h-3" />
                  <span>1-Line Hack</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendPrompt('Give me a focus mantra for deep work.')}
                  className="shrink-0 flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-purple-300 hover:bg-purple-500/20 transition-all font-semibold"
                >
                  <Zap className="w-3 h-3" />
                  <span>Focus Mantra</span>
                </button>
              </div>

              {/* Messages Terminal Scroll Stream */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-mono text-xs max-h-[280px]">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 mb-0.5">
                      {m.sender === 'ghost' && (
                        <span className="text-pink-400 font-bold">
                          [{m.tag || 'GHOST'}]
                        </span>
                      )}
                      <span>{m.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-2.5 text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-zinc-900/90 border border-white/10 text-zinc-200 shadow-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Terminal Command Input */}
              <div className="p-2.5 border-t border-white/10 bg-zinc-900/50 flex items-center gap-2">
                <span className="font-mono text-pink-400 text-xs font-bold pl-1">›</span>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendPrompt();
                  }}
                  placeholder="Drop a prompt, ask for a roast, or type a command…"
                  className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleSendPrompt()}
                  className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow hover:scale-105 transition-transform"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
