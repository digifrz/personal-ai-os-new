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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';

export interface SparkItem {
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
}

interface SparksViewerProps {
  onSelectCreator?: (creator: any) => void;
  onShowToast: (msg: string) => void;
  allProfiles?: UserProfile[];
}

const SAMPLE_SPARKS: SparkItem[] = [
  {
    id: 'spark_1',
    creatorId: 'creator_alex',
    creatorName: 'Alex Chen',
    creatorUsername: 'alexchen_ai',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Autonomous Multi-Agent Workflow in 45 Seconds ⚡',
    caption: 'Connecting Gemini 2.5 Flash to Firestore background tasks. Notice zero API key leakage in the client bundle!',
    tags: ['AI', 'Coding', 'Agents', 'Workflow'],
    audioTrackName: 'Deep Alpha Frequency — Lofi Beats',
    likesCount: 1420,
    commentsCount: 88,
    sharesCount: 154,
    viewsCount: 18400,
    completionRate: 0.94,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'spark_2',
    creatorId: 'creator_maya',
    creatorName: 'Maya Lin',
    creatorUsername: 'mayalin_design',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    title: 'Minimalist Spatial UI for Modern Operating Systems 🎨',
    caption: 'Obsidian dark mode, fluid micro-interactions, and instant response. What do you think of this layout hierarchy?',
    tags: ['Design', 'UIUX', 'Minimalism', 'Frontend'],
    audioTrackName: 'Ambient Flow — Synthwave Resonance',
    likesCount: 2310,
    commentsCount: 142,
    sharesCount: 310,
    viewsCount: 29800,
    completionRate: 0.89,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'spark_3',
    creatorId: 'creator_farzan',
    creatorName: 'Farzan',
    creatorUsername: 'farzanc',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    title: 'Building a 500 MB Encrypted Cloud Vault with Zero Telemetry 🛡️',
    caption: 'Full offline persistence with client-side token isolation. The entire workspace runs at 60fps.',
    tags: ['CloudVault', 'Security', 'Tech', 'Architecture'],
    audioTrackName: 'Midnight Focus — Binaural Beats',
    likesCount: 3840,
    commentsCount: 215,
    sharesCount: 420,
    viewsCount: 44200,
    completionRate: 0.96,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

export const SparksViewer: React.FC<SparksViewerProps> = ({
  onSelectCreator,
  onShowToast,
  allProfiles = [],
}) => {
  const { user } = useAuth();
  const [sparks, setSparks] = useState<SparkItem[]>(() => {
    try {
      const saved = localStorage.getItem('personal_ai_sparks_feed');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SAMPLE_SPARKS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<Record<string, { id: string; user: string; text: string; time: string }[]>>({
    spark_1: [
      { id: 'c1', user: 'DevCreator', text: 'The token isolation is so clean!', time: '2h ago' },
      { id: 'c2', user: 'SarahTech', text: 'Are the background tasks authoritative?', time: '1h ago' },
    ],
    spark_2: [
      { id: 'c3', user: 'UIArchitect', text: 'Color contrast is gorgeous.', time: '5h ago' },
    ],
  });
  const [commentInput, setCommentInput] = useState('');

  // Upload new spark modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadTags, setUploadTags] = useState('AI, Productivity, Code');
  const [uploadVideoUrl, setUploadVideoUrl] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentSpark = sparks[currentIndex] || sparks[0];

  // Auto-play when switching sparks
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < sparks.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // loop
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(sparks.length - 1);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleLike = () => {
    setSparks((prev) =>
      prev.map((s, idx) => {
        if (idx === currentIndex) {
          const nextLiked = !s.isLiked;
          return {
            ...s,
            isLiked: nextLiked,
            likesCount: s.likesCount + (nextLiked ? 1 : -1),
          };
        }
        return s;
      })
    );
  };

  const toggleSave = () => {
    setSparks((prev) =>
      prev.map((s, idx) => {
        if (idx === currentIndex) {
          const nextSaved = !s.isSaved;
          return {
            ...s,
            isSaved: nextSaved,
          };
        }
        return s;
      })
    );
    onShowToast(!currentSpark.isSaved ? 'Spark saved to your library!' : 'Spark removed from saved.');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      onShowToast(`Copied Spark link: "${currentSpark.title}"`);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment = {
      id: `c_${Date.now()}`,
      user: user?.email?.split('@')[0] || 'Me',
      text: commentInput.trim(),
      time: 'Just now',
    };

    setCommentsList((prev) => ({
      ...prev,
      [currentSpark.id]: [...(prev[currentSpark.id] || []), newComment],
    }));

    setSparks((prev) =>
      prev.map((s, idx) => (idx === currentIndex ? { ...s, commentsCount: s.commentsCount + 1 } : s))
    );

    setCommentInput('');
    onShowToast('Comment posted!');
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    const newSpark: SparkItem = {
      id: `spark_${Date.now()}`,
      creatorId: user?.uid || 'current',
      creatorName: user?.email?.split('@')[0] || 'Creator',
      creatorUsername: (user?.email?.split('@')[0] || 'creator').toLowerCase(),
      videoUrl: uploadVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      title: uploadTitle.trim(),
      caption: uploadCaption.trim(),
      tags: uploadTags.split(',').map((t) => t.trim()).filter(Boolean),
      audioTrackName: 'Original Audio • Creator Studio',
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 12,
      completionRate: 0.95,
      createdAt: new Date().toISOString(),
      isLiked: true,
    };

    const updated = [newSpark, ...sparks];
    setSparks(updated);
    try {
      localStorage.setItem('personal_ai_sparks_feed', JSON.stringify(updated));
    } catch {}

    setShowUploadModal(false);
    setCurrentIndex(0);
    onShowToast('Your Spark has been published to the community algorithm!');
  };

  return (
    <div className="relative mx-auto flex h-[82vh] max-h-[860px] w-full max-w-md items-center justify-center rounded-3xl bg-black shadow-2xl overflow-hidden border border-[var(--color-border)] select-none">
      {/* Top Header Controls: Mode & Create Spark Button */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3.5 py-1 text-xs font-black text-white">
          <Film className="w-3.5 h-3.5 text-[var(--color-cyan)]" />
          <span>Sparks Feed</span>
          <span className="rounded-full bg-[var(--color-primary)] px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
            AI Algorithm
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg hover:scale-105 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Spark</span>
        </button>
      </div>

      {/* Main Video Element */}
      <div className="relative h-full w-full cursor-pointer flex items-center justify-center" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={currentSpark.videoUrl}
          loop
          playsInline
          muted={isMuted}
          className="h-full w-full object-cover"
        />

        {/* Play/Pause Overlay indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
              <Play className="w-8 h-8 fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Video Scrim Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none z-10" />
      </div>

      {/* Vertical Navigation Pill (Up / Down chevrons) */}
      <div className="absolute right-4 top-16 z-30 flex flex-col gap-2">
        <button
          type="button"
          onClick={handlePrev}
          title="Previous Spark (Up)"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 border border-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          title="Next Spark (Down)"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 border border-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Right Action Rail: Creator Avatar, Like, Comment, Share, Sound */}
      <div className="absolute right-4 bottom-24 z-30 flex flex-col items-center gap-4">
        {/* Creator Avatar with Follow Plus */}
        <div className="relative group">
          <div
            onClick={() => {
              if (onSelectCreator) {
                onSelectCreator({
                  userId: currentSpark.creatorId,
                  displayName: currentSpark.creatorName,
                  username: currentSpark.creatorUsername,
                  avatarUrl: currentSpark.creatorAvatar,
                });
              }
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white p-0.5 bg-gradient-to-tr from-[var(--color-primary)] to-cyan-400 cursor-pointer shadow-lg"
          >
            <img
              src={currentSpark.creatorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={currentSpark.creatorName}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Like Button */}
        <button
          type="button"
          onClick={toggleLike}
          className="flex flex-col items-center gap-1 group text-white hover:scale-110 transition-transform"
        >
          <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 ${currentSpark.isLiked ? 'text-rose-500' : 'text-white'}`}>
            <Heart className={`w-5 h-5 ${currentSpark.isLiked ? 'fill-rose-500' : ''}`} />
          </div>
          <span className="text-[11px] font-bold text-white shadow-sm font-mono">
            {currentSpark.likesCount}
          </span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-sm font-mono">
            {currentSpark.commentsCount}
          </span>
        </button>

        {/* Save/Bookmark */}
        <button
          type="button"
          onClick={toggleSave}
          className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
        >
          <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 ${currentSpark.isSaved ? 'text-amber-400' : 'text-white'}`}>
            <Bookmark className={`w-5 h-5 ${currentSpark.isSaved ? 'fill-amber-400' : ''}`} />
          </div>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-sm font-mono">
            {currentSpark.sharesCount}
          </span>
        </button>

        {/* Mute/Unmute */}
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 border border-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all mt-1"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>

      {/* Bottom Information Overlay */}
      <div className="absolute left-4 right-16 bottom-5 z-20 space-y-2 pointer-events-auto text-left text-white">
        {/* Creator Username & Badge */}
        <div className="flex items-center gap-2">
          <strong
            onClick={() => {
              if (onSelectCreator) {
                onSelectCreator({
                  userId: currentSpark.creatorId,
                  displayName: currentSpark.creatorName,
                  username: currentSpark.creatorUsername,
                  avatarUrl: currentSpark.creatorAvatar,
                });
              }
            }}
            className="text-sm font-extrabold cursor-pointer hover:underline text-white drop-shadow-md"
          >
            @{currentSpark.creatorUsername}
          </strong>
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white text-[9px] font-bold">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </span>
        </div>

        {/* Spark Title & Caption */}
        <h4 className="text-xs font-black leading-snug drop-shadow-md text-slate-100">
          {currentSpark.title}
        </h4>
        <p className="text-[11px] text-slate-200/90 line-clamp-2 leading-relaxed drop-shadow-sm">
          {currentSpark.caption}
        </p>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {currentSpark.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Audio Track + Algorithm Signal */}
        <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-300">
          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
            <Music className="w-3 h-3 text-[var(--color-cyan)] shrink-0 animate-spin" />
            <span className="truncate">{currentSpark.audioTrackName}</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
            <Sparkles className="w-3 h-3" />
            <span>AI Ranked 94%</span>
          </div>
        </div>
      </div>

      {/* Comments Drawer Modal */}
      {showComments && (
        <div
          className="absolute inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-sm"
          onClick={() => setShowComments(false)}
        >
          <div
            className="w-full max-h-[60%] rounded-t-3xl border-t border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xl flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--color-primary)]" />
                <h3 className="text-sm font-bold text-[var(--color-text)]">
                  Comments ({commentsList[currentSpark.id]?.length || 0})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowComments(false)}
                className="p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-52 pr-1 scrollbar-thin">
              {(commentsList[currentSpark.id] || []).map((c) => (
                <div key={c.id} className="rounded-xl bg-[var(--color-bg-secondary)] p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-[var(--color-text)] font-bold">@{c.user}</strong>
                    <span className="text-[10px] text-[var(--color-muted)]">{c.time}</span>
                  </div>
                  <p className="text-[var(--color-text)]/90 leading-relaxed">{c.text}</p>
                </div>
              ))}

              {(!commentsList[currentSpark.id] || commentsList[currentSpark.id].length === 0) && (
                <p className="py-6 text-center text-xs text-[var(--color-muted)]">
                  Be the first to leave a comment on this Spark!
                </p>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-1 border-t border-[var(--color-border)]">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a constructive thought…"
                className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all flex items-center gap-1 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upload Spark Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  Publish a New Spark
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[var(--color-muted)] mb-1">
                  Spark Title / Hook
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. 3 AI prompts that saved 10 hours this week"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--color-muted)] mb-1">
                  Caption &amp; Details
                </label>
                <textarea
                  rows={3}
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Explain the workflow, breakthrough, or lesson learned..."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--color-muted)] mb-1">
                  Hashtags (comma separated)
                </label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="AI, Study, Coding, Productivity"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-[var(--color-text)] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--color-muted)] mb-1">
                  Video URL (or direct MP4 link)
                </label>
                <input
                  type="url"
                  value={uploadVideoUrl}
                  onChange={(e) => setUploadVideoUrl(e.target.value)}
                  placeholder="https://... (Leave blank for default sample)"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-[var(--color-text)] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-md"
                >
                  Publish Spark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
