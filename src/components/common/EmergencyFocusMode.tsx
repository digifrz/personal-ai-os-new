import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, X, Play, Pause, Waves, Sparkles, Flame, Volume2, VolumeX } from 'lucide-react';
import { TaskItem } from '../../types';

interface EmergencyFocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onCompleteTask: (taskId: string) => void;
}

export const EmergencyFocusMode: React.FC<EmergencyFocusModeProps> = ({
  isOpen,
  onClose,
  tasks,
  onCompleteTask,
}) => {
  const topTask = tasks.find((t) => t.status !== 'done');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25m
  const [isRunning, setIsRunning] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const oscRef = React.useRef<OscillatorNode | null>(null);

  // Focus binaural drone (432Hz sine tone)
  useEffect(() => {
    if (isAudioOn && isOpen) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(432, ctx.currentTime);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          oscRef.current = osc;
        }
      } catch {}
    } else {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch {}
        oscRef.current = null;
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
        audioCtxRef.current = null;
      }
    }

    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
        } catch {}
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, [isAudioOn, isOpen]);

  useEffect(() => {
    let interval: any = null;
    if (isOpen && isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isRunning, timeLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleFinish = () => {
    if (topTask) {
      onCompleteTask(topTask.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-fade-in select-none">
      <div className="w-full max-w-2xl text-center space-y-8">
        {/* Top Indicator */}
        <div className="flex items-center justify-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-widest font-black animate-pulse">
          <ShieldAlert className="w-4 h-4" />
          <span>Emergency Deep Focus Protocol · All Distractions Suppressed</span>
        </div>

        {/* The One Single Task */}
        <div className="p-8 rounded-3xl border border-rose-500/30 bg-gradient-to-b from-rose-950/20 via-zinc-950/40 to-black space-y-3 shadow-2xl relative overflow-hidden">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
            Current Single Objective
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            {topTask?.title || 'Conquer your high-friction priority'}
          </h2>
          {topTask?.description && (
            <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
              {topTask.description}
            </p>
          )}

          {/* Pomodoro Timer */}
          <div className="py-4">
            <span className="font-mono text-6xl sm:text-7xl font-black text-rose-400 tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              {timeFormatted}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-xs font-black text-white shadow-xl transition-all hover:scale-105"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Mark Completed &amp; Unlock OS</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-1.5 rounded-2xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 px-4 py-3 text-xs font-bold text-zinc-300 transition-all"
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'Pause Timer' : 'Resume'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAudioOn(!isAudioOn)}
              className={`flex items-center gap-1.5 rounded-2xl border px-4 py-3 text-xs font-bold transition-all ${
                isAudioOn
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                  : 'border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-white'
              }`}
            >
              {isAudioOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>432Hz Drone</span>
            </button>
          </div>
        </div>

        {/* Emergency Escape */}
        <div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-300 font-mono transition-colors"
          >
            Press here to abort lockdown and return to desktop
          </button>
        </div>
      </div>
    </div>
  );
};
