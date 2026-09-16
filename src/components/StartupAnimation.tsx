import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Database, Cpu } from 'lucide-react';

interface StartupAnimationProps {
  onComplete: () => void;
}

const BOOT_STEPS = [
  { label: 'Initializing secure kernel runtime', icon: Cpu, progress: 28 },
  { label: 'Synchronizing Firestore & ABAC rules', icon: Database, progress: 58 },
  { label: 'Connecting Gemini 3.6 Flash neural proxy', icon: Sparkles, progress: 85 },
  { label: 'Workspace authenticated & ready', icon: ShieldCheck, progress: 100 },
];

export const StartupAnimation: React.FC<StartupAnimationProps> = ({ onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    timers.push(
      setTimeout(() => {
        setStepIndex(1);
        setProgress(58);
      }, 450)
    );

    timers.push(
      setTimeout(() => {
        setStepIndex(2);
        setProgress(85);
      }, 950)
    );

    timers.push(
      setTimeout(() => {
        setStepIndex(3);
        setProgress(100);
      }, 1450)
    );

    timers.push(
      setTimeout(() => {
        onComplete();
      }, 1950)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const CurrentIcon = BOOT_STEPS[stepIndex].icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#080D18] overflow-hidden select-none"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.25, 1.1],
            opacity: [0.18, 0.32, 0.22],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,#8B5CF6_0%,rgba(34,211,238,0.25)_40%,transparent_70%)] blur-3xl"
        />
      </div>

      {/* Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 max-w-md w-full text-center">
        {/* Animated Central Emblem */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Pulsing Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute h-28 w-28 rounded-3xl border border-dashed border-[#8B5CF6]/40"
          />

          {/* Secondary Counter-rotating Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="absolute h-32 w-32 rounded-full border border-[var(--color-border)]/60"
          />

          {/* Glowing Center Core */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'backOut' }}
            className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#8B5CF6] via-[#A78BFA] to-[#22D3EE] shadow-[0_0_50px_rgba(139,92,246,0.45)]"
          >
            <motion.span
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="text-3xl font-black text-white drop-shadow-md"
            >
              ✦
            </motion.span>
          </motion.div>
        </div>

        {/* Title & Brand */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#A78BFA]">
            Autonomous Workspace Engine
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Personal AI OS
          </h1>
          <p className="mt-1 text-xs text-[#94A3B8]">
            Unified Intelligence • Private Cloud Command Center
          </p>
        </motion.div>

        {/* Progress Bar Container */}
        <div className="mt-8 w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#111827] border border-[#26344A]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#C4B5FD] to-[#22D3EE] rounded-full"
              initial={{ width: '15%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          </div>

          {/* Current Step Status */}
          <div className="mt-3.5 flex items-center justify-between text-xs text-[#94A3B8]">
            <motion.span
              key={stepIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 font-medium text-slate-300"
            >
              <CurrentIcon className="h-3.5 w-3.5 text-[#8B5CF6] animate-pulse" />
              <span>{BOOT_STEPS[stepIndex].label}</span>
            </motion.span>

            <span className="font-mono text-[11px] text-[#A78BFA] font-bold">
              {progress}%
            </span>
          </div>
        </div>

        {/* Skip button for rapid interaction */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          whileHover={{ opacity: 1 }}
          onClick={onComplete}
          className="mt-6 text-[11px] font-semibold text-[#94A3B8] hover:text-white transition-opacity underline-offset-4 hover:underline"
        >
          Skip animation
        </motion.button>
      </div>
    </motion.div>
  );
};
