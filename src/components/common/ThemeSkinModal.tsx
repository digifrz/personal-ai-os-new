import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Sparkles,
  Terminal,
  Layers,
  Volume2,
  VolumeX,
  Check,
  Zap,
  Sliders,
  Moon,
} from 'lucide-react';
import { dynamicSoundtrack, SoundtrackTrack } from '../../services/soundtrack.service';

export type ThemeSkin = 'deep_space' | 'cyberpunk' | 'terminal_green' | 'midnight_synth';

interface ThemeSkinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

const THEME_OPTIONS: Array<{
  id: ThemeSkin;
  name: string;
  badge: string;
  description: string;
  previewBg: string;
  accentBorder: string;
  tagColor: string;
}> = [
  {
    id: 'deep_space',
    name: 'Deep Space Glass',
    badge: 'Obsidian Glass',
    description: 'Ultra-frosted obsidian glass, floating nebula gradients, and sleek minimalist violet accents.',
    previewBg: 'bg-gradient-to-br from-[#080d18] via-[#0d1422] to-[#111827]',
    accentBorder: 'border-purple-500/50',
    tagColor: 'text-purple-400 bg-purple-500/10',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    badge: 'High Voltage',
    description: 'Electric cyan and neon magenta glows against dark onyx glass. High-speed hacker energy.',
    previewBg: 'bg-gradient-to-br from-[#060814] via-[#120726] to-[#041527]',
    accentBorder: 'border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.25)]',
    tagColor: 'text-cyan-300 bg-cyan-400/15',
  },
  {
    id: 'terminal_green',
    name: 'Retro Terminal Green',
    badge: 'CRT Matrix',
    description: 'Emerald phosphor CRT glow, monospace terminal aesthetic, and cyberpunk command-line styling.',
    previewBg: 'bg-gradient-to-br from-[#03140b] via-[#020d07] to-[#052112]',
    accentBorder: 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    tagColor: 'text-emerald-400 bg-emerald-500/15',
  },
  {
    id: 'midnight_synth',
    name: 'Midnight Synthwave',
    badge: 'Sunset LoFi',
    description: 'Warm dusk purple, magenta sunset glow, and ambient 80s synth aesthetic.',
    previewBg: 'bg-gradient-to-br from-[#1a052e] via-[#0f041d] to-[#250836]',
    accentBorder: 'border-pink-500/60 shadow-[0_0_15px_rgba(236,72,153,0.25)]',
    tagColor: 'text-pink-400 bg-pink-500/15',
  },
];

export const ThemeSkinModal: React.FC<ThemeSkinModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeSkin, setActiveSkin] = useState<ThemeSkin>(() => {
    try {
      return (localStorage.getItem('paio_theme_skin') as ThemeSkin) || 'deep_space';
    } catch {
      return 'deep_space';
    }
  });

  const [soundtrackStatus, setSoundtrackStatus] = useState(dynamicSoundtrack.getStatus());
  const [selectedTrack, setSelectedTrack] = useState<SoundtrackTrack>(soundtrackStatus.currentTrack);
  const [sfxOn, setSfxOn] = useState(soundtrackStatus.sfxEnabled);
  const [volume, setVolume] = useState(soundtrackStatus.volume);

  useEffect(() => {
    const handleState = (e: any) => {
      setSoundtrackStatus(e.detail);
      setSelectedTrack(e.detail.currentTrack);
      setSfxOn(e.detail.sfxEnabled);
      setVolume(e.detail.volume);
    };
    window.addEventListener('paio:soundtrack-state', handleState);
    return () => window.removeEventListener('paio:soundtrack-state', handleState);
  }, []);

  if (!isOpen) return null;

  const handleApplySkin = (skin: ThemeSkin) => {
    setActiveSkin(skin);
    try {
      localStorage.setItem('paio_theme_skin', skin);
      document.body.classList.remove('theme-cyberpunk', 'theme-terminal', 'theme-synthwave');
      if (skin === 'cyberpunk') document.body.classList.add('theme-cyberpunk');
      if (skin === 'terminal_green') document.body.classList.add('theme-terminal');
      if (skin === 'midnight_synth') document.body.classList.add('theme-synthwave');
    } catch {}
    dynamicSoundtrack.playHapticSound('click');
    onShowToast(`🎨 Activated "${THEME_OPTIONS.find((t) => t.id === skin)?.name}" visual skin!`);
  };

  const handleToggleSoundtrack = () => {
    const playing = dynamicSoundtrack.togglePlay();
    onShowToast(playing ? '🎵 Dynamic Room Soundtrack resumed' : '🔇 Dynamic Room Soundtrack paused');
  };

  const handleTrackChange = (t: SoundtrackTrack) => {
    setSelectedTrack(t);
    dynamicSoundtrack.setTrack(t);
    onShowToast(`🎧 Switched ambient channel to ${t.replace('_', ' ').toUpperCase()}`);
  };

  const handleToggleSfx = () => {
    const next = !sfxOn;
    setSfxOn(next);
    dynamicSoundtrack.setSfxEnabled(next);
    if (next) dynamicSoundtrack.playHapticSound('task_complete');
    onShowToast(next ? '🔊 Tactile sound effects enabled' : '🔇 Tactile sound effects muted');
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950/85 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-zinc-900/60 to-cyan-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 text-white font-black shadow-lg">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Visual Skins &amp; Dynamic Room Soundtrack
                </h2>
                <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-black text-cyan-300">
                  Hacker Aesthetic
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Glassmorphism styling, ambient LoFi soundscapes, and tactile haptic feedback
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* SECTION 1: 4 AESTHETIC VISUAL SKINS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                1. Visual Skins (Glassmorphism + Neon Accents)
              </span>
              <span className="text-[10px] text-zinc-500">Instant real-time preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = activeSkin === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => handleApplySkin(theme.id)}
                    className={`relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 overflow-hidden ${
                      theme.previewBg
                    } ${
                      isSelected
                        ? `${theme.accentBorder} ring-2 ring-cyan-500/40 scale-[1.01]`
                        : 'border-white/10 hover:border-white/20 hover:scale-[1.005]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-sm font-black text-white">{theme.name}</h4>
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase mt-1 ${theme.tagColor}`}>
                          {theme.badge}
                        </span>
                      </div>
                      {isSelected ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-black shadow-md font-bold text-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-white/20" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {theme.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: DYNAMIC ROOM SOUNDTRACK */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  2. Dynamic Room Soundtrack (Auto-LoFi &amp; Ambient)
                </span>
                {soundtrackStatus.isPlaying && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleToggleSoundtrack}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all shadow-md ${
                  soundtrackStatus.isPlaying
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:brightness-110'
                }`}
              >
                {soundtrackStatus.isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{soundtrackStatus.isPlaying ? 'Pause Audio' : 'Start Soundscape'}</span>
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Ambient audio automatically shifts when you switch tabs (focus LoFi on tasks/notes, auto-ducks during videos/calls, and switches to night-synth past midnight).
            </p>

            {/* Channels */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'lofi_rain' as SoundtrackTrack, label: 'Cyberpunk Rain', sub: 'LoFi Chord Pad' },
                { id: 'alpha_waves' as SoundtrackTrack, label: '432Hz Alpha', sub: 'Deep Cognitive Beat' },
                { id: 'midnight_synth' as SoundtrackTrack, label: 'Midnight Synth', sub: 'Retro Drone' },
                { id: 'rainy_cafe' as SoundtrackTrack, label: 'Rainy Cafe', sub: 'Warm Ambient' },
              ].map((trk) => {
                const isActive = selectedTrack === trk.id;
                return (
                  <button
                    key={trk.id}
                    type="button"
                    onClick={() => handleTrackChange(trk.id)}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      isActive
                        ? 'border-cyan-400 bg-cyan-500/15 text-white font-black ring-1 ring-cyan-400/50'
                        : 'border-white/10 bg-zinc-800/40 text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate">{trk.label}</div>
                    <div className="text-[9px] text-zinc-500 truncate mt-0.5">{trk.sub}</div>
                  </button>
                );
              })}
            </div>

            {/* Volume slider & Tactile Haptic toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 font-bold">Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    dynamicSoundtrack.setVolume(val);
                  }}
                  className="w-32 accent-cyan-400 cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-400">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleSfx}
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                  sfxOn
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-white/10 bg-zinc-800/40 text-zinc-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{sfxOn ? 'Tactile Clicks: ON' : 'Tactile Clicks: OFF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-white/10 bg-zinc-900/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2 text-xs font-black text-white shadow-md hover:brightness-110 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
