import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CloudRain, Coffee, Sparkles, Radio, Waves, Play, Pause, X } from 'lucide-react';

interface SoundChannel {
  id: 'rain' | 'binaural' | 'cafe' | 'white_noise';
  name: string;
  icon: any;
  color: string;
  volume: number; // 0 to 1
  isActive: boolean;
}

export const AmbientSoundscapeStation: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [channels, setChannels] = useState<SoundChannel[]>([
    { id: 'rain', name: 'Cyberpunk Rain', icon: CloudRain, color: '#38BDF8', volume: 0.6, isActive: true },
    { id: 'binaural', name: '432Hz Alpha Waves', icon: Waves, color: '#A855F7', volume: 0.5, isActive: true },
    { id: 'cafe', name: 'Ambient Cafe Warmth', icon: Coffee, color: '#F59E0B', volume: 0.3, isActive: false },
    { id: 'white_noise', name: 'Deep Space Brown Noise', icon: Radio, color: '#34D399', volume: 0.4, isActive: false },
  ]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ [key: string]: { gain: GainNode; sources: any[] } }>({});

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Start generating ambient synthesized sounds
  const startAudio = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    stopAudio();

    channels.forEach((channel) => {
      if (!channel.isActive) return;

      const channelGain = ctx.createGain();
      channelGain.gain.setValueAtTime(channel.volume * masterVolume, ctx.currentTime);
      channelGain.connect(ctx.destination);

      const sources: any[] = [];

      if (channel.id === 'rain') {
        // Pink/Brown noise filtered for rain sound
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2) * 0.15;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(channelGain);
        whiteNoise.start();
        sources.push(whiteNoise);
      } else if (channel.id === 'binaural') {
        // 432 Hz + 442 Hz (10 Hz binaural beat for deep alpha focus)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(432, ctx.currentTime);
        osc2.frequency.setValueAtTime(442, ctx.currentTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, ctx.currentTime);

        osc1.connect(oscGain);
        osc2.connect(oscGain);
        oscGain.connect(channelGain);

        osc1.start();
        osc2.start();
        sources.push(osc1, osc2);
      } else if (channel.id === 'cafe') {
        // Warm brown noise with gentle modulation
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 1.8;
        }

        const brownSource = ctx.createBufferSource();
        brownSource.buffer = noiseBuffer;
        brownSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        brownSource.connect(filter);
        filter.connect(channelGain);
        brownSource.start();
        sources.push(brownSource);
      } else if (channel.id === 'white_noise') {
        // Deep Space Drone (65 Hz with slight pitch drift)
        const drone = ctx.createOscillator();
        drone.type = 'triangle';
        drone.frequency.setValueAtTime(65, ctx.currentTime);

        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(32.5, ctx.currentTime);

        const droneGain = ctx.createGain();
        droneGain.gain.setValueAtTime(0.2, ctx.currentTime);

        drone.connect(droneGain);
        sub.connect(droneGain);
        droneGain.connect(channelGain);

        drone.start();
        sub.start();
        sources.push(drone, sub);
      }

      nodesRef.current[channel.id] = { gain: channelGain, sources };
    });

    setIsPlaying(true);
  };

  const stopAudio = () => {
    Object.values(nodesRef.current).forEach((node) => {
      node.sources.forEach((s) => {
        try {
          s.stop();
          s.disconnect();
        } catch {}
      });
      try {
        node.gain.disconnect();
      } catch {}
    });
    nodesRef.current = {};
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const toggleChannel = (id: SoundChannel['id']) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const updateVolume = (id: SoundChannel['id'], vol: number) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, volume: vol } : c))
    );

    if (nodesRef.current[id] && audioCtxRef.current) {
      nodesRef.current[id].gain.gain.setValueAtTime(
        vol * masterVolume,
        audioCtxRef.current.currentTime
      );
    }
  };

  // Restart audio if channels change while active
  useEffect(() => {
    if (isPlaying) {
      startAudio();
    }
  }, [channels.map((c) => c.isActive).join(',')]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-gradient-to-r from-cyan-950/30 via-[var(--color-surface)] to-purple-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-md">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[var(--color-text)]">
                Spatial Audio Focus Station
              </h3>
              <p className="text-[10px] text-[var(--color-muted)] font-mono">
                Web Audio Synth · Zero Bandwidth · Infinite Loops
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-md ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause Station' : 'Play Soundscape'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Channels Mixer */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <div
                  key={channel.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    channel.isActive
                      ? 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
                      : 'bg-[var(--color-surface)] opacity-50 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleChannel(channel.id)}
                        className={`p-1.5 rounded-xl border transition-all ${
                          channel.isActive
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'border-[var(--color-border)] text-[var(--color-muted)]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-[var(--color-text)]">
                        {channel.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-[var(--color-muted)]">
                      {Math.round(channel.volume * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={channel.volume}
                    disabled={!channel.isActive}
                    onChange={(e) => updateVolume(channel.id, parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          {/* Master Volume */}
          <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-[var(--color-muted)] uppercase">
              Master Level
            </span>
            <div className="flex items-center gap-2 w-1/2">
              <Volume2 className="w-3.5 h-3.5 text-[var(--color-muted)] shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMasterVolume(val);
                  channels.forEach((c) => updateVolume(c.id, c.volume));
                }}
                className="w-full accent-indigo-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between text-[11px] text-[var(--color-muted)]">
          <span>Synthesized in real-time by Web Audio API</span>
          <span className="text-emerald-400 font-mono font-bold">100% Offline Capable</span>
        </div>
      </div>
    </div>
  );
};
