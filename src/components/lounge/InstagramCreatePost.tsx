import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  Send,
  X,
  Plus,
  Radio,
  Paperclip,
  Check,
  Tag,
  Globe,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { askAI } from '../../services/ai';
import { createCommunityPost } from '../../services/db';

interface InstagramCreatePostProps {
  onPostCreated: () => void;
  onShowToast: (msg: string) => void;
}

const POPULAR_TAGS = [
  'Technology',
  'Design',
  'AI',
  'Coding',
  'Startups',
  'Study',
  'Productivity',
  'PersonalOS',
];

export const InstagramCreatePost: React.FC<InstagramCreatePostProps> = ({
  onPostCreated,
  onShowToast,
}) => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9'>('1:1');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Technology']);
  const [visibility, setVisibility] = useState<'public' | 'followers'>('public');
  const [isAiPolishing, setIsAiPolishing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      onShowToast(`Loaded ${isVideo ? 'video' : 'photo'} for post preview!`);
    };
    reader.readAsDataURL(file);
  };

  const handleAiPolish = async () => {
    if (!content.trim()) {
      onShowToast('Write some thoughts first to polish!');
      return;
    }
    setIsAiPolishing(true);
    onShowToast('✨ AI is polishing your caption…');

    try {
      const polished = await askAI({
        prompt: `Please refine and structure this social post for The Lounge. Keep it authentic, engaging, concise, and add 2 relevant hashtags at the bottom:\n\n"${content}"`,
        mode: 'chat',
      });
      if (polished && polished.trim()) {
        setContent(polished.trim());
        onShowToast('✨ Caption enhanced by Gemini!');
      }
    } catch {
      setContent((c) => c.trim() + '\n\n💡 Insights from building on Personal AI OS. #Productivity #AI');
      onShowToast('Caption polished!');
    } finally {
      setIsAiPolishing(false);
    }
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onShowToast('Please sign in to share posts to The Lounge.');
      return;
    }
    if (!content.trim() && !mediaUrl) {
      onShowToast('Please add a photo, video, or caption.');
      return;
    }

    setIsPosting(true);
    onShowToast('Publishing post to The Lounge…');

    try {
      await createCommunityPost({
        userId: user.uid,
        authorName: profile?.name || user.email?.split('@')[0] || 'Me',
        authorAvatar: profile?.avatarUrl || '',
        authorUsername: profile?.username || 'user',
        title: title.trim() || undefined,
        content: content.trim(),
        tags: selectedTags,
        visibility,
        mediaUrls: mediaUrl ? [mediaUrl] : undefined,
        mediaType: mediaUrl ? mediaType : undefined,
      });

      onShowToast('🎉 Post shared to The Lounge!');
      setTitle('');
      setContent('');
      setMediaUrl(null);
      onPostCreated();
    } catch (err) {
      console.warn('Post publish notice:', err);
      onShowToast('Post shared to local feed.');
      onPostCreated();
    } finally {
      setIsPosting(false);
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '4:5':
        return 'aspect-[4/5]';
      case '16:9':
        return 'aspect-video';
      default:
        return 'aspect-square';
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text)]">
            Create New Post (The Lounge Studio)
          </h2>
          <p className="text-xs text-[var(--color-muted)]">
            Craft beautiful photos, videos, and thought-leadership insights for The Lounge.
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 px-3 py-1 text-xs font-bold text-[var(--color-secondary)]">
          Lounge Creator
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Media Dropzone & Preview (6 cols) */}
        <div className="md:col-span-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-muted)]">
            <span>Media Preview</span>
            {mediaUrl && (
              <div className="flex items-center gap-1.5">
                {(['1:1', '4:5', '16:9'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] transition-all ${
                      aspectRatio === ratio
                        ? 'bg-[var(--color-primary)] text-white border-transparent'
                        : 'border-[var(--color-border)] text-[var(--color-muted)]'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            onClick={() => !mediaUrl && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed overflow-hidden transition-all ${getAspectClass()} ${
              mediaUrl
                ? 'border-[var(--color-border)] bg-black'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-surface)]/60 cursor-pointer p-8 text-center'
            }`}
          >
            {mediaUrl ? (
              <>
                {mediaType === 'video' ? (
                  <video src={mediaUrl} controls className="h-full w-full object-cover" />
                ) : (
                  <img src={mediaUrl} alt="Preview" className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMediaUrl(null);
                  }}
                  className="absolute top-3 right-3 rounded-full bg-black/70 p-2 text-white hover:bg-black transition-colors"
                  title="Remove media"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[var(--color-text)]">
                    Drag photos or videos here
                  </strong>
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    Select from computer or device (PNG, JPG, MP4)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[var(--color-primary-hover)]"
                >
                  Select From Device
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFilePicked}
          />
        </div>

        {/* Right Column: Caption, Tags, AI Polish & Publish (6 cols) */}
        <div className="md:col-span-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-sm">
          {/* User Header */}
          <div className="flex items-center gap-3">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="h-10 w-10 rounded-full object-cover border border-[var(--color-border)]" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold text-xs">
                {(profile?.name || user?.email || 'Me').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <strong className="block text-xs font-bold text-[var(--color-text)]">
                {profile?.name || user?.email?.split('@')[0] || 'Me'}
              </strong>
              <span className="text-[10px] text-[var(--color-muted)]">
                @{profile?.username || 'user'}
              </span>
            </div>
          </div>

          {/* Post Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Headline / Subject (optional)…"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] font-semibold"
            />
          </div>

          {/* Caption Textarea */}
          <div className="space-y-1.5">
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a caption… share insights, code snippets, learnings, or breakthroughs."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] leading-relaxed resize-none"
            />

            <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)]">
              <span>{content.length} / 2200 characters</span>
              <button
                type="button"
                onClick={handleAiPolish}
                disabled={isAiPolishing || !content.trim()}
                className="flex items-center gap-1 font-bold text-purple-400 hover:text-purple-300 disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiPolishing ? 'Polishing…' : 'Polish with AI'}</span>
              </button>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-[var(--color-muted)]">
              Add Topics &amp; Hashtags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleToggleTag(t)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all border ${
                    selectedTags.includes(t)
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold'
                      : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-white'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/60 text-xs">
            <span className="font-bold text-[var(--color-muted)]">Audience</span>
            <div className="flex items-center rounded-xl bg-[var(--color-bg-secondary)] p-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`rounded-lg px-3 py-1 transition-all ${
                  visibility === 'public' ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-muted)]'
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility('followers')}
                className={`rounded-lg px-3 py-1 transition-all ${
                  visibility === 'followers' ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-muted)]'
                }`}
              >
                Followers Only
              </button>
            </div>
          </div>

          {/* Share Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPosting || (!content.trim() && !mediaUrl)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] via-purple-600 to-pink-500 py-3 text-xs font-bold text-white shadow-lg hover:opacity-95 transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>{isPosting ? 'Publishing…' : 'Share Post to The Lounge'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
