import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Music,
  Plus,
  Send,
  X,
  Check,
  TrendingUp,
  Flame,
  Award,
  Film,
  Zap,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import {
  calculateAlgorithmScore,
  recordAlgorithmInteraction,
  getStoredAlgorithmProfile,
} from '../../services/algorithm';

export interface PulseItem {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar?: string;
  videoUrl: string;
  title: string;
  caption: string;
  tags: string[];
  audioTrackName: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  completionRate: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  algorithmReason?: string;
}

interface PulsesViewerProps {
  onSelectCreator?: (creator: any) => void;
  onShowToast: (msg: string) => void;
  allProfiles?: UserProfile[];
}

const SAMPLE_PULSES: PulseItem[] = [
  {
    id: 'pulse_1',
    creatorId: 'creator_alex',
    creatorName: 'Alex Chen',
    creatorUsername: 'alexchen_ai',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Autonomous Multi-Agent Workflow in 45 Seconds ⚡',
    caption: 'Connecting Gemini 2.5 Flash to Firestore background tasks. Notice zero API key leakage in the client bundle!',
    tags: ['ai', 'coding', 'agents', 'workflow'],
    audioTrackName: 'Deep Alpha Frequency — Lofi Beats',
    likesCount: 1420,
    commentsCount: 88,
    sharesCount: 154,
    viewsCount: 18400,
    completionRate: 0.94,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    algorithmReason: '✦ 98% Match · High engagement in #ai & #workflow',
  },
  {
    id: 'pulse_2',
    creatorId: 'creator_maya',
    creatorName: 'Maya Lin',
    creatorUsername: 'mayalin_design',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    title: 'Minimalist Spatial UI for Modern Operating Systems 🎨',
    caption: 'Obsidian dark mode, fluid micro-interactions, and instant response. What do you think of this layout hierarchy?',
    tags: ['design', 'uiux', 'minimalism', 'frontend'],
    audioTrackName: 'Ambient Flow — Synthwave Resonance',
    likesCount: 2310,
    commentsCount: 142,
    sharesCount: 310,
    viewsCount: 29800,
    completionRate: 0.89,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    algorithmReason: '🔥 Trending in Design & UI Architecture',
  },
  {
    id: 'pulse_3',
    creatorId: 'creator_farzan',
    creatorName: 'Farzan',
    creatorUsername: 'farzanc',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    title: 'Building a 500 MB Encrypted Cloud Vault with Zero Telemetry 🛡️',
    caption: 'Full offline persistence with client-side token isolation. The entire workspace runs at 60fps.',
    tags: ['cloudvault', 'security', 'tech', 'architecture'],
    audioTrackName: 'Midnight Focus — Binaural Beats',
    likesCount: 3840,
    commentsCount: 215,
    sharesCount: 420,
    viewsCount: 44200,
    completionRate: 0.96,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    algorithmReason: '💡 96% completion rate · Tech Breakthrough',
  },
];

export const PulsesViewer: React.FC<PulsesViewerProps> = ({
  onSelectCreator,
  onShowToast,
  allProfiles = [],
}) => {
  const { user, profile } = useAuth();
  const [pulses, setPulses] = useState<PulseItem[]>(() => {
    try {
      const saved = localStorage.getItem('personal_ai_pulses_feed');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SAMPLE_PULSES;
  });

  const [feedFilter, setFeedFilter] = useState<'for_you' | 'trending' | 'latest'>('for_you');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);
  const clickTimeoutRef = useRef<number | null>(null);
  const [commentsList, setCommentsList] = useState<Record<string, { id: string; user: string; text: string; time: string }[]>>({
    pulse_1: [
      { id: 'c1', user: 'DevArchitect', text: 'The token isolation is so clean!', time: '2h ago' },
      { id: 'c2', user: 'SarahTech', text: 'Are the background tasks authoritative?', time: '1h ago' },
    ],
    pulse_2: [
      { id: 'c3', user: 'UIArchitect', text: 'Color contrast is gorgeous.', time: '5h ago' },
    ],
  });
  const [commentInput, setCommentInput] = useState('');

  // Upload new pulse modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newAudioTrack, setNewAudioTrack] = useState('Workspace Synth Beats');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [progressPercent, setProgressPercent] = useState(0);

  // Save pulses on change
  useEffect(() => {
    try {
      localStorage.setItem('personal_ai_pulses_feed', JSON.stringify(pulses));
    } catch {}
  }, [pulses]);

  // Filter and rank pulses based on algorithm
  const filteredPulses = React.useMemo(() => {
    if (feedFilter === 'trending') {
      return [...pulses].sort((a, b) => (b.viewsCount + b.likesCount * 3) - (a.viewsCount + a.likesCount * 3));
    }
    if (feedFilter === 'latest') {
      return [...pulses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // "For You" - Smart Algorithm
    const userProfile = getStoredAlgorithmProfile();
    return [...pulses].sort((a, b) => {
      const scoreA = calculateAlgorithmScore(a, userProfile).score;
      const scoreB = calculateAlgorithmScore(b, userProfile).score;
      return scoreB - scoreA;
    });
  }, [pulses, feedFilter]);

  const currentPulse = filteredPulses[currentIndex] || filteredPulses[0];

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgressPercent(percent);
    }
  };

  const handlePulseTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_THRESHOLD) {
      // Double tap detected!
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      triggerDoubleTapLike();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      clickTimeoutRef.current = window.setTimeout(() => {
        setIsPlaying((p) => !p);
        clickTimeoutRef.current = null;
      }, DOUBLE_TAP_THRESHOLD);
    }
  };

  const triggerDoubleTapLike = () => {
    if (!currentPulse) return;
    if (!currentPulse.isLiked) {
      handleToggleLike();
    }
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 900);
  };

  const handleNext = () => {
    if (currentIndex < filteredPulses.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  const handleToggleLike = () => {
    if (!currentPulse) return;
    const isCurrentlyLiked = currentPulse.isLiked;
    const updated = pulses.map((p) => {
      if (p.id === currentPulse.id) {
        return {
          ...p,
          isLiked: !isCurrentlyLiked,
          likesCount: isCurrentlyLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
        };
      }
      return p;
    });
    setPulses(updated);

    if (!isCurrentlyLiked) {
      recordAlgorithmInteraction(currentPulse.tags, 'like');
      // Background algorithm ranking silently updated with no intrusive toast
    }
  };

  const handleToggleSave = () => {
    if (!currentPulse) return;
    const isCurrentlySaved = currentPulse.isSaved;
    const updated = pulses.map((p) => {
      if (p.id === currentPulse.id) {
        return {
          ...p,
          isSaved: !isCurrentlySaved,
        };
      }
      return p;
    });
    setPulses(updated);
    if (!isCurrentlySaved) {
      recordAlgorithmInteraction(currentPulse.tags, 'save');
    }
  };

  const handleSharePulse = () => {
    if (!currentPulse) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/pulse/${currentPulse.id}`);
      recordAlgorithmInteraction(currentPulse.tags, 'share');
      onShowToast('Pulse link copied! Sent to algorithm graph.');
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentPulse) return;

    const newComment = {
      id: `comm_${Date.now()}`,
      user: profile?.username || user?.email?.split('@')[0] || 'Community User',
      text: commentInput.trim(),
      time: 'Just now',
    };

    setCommentsList((prev) => ({
      ...prev,
      [currentPulse.id]: [...(prev[currentPulse.id] || []), newComment],
    }));

    setPulses((prev) =>
      prev.map((p) =>
        p.id === currentPulse.id ? { ...p, commentsCount: p.commentsCount + 1 } : p
      )
    );

    recordAlgorithmInteraction(currentPulse.tags, 'comment');
    setCommentInput('');
    onShowToast('Comment posted!');
  };

  const handleCreatePulse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      onShowToast('Please enter a title for your Pulse');
      return;
    }

    setIsUploading(true);

    setTimeout(() => {
      const parsedTags = newTags
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/#/g, ''))
        .filter(Boolean);

      const created: PulseItem = {
        id: `pulse_${Date.now()}`,
        creatorId: user?.uid || 'user_current',
        creatorName: profile?.name || 'Workspace Creator',
        creatorUsername: profile?.username || user?.email?.split('@')[0] || 'creator',
        creatorAvatar: profile?.avatarUrl,
        videoUrl:
          newVideoUrl.trim() ||
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        title: newTitle.trim(),
        caption: newCaption.trim(),
        tags: parsedTags.length > 0 ? parsedTags : ['creator', 'ai', 'showcase'],
        audioTrackName: newAudioTrack.trim() || 'Original Workspace Sound',
        likesCount: 1,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 1,
        completionRate: 0.95,
        createdAt: new Date().toISOString(),
        isLiked: true,
        algorithmReason: '✨ Your freshly published Pulse',
      };

      setPulses([created, ...pulses]);
      setCurrentIndex(0);
      setIsUploading(false);
      setShowUploadModal(false);
      setNewTitle('');
      setNewCaption('');
      setNewTags('');
      setNewVideoUrl('');
      onShowToast('Your Pulse is published to the community feed!');
    }, 800);
  };

  if (!currentPulse) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center p-6 space-y-3">
        <Film className="w-12 h-12 text-[var(--color-muted)]" />
        <h3 className="text-base font-bold text-[var(--color-text)]">No Pulses available</h3>
        <p className="text-xs text-[var(--color-muted)]">Be the first to publish a high-energy Pulse!</p>
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md"
        >
          Create Pulse
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 animate-fade-in">
      {/* Top Header & Feed Algorithm Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-md">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[var(--color-text)] flex items-center gap-1.5">
              <span>Pulses</span>
              <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-[10px] font-extrabold text-pink-400 border border-pink-500/30">
                Algorithm Live
              </span>
            </h2>
          </div>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setFeedFilter('for_you');
              setCurrentIndex(0);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              feedFilter === 'for_you'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>For You</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFeedFilter('trending');
              setCurrentIndex(0);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              feedFilter === 'trending'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Trending</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFeedFilter('latest');
              setCurrentIndex(0);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              feedFilter === 'latest'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Fresh</span>
          </button>
        </div>

        {/* Create Pulse Button */}
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Post Pulse</span>
        </button>
      </div>

      {/* Main Pulse Player Viewport */}
      <div className="relative mx-auto flex h-[620px] sm:h-[680px] w-full max-w-[390px] flex-col justify-between overflow-hidden rounded-[2.5rem] border border-[var(--color-border)]/80 bg-black shadow-2xl">
        {/* Progress Bar Header */}
        <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/20">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Top Header: Music & Volume (Clean Instagram Reels style, no algorithm pills) */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 border border-white/15 text-[10px] font-bold text-white shadow-sm">
            <Music className="w-3 h-3 text-pink-400 shrink-0" />
            <span className="truncate max-w-[200px]">
              {currentPulse.audioTrackName || 'Original Audio'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/15 hover:bg-black/80 transition-all shadow-sm"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-pink-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Video Element with Double-Tap to Like */}
        <div
          onClick={handlePulseTap}
          onDoubleClick={triggerDoubleTapLike}
          className="relative h-full w-full flex items-center justify-center cursor-pointer bg-zinc-950 select-none"
        >
          <video
            ref={videoRef}
            src={currentPulse.videoUrl}
            loop
            muted={isMuted}
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            className="h-full w-full object-cover"
          />

          {/* Double-tap animated heart pop (Instagram style) */}
          {showHeartAnimation && (
            <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center animate-ping duration-700">
              <div className="transform scale-125 transition-transform">
                <Heart className="w-24 h-24 fill-red-500 text-white drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]" />
              </div>
            </div>
          )}

          {/* Pause overlay icon */}
          {!isPlaying && (
            <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white animate-scale-in">
              <Play className="w-8 h-8 fill-white ml-1" />
            </div>
          )}
        </div>

        {/* Right Side Action Floating Bar (Like, Comment, Share, Save) */}
        <div className="absolute right-3 bottom-20 z-30 flex flex-col items-center gap-4">
          {/* Creator Avatar Pill */}
          <div
            onClick={() => onSelectCreator?.({
              id: currentPulse.creatorId,
              username: currentPulse.creatorUsername,
              name: currentPulse.creatorName,
              avatarUrl: currentPulse.creatorAvatar,
            })}
            className="relative cursor-pointer group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-rose-500 shadow-lg">
              {currentPulse.creatorAvatar ? (
                <img
                  src={currentPulse.creatorAvatar}
                  alt={currentPulse.creatorName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-indigo-600 text-white font-extrabold text-xs">
                  {currentPulse.creatorName.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-white text-[10px] font-bold shadow">
              +
            </div>
          </div>

          {/* Like */}
          <button
            type="button"
            onClick={handleToggleLike}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all ${
              currentPulse.isLiked
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-110'
                : 'bg-black/50 text-white hover:bg-black/70'
            }`}>
              <Heart className={`w-5 h-5 ${currentPulse.isLiked ? 'fill-white' : ''}`} />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow">
              {currentPulse.likesCount.toLocaleString()}
            </span>
          </button>

          {/* Comment */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow">
              {(commentsList[currentPulse.id]?.length ?? currentPulse.commentsCount).toLocaleString()}
            </span>
          </button>

          {/* Save / Bookmark */}
          <button
            type="button"
            onClick={handleToggleSave}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all ${
              currentPulse.isSaved
                ? 'bg-amber-500 text-white shadow-lg scale-110'
                : 'bg-black/50 text-white hover:bg-black/70'
            }`}>
              <Bookmark className={`w-5 h-5 ${currentPulse.isSaved ? 'fill-white' : ''}`} />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow">Save</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleSharePulse}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow">Share</span>
          </button>
        </div>

        {/* Bottom Details (Creator Name, Title, Caption, Tags, Audio) */}
        <div className="absolute bottom-0 left-0 right-14 z-20 p-4 space-y-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-12">
          {/* Creator name & badge */}
          <div
            onClick={() => onSelectCreator?.({
              id: currentPulse.creatorId,
              username: currentPulse.creatorUsername,
              name: currentPulse.creatorName,
              avatarUrl: currentPulse.creatorAvatar,
            })}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-sm font-extrabold text-white hover:underline">
              @{currentPulse.creatorUsername}
            </span>
            <span className="flex items-center gap-0.5 rounded-full bg-pink-500/20 px-2 py-0.5 text-[9px] font-bold text-pink-300 border border-pink-500/30">
              <Award className="w-2.5 h-2.5" />
              Creator
            </span>
          </div>

          {/* Title & Caption */}
          <p className="text-xs font-bold text-white line-clamp-1">{currentPulse.title}</p>
          <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
            {currentPulse.caption}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {currentPulse.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] font-bold text-pink-300 hover:text-pink-200 cursor-pointer"
              >
                #{t}
              </span>
            ))}
          </div>

          {/* Audio track info */}
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 pt-1">
            <Music className="w-3 h-3 text-pink-400 animate-pulse" />
            <span className="truncate max-w-[200px]">{currentPulse.audioTrackName}</span>
          </div>
        </div>

        {/* Navigation Arrows on Side (Next / Prev) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Previous Pulse"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            type="button"
            disabled={currentIndex === filteredPulses.length - 1}
            onClick={handleNext}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Next Pulse"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Comments Drawer Modal */}
        {showComments && (
          <div className="absolute inset-x-0 bottom-0 z-40 max-h-[70%] rounded-t-3xl border-t border-white/15 bg-zinc-900/95 backdrop-blur-xl p-4 shadow-2xl flex flex-col justify-between space-y-3 animate-slide-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span>Comments</span>
                <span className="text-[10px] text-zinc-400">
                  ({(commentsList[currentPulse.id] || []).length})
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowComments(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments scroll container */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-56 pr-1 scrollbar-none">
              {(commentsList[currentPulse.id] || []).length === 0 ? (
                <p className="text-center text-xs text-zinc-500 py-6">
                  No comments yet. Start the conversation!
                </p>
              ) : (
                (commentsList[currentPulse.id] || []).map((c) => (
                  <div key={c.id} className="rounded-xl bg-white/5 p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-pink-400">@{c.user}</span>
                      <span className="text-[9px] text-zinc-500">{c.time}</span>
                    </div>
                    <p className="text-xs text-zinc-200">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1 border-t border-white/10">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500 text-white disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Upload New Pulse Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--color-text)]">
                    Create New Pulse
                  </h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    Share dynamic vertical short video clips with the community
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-xl p-1.5 text-[var(--color-muted)] hover:bg-white/10 hover:text-[var(--color-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePulse} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text)]">Pulse Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Real-time AI Agent Automation in 30s"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text)]">Caption & Story</label>
                <textarea
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Describe your breakthrough, key takeaways, and question for viewers…"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3.5 py-2 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text)]">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="ai, code, design, workflow"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3.5 py-2 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text)]">Sound Track Name</label>
                  <input
                    type="text"
                    value={newAudioTrack}
                    onChange={(e) => setNewAudioTrack(e.target.value)}
                    placeholder="e.g., Synthwave Midnight Focus"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3.5 py-2 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text)]">
                  Video URL (Direct MP4 / WebM or sample)
                </label>
                <input
                  type="url"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://... (defaults to high-definition sample video if empty)"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3.5 py-2 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {isUploading ? (
                    <span>Publishing Pulse…</span>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Publish Pulse</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Backwards compatibility export
export const SparksViewer = PulsesViewer;
