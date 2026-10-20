import React, { useState, useEffect } from 'react';
import {
  Layers,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Clock,
  Radio,
  MessageSquare,
  Music,
  Sparkles,
  FileText,
  FolderKanban,
  CheckSquare,
  Cloud,
  Check,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronUp,
  Flame,
  DollarSign,
  Sun,
  Waves,
  Dices,
} from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';

export interface OSTaskbarProps {
  onOpenAppHub?: () => void;
  onOpenDirectChat?: () => void;
  onOpenVoiceRoom?: () => void;
  onOpenSpotify?: () => void;
  onOpenAssistant?: () => void;
  onOpenScratchpad?: () => void;
  onOpenFiles?: () => void;
  onOpenTasks?: () => void;
  onOpenHabits?: () => void;
  onOpenFinance?: () => void;
  onOpenDailyBriefing?: () => void;
  onOpenRoastHype?: () => void;
  onOpenDecisionWheel?: () => void;
  onOpenSoundscape?: () => void;
}

export const OSTaskbar: React.FC<OSTaskbarProps> = ({
  onOpenAppHub,
  onOpenDirectChat,
  onOpenVoiceRoom,
  onOpenSpotify,
  onOpenAssistant,
  onOpenScratchpad,
  onOpenFiles,
  onOpenTasks,
  onOpenHabits,
  onOpenFinance,
  onOpenDailyBriefing,
  onOpenRoastHype,
  onOpenDecisionWheel,
  onOpenSoundscape,
}) => {
  const {
    windows,
    activeWindowId,
    osMode,
    toggleOsMode,
    restoreWindow,
    minimizeWindow,
    closeWindow,
    focusWindow,
    openWindow,
  } = useWindowManager();

  const [timeStr, setTimeStr] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[9999] h-12 bg-[var(--color-surface)]/90 backdrop-blur-2xl border-t border-[var(--color-border)] px-3 flex items-center justify-between select-none shadow-[0_-10px_25px_rgba(0,0,0,0.3)]">
      {/* Left: OS Launcher & Quick Dock */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Launcher Button */}
        <button
          type="button"
          onClick={() => setIsLauncherOpen(!isLauncherOpen)}
          title="Personal AI OS Launcher"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-3 py-1.5 text-xs font-black text-white shadow-md hover:brightness-110 transition-all shrink-0"
        >
          <span className="text-sm">✦</span>
          <span className="hidden sm:inline font-extrabold tracking-tight">OS Start</span>
        </button>

        {/* View Mode Switcher (Fullscreen Tabbed <-> Multi-Window Desktop) */}
        <button
          type="button"
          onClick={toggleOsMode}
          title={osMode === 'desktop' ? 'Switch to Fullscreen Tabbed View' : 'Switch to Multi-Window Desktop Canvas'}
          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all shrink-0 ${
            osMode === 'desktop'
              ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300 shadow-sm'
              : 'border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{osMode === 'desktop' ? 'Desktop Mode' : 'Tab View'}</span>
        </button>

        <div className="h-4 w-[1px] bg-[var(--color-border)] mx-1 hidden sm:block" />

        {/* Quick Launch Icons */}
        <div className="hidden lg:flex items-center gap-1">
          {onOpenVoiceRoom && (
            <button
              type="button"
              onClick={onOpenVoiceRoom}
              title="Open Voice Lounge Stage"
              className="p-1.5 rounded-lg hover:bg-violet-500/20 text-violet-400 hover:text-white transition-colors"
            >
              <Radio className="w-4 h-4" />
            </button>
          )}

          {onOpenDirectChat && (
            <button
              type="button"
              onClick={onOpenDirectChat}
              title="Open Direct Messages"
              className="p-1.5 rounded-lg hover:bg-pink-500/20 text-pink-400 hover:text-white transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}

          {onOpenSpotify && (
            <button
              type="button"
              onClick={onOpenSpotify}
              title="Open Spotify OS Player"
              className="p-1.5 rounded-lg hover:bg-[#1DB954]/20 text-[#1DB954] transition-colors"
            >
              <Music className="w-4 h-4" />
            </button>
          )}

          {onOpenAssistant && (
            <button
              type="button"
              onClick={onOpenAssistant}
              title="Open AI Assistant"
              className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-indigo-400 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {onOpenScratchpad && (
            <button
              type="button"
              onClick={onOpenScratchpad}
              title="Open Quick Notes Scratchpad"
              className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-colors"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

          {onOpenHabits && (
            <button
              type="button"
              onClick={onOpenHabits}
              title="Open Habits & Streaks"
              className="p-1.5 rounded-lg hover:bg-orange-500/20 text-orange-400 transition-colors"
            >
              <Flame className="w-4 h-4" />
            </button>
          )}

          {onOpenFinance && (
            <button
              type="button"
              onClick={onOpenFinance}
              title="Open Personal Finance Ledger"
              className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
            </button>
          )}

          {onOpenDailyBriefing && (
            <button
              type="button"
              onClick={onOpenDailyBriefing}
              title="Open Daily AI Executive Briefing"
              className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-300 transition-colors"
            >
              <Sun className="w-4 h-4" />
            </button>
          )}

          {onOpenRoastHype && (
            <button
              type="button"
              onClick={onOpenRoastHype}
              title="AI Motivation Coach & Workspace Roast"
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors"
            >
              <Flame className="w-4 h-4" />
            </button>
          )}

          {onOpenDecisionWheel && (
            <button
              type="button"
              onClick={onOpenDecisionWheel}
              title="Decision Wheel of Destiny"
              className="p-1.5 rounded-lg hover:bg-violet-500/20 text-violet-400 transition-colors"
            >
              <Dices className="w-4 h-4" />
            </button>
          )}

          {onOpenSoundscape && (
            <button
              type="button"
              onClick={onOpenSoundscape}
              title="Spatial Audio Focus Synthesizer"
              className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-400 transition-colors"
            >
              <Waves className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Center: Running App Window Tabs */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto px-3 max-w-2xl scrollbar-none">
        {windows.map((win) => {
          const isActive = activeWindowId === win.id && !win.isMinimized;
          return (
            <div
              key={win.id}
              onClick={() => {
                if (win.isMinimized) {
                  restoreWindow(win.id);
                } else if (isActive) {
                  minimizeWindow(win.id);
                } else {
                  focusWindow(win.id);
                }
              }}
              className={`group flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs cursor-pointer transition-all max-w-[160px] truncate shrink-0 ${
                isActive
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-text)] font-extrabold shadow-sm ring-1 ring-[var(--color-primary)]/40'
                  : win.isMinimized
                  ? 'border-[var(--color-border)]/60 bg-[var(--color-bg-secondary)]/40 text-[var(--color-muted)] hover:text-[var(--color-text)] opacity-75'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {win.icon && <span className="text-xs shrink-0">{win.icon}</span>}
              <span className="truncate">{win.title}</span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeWindow(win.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity ml-1"
                title="Close"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Right: Cloud Sync Status & Digital Clock */}
      <div className="flex items-center gap-2.5 shrink-0 text-xs">
        {/* Cloud Firestore Live Sync Status */}
        <div
          title={isOnline ? 'Cloud Firestore live sync active with IndexedDB offline cache' : 'Offline mode active. Changes queued in local cache.'}
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[11px] font-bold"
        >
          {isOnline ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-emerald-400">Cloud Synced</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-400">Offline Cache</span>
            </>
          )}
        </div>

        {/* Digital Clock */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[var(--color-text)] px-1">
          <Clock className="w-3.5 h-3.5 text-[var(--color-muted)]" />
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Launcher Flyout Menu */}
      {isLauncherOpen && (
        <>
          <div
            onClick={() => setIsLauncherOpen(false)}
            className="fixed inset-0 z-30"
          />
          <div className="absolute bottom-14 left-3 z-40 w-72 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 shadow-2xl space-y-2 backdrop-blur-2xl animate-fade-in">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-[var(--color-border)]">
              <span className="text-xs font-black tracking-tight text-[var(--color-text)]">
                Personal AI OS Hub
              </span>
              <span className="text-[10px] text-violet-400 font-bold">Multi-Window</span>
            </div>

            <div className="space-y-1">
              {[
                { name: 'Community Lounge Stage', icon: Radio, action: onOpenVoiceRoom, color: 'text-violet-400 hover:bg-violet-500/10' },
                { name: 'Direct Chat Threads', icon: MessageSquare, action: onOpenDirectChat, color: 'text-pink-400 hover:bg-pink-500/10' },
                { name: 'Spotify Focus Player', icon: Music, action: onOpenSpotify, color: 'text-[#1DB954] hover:bg-[#1DB954]/10' },
                { name: 'Dual AI Assistant', icon: Sparkles, action: onOpenAssistant, color: 'text-indigo-400 hover:bg-indigo-500/10' },
                { name: 'Quick Scratchpad', icon: FileText, action: onOpenScratchpad, color: 'text-amber-400 hover:bg-amber-500/10' },
                { name: 'Workspace Files', icon: FolderKanban, action: onOpenFiles, color: 'text-blue-400 hover:bg-blue-500/10' },
                { name: 'Task Manager', icon: CheckSquare, action: onOpenTasks, color: 'text-emerald-400 hover:bg-emerald-500/10' },
              ].map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setIsLauncherOpen(false);
                    if (item.action) item.action();
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-[var(--color-text)] transition-colors ${item.color}`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </footer>
  );
};
