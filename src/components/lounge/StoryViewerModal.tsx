import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const timerRef = useRef<number | null>(null);

  const currentStory = stories[currentIndex];
  const duration = currentStory?.mediaType === 'video' ? 15000 : 5000;

  // Key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, stories.length]);

  // Story playback timer
  useEffect(() => {
    setProgress(0);
    const startTime = Date.now();

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (elapsed >= duration) {
        window.clearInterval(interval);
        handleNext();
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [currentIndex, duration]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!currentStory) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Story viewer"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close story viewer"
        className="fixed top-5 right-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition-all text-xl"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev / Next buttons */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous story"
          className="fixed left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      <button
        type="button"
        onClick={handleNext}
        aria-label="Next story"
        className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition-all"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Story Card Container */}
      <div className="relative flex w-full max-w-[460px] h-[85vh] max-h-[760px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
        {/* Progress Bar */}
        <div className="absolute top-3 left-4 right-4 z-10 flex gap-1.5">
          {stories.map((s, idx) => (
            <div
              key={s.id || idx}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
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
        <div className="absolute top-7 left-4 right-4 z-10 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400 bg-cyan-500/20 text-xs font-extrabold text-cyan-300">
              {currentStory.authorName?.[0]?.toUpperCase() || 'U'}
            </span>
            <div>
              <strong className="block text-xs font-bold leading-tight">
                {currentStory.authorName || 'Community Member'}
              </strong>
              <small className="text-[10px] text-white/70">
                Story {currentIndex + 1} of {stories.length}
              </small>
            </div>
          </div>
        </div>

        {/* Media Container */}
        <div className="relative flex flex-1 items-center justify-center bg-black/95">
          {currentStory.mediaType === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-contain"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt={`${currentStory.authorName} story`}
              className="h-full w-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
};
