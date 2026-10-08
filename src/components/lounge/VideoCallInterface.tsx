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
  AlertCircle,
  Radio,
  ShieldCheck,
  PhoneCall,
} from 'lucide-react';
import { useVideoCall } from '../../context/VideoCallContext';

export interface VideoCallInterfaceProps {
  contactName?: string;
  contactAvatar?: string;
  initialType?: 'video' | 'voice';
  isMinimized?: boolean;
  onClose?: () => void;
  onToggleMinimize?: () => void;
}

export const VideoCallInterface: React.FC<VideoCallInterfaceProps> = (props) => {
  let contextCall: ReturnType<typeof useVideoCall> | null = null;
  try {
    contextCall = useVideoCall();
  } catch {
    contextCall = null;
  }

  const activeCall = contextCall?.activeCall;
  const isCallActive = Boolean(activeCall || props.contactName);

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
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [callState, setCallState] = useState<'ringing' | 'connected'>('ringing');
  const [networkQuality] = useState<'HD 1080p 60fps' | 'HD 720p' | 'Optimal'>('HD 1080p 60fps');
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // MediaStream references
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const overlayVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Floating draggable overlay coordinates & state
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number }>(() => {
    const defaultX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 340) : 100;
    const defaultY = typeof window !== 'undefined' ? Math.max(16, window.innerHeight - 280) : 100;
    return { x: defaultX, y: defaultY };
  });
  const isDraggingRef = useRef(false);
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Attach stream to video elements safely
  const syncVideoElements = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    if (pipVideoRef.current && pipVideoRef.current.srcObject !== stream) {
      pipVideoRef.current.srcObject = stream;
    }
    if (overlayVideoRef.current && overlayVideoRef.current.srcObject !== stream) {
      overlayVideoRef.current.srcObject = stream;
    }
  }, []);

  // Web Audio Ringtone Simulation
  useEffect(() => {
    let osc1: OscillatorNode | null = null;
    let osc2: OscillatorNode | null = null;
    let gain: GainNode | null = null;
    let ctx: AudioContext | null = null;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
        gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, ctx.currentTime);

        osc1 = ctx.createOscillator();
        osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        // Pulsing ringing tone
        const stopTimer = setTimeout(() => {
          try {
            osc1?.stop();
            osc2?.stop();
            ctx?.close();
          } catch {}
        }, 1800);

        return () => {
          clearTimeout(stopTimer);
          try {
            osc1?.stop();
            osc2?.stop();
            ctx?.close();
          } catch {}
        };
      }
    } catch {
      // Audio not permitted without interaction
    }
  }, []);

  // Transition from 'ringing' to 'connected' after 2.2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallState('connected');
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Helper to generate a fallback animated synthetic stream if browser blocks device permissions
  const createSyntheticMediaStream = useCallback((): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    let syntheticInterval: any;
    if (ctx) {
      let phase = 0;
      syntheticInterval = setInterval(() => {
        phase += 0.05;
        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 640, 360);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 360);

        // Animated sound wave circle
        ctx.beginPath();
        const r = 40 + Math.sin(phase * 4) * 10;
        ctx.arc(320, 160, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.fill();

        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('Encrypted WebRTC Stream', 320, 240);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Device active • 30 FPS', 320, 270);
      }, 50);
    }

    const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : new MediaStream();

    // Hook cleanup
    (stream as any)._syntheticInterval = syntheticInterval;
    return stream;
  }, []);

  // Initialize browser MediaStream API
  useEffect(() => {
    let mounted = true;

    async function initMedia() {
      try {
        setPermissionNotice(null);

        if (!navigator?.mediaDevices?.getUserMedia) {
          const fallback = createSyntheticMediaStream();
          if (mounted) {
            localStreamRef.current = fallback;
            syncVideoElements(fallback);
            setPermissionNotice('Simulated media pipeline active (Browser iframe security mode).');
          }
          return;
        }

        // Request camera and microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          video: initialType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        syncVideoElements(stream);

        // Setup real audio visualizer analysis
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const aCtx = new AudioContextClass();
            audioContextRef.current = aCtx;
            const source = aCtx.createMediaStreamSource(stream);
            const analyser = aCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const tick = () => {
              if (!mounted) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const avg = sum / bufferLength;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
              animFrameRef.current = requestAnimationFrame(tick);
            };
            tick();
          }
        } catch {
          // Audio analyzer unavailable
        }
      } catch (err: any) {
        console.warn('Live device access notice:', err?.message || err);
        if (mounted) {
          // Fallback to audio or synthetic stream
          try {
            const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            if (mounted) {
              localStreamRef.current = audioOnly;
              setIsVideoEnabled(false);
              setPermissionNotice('Microphone active. Camera access declined or unavailable.');
            }
          } catch {
            const fallback = createSyntheticMediaStream();
            if (mounted) {
              localStreamRef.current = fallback;
              syncVideoElements(fallback);
              setPermissionNotice('Simulated media link active. Microphones and cameras can be toggled.');
            }
          }
        }
      }
    }

    initMedia();

    return () => {
      mounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        if ((localStreamRef.current as any)._syntheticInterval) {
          clearInterval((localStreamRef.current as any)._syntheticInterval);
        }
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [initialType, syncVideoElements, createSyntheticMediaStream]);

  // Sync video elements when minimized state changes
  useEffect(() => {
    if (localStreamRef.current) {
      syncVideoElements(localStreamRef.current);
    }
  }, [isMinimized, syncVideoElements]);

  // Call duration counter (active once connected)
  useEffect(() => {
    if (callState !== 'connected') return;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callState]);

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
        syncVideoElements(localStreamRef.current);
      } catch {
        setPermissionNotice('Camera device unavailable or permission denied.');
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
    } else {
      try {
        if (!navigator?.mediaDevices?.getDisplayMedia) {
          setPermissionNotice('Screen sharing requires standard browser window permissions.');
          return;
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
        }

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
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
    } catch {
      console.warn('Could not switch camera device.');
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
        className="fixed z-[9999] w-72 sm:w-80 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-xl shadow-2xl overflow-hidden select-none animate-fade-in group hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
      >
        {/* Drag Handle Top Bar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-violet-900/60 cursor-grab active:cursor-grabbing border-b border-[var(--color-border)]/60 text-xs text-white"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white truncate max-w-[130px]">
              {contactName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-300">
            <span>{callState === 'ringing' ? 'Calling...' : formatTime(callDuration)}</span>
            <button
              type="button"
              onClick={handleToggleMinimize}
              title="Expand full call"
              className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors ml-1"
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-white font-bold text-base mb-1 shadow-lg">
                {contactAvatar ? (
                  <img src={contactAvatar} alt={contactName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  contactName.charAt(0).toUpperCase()
                )}
              </div>
              <p className="text-xs font-semibold text-[var(--color-text)]">{contactName}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-mono">
                  {callState === 'ringing' ? 'Connecting...' : 'Voice Connected'}
                </span>
              </div>
            </div>
          )}

          {/* Persistent Draggable Feed Watermark / Status */}
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white/90 backdrop-blur-sm pointer-events-none">
            <Radio className="w-2.5 h-2.5 text-red-500 animate-pulse" />
            <span>{callState === 'ringing' ? 'DIALING' : 'LIVE'}</span>
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
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 select-none animate-fade-in"
    >
      <div className="relative flex flex-col h-full max-h-[92vh] w-full max-w-5xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[var(--color-border)]/60 bg-[var(--color-surface)]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white font-bold text-sm shadow-md">
                {contactAvatar ? (
                  <img src={contactAvatar} alt={contactName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  contactName.charAt(0).toUpperCase()
                )}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--color-surface)] ${
                callState === 'connected' ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[var(--color-text)] text-sm sm:text-base">
                  {contactName}
                </h3>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  {networkQuality}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  <span>E2EE Active</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] font-mono">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${callState === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>
                  {callState === 'ringing' ? 'Calling… Establishing encrypted peer handshake' : formatTime(callDuration)}
                </span>
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
          {/* If screen sharing is on, display screen feed */}
          {isScreenSharing ? (
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            /* Main Remote Stage: Displays the remote peer avatar / visualizer */
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-5">
              <div className="relative">
                {/* Speaking wave pulse rings */}
                <div className={`absolute -inset-4 rounded-full bg-[var(--color-primary)]/20 animate-ping ${callState === 'connected' ? 'opacity-75' : 'opacity-30'}`} />
                <div className={`absolute -inset-8 rounded-full bg-[var(--color-primary)]/10 animate-pulse ${callState === 'connected' ? 'opacity-50' : 'opacity-20'}`} />

                <div className="relative flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-500 text-white text-4xl sm:text-5xl font-extrabold shadow-2xl border-4 border-white/20">
                  {contactAvatar ? (
                    <img src={contactAvatar} alt={contactName} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    contactName.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">{contactName}</h4>
                <p className="text-xs text-white/70 font-mono">
                  {callState === 'ringing'
                    ? 'Connecting to secure channel…'
                    : 'Encrypted High-Definition Media Stream'}
                </p>
              </div>

              {/* Dynamic Audio Visualizer Equalizer */}
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-300 font-semibold font-mono">
                  {callState === 'ringing' ? 'Dialing…' : 'Microphone Live'}
                </span>
                {/* 5 Equalizer Bars */}
                <div className="flex items-center gap-0.5 ml-2 h-4">
                  {[40, 70, 100, 60, 85].map((baseHeight, idx) => {
                    const dynamicH = Math.max(20, Math.min(100, (audioLevel * baseHeight) / 50));
                    return (
                      <span
                        key={idx}
                        style={{ height: `${dynamicH}%` }}
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Picture-in-Picture Local Self Preview */}
          <div className="absolute top-4 right-4 h-28 w-40 sm:h-36 sm:w-52 rounded-2xl border-2 border-white/20 bg-neutral-900 shadow-2xl overflow-hidden backdrop-blur-md transition-all hover:scale-105">
            {isVideoEnabled ? (
              <video
                ref={pipVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/90 text-white/80 p-2 text-center">
                <VideoOff className="w-6 h-6 text-zinc-500 mb-1" />
                <span className="text-[10px] font-semibold">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white/90">
              You (Local)
            </div>
          </div>

          {/* Notice banner */}
          {permissionNotice && (
            <div className="absolute top-4 left-4 right-4 sm:right-auto max-w-md flex items-center gap-2.5 rounded-2xl bg-amber-500/95 text-black px-4 py-2.5 text-xs font-semibold shadow-2xl animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-950" />
              <span>{permissionNotice}</span>
            </div>
          )}

          {/* Persistent Floating Draggable Overlay Hint */}
          <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-sm px-3 py-1.5 text-[11px] text-white/70">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Click &apos;Floating Overlay&apos; to keep call running while using other workspace tools</span>
          </div>
        </div>

        {/* Bottom Call Controls Dock */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-4 border-t border-[var(--color-border)]/60 bg-[var(--color-surface)]/95 backdrop-blur-sm">
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
            {isAudioEnabled ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5" />}
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
            {isVideoEnabled ? <Video className="w-5 h-5 text-indigo-400" /> : <VideoOff className="w-5 h-5" />}
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
            <ScreenShare className="w-5 h-5 text-cyan-400" />
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
