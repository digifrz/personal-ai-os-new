import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface OSWindowInstance {
  id: string;
  title: string;
  icon?: string;
  component: 'direct_chat' | 'voice_room' | 'spotify' | 'assistant' | 'scratchpad' | 'files' | 'tasks' | 'habits' | 'finance' | 'wellness';
  props?: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

export type OSViewMode = 'fullscreen' | 'desktop';

interface WindowManagerContextType {
  windows: OSWindowInstance[];
  activeWindowId: string | null;
  osMode: OSViewMode;
  setOsMode: (mode: OSViewMode) => void;
  toggleOsMode: () => void;
  openWindow: (config: {
    id: string;
    title: string;
    icon?: string;
    component: OSWindowInstance['component'];
    props?: Record<string, any>;
    defaultSize?: { width: number; height: number };
  }) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, pos: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | null>(null);

const STORAGE_MODE_KEY = 'paio_os_view_mode_v1';

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [osMode, setOsModeState] = useState<OSViewMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_MODE_KEY) as OSViewMode) || 'fullscreen';
    } catch {
      return 'fullscreen';
    }
  });

  const [windows, setWindows] = useState<OSWindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [topZIndex, setTopZIndex] = useState(100);

  const setOsMode = useCallback((mode: OSViewMode) => {
    setOsModeState(mode);
    try {
      localStorage.setItem(STORAGE_MODE_KEY, mode);
    } catch {}
  }, []);

  const toggleOsMode = useCallback(() => {
    setOsModeState((prev) => {
      const next = prev === 'fullscreen' ? 'desktop' : 'fullscreen';
      try {
        localStorage.setItem(STORAGE_MODE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  const focusWindow = useCallback((id: string) => {
    setActiveWindowId(id);
    setTopZIndex((prev) => {
      const next = prev + 1;
      setWindows((curr) =>
        curr.map((w) => (w.id === id ? { ...w, zIndex: next, isMinimized: false } : w))
      );
      return next;
    });
  }, []);

  const openWindow = useCallback(
    ({
      id,
      title,
      icon,
      component,
      props,
      defaultSize = { width: 520, height: 480 },
    }: {
      id: string;
      title: string;
      icon?: string;
      component: OSWindowInstance['component'];
      props?: Record<string, any>;
      defaultSize?: { width: number; height: number };
    }) => {
      setWindows((curr) => {
        const existing = curr.find((w) => w.id === id);
        const nextZ = topZIndex + 1;
        setTopZIndex(nextZ);
        setActiveWindowId(id);

        if (existing) {
          return curr.map((w) =>
            w.id === id
              ? {
                  ...w,
                  title,
                  icon: icon || w.icon,
                  props: { ...w.props, ...props },
                  isMinimized: false,
                  zIndex: nextZ,
                }
              : w
          );
        }

        // Stagger positions for natural cascade
        const offsetMultiplier = (curr.length % 6) * 28;
        const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

        const posX = Math.max(20, Math.min(screenW - defaultSize.width - 20, 100 + offsetMultiplier));
        const posY = Math.max(70, Math.min(screenH - defaultSize.height - 60, 80 + offsetMultiplier));

        const newWin: OSWindowInstance = {
          id,
          title,
          icon,
          component,
          props,
          position: { x: posX, y: posY },
          size: defaultSize,
          zIndex: nextZ,
          isMinimized: false,
          isMaximized: false,
        };

        return [...curr, newWin];
      });
    },
    [topZIndex]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((curr) => curr.filter((w) => w.id !== id));
    setActiveWindowId((curr) => (curr === id ? null : curr));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((curr) =>
      curr.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
    setActiveWindowId((curr) => (curr === id ? null : curr));
  }, []);

  const restoreWindow = useCallback(
    (id: string) => {
      focusWindow(id);
    },
    [focusWindow]
  );

  const maximizeWindow = useCallback((id: string) => {
    setWindows((curr) =>
      curr.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  }, []);

  const updateWindowPosition = useCallback((id: string, pos: { x: number; y: number }) => {
    setWindows((curr) =>
      curr.map((w) => (w.id === id ? { ...w, position: pos } : w))
    );
  }, []);

  const updateWindowSize = useCallback((id: string, size: { width: number; height: number }) => {
    setWindows((curr) =>
      curr.map((w) => (w.id === id ? { ...w, size } : w))
    );
  }, []);

  return (
    <WindowManagerContext.Provider
      value={{
        windows,
        activeWindowId,
        osMode,
        setOsMode,
        toggleOsMode,
        openWindow,
        closeWindow,
        minimizeWindow,
        restoreWindow,
        maximizeWindow,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
};

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
};
