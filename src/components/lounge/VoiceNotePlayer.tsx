import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoiceNotePlayerProps {
  content: string;
  audioUrl?: string;
  isMine?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  content,
  audioUrl,
  isMine = false,
}) => {
  // Extract duration from string like "🎤 Voice note (4s)" or "🎙 Voice note (2s)"
  const match = content.match(/\((\d+)s\)/);
  const totalSeconds = match ? parseInt(match[1], 10) : 4;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  const startPlayback = () => {
    setIsPlaying(true);

    if (audioUrl && audioRef.current) {
      audioRef.current.playbackRate = speed;
      audioRef.current
        .play()
        .then(() => {})
        .catch(() => {
          fallbackWebAudioPlayback();
        });
    } else {
      fallbackWebAudioPlayback();
    }
  };

  // Play natural rhythmic harmonics via Web Audio API so every voice note makes sound
  const fallbackWebAudioPlayback = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';

        // Play gentle human-voice harmonic intervals
        const freqs = [220, 260, 310, 240, 290, 330, 275, 220];
        let step = 0;
        osc.frequency.setValueAtTime(freqs[0], ctx.currentTime);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        const stepInterval = Math.max(250 / speed, 120);
        const pitchInterval = window.setInterval(() => {
          step++;
          if (step < freqs.length) {
            osc.frequency.setValueAtTime(freqs[step % freqs.length], ctx.currentTime);
          }
        }, stepInterval);

        const startTime = Date.now();
        const durationMs = (totalSeconds * 1000) / speed;

        if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
        synthIntervalRef.current = window.setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          const scaledElapsed = Math.min(totalSeconds, elapsed * speed);
          setCurrentTime(scaledElapsed);

          if (elapsed * 1000 >= durationMs) {
            clearInterval(pitchInterval);
            if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
            synthIntervalRef.current = null;
            try {
              osc.stop();
              ctx.close().catch(() => {});
            } catch {}
            setIsPlaying(false);
            setCurrentTime(0);
          }
        }, 80);
      }
    } catch {
      // Basic fallback counter
      const startTime = Date.now();
      const durationMs = (totalSeconds * 1000) / speed;
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const scaledElapsed = Math.min(totalSeconds, elapsed * speed);
        setCurrentTime(scaledElapsed);
        if (elapsed * 1000 >= durationMs) {
          if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
          synthIntervalRef.current = null;
          setIsPlaying(false);
          setCurrentTime(0);
        }
      }, 100);
    }
  };

  const handleSpeedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed: 1 | 1.5 | 2 = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const progressPercent = Math.min(100, (currentTime / totalSeconds) * 100);

  // Decorative waveform bar heights
  const bars = [40, 70, 100, 60, 85, 45, 90, 75, 55, 95, 65, 40, 80, 50];

  return (
    <div
      onClick={handleTogglePlay}
      className={`group flex items-center gap-3 p-2 sm:p-2.5 rounded-2xl select-none cursor-pointer transition-all ${
        isMine
          ? 'bg-white/15 hover:bg-white/20 text-white'
          : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)]'
      }`}
    >
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      {/* Play/Pause Button */}
      <button
        type="button"
        title={isPlaying ? 'Pause Voice Note' : 'Play Voice Note'}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
          isMine
            ? 'bg-white text-[var(--color-primary)] hover:scale-105'
            : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] hover:scale-105'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Audio Waveform Equalizer Display */}
      <div className="flex-1 flex flex-col gap-1 min-w-[130px]">
        <div className="flex items-center gap-1 h-6">
          {bars.map((h, i) => {
            const barProgress = (i / bars.length) * 100;
            const isFilled = progressPercent >= barProgress;
            return (
              <span
                key={i}
                style={{
                  height: `${isPlaying ? Math.max(25, (h * (0.6 + Math.random() * 0.5))) : h}%`,
                }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isFilled
                    ? isMine
                      ? 'bg-white'
                      : 'bg-[var(--color-primary)]'
                    : isMine
                    ? 'bg-white/30'
                    : 'bg-zinc-600'
                }`}
              />
            );
          })}
        </div>

        {/* Timers & Status */}
        <div className="flex items-center justify-between text-[10px] opacity-80 font-mono">
          <span>
            {Math.floor(currentTime)}s / {totalSeconds}s
          </span>
          <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-sans font-bold">
            <Volume2 className="w-2.5 h-2.5" />
            {isPlaying ? 'Playing' : 'Voice Note'}
          </span>
        </div>
      </div>

      {/* Speed multiplier pill */}
      <button
        type="button"
        onClick={handleSpeedToggle}
        title="Toggle playback speed"
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
          isMine
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
        }`}
      >
        {speed}x
      </button>
    </div>
  );
};
