import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface VideoCallSession {
  contactName: string;
  contactAvatar?: string;
  type: 'video' | 'voice';
  isMinimized: boolean;
  startTime: number;
}

interface VideoCallContextType {
  activeCall: VideoCallSession | null;
  startCall: (params: { contactName: string; contactAvatar?: string; type?: 'video' | 'voice' }) => void;
  endCall: () => void;
  minimizeCall: () => void;
  maximizeCall: () => void;
  toggleMinimize: () => void;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

export const VideoCallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCall, setActiveCall] = useState<VideoCallSession | null>(null);

  const startCall = useCallback((params: { contactName: string; contactAvatar?: string; type?: 'video' | 'voice' }) => {
    setActiveCall({
      contactName: params.contactName,
      contactAvatar: params.contactAvatar,
      type: params.type || 'video',
      isMinimized: false,
      startTime: Date.now(),
    });
  }, []);

  const endCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  const minimizeCall = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, isMinimized: true } : null));
  }, []);

  const maximizeCall = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, isMinimized: false } : null));
  }, []);

  const toggleMinimize = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, isMinimized: !prev.isMinimized } : null));
  }, []);

  return (
    <VideoCallContext.Provider
      value={{
        activeCall,
        startCall,
        endCall,
        minimizeCall,
        maximizeCall,
        toggleMinimize,
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = (): VideoCallContextType => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};
