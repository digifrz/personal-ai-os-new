import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, Cpu, Database, Check } from 'lucide-react';

interface AppIntroSplashProps {
  onComplete: () => void;
}

export const AppIntroSplash: React.FC<AppIntroSplashProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Step progression
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 700);
    const t3 = setTimeout(() => setStep(3), 1100);
    const t4 = setTimeout(() => setStep(4), 1500);

    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(100, prev + 5);
      });
    }, 70);

    // Auto complete after 1.8s
    const doneTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(doneTimer);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070b14] text-white select-none overflow-hidden"
    >
      {/* Background ambient glowing orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-pink-500/5 blur-[150px]" />
        
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Skip button in top right */}
      <button
        type="button"
        onClick={onComplete}
        className="absolute top-6 right-6 z-20 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
      >
        Skip ✕
      </button>

      {/* Main Core Animation */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-md w-full">
        {/* Logo / Neural Core with layered glowing rings */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative mb-6"
        >
          {/* Outer rotating pulse ring */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 opacity-30 blur-xl animate-pulse" />
          
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-cyan-500/20">
            {/* Spinning decorative tech ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
              className="absolute inset-1 rounded-2xl border border-dashed border-cyan-400/40"
            />
            <Sparkles className="w-10 h-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-400" style={{ fill: 'currentColor' }} />
          </div>
        </motion.div>

        {/* Brand Name & Tagline */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-1 mb-6"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-[10px] font-bold text-cyan-300 tracking-widest uppercase">
            <Cpu className="w-3 h-3" />
            <span>Kernel Booting</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Personal AI OS
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Digital Command Center
          </p>
        </motion.div>

        {/* Micro Boot Log Telemetry */}
        <div className="w-full rounded-2xl border border-white/10 bg-slate-950/60 p-3.5 backdrop-blur-md text-left font-mono text-[11px] space-y-1.5 shadow-xl mb-5">
          <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-white/5 pb-1 mb-1">
            <span>SYSTEM INIT</span>
            <span>V3.8-FLASH ACTIVE</span>
          </div>

          <div className={`flex items-center gap-2 transition-all ${step >= 1 ? 'text-emerald-400' : 'text-slate-600'}`}>
            <span className="shrink-0">{step >= 1 ? '✓' : '○'}</span>
            <span className="truncate">Mounting Cloud Storage Vault (500 MB)</span>
          </div>

          <div className={`flex items-center gap-2 transition-all ${step >= 2 ? 'text-emerald-400' : 'text-slate-600'}`}>
            <span className="shrink-0">{step >= 2 ? '✓' : '○'}</span>
            <span className="truncate">Attaching Workspace Intelligence & Context</span>
          </div>

          <div className={`flex items-center gap-2 transition-all ${step >= 3 ? 'text-cyan-400' : 'text-slate-600'}`}>
            <span className="shrink-0">{step >= 3 ? '✓' : '○'}</span>
            <span className="truncate">Connecting Lounge, Tasks, Notes & Multimodal AI</span>
          </div>

          {step >= 4 && (
            <div className="flex items-center gap-2 text-pink-400 animate-pulse pt-0.5">
              <span>●</span>
              <span>Personal workspace initialized. Welcome!</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>READY</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
