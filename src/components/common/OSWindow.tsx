import React, { useRef, useState, useEffect } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { useWindowManager, OSWindowInstance } from '../../context/WindowManagerContext';

interface OSWindowProps {
  instance: OSWindowInstance;
  children: React.ReactNode;
}

export const OSWindow: React.FC<OSWindowProps> = ({ instance, children }) => {
  const {
    activeWindowId,
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    updateWindowSize,
  } = useWindowManager();

  const isFocused = activeWindowId === instance.id;
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; winX: number; winY: number }>({
    x: 0,
    y: 0,
    winX: instance.position.x,
    winY: instance.position.y,
  });

  const isResizingRef = useRef(false);
  const resizeStartRef = useRef<{ x: number; y: number; winW: number; winH: number }>({
    x: 0,
    y: 0,
    winW: instance.size.width,
    winH: instance.size.height,
  });

  // Dragging handlers
  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    focusWindow(instance.id);
    if (instance.isMaximized) return;

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      winX: instance.position.x,
      winY: instance.position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleHeaderPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || instance.isMaximized) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const newX = Math.max(0, Math.min(screenW - 120, dragStartRef.current.winX + deltaX));
    const newY = Math.max(50, Math.min(screenH - 100, dragStartRef.current.winY + deltaY));

    updateWindowPosition(instance.id, { x: newX, y: newY });
  };

  const handleHeaderPointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Resizing handlers
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    focusWindow(instance.id);
    if (instance.isMaximized) return;

    isResizingRef.current = true;
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      winW: instance.size.width,
      winH: instance.size.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizingRef.current || instance.isMaximized) return;
    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;

    const minW = 340;
    const minH = 260;
    const maxW = window.innerWidth - instance.position.x - 20;
    const maxH = window.innerHeight - instance.position.y - 40;

    const newW = Math.max(minW, Math.min(maxW, resizeStartRef.current.winW + deltaX));
    const newH = Math.max(minH, Math.min(maxH, resizeStartRef.current.winH + deltaY));

    updateWindowSize(instance.id, { width: newW, height: newH });
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    isResizingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  if (instance.isMinimized) {
    return null;
  }

  const windowStyle: React.CSSProperties = instance.isMaximized
    ? {
        position: 'fixed',
        left: '12px',
        top: '64px',
        right: '12px',
        bottom: '64px',
        width: 'auto',
        height: 'auto',
        zIndex: instance.zIndex,
      }
    : {
        position: 'fixed',
        left: `${instance.position.x}px`,
        top: `${instance.position.y}px`,
        width: `${instance.size.width}px`,
        height: `${instance.size.height}px`,
        zIndex: instance.zIndex,
      };

  return (
    <div
      style={windowStyle}
      onClick={() => focusWindow(instance.id)}
      className={`flex flex-col rounded-2xl border shadow-2xl backdrop-blur-2xl overflow-hidden transition-shadow select-none animate-fade-in ${
        isFocused
          ? 'border-[var(--color-primary)]/60 bg-[var(--color-surface)]/95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-[var(--color-primary)]/30'
          : 'border-[var(--color-border)]/80 bg-[var(--color-surface)]/85 shadow-lg'
      }`}
    >
      {/* Titlebar Header */}
      <div
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        onDoubleClick={() => maximizeWindow(instance.id)}
        className={`flex h-11 shrink-0 items-center justify-between px-3.5 border-b border-[var(--color-border)] cursor-grab active:cursor-grabbing transition-colors ${
          isFocused
            ? 'bg-[var(--color-bg-secondary)]/90 text-[var(--color-text)]'
            : 'bg-[var(--color-bg-secondary)]/50 text-[var(--color-muted)]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {instance.icon && <span className="text-sm shrink-0">{instance.icon}</span>}
          <span className="font-extrabold text-xs tracking-tight truncate max-w-[220px] sm:max-w-xs">
            {instance.title}
          </span>
        </div>

        {/* Window Traffic Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Minimize */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(instance.id);
            }}
            title="Minimize window"
            className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white/10 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximize / Restore */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              maximizeWindow(instance.id);
            }}
            title={instance.isMaximized ? 'Restore down' : 'Maximize window'}
            className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white/10 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            {instance.isMaximized ? (
              <Copy className="w-3 h-3 rotate-180" />
            ) : (
              <Square className="w-3 h-3" />
            )}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(instance.id);
            }}
            title="Close window"
            className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-red-500/20 text-[var(--color-muted)] hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Body Container */}
      <div className="flex-1 overflow-auto bg-[var(--color-bg)]/40 relative">
        {children}
      </div>

      {/* Resize Handle (bottom-right) */}
      {!instance.isMaximized && (
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-center justify-center opacity-40 hover:opacity-100"
          title="Drag to resize"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-[var(--color-muted)]" />
        </div>
      )}
    </div>
  );
};
