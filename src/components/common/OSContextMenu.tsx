import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  CheckSquare,
  FileText,
  Sparkles,
  Terminal,
  Palette,
  Printer,
  Bell,
  Crown,
  Search,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { requestWebNotificationPermission, notifyTaskReady } from '../../services/webNotifications';

interface OSContextMenuProps {
  onOpenTaskModal?: () => void;
  onOpenNoteModal?: () => void;
  onOpenAI?: () => void;
  onToggleGhostWriter?: () => void;
  onOpenThemeSkinModal?: () => void;
  onOpenUpgradeModal?: () => void;
  onOpenSearch?: () => void;
  onShowToast?: (msg: string) => void;
  onExportPDF?: () => void;
}

export const OSContextMenu: React.FC<OSContextMenuProps> = ({
  onOpenTaskModal,
  onOpenNoteModal,
  onOpenAI,
  onToggleGhostWriter,
  onOpenThemeSkinModal,
  onOpenUpgradeModal,
  onOpenSearch,
  onShowToast,
  onExportPDF,
}) => {
  const { theme, setTheme, profile } = useAuth();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Allow native menu on form inputs if text is selected for typing
      const target = e.target as HTMLElement;
      if (
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        window.getSelection()?.toString()
      ) {
        return;
      }

      e.preventDefault();
      const selection = window.getSelection()?.toString().trim() || '';
      setSelectedText(selection);

      // Clamp position to viewport bounds
      const menuWidth = 240;
      const menuHeight = 360;
      const x = Math.min(e.clientX, window.innerWidth - menuWidth - 12);
      const y = Math.min(e.clientY, window.innerHeight - menuHeight - 12);

      setPosition({ x: Math.max(8, x), y: Math.max(8, y) });
      setVisible(true);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!visible) return null;

  const handleAction = (callback?: () => void) => {
    setVisible(false);
    callback?.();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
      onShowToast?.('Entered Zen Fullscreen Mode');
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
      onShowToast?.('Exited Zen Fullscreen Mode');
    }
  };

  const handleCopySelection = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      onShowToast?.('Copied to clipboard!');
    }
  };

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    onShowToast?.(`Switched to ${next.toUpperCase()} mode`);
  };

  const handleWebNotifications = async () => {
    const granted = await requestWebNotificationPermission();
    if (granted) {
      onShowToast?.('🔔 Web Notifications: Enabled & Active!');
      notifyTaskReady('Web Notifications Activated', 'Personal AI OS will notify your browser when tasks are ready.');
    } else {
      onShowToast?.('Please enable notifications in your browser permissions.');
    }
  };

  const handlePrintPDF = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      window.print();
    }
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      className="fixed z-[99999] w-64 rounded-2xl border border-white/15 bg-zinc-950/90 p-1.5 text-xs text-white shadow-2xl backdrop-blur-2xl animate-fade-in font-sans select-none ring-1 ring-white/10"
    >
      {/* Header OS Badge */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 mb-1 text-[10px] font-mono text-zinc-400">
        <span className="flex items-center gap-1.5 font-bold text-zinc-200">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          PERSONAL AI OS
        </span>
        <span className="text-zinc-500">v2.5</span>
      </div>

      {/* Copy selection option if text is selected */}
      {selectedText && (
        <>
          <button
            type="button"
            onClick={() => handleAction(handleCopySelection)}
            className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-cyan-500/20 text-cyan-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Selection</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[80px]">
              "{selectedText.slice(0, 10)}..."
            </span>
          </button>
          <div className="my-1 border-t border-white/10" />
        </>
      )}

      {/* Primary Creation Actions */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => handleAction(onOpenTaskModal)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-white/10 text-zinc-200 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Task</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">T</span>
        </button>

        <button
          type="button"
          onClick={() => handleAction(onOpenNoteModal)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-white/10 text-zinc-200 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>New Note</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">N</span>
        </button>

        <button
          type="button"
          onClick={() => handleAction(onOpenAI)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ask AI Assistant</span>
          </div>
          <span className="text-[10px] text-indigo-400 font-mono">Ctrl+A</span>
        </button>

        <button
          type="button"
          onClick={() => handleAction(onToggleGhostWriter)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-purple-600/20 text-purple-300 hover:text-purple-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Ghost-Writer Co-Pilot</span>
          </div>
          <span className="text-[10px] text-purple-400 font-mono">&gt;_</span>
        </button>
      </div>

      <div className="my-1 border-t border-white/10" />

      {/* System & Aesthetics */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => handleAction(onOpenThemeSkinModal)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-white/10 text-zinc-200 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>Change Visual Skin</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-bold">
            {profile?.themeSkin || 'Skin'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleAction(handleToggleTheme)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-white/10 text-zinc-200 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs">🌓</span>
            <span>Toggle Dark/Light</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono capitalize">{theme}</span>
        </button>

        <button
          type="button"
          onClick={() => handleAction(handlePrintPDF)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-white/10 text-zinc-200 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Page to PDF</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+P</span>
        </button>

        <button
          type="button"
          onClick={() => handleAction(handleWebNotifications)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-white/10 text-zinc-200 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-yellow-400" />
            <span>Web Notifications</span>
          </div>
          <span className="text-[10px] text-yellow-400 font-mono">ON</span>
        </button>
      </div>

      <div className="my-1 border-t border-white/10" />

      {/* Upgrade & Fullscreen */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => handleAction(onOpenUpgradeModal)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 font-bold transition-all"
        >
          <div className="flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Payment &amp; Pro Plans</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 font-extrabold">
            UPGRADE
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleAction(handleToggleFullscreen)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Zen Mode' : 'Zen Fullscreen'}</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">F11</span>
        </button>
      </div>
    </div>
  );
};
