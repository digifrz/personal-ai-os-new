import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Zap,
  Radio,
  Sliders,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Terminal,
} from 'lucide-react';
import { askAI } from '../../services/ai';
import { contextFabric } from '../../services/contextFabric';
import { ViewTab } from '../../types';

interface AmbientVoiceStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: ViewTab) => void;
  onShowToast?: (msg: string) => void;
}

export const AmbientVoiceStreamModal: React.FC<AmbientVoiceStreamModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onShowToast,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [lastAiResponse, setLastAiResponse] = useState<string>(
    "I'm listening in ambient conversational mode. You can talk freely, or interrupt me anytime while I speak."
  );
  const [voiceLog, setVoiceLog] = useState<Array<{ role: 'user' | 'ai'; text: string; time: string }>>([
    {
      role: 'ai',
      text: 'Ambient Voice Stream initialized with real-time barge-in interruption.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [volumeLevel, setVolumeLevel] = useState<number>(0.3);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);

  // Trigger haptic feedback for mobile devices (Android / iOS)
  const triggerHaptic = (pattern: number | number[] = 25) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  // Interrupt AI speaking (Barge-In)
  const interruptAi = () => {
    if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) {
      synthRef.current.cancel();
      setIsAiSpeaking(false);
      setIsInterrupted(true);
      triggerHaptic([30, 20, 30]);
      setTimeout(() => setIsInterrupted(false), 2500);
    }
  };

  // Speak AI text with SpeechSynthesis
  const speakText = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel(); // clear previous
    setIsAiSpeaking(true);

    const cleanText = text.replace(/[*#`_]/g, '').slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick natural voice if available
    const voices = synthRef.current.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('English')) && v.lang.startsWith('en')
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onend = () => {
      setIsAiSpeaking(false);
    };
    utterance.onerror = () => {
      setIsAiSpeaking(false);
    };

    synthRef.current.speak(utterance);
  };

  // Process user speech command
  const handleUserSpeech = async (spokenText: string) => {
    const clean = spokenText.trim();
    if (!clean) return;

    interruptAi(); // If AI was speaking, user barged in!

    const userEntry = {
      role: 'user' as const,
      text: clean,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setVoiceLog((prev) => [...prev.slice(-8), userEntry]);
    setTranscript('');
    setInterimText('');

    // Check spatial & app control voice commands
    const lower = clean.toLowerCase();
    if (lower.includes('sandbox') || lower.includes('simulation') || lower.includes('code')) {
      onNavigateTab('simulation');
      speakText('Switching to Interactive Simulation Sandbox.');
      return;
    }
    if (lower.includes('war room') || lower.includes('agent')) {
      onNavigateTab('warrooms');
      speakText('Opening Multi-Agent War Room.');
      return;
    }
    if (lower.includes('lounge') || lower.includes('chat')) {
      onNavigateTab('community');
      speakText('Navigating to Lounge.');
      return;
    }
    if (lower.includes('notes') || lower.includes('note')) {
      onNavigateTab('notes');
      speakText('Opening your workspace notes.');
      return;
    }
    if (lower.includes('task') || lower.includes('tasks')) {
      onNavigateTab('tasks');
      speakText('Showing your open tasks.');
      return;
    }

    // Otherwise pass to AI brain with context fabric
    try {
      const correlated = contextFabric.getItems().slice(0, 3);
      const fabricContext = correlated.map((c) => `[${c.sourceModule}: ${c.title}] ${c.excerpt}`).join('\n');

      const prompt = `You are the voice interface for Personal AI OS.
Spoken User Command: "${clean}"
Active Context Fabric:
${fabricContext}

Answer in 1-2 conversational, concise sentences suitable for spoken audio:`;

      const aiText = await askAI({ prompt });
      const cleanAi = aiText.trim();
      setLastAiResponse(cleanAi);
      setVoiceLog((prev) => [
        ...prev.slice(-8),
        {
          role: 'ai',
          text: cleanAi,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      speakText(cleanAi);
    } catch (e) {
      console.warn('Voice AI error:', e);
      speakText('Received your command. Processing in the background.');
    }
  };

  // Toggle Continuous Ambient Listening
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onShowToast?.('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      triggerHaptic(20);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        triggerHaptic([15, 30]);
      };

      recognition.onresult = (event: any) => {
        let final = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (interim) {
          setInterimText(interim);
          // If user starts speaking while AI is speaking, trigger Barge-In!
          if (isAiSpeaking) {
            interruptAi();
          }
        }

        if (final) {
          setTranscript(final);
          handleUserSpeech(final);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        // If still flagged as listening, auto-restart for ambient continuity
        if (isListening) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech error:', e);
    }
  };

  // Simulating waveform / volume level
  useEffect(() => {
    let animId: number;
    const updateOrb = () => {
      if (isListening || isAiSpeaking) {
        setVolumeLevel(0.2 + Math.random() * 0.6);
      } else {
        setVolumeLevel(0.15);
      }
      animId = requestAnimationFrame(updateOrb);
    };
    animId = requestAnimationFrame(updateOrb);
    return () => cancelAnimationFrame(animId);
  }, [isListening, isAiSpeaking]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9996] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-violet-500/30 p-6 flex flex-col items-center shadow-2xl relative text-white overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            interruptAi();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ambient Spatial Audio Orb */}
        <div className="my-6 relative flex items-center justify-center">
          {/* Outer glow rings */}
          <div
            style={{
              transform: `scale(${1 + volumeLevel * 0.4})`,
              opacity: isListening || isAiSpeaking ? 0.7 : 0.2,
            }}
            className="w-44 h-44 rounded-full bg-gradient-to-tr from-violet-600/40 via-cyan-500/30 to-fuchsia-500/40 blur-2xl transition-all duration-150 absolute"
          />

          {/* Core Pulsing Orb */}
          <div
            onClick={toggleListening}
            className={`w-32 h-32 rounded-full cursor-pointer relative z-10 flex items-center justify-center border transition-all duration-300 shadow-2xl ${
              isAiSpeaking
                ? 'bg-gradient-to-tr from-fuchsia-600 to-indigo-600 border-fuchsia-400 shadow-fuchsia-500/40'
                : isListening
                ? 'bg-gradient-to-tr from-cyan-600 to-emerald-600 border-cyan-400 shadow-cyan-500/40'
                : 'bg-zinc-900 border-white/20 hover:border-violet-400'
            }`}
          >
            {isAiSpeaking ? (
              <Volume2 className="w-10 h-10 text-white animate-bounce" />
            ) : isListening ? (
              <Mic className="w-10 h-10 text-white animate-pulse" />
            ) : (
              <MicOff className="w-10 h-10 text-zinc-400" />
            )}
          </div>
        </div>

        {/* Interruptible (Barge-In) Badge */}
        {isInterrupted && (
          <div className="mb-3 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 animate-bounce">
            <Zap className="w-3.5 h-3.5 text-rose-400 fill-current" />
            <span>Barge-in Interruption Active</span>
          </div>
        )}

        {/* Status indicator */}
        <div className="text-center space-y-1">
          <h3 className="font-extrabold text-base tracking-tight text-white flex items-center justify-center gap-2">
            <span>Ambient Conversational Voice</span>
            <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            {isAiSpeaking
              ? 'AI is speaking. You can speak to interrupt anytime.'
              : isListening
              ? 'Listening… Ask anything or speak spatial commands.'
              : 'Tap the orb to activate continuous ambient listening.'}
          </p>
        </div>

        {/* Live Interim / Spoken Text Display */}
        <div className="w-full my-4 p-3 rounded-2xl bg-zinc-900/80 border border-white/10 min-h-[56px] flex items-center justify-center text-center text-xs">
          {interimText ? (
            <span className="text-cyan-300 italic font-medium">&quot;{interimText}&quot;</span>
          ) : (
            <span className="text-zinc-400 text-[11px] leading-relaxed">
              {lastAiResponse}
            </span>
          )}
        </div>

        {/* Quick Voice Command Hints */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-4 text-[10px]">
          {['Open Sandbox', 'Multi-Agent War Room', 'Switch to Lounge', 'Check Tasks'].map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => handleUserSpeech(hint)}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 transition-colors cursor-pointer"
            >
              &quot;{hint}&quot;
            </button>
          ))}
        </div>

        {/* Control Footer */}
        <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5">
              Barge-in: Enabled
            </span>
            {isAiSpeaking && (
              <button
                type="button"
                onClick={interruptAi}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
              >
                <VolumeX className="w-3 h-3" />
                <span>Mute AI</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={toggleListening}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-400 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isListening ? 'Stop Mic' : 'Start Mic'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
