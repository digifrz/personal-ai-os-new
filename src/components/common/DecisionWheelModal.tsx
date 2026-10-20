import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, RefreshCw, X, Check, Dices, ArrowRight } from 'lucide-react';
import { TaskItem } from '../../types';

interface DecisionWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onNavigateTab: (tab: string) => void;
}

const DEFAULT_OPTIONS = [
  'Crush Top Priority Task',
  '25m Deep Focus Sprint',
  '10m Quick Inbox Zero',
  'Hydrate & 5m Stretch',
  'Review Vision Board',
  'Draft Next Milestone',
];

export const DecisionWheelModal: React.FC<DecisionWheelModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onNavigateTab,
}) => {
  const [mode, setMode] = useState<'wheel' | 'coin'>('wheel');
  const [options, setOptions] = useState<string[]>(() => {
    const open = tasks.filter((t) => t.status !== 'done').slice(0, 6).map((t) => t.title);
    return open.length >= 2 ? open : DEFAULT_OPTIONS;
  });

  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [coinSide, setCoinSide] = useState<'HEADS' | 'TAILS' | null>(null);
  const [isFlippingCoin, setIsFlippingCoin] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef(0);
  const spinVelocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Play synthesized tick sound using Web Audio API
  const playTickSound = (freq = 440) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  };

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = width / 2 - 16;
    const centerX = width / 2;
    const centerY = height / 2;
    const arc = (2 * Math.PI) / options.length;

    ctx.clearRect(0, 0, width, height);

    const colors = [
      '#6366F1', // indigo
      '#EC4899', // pink
      '#3B82F6', // blue
      '#10B981', // emerald
      '#F59E0B', // amber
      '#8B5CF6', // purple
    ];

    options.forEach((opt, i) => {
      const startAngle = angle + i * arc;
      const endAngle = startAngle + arc;

      // Slice
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      // Border line
      ctx.strokeStyle = '#080D18';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Inter, sans-serif';

      const truncated = opt.length > 18 ? opt.slice(0, 16) + '…' : opt;
      ctx.fillText(truncated, radius - 18, 5);
      ctx.restore();
    });

    // Center circular hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center jewel
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#38BDF8';
    ctx.fill();

    // Pointer at top (pointing downward into wheel)
    ctx.beginPath();
    ctx.moveTo(centerX - 12, 6);
    ctx.lineTo(centerX + 12, 6);
    ctx.lineTo(centerX, 26);
    ctx.closePath();
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    if (isOpen && mode === 'wheel') {
      drawWheel(currentAngleRef.current);
    }
  }, [isOpen, mode, options]);

  const spinWheel = () => {
    if (isSpinning || options.length < 2) return;
    setIsSpinning(true);
    setSelectedWinner(null);

    // Initial random velocity between 0.35 and 0.55 rad/frame
    spinVelocityRef.current = 0.35 + Math.random() * 0.2;
    let lastTickAngle = currentAngleRef.current;

    const animate = () => {
      currentAngleRef.current += spinVelocityRef.current;
      spinVelocityRef.current *= 0.985; // Decelerate smoothly

      // Trigger audio tick when passing slices
      const arc = (2 * Math.PI) / options.length;
      if (Math.abs(currentAngleRef.current - lastTickAngle) >= arc) {
        playTickSound(350 + Math.random() * 100);
        lastTickAngle = currentAngleRef.current;
      }

      drawWheel(currentAngleRef.current);

      if (spinVelocityRef.current > 0.002) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        // Calculate winner pointed at by top arrow (top is at -PI/2 or 3PI/2)
        const normalized = (currentAngleRef.current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const topAngle = (3 * Math.PI) / 2;
        let relative = (topAngle - normalized) % (2 * Math.PI);
        if (relative < 0) relative += 2 * Math.PI;

        const winningIndex = Math.floor(relative / arc) % options.length;
        setSelectedWinner(options[winningIndex]);
        playTickSound(880);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const flipCoin = () => {
    if (isFlippingCoin) return;
    setIsFlippingCoin(true);
    setCoinSide(null);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      playTickSound(500 + count * 20);
      if (count > 15) {
        clearInterval(interval);
        const result = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
        setCoinSide(result);
        setIsFlippingCoin(false);
        playTickSound(result === 'HEADS' ? 880 : 660);
      }
    }, 80);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-gradient-to-r from-violet-950/30 to-indigo-950/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-violet-500/20 text-violet-400">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--color-text)]">
                Procrastination Killer &amp; Destiny Decider
              </h3>
              <p className="text-[10px] text-[var(--color-muted)] font-mono">
                Cannot decide? Let physics take the wheel.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex p-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] text-xs">
          <button
            type="button"
            onClick={() => setMode('wheel')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              mode === 'wheel' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[var(--color-muted)]'
            }`}
          >
            Wheel of Destiny
          </button>
          <button
            type="button"
            onClick={() => setMode('coin')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              mode === 'coin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[var(--color-muted)]'
            }`}
          >
            Quantum Coin Flip
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center justify-center space-y-4">
          {mode === 'wheel' ? (
            <>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={280}
                  className="rounded-full shadow-2xl drop-shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                />
              </div>

              {selectedWinner && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-indigo-950/40 border border-emerald-500/40 text-center animate-bounce space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono tracking-wider">
                    Destiny Selected:
                  </span>
                  <p className="text-sm font-black text-white">{selectedWinner}</p>
                </div>
              )}

              <button
                type="button"
                onClick={spinWheel}
                disabled={isSpinning}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 hover:brightness-110 text-xs font-black text-white shadow-lg transition-all disabled:opacity-50"
              >
                {isSpinning ? 'Deciding Your Fate...' : '🎲 Spin the Wheel'}
              </button>
            </>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center space-y-6 w-full">
              <div className={`h-32 w-32 rounded-full border-4 flex items-center justify-center font-black text-2xl shadow-2xl transition-all ${
                coinSide === 'HEADS'
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-amber-500/30'
                  : coinSide === 'TAILS'
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-cyan-500/30'
                  : 'border-indigo-500/40 bg-[var(--color-bg-secondary)] text-[var(--color-muted)]'
              } ${isFlippingCoin ? 'animate-spin' : ''}`}>
                {coinSide || (isFlippingCoin ? '?' : 'FLIP')}
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-[var(--color-text)]">
                  {coinSide ? `Result: ${coinSide}! Proceed immediately.` : 'Heads = Action A · Tails = Action B'}
                </p>
                <p className="text-[10px] text-[var(--color-muted)]">
                  Eliminate decision paralysis in 0.8 seconds.
                </p>
              </div>

              <button
                type="button"
                onClick={flipCoin}
                disabled={isFlippingCoin}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:brightness-110 text-xs font-black text-white shadow-lg transition-all disabled:opacity-50"
              >
                {isFlippingCoin ? 'Flipping Quantum Coin...' : '🪙 Flip Quantum Coin'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between text-[11px] text-[var(--color-muted)]">
          <span>Anti-Procrastination Protocol</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-[var(--color-text)] hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
