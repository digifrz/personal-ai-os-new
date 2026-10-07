import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  ScreenShare,
  Volume2,
  Sparkles,
  RefreshCw,
  Camera,
  AlertCircle,
  Move,
  Radio,
  User,
} from 'lucide-react';
import { useVideoCall } from '../../context/VideoCallContext';

export interface VideoCallInterfaceProps {
  // Can be used either with context or standalone
  contactName?: string;
  contactAvatar?: string;
  initialType?: 'video' | 'voice';
  isMinimized?: boolean;
  onClose?: () => void;
  onToggleMinimize?: () => void;
}

export const VideoCallInterface: React.FC<VideoCallInterfaceProps> = (props) => {
  // Use context if available
  let contextCall: ReturnType<typeof useVideoCall> | null = null;
  try {
    contextCall = useVideoCall();
  } catch {
    contextCall = null;
  }

  const activeCall = contextCall?.activeCall;
  const isCallActive = Boolean(activeCall || props.contactName);

  // If no call has been initiated, NEVER mount video devices, timers, or UI overlay
  if (!isCallActive) {
    return null;
  }

  return (
    <VideoCallActiveSession
      {...props}
      contextCall={contextCall}
      activeCall={activeCall || null}
    />
  );
};

interface VideoCallActiveSessionProps extends VideoCallInterfaceProps {
  contextCall: ReturnType<typeof useVideoCall> | null;
  activeCall: any;
}

const VideoCallActiveSession: React.FC<VideoCallActiveSessionProps> = ({
  contextCall,
  activeCall,
  ...props
}) => {
  const contactName = props.contactName || activeCall?.contactName || 'Community Member';
  const contactAvatar = props.contactAvatar || activeCall?.contactAvatar;
  const initialType = props.initialType || activeCall?.type || 'video';
  const isMinimized = props.isMinimized !== undefined ? props.isMinimized : (activeCall?.isMinimized ?? false);

  const handleEndCall = () => {
    if (props.onClose) {
      props.onClose();
    }
    if (contextCall) {
      contextCall.endCall();
    }
  };

  const handleToggleMinimize = () => {
    if (props.onToggleMinimize) {
      props.onToggleMinimize();
    } else if (contextCall) {
      contextCall.toggleMinimize();
    }
  };

  const [isVideoEnabled, setIsVideoEnabled] = useState(initialType === 'video');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [networkQuality, setNetworkQuality] = useState<'HD 1080p' | 'HD 720p' | 'Optimal'>('HD 720p');

  // MediaStream references
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const fullVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const overlayVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Floating draggable overlay coordinates & state
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number }>(() => {
    // Default to bottom right with 24px padding
    const defaultX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 340) : 100;
    const defaultY = typeof window !== 'undefined' ? Math.max(16, window.innerHeight - 280) : 100;
    return { x: defaultX, y: defaultY };
  });
  const isDraggingRef = useRef(false);
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Attach stream to any available video element
  const syncVideoElements = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    if (fullVideoRef.current && fullVideoRef.current.srcObject !== stream) {
      fullVideoRef.current.srcObject = stream;
    }
    if (pipVideoRef.current && pipVideoRef.current.srcObject !== stream) {
      pipVideoRef.current.srcObject = stream;
    }
    if (overlayVideoRef.current && overlayVideoRef.current.srcObject !== stream) {
      overlayVideoRef.current.srcObject = stream;
    }
  }, []);

  // Initialize browser MediaStream API
  useEffect(() => {
    let mounted = true;

    async function initMedia() {
      try {
        setIsConnecting(true);
        setPermissionError(null);

        if (!navigator?.mediaDevices?.getUserMedia) {
          setIsConnecting(false);
          setPermissionError('Media devices not supported in this browser or iframe context (Requires HTTPS).');
          return;
        }

        // Request real camera and microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          video: initialType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setStreamActive(true);
        setIsConnecting(false);
        syncVideoElements(stream);
      } catch (err: any) {
        console.warn('MediaStream permission notice:', err);
        if (mounted) {
          setIsConnecting(false);
          // If video failed, attempt audio-only fallback
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            if (!mounted) {
              audioStream.getTracks().forEach((t) => t.stop());
              return;
            }
            localStreamRef.current = audioStream;
            setStreamActive(true);
            setIsVideoEnabled(false);
            setPermissionError('Camera unavailable or permission denied. Voice audio active.');
          } catch (audioErr) {
            setPermissionError('Microphone & Camera permission required for live media call.');
          }
        }
      }
    }

    initMedia();

    return () => {
      mounted = false;
      // Stop all tracks cleanly when call ends
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [initialType, syncVideoElements]);

  // Sync video elements whenever min/maximized state changes
  useEffect(() => {
    if (localStreamRef.current) {
      syncVideoElements(localStreamRef.current);
    }
  }, [isMinimized, syncVideoElements]);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle Camera
  const toggleCamera = async () => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    } else {
      try {
        const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = newVideoStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newTrack);
        setIsVideoEnabled(true);
        setPermissionError(null);
        syncVideoElements(localStreamRef.current);
      } catch (err) {
        setPermissionError('Unable to activate camera device.');
      }
    }
  };

  // Toggle Microphone
  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  // Screen Share using getDisplayMedia
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      if (localStreamRef.current) {
        syncVideoElements(localStreamRef.current);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        syncVideoElements(screenStream);

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          if (localStreamRef.current) {
            syncVideoElements(localStreamRef.current);
          }
        };
      } catch (err) {
        console.warn('Screen share canceled or denied:', err);
      }
    }
  };

  // Flip camera / switch facing mode
  const switchCamera = async () => {
    if (!localStreamRef.current) return;
    try {
      const currentTrack = localStreamRef.current.getVideoTracks()[0];
      if (currentTrack) {
        currentTrack.stop();
        localStreamRef.current.removeTrack(currentTrack);
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      const newTrack = newStream.getVideoTracks()[0];
      localStreamRef.current.addTrack(newTrack);
      setIsVideoEnabled(true);
      syncVideoElements(localStreamRef.current);
    } catch (err) {
      console.warn('Could not switch camera device:', err);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Dragging event handlers for Floating Draggable Overlay
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartOffsetRef.current = {
      x: e.clientX - overlayPos.x,
      y: e.clientY - overlayPos.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const newX = e.clientX - dragStartOffsetRef.current.x;
    const newY = e.clientY - dragStartOffsetRef.current.y;
    // Bound within viewport window
    const boundedX = Math.max(10, Math.min(window.innerWidth - 320, newX));
    const boundedY = Math.max(10, Math.min(window.innerHeight - 240, newY));
    setOverlayPos({ x: boundedX, y: boundedY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // -------------------------------------------------------------
  // RENDER: Floating Draggable Overlay (Persists Across Tabs)
  // -------------------------------------------------------------
  if (isMinimized) {
    return (
      <div
        style={{ left: `${overlayPos.x}px`, top: `${overlayPos.y}px` }}
        className="fixed z-[9999] w-72 sm:w-80 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-shadow select-none animate-fade-in group hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Drag Handle Top Bar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-violet-900/40 cursor-grab active:cursor-grabbing border-b border-[var(--color-border)]/60 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-[var(--color-text)] truncate max-w-[130px]">
              {contactName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-muted)]">
            <span>{formatTime(callDuration)}</span>
            <button
              type="button"
              onClick={handleToggleMinimize}
              title="Expand full call"
              className="p-1 rounded-lg hover:bg-white/10 text-[var(--color-text)] transition-colors ml-1"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video feed / Avatar presentation */}
        <div className="relative aspect-video w-full bg-black/90 overflow-hidden flex items-center justify-center">
          {isVideoEnabled ? (
            <video
              ref={overlayVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40 text-[var(--color-primary)] font-bold text-lg mb-1 shadow-lg">
                {contactAvatar ? (
                  <img src={contactAvatar} alt={contactName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  contactName.charAt(0).toUpperCase()
                )}
              </div>
              <p className="text-xs font-semibold text-[var(--color-text)]">{contactName}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-mono">Audio Active</span>
              </div>
            </div>
          )}

          {/* Persistent Draggable Feed Watermark / Status */}
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white/80 backdrop-blur-sm pointer-events-none">
            <Radio className="w-2.5 h-2.5 text-red-500 animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>

        {/* Floating Quick Action Controls Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface)] border-t border-[var(--color-border)]/60">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleAudio}
              title={isAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                isAudioEnabled
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-red-500/20 border border-red-500/40 text-red-400'
              }`}
            >
              {isAudioEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={toggleCamera}
              title={isVideoEnabled ? 'Turn Video Off' : 'Turn Video On'}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                isVideoEnabled
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-red-500/20 border border-red-500/40 text-red-400'
              }`}
            >
              {isVideoEnabled ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleMinimize}
              title="Maximize Call Window"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand</span>
            </button>

            <button
              type="button"
              onClick={handleEndCall}
              title="End Call"
              className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md transition-all"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Full Video Call Modal Window
  // -------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 select-none animate-fade-in"
    >
      <div className="relative flex flex-col h-full max-h-[92vh] w-full max-w-5xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[var(--color-border)]/60 bg-[var(--color-surface)]/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white font-bold text-sm shadow-md">
                {contactAvatar ? (
                  <img src={contactAvatar} alt={contactName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  contactName.charAt(0).toUpperCase()
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[var(--color-surface)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[var(--color-text)] text-sm sm:text-base">
                  {contactName}
                </h3>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  {networkQuality}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] font-mono">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isConnecting ? 'Establishing peer handshake…' : formatTime(callDuration)}</span>
              </div>
            </div>
          </div>

          {/* Window action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleMinimize}
              title="Minimize to floating draggable feed (persists across tabs)"
              className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Floating Overlay</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleEndCall}
              title="Close and end call"
              className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all ml-1"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas Stage */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {/* Main Remote / Screen Feed */}
          {isVideoEnabled || isScreenSharing ? (
            <video
              ref={fullVideoRef}
              autoPlay
              playsInline
              muted={isScreenSharing}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[var(--color-primary)]/15 border-2 border-[var(--color-primary)] text-[var(--color-primary)] text-3xl font-extrabold shadow-2xl animate-pulse">
                {contactAvatar ? (
                  <img src={contactAvatar} alt={contactName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  contactName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">{contactName}</h4>
                <p className="text-xs text-white/60 mt-1 font-mono">Camera paused · Encrypted voice stream</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                <span>Microphone Connected</span>
              </div>
            </div>
          )}

          {/* Picture-in-Picture Local Self Preview */}
          {isVideoEnabled && (
            <div className="absolute top-4 right-4 h-28 w-40 sm:h-36 sm:w-52 rounded-2xl border-2 border-white/20 bg-neutral-900 shadow-2xl overflow-hidden backdrop-blur-md transition-all hover:scale-105">
              <video
                ref={pipVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              <div className="absolute bottom-1.5 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white/90">
                You (Local)
              </div>
            </div>
          )}

          {/* Permission or device warning banner */}
          {permissionError && (
            <div className="absolute top-4 left-4 right-4 sm:right-auto max-w-md flex items-center gap-2.5 rounded-2xl bg-amber-500/90 text-black px-4 py-2.5 text-xs font-semibold shadow-2xl animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-950" />
              <span>{permissionError}</span>
            </div>
          )}

          {/* Persistent Floating Draggable Overlay Hint */}
          <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-sm px-3 py-1.5 text-[11px] text-white/70">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Click &apos;Floating Overlay&apos; to keep video active while exploring other tabs</span>
          </div>
        </div>

        {/* Bottom Call Controls Dock */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-4 border-t border-[var(--color-border)]/60 bg-[var(--color-surface)]/90 backdrop-blur-sm">
          {/* Mic Toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
              isAudioEnabled
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            <span className="text-[10px] font-bold">{isAudioEnabled ? 'Mute' : 'Unmuted'}</span>
          </button>

          {/* Camera Toggle */}
          <button
            type="button"
            onClick={toggleCamera}
            title={isVideoEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
              isVideoEnabled
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            <span className="text-[10px] font-bold">{isVideoEnabled ? 'Stop Video' : 'Start Video'}</span>
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            title="Share Screen"
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
              isScreenSharing
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <ScreenShare className="w-5 h-5" />
            <span className="text-[10px] font-bold">{isScreenSharing ? 'Sharing' : 'Share'}</span>
          </button>

          {/* Switch Camera */}
          <button
            type="button"
            onClick={switchCamera}
            title="Flip / Switch Camera Device"
            className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-[10px] font-bold">Flip</span>
          </button>

          {/* Minimize to Floating Draggable Overlay */}
          <button
            type="button"
            onClick={handleToggleMinimize}
            title="Minimize to floating draggable feed"
            className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 transition-all"
          >
            <Minimize2 className="w-5 h-5" />
            <span className="text-[10px] font-bold">Minimize</span>
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            title="End Video Call"
            className="flex flex-col items-center gap-1 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-xl transition-all font-bold"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider">End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
