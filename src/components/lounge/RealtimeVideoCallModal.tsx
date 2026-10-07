import React, { useState, useEffect, useRef } from 'react';
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
  Shield,
  Sparkles,
  RefreshCw,
  Camera,
  AlertCircle,
} from 'lucide-react';

interface RealtimeVideoCallModalProps {
  contactName: string;
  contactAvatar?: string;
  initialType?: 'video' | 'voice';
  onClose: () => void;
}

export const RealtimeVideoCallModal: React.FC<RealtimeVideoCallModalProps> = ({
  contactName,
  contactAvatar,
  initialType = 'video',
  onClose,
}) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialType === 'video');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn('MediaStream permission notice:', err);
        if (mounted) {
          setIsConnecting(false);
          // If camera fails, try audio only
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            if (!mounted) {
              audioStream.getTracks().forEach((t) => t.stop());
              return;
            }
            localStreamRef.current = audioStream;
            setStreamActive(true);
            setIsVideoEnabled(false);
            setPermissionError('Camera unavailable or permission denied. Voice call active.');
          } catch (audioErr) {
            setPermissionError('Microphone/Camera permission required for live media call.');
          }
        }
      }
    }

    initMedia();

    return () => {
      mounted = false;
      // Stop all tracks cleanly when component unmounts
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [initialType]);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to mm:ss
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
      // Stream didn't have video, request it now
      try {
        const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = newVideoStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        setIsVideoEnabled(true);
        setPermissionError(null);
      } catch (err) {
        setPermissionError('Unable to activate camera.');
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
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } catch (err) {
        console.warn('Screen share canceled or not supported:', err);
      }
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

  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#060911]/95 backdrop-blur-xl text-white select-none overflow-hidden"
    >
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            {contactAvatar ? (
              <img
                src={contactAvatar}
                alt={contactName}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-[var(--color-primary)] shadow-lg"
              />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-cyan)] flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg">
                {contactName.charAt(0)}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-black" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">{contactName}</h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <Shield className="w-2.5 h-2.5" />
                <span>HD 1080p</span>
              </span>
            </div>
            <p className="text-xs font-mono text-emerald-400 font-semibold tracking-wider">
              {isConnecting ? 'Establishing secure media pipeline…' : `Connected • ${formatTime(callDuration)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-all backdrop-blur-md"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video Arena */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center p-2 sm:p-6">
        {/* Remote Peer Screen / Simulated Ambient Peer Video */}
        <div className="relative w-full h-full max-w-5xl max-h-[82vh] rounded-3xl overflow-hidden bg-gradient-to-br from-[#0e1628] via-[#11192e] to-[#080d18] border border-white/10 shadow-2xl flex flex-col items-center justify-center">
          {/* Ambient lighting effects */}
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[var(--color-primary)]/15 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[var(--color-cyan)]/15 blur-[100px] pointer-events-none" />

          {/* Peer Avatar & Audio Reactive Ripple */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="relative flex items-center justify-center">
              {/* Expanding audio waves animation */}
              <div className="absolute -inset-4 rounded-full bg-[var(--color-primary)]/20 animate-ping" />
              <div className="absolute -inset-8 rounded-full bg-[var(--color-cyan)]/10 animate-pulse" />

              <div className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full overflow-hidden border-4 border-[var(--color-primary)] shadow-[0_0_40px_rgba(139,92,246,0.35)]">
                {contactAvatar ? (
                  <img src={contactAvatar} alt={contactName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[var(--color-primary)] via-indigo-700 to-[var(--color-cyan)] flex items-center justify-center text-white text-3xl font-black">
                    {contactName.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">{contactName}</h3>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-slate-300">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Audio stream connected (Speex 48kHz)</span>
              </div>
            </div>
          </div>

          {/* Local User Camera Video Feed Overlay (Picture-in-Picture) */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 w-36 h-48 sm:w-52 sm:h-72 rounded-2xl overflow-hidden border-2 border-[var(--color-primary)] shadow-2xl bg-black/80 backdrop-blur-md group">
            {isVideoEnabled && streamActive ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#090e1a] text-slate-400 p-2 text-center">
                <VideoOff className="w-6 h-6 mb-2 text-slate-500" />
                <span className="text-[11px] font-semibold text-slate-300">Camera Off</span>
                <span className="text-[9px] text-slate-500">You</span>
              </div>
            )}

            {/* PIP Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>You {isScreenSharing ? '(Screen)' : ''}</span>
            </div>
          </div>

          {/* Permission or Status Toast Overlay */}
          {permissionError && (
            <div className="absolute top-4 z-20 flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur-md animate-fade-in">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{permissionError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Media Controls Bar */}
      <div className="relative z-30 pb-6 sm:pb-8 pt-2 flex items-center justify-center gap-3 sm:gap-5">
        {/* Toggle Mic */}
        <button
          type="button"
          onClick={toggleAudio}
          className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl sm:rounded-3xl transition-all shadow-lg ${
            isAudioEnabled
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 ring-2 ring-rose-500/50'
          }`}
          title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isAudioEnabled ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        {/* Toggle Camera */}
        <button
          type="button"
          onClick={toggleCamera}
          className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl sm:rounded-3xl transition-all shadow-lg ${
            isVideoEnabled
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 ring-2 ring-rose-500/50'
          }`}
          title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isVideoEnabled ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        {/* Screen Share */}
        <button
          type="button"
          onClick={toggleScreenShare}
          className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl sm:rounded-3xl transition-all shadow-lg ${
            isScreenSharing
              ? 'bg-[var(--color-primary)] text-white border border-white/40 ring-2 ring-[var(--color-primary)]'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
          }`}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <ScreenShare className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* End Call Button */}
        <button
          type="button"
          onClick={handleEndCall}
          className="flex h-12 w-14 sm:h-14 sm:w-16 items-center justify-center rounded-2xl sm:rounded-3xl bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-[0_0_25px_rgba(244,63,94,0.45)] hover:scale-105 active:scale-95"
          title="End Video Call"
        >
          <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
};
