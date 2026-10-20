import React, { useState, useEffect } from 'react';
import { Droplet, Eye, RotateCcw, Play, Pause, Bell, Check, Sparkles } from 'lucide-react';

export const WellnessWidget: React.FC = () => {
  // Water Intake state (persisted in localStorage for today)
  const todayKey = new Date().toISOString().split('T')[0];
  const [glasses, setGlasses] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`wellness_water_${todayKey}`);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const TARGET_GLASSES = 8; // 8 x 250ml = 2.0 Liters

  const handleDrinkGlass = () => {
    setGlasses((prev) => {
      const next = Math.min(TARGET_GLASSES + 4, prev + 1);
      try {
        localStorage.setItem(`wellness_water_${todayKey}`, next.toString());
      } catch {}
      return next;
    });
  };

  const handleResetWater = () => {
    setGlasses(0);
    try {
      localStorage.setItem(`wellness_water_${todayKey}`, '0');
    } catch {}
  };

  // 20-20-20 Screen Rest Timer (20 minutes work -> 20 seconds look 20 ft away)
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 mins
  const [isRunning, setIsRunning] = useState(false);
  const [isBreakTime, setIsBreakTime] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (!isBreakTime) {
        // Trigger 20-second break
        setIsBreakTime(true);
        setTimeLeft(20);
        // Play subtle audio alert if possible
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch {}
      } else {
        // Break finished, reset to 20 minutes
        setIsBreakTime(false);
        setTimeLeft(20 * 60);
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, isBreakTime]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Hydro Glass Tracker */}
      <div className="p-4 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-400">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--color-text)]">Hydration Target</h3>
              <p className="text-[10px] text-[var(--color-muted)]">2.0L Daily Goal (8 glasses)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-cyan-400">
              {glasses} / {TARGET_GLASSES}
            </span>
            <button
              type="button"
              onClick={handleResetWater}
              className="text-[10px] text-[var(--color-muted)] hover:text-red-400"
              title="Reset today's water"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Glasses Visual Icons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from({ length: TARGET_GLASSES }).map((_, idx) => {
            const isFilled = idx < glasses;
            return (
              <button
                key={idx}
                type="button"
                onClick={handleDrinkGlass}
                className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-all ${
                  isFilled
                    ? 'border-cyan-400 bg-cyan-500/30 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:border-cyan-500/50'
                }`}
                title={`Glass ${idx + 1} (${(idx + 1) * 250} ml)`}
              >
                <Droplet className={`w-3.5 h-3.5 ${isFilled ? 'fill-cyan-400 text-cyan-400' : ''}`} />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleDrinkGlass}
          className="w-full py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
        >
          <Droplet className="w-3.5 h-3.5" />
          <span>+ Log 250ml Water Glass</span>
        </button>
      </div>

      {/* 20-20-20 Eye Rest & Screen Break Companion */}
      <div className={`p-4 rounded-3xl border transition-all space-y-3 ${
        isBreakTime
          ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
          : 'bg-[var(--color-surface)] border-[var(--color-border)]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-xl ${isBreakTime ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--color-text)]">
                {isBreakTime ? '👀 Eye Rest Break!' : '20-20-20 Screen Rest'}
              </h3>
              <p className="text-[10px] text-[var(--color-muted)]">
                {isBreakTime ? 'Look at something 20ft away for 20s' : 'Protect vision & prevent fatigue'}
              </p>
            </div>
          </div>

          <span className={`font-mono text-sm font-black tabular-nums ${isBreakTime ? 'text-amber-400 animate-pulse' : 'text-[var(--color-text)]'}`}>
            {formatTimer(timeLeft)}
          </span>
        </div>

        <div className="h-1.5 w-full bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${isBreakTime ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, Math.max(0, 100 - (timeLeft / (isBreakTime ? 20 : 1200)) * 100))}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pause Interval' : 'Start Focus Timer'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setIsBreakTime(false);
              setTimeLeft(20 * 60);
            }}
            className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5"
            title="Reset timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
