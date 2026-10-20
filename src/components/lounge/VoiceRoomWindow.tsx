import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Hand,
  PhoneOff,
  Radio,
  Users,
  Sparkles,
  Music,
  ChevronDown,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface VoiceParticipant {
  id: string;
  name: string;
  avatar?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isHandRaised: boolean;
  role: 'host' | 'speaker' | 'listener';
}

const CHANNELS = [
  { id: 'tech_ai', name: 'Tech, AI & Architecture', topic: 'Modern LLM agents, system architectures & coding sprints', activeCount: 6 },
  { id: 'deep_work', name: 'Deep Work & Focus Lo-Fi', topic: 'Quiet co-working with ambient Spotify background music', activeCount: 12 },
  { id: 'general_lounge', name: 'Community Lounge Stage', topic: 'Open mic discussion, creator collabs & casual coffee chats', activeCount: 8 },
];

export const VoiceRoomWindow: React.FC = () => {
  const { user, profile } = useAuth();
  const [selectedChannelId, setSelectedChannelId] = useState('tech_ai');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(true);

  // Audio stream and analyzer refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [participants, setParticipants] = useState<VoiceParticipant[]>([
    {
      id: 'maya_lin',
      name: 'Maya Lin',
      isSpeaking: true,
      isMuted: false,
      isHandRaised: false,
      role: 'host',
    },
    {
      id: 'marcus_vance',
      name: 'Marcus Vance',
      isSpeaking: false,
      isMuted: false,
      isHandRaised: true,
      role: 'speaker',
    },
    {
      id: 'elena_rostova',
      name: 'Elena Rostova',
      isSpeaking: false,
      isMuted: true,
      isHandRaised: false,
      role: 'speaker',
    },
    {
      id: 'david_chen',
      name: 'David Chen',
      isSpeaking: false,
      isMuted: true,
      isHandRaised: false,
      role: 'listener',
    },
    {
      id: 'sophia_alvarez',
      name: 'Sophia Alvarez',
      isSpeaking: false,
      isMuted: true,
      isHandRaised: false,
      role: 'listener',
    },
  ]);

  // Real Web Audio API microphone level analyzer
  useEffect(() => {
    let active = true;

    async function initMicrophone() {
      if (isMicMuted || !isLiveConnected) {
        setAudioLevel(0);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        micStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!active) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Scale between 0 and 100
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      } catch {
        // Fallback simulated ambient pulse if permission was not granted
        const interval = setInterval(() => {
          if (!active || isMicMuted) {
            setAudioLevel(0);
          } else {
            setAudioLevel(Math.floor(Math.random() * 28));
          }
        }, 150);
        return () => clearInterval(interval);
      }
    }

    initMicrophone();

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isMicMuted, isLiveConnected]);

  const currentChannel = CHANNELS.find((c) => c.id === selectedChannelId) || CHANNELS[0];

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text)] select-none">
      {/* Top Channel Header */}
      <div className="p-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white font-black shadow-md shadow-violet-500/20">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="font-extrabold text-xs sm:text-sm bg-transparent border-0 text-[var(--color-text)] outline-none cursor-pointer"
              >
                {CHANNELS.map((ch) => (
                  <option key={ch.id} value={ch.id} className="bg-[var(--color-surface)] text-[var(--color-text)]">
                    {ch.name}
                  </option>
                ))}
              </select>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                LIVE STAGE
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-muted)] truncate max-w-sm">
              {currentChannel.topic}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] shrink-0">
          <Users className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-bold">{participants.length + 1} online</span>
        </div>
      </div>

      {/* Main Stage Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Stage Speakers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
              Speakers on Stage
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">
              HD Voice Quality · Opus 48kHz
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Current User Card */}
            <div
              className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-between text-center relative ${
                audioLevel > 15
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)]'
              }`}
            >
              {/* Speaking waveform visualizer ring */}
              <div className="relative mb-2">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base shadow-md transition-all ${
                    audioLevel > 15
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-black ring-4 ring-emerald-500/40'
                      : 'bg-[var(--color-primary)] text-white'
                  }`}
                  style={{
                    transform: audioLevel > 15 ? `scale(${1 + Math.min(0.2, audioLevel / 300)})` : 'scale(1)',
                  }}
                >
                  {profile?.name ? profile.name.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase() || 'YOU'}
                </div>

                {isMicMuted && (
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-red-600 text-white shadow-sm">
                    <MicOff className="w-3 h-3" />
                  </div>
                )}
                {isHandRaised && (
                  <div className="absolute -top-1 -right-1 p-1 rounded-full bg-amber-500 text-black shadow-sm animate-bounce">
                    <Hand className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div className="w-full truncate">
                <p className="font-extrabold text-xs text-[var(--color-text)] truncate">
                  {profile?.name || user?.email?.split('@')[0] || 'You (Host)'}
                </p>
                <p className="text-[10px] text-violet-400 font-semibold">You</p>
              </div>

              {/* Real-time mic level bar */}
              {!isMicMuted && (
                <div className="w-full bg-black/20 rounded-full h-1 mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-75"
                    style={{ width: `${Math.min(100, audioLevel)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Other Stage Participants */}
            {participants
              .filter((p) => p.role !== 'listener')
              .map((p) => (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-between text-center relative ${
                    p.isSpeaking
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-2 ring-emerald-500/30'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  }`}
                >
                  <div className="relative mb-2">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base shadow-md transition-all ${
                        p.isSpeaking
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-black animate-pulse'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>

                    {p.isMuted && (
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-red-600 text-white shadow-sm">
                        <MicOff className="w-3 h-3" />
                      </div>
                    )}
                    {p.isHandRaised && (
                      <div className="absolute -top-1 -right-1 p-1 rounded-full bg-amber-500 text-black shadow-sm animate-bounce">
                        <Hand className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <div className="w-full truncate">
                    <p className="font-extrabold text-xs text-[var(--color-text)] truncate">{p.name}</p>
                    <p className="text-[10px] text-[var(--color-muted)] capitalize">{p.role}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Audience / Listeners */}
        <div className="pt-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-muted)] block mb-2.5">
            Listeners in Room ({participants.filter((p) => p.role === 'listener').length})
          </span>

          <div className="flex flex-wrap gap-2">
            {participants
              .filter((p) => p.role === 'listener')
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs"
                >
                  <div className="h-6 w-6 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-[10px]">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-xs text-[var(--color-text)]">{p.name}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Bottom Stage Action Dock */}
      <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Mic Toggle */}
          <button
            type="button"
            onClick={() => setIsMicMuted(!isMicMuted)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${
              isMicMuted
                ? 'bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMicMuted ? 'Muted' : 'Speaking'}</span>
          </button>

          {/* Deafen Toggle */}
          <button
            type="button"
            onClick={() => setIsDeafened(!isDeafened)}
            title={isDeafened ? 'Undeafen audio' : 'Deafen room audio'}
            className={`p-2 rounded-xl border transition-colors ${
              isDeafened
                ? 'border-red-500/40 bg-red-500/15 text-red-400'
                : 'border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold border transition-all ${
              isHandRaised
                ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                : 'border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
          </button>
        </div>

        {/* Leave Stage */}
        <button
          type="button"
          onClick={() => setIsLiveConnected(false)}
          className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs font-bold text-red-400 transition-colors"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span>Leave Stage</span>
        </button>
      </div>
    </div>
  );
};
