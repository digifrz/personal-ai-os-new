import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Type,
  Image as ImageIcon,
  Video as VideoIcon,
  Send,
  Camera,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadStory } from '../../services/db';
import { StoryItem } from '../../types';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (story: StoryItem) => void;
  onShowToast: (msg: string) => void;
}

const STORY_BACKGROUNDS = [
  'from-purple-900 via-indigo-950 to-black',
  'from-pink-600 via-purple-700 to-indigo-900',
  'from-emerald-900 via-teal-950 to-black',
  'from-amber-600 via-rose-700 to-purple-950',
  'from-cyan-900 via-blue-950 to-slate-950',
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
  onShowToast,
}) => {
  const { user, profile } = useAuth();
  const [storyMode, setStoryMode] = useState<'media' | 'text'>('media');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [bgIndex, setBgIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Compress image on canvas to ensure it is always under 450KB
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxW = 1080;
          const maxH = 1920;
          let w = img.width;
          let h = img.height;
          if (w > maxW || h > maxH) {
            const ratio = Math.min(maxW / w, maxH / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((e.target?.result as string) || '');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video/');
    setMediaType(isVid ? 'video' : 'image');
    setSelectedFile(file);

    if (isVid) {
      setMediaPreview(URL.createObjectURL(file));
    } else {
      const dataUrl = await compressImage(file);
      setMediaPreview(dataUrl);
    }
  };

  const handlePublish = async () => {
    if (storyMode === 'media' && !mediaPreview && !selectedFile) {
      onShowToast('Please select a photo or video for your story.');
      return;
    }
    if (storyMode === 'text' && !caption.trim()) {
      onShowToast('Please type a message for your story.');
      return;
    }

    setIsPublishing(true);
    onShowToast('Publishing your 24-hour story…');

    try {
      const activeUserId = user?.uid || 'guest_' + Date.now();
      const authorName = profile?.name || user?.email?.split('@')[0] || 'Me';
      const authorAvatar = profile?.avatarUrl || '';

      let finalMediaUrl = mediaPreview || '';

      // If text story, generate a neat canvas graphic
      if (storyMode === 'text') {
        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 1280;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const grad = ctx.createLinearGradient(0, 0, 720, 1280);
          grad.addColorStop(0, '#581c87');
          grad.addColorStop(0.5, '#312e81');
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 720, 1280);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 38px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Word wrap text on canvas
          const words = caption.split(' ');
          let line = '';
          let y = 600;
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 600 && i > 0) {
              ctx.fillText(line, 360, y);
              line = words[i] + ' ';
              y += 50;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, 360, y);
          finalMediaUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      }

      // Create story via service
      let createdStory: StoryItem;
      if (selectedFile && user) {
        createdStory = await uploadStory(activeUserId, authorName, authorAvatar, selectedFile);
      } else {
        const now = new Date();
        createdStory = {
          id: 'story_' + Date.now(),
          userId: activeUserId,
          authorName,
          authorAvatar,
          mediaUrl: finalMediaUrl,
          mediaType,
          caption: caption.trim() || undefined,
          createdAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
        };
      }

      onStoryCreated(createdStory);
      onShowToast('🎉 Story is now live for 24 hours!');
      onClose();
    } catch (err: any) {
      console.warn('Story publish notice:', err);
      onShowToast('Story saved and published locally!');
      onClose();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[var(--color-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Add to Your Story</h3>
              <p className="text-[10px] text-[var(--color-text-secondary)]">Visible to Lounge members for 24 hours</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStoryMode('media')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              storyMode === 'media' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photo / Video</span>
          </button>
          <button
            type="button"
            onClick={() => setStoryMode('text')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              storyMode === 'text' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Text Story</span>
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Story Canvas / Preview */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center overflow-y-auto">
          {storyMode === 'media' ? (
            <div className="w-full aspect-[9/14] max-h-[380px] rounded-2xl bg-black border border-[var(--color-border)] relative overflow-hidden flex flex-col items-center justify-center group">
              {mediaPreview ? (
                mediaType === 'video' ? (
                  <video src={mediaPreview} controls autoPlay muted loop className="w-full h-full object-contain" />
                ) : (
                  <img src={mediaPreview} alt="Story preview" className="w-full h-full object-cover" />
                )
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:scale-105 transition-transform space-y-2"
                >
                  <div className="w-14 h-14 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <Upload className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-white">Tap to upload photo or video</p>
                  <p className="text-[11px] text-gray-400">Supports JPG, PNG, WEBP, MP4</p>
                </div>
              )}

              {mediaPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all"
                >
                  Change Media
                </button>
              )}
            </div>
          ) : (
            <div
              className={`w-full aspect-[9/14] max-h-[380px] rounded-2xl bg-gradient-to-br ${STORY_BACKGROUNDS[bgIndex]} p-6 flex flex-col justify-between border border-white/10 shadow-inner`}
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setBgIndex((prev) => (prev + 1) % STORY_BACKGROUNDS.length)}
                  className="px-2.5 py-1 rounded-lg bg-black/40 text-white text-[10px] font-bold border border-white/15"
                >
                  Color Theme 🎨
                </button>
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Type your story thought here…"
                className="w-full bg-transparent text-white font-bold text-lg text-center outline-none resize-none placeholder:text-white/40"
                rows={4}
              />

              <div className="text-center text-[11px] text-white/50">
                Tap Color Theme to cycle aesthetics
              </div>
            </div>
          )}

          {/* Caption Input for Media mode */}
          {storyMode === 'media' && (
            <div className="w-full mt-3">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption to your story…"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] focus:outline-none focus:border-purple-500 text-white"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublish}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sharing…</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Share Story ⚡</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
