import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Send, Heart, Play, Pause } from 'lucide-react';
import { StoryItem } from '../../types';

interface StoryViewerModalProps {
  stories: StoryItem[];
  initialIndex: number;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [reactions, setReactions] = useState<Array<{ id: number; emoji: string; x: number }>>([]);
  const [isLiked, setIsLiked] = useState(false);
  const pressTimerRef = useRef<number | null>(null);

  // Sync index if initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex]);

  const currentStory = stories[currentIndex];
  const duration = currentStory?.mediaType === 'video' ? 15000 : 6000;

  // Key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, stories.length]);

  // Story playback timer
  useEffect(() => {
    setProgress(0);
    let startElapsed = 0;
    let lastTime = Date.now();

    const interval = window.setInterval(() => {
      if (isPaused) {
        lastTime = Date.now();
        return;
      }

      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;
      startElapsed += delta;

      const pct = Math.min(100, (startElapsed / duration) * 100);
      setProgress(pct);

      if (startElapsed >= duration) {
        window.clearInterval(interval);
        handleNext();
      }
    }, 40);

    return () => window.clearInterval(interval);
  }, [currentIndex, duration, isPaused]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsLiked(false);
      setReplyText('');
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsLiked(false);
      setReplyText('');
    }
  };

  const handlePointerDown = () => {
    pressTimerRef.current = window.setTimeout(() => {
      setIsPaused(true);
    }, 180);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    setIsPaused(false);
  };

  const handleSendReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    setReactions((prev) => [...prev, { id, emoji, x: 20 + Math.random() * 60 }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1800);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    handleSendReaction('💬');
    setReplyText('');
  };

  const formatStoryTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const diffHours = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / (3600 * 1000)));
    if (diffHours === 0) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return '1d ago';
  };

  if (!currentStory) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Story viewer"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-2 sm:p-4 backdrop-blur-md select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Floating Reaction Emojis Animation */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-20 text-4xl animate-float-up opacity-0"
            style={{
              left: `${r.x}%`,
              animation: 'floatUpAndFade 1.8s ease-out forwards',
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUpAndFade {
          0% { transform: translateY(0) scale(0.6); opacity: 0.9; }
          50% { transform: translateY(-160px) scale(1.3); opacity: 1; }
          100% { transform: translateY(-340px) scale(1); opacity: 0; }
        }
      `}</style>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close story viewer"
        className="fixed top-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 transition-all text-xl backdrop-blur-md"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev button (desktop / large screen) */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous story"
          className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-30 h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition-all backdrop-blur-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next button (desktop / large screen) */}
      {currentIndex < stories.length - 1 && (
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next story"
          className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition-all backdrop-blur-sm"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Story Card Container */}
      <div
        className="relative flex w-full max-w-[420px] h-[92vh] max-h-[820px] flex-col overflow-hidden rounded-3xl border border-white/15 bg-zinc-950 shadow-2xl"
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
      >
        {/* Progress Bar Segments */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5">
          {stories.map((s, idx) => (
            <div
              key={s.id || idx}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30 backdrop-blur-sm"
            >
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* User Info Header */}
        <div className="absolute top-7 left-3.5 right-3.5 z-30 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2.5">
            {currentStory.authorAvatar ? (
              <img
                src={currentStory.authorAvatar}
                alt={currentStory.authorName}
                className="h-9 w-9 rounded-full object-cover border-2 border-pink-500 shadow"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-pink-500 bg-gradient-to-tr from-pink-500 to-indigo-600 text-xs font-black text-white shadow">
                {currentStory.authorName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold leading-tight drop-shadow">
                  {currentStory.authorName || 'Community Member'}
                </span>
                <span className="text-[10px] text-white/70">
                  • {formatStoryTime(currentStory.createdAt)}
                </span>
              </div>
              <span className="text-[10px] text-white/60">
                Story {currentIndex + 1} of {stories.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isPaused && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-white/90">
                <Pause className="w-2.5 h-2.5" /> Paused
              </span>
            )}
          </div>
        </div>

        {/* Media Container with Left/Right Tap Zones */}
        <div className="relative flex flex-1 items-center justify-center bg-black overflow-hidden">
          {currentStory.mediaType === 'video' ? (
            <video
              key={currentStory.id}
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              muted
              loop
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.mediaUrl}
              alt={`${currentStory.authorName} story`}
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback gradient background if image URL fails
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          {/* Background fallback gradient for text/failed media */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-950 via-purple-950 to-pink-950" />

          {/* Caption Overlay (if any) */}
          {currentStory.caption && (
            <div className="absolute bottom-20 left-4 right-4 z-20">
              <div className="inline-block rounded-2xl bg-black/60 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-white/95 border border-white/10 shadow-lg">
                {currentStory.caption}
              </div>
            </div>
          )}

          {/* Left Tap Zone (previous story) */}
          <div
            className="absolute left-0 top-16 bottom-20 w-[35%] z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          />

          {/* Right Tap Zone (next story) */}
          <div
            className="absolute right-0 top-16 bottom-20 w-[65%] z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />
        </div>

        {/* Interactive Bottom Bar (Instagram style: Reply input, Quick reactions, Heart) */}
        <div className="relative z-30 p-3 bg-gradient-to-t from-black via-black/80 to-transparent space-y-2">
          {/* Quick Reaction Emojis */}
          <div className="flex items-center justify-around px-2 text-xl">
            {['❤️', '🔥', '👏', '😂', '😮', '😍'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendReaction(emoji)}
                className="transform transition hover:scale-130 active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={`Reply to ${currentStory.authorName?.split(' ')[0] || 'them'}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white placeholder-white/50 backdrop-blur-md focus:border-pink-500 focus:outline-none"
              />
            </div>

            {replyText.trim() ? (
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-white shadow hover:bg-pink-600 transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsLiked(!isLiked);
                  if (!isLiked) handleSendReaction('❤️');
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

