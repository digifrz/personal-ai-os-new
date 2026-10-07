import React, { useState } from 'react';
import {
  Search,
  Heart,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Flame,
  Tag,
  Share2,
  Bookmark,
  Eye,
} from 'lucide-react';
import { CommunityPostItem } from '../../types';

interface InstagramExploreProps {
  posts: CommunityPostItem[];
  onSelectPost: (post: CommunityPostItem) => void;
  onShowToast: (msg: string) => void;
}

const EXPLORE_TAGS = [
  'All',
  'Technology',
  'Design',
  'AI & Neural',
  'Coding',
  'Startups',
  'Study Systems',
  'Personal OS',
];

const GRADIENT_PRESETS = [
  'from-indigo-600 via-purple-600 to-pink-500',
  'from-cyan-500 via-blue-600 to-indigo-700',
  'from-rose-500 via-pink-600 to-amber-500',
  'from-emerald-500 via-teal-600 to-cyan-600',
  'from-purple-700 via-violet-800 to-indigo-900',
  'from-amber-500 via-orange-600 to-rose-600',
];

export const InstagramExplore: React.FC<InstagramExploreProps> = ({
  posts,
  onSelectPost,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const filteredPosts = posts.filter((post) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (post.title || '').toLowerCase().includes(q) ||
      (post.content || '').toLowerCase().includes(q) ||
      post.authorName.toLowerCase().includes(q) ||
      (post.tags || []).some((t) => t.toLowerCase().includes(q));

    const matchesTag =
      selectedTag === 'All' ||
      (post.tags || []).some((t) => t.toLowerCase() === selectedTag.toLowerCase()) ||
      (selectedTag === 'Technology' && post.content.toLowerCase().includes('tech')) ||
      (selectedTag === 'AI & Neural' && post.content.toLowerCase().includes('ai')) ||
      (selectedTag === 'Design' && post.content.toLowerCase().includes('design'));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* Instagram Explore Search Bar Header */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-[var(--color-muted)]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search The Lounge: creators, ideas, hashtags, code…"
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-all shadow-sm"
          />
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-[var(--color-muted)] hover:text-white px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        {EXPLORE_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setSelectedTag(tag)}
            className={`rounded-xl px-4 py-2 transition-all whitespace-nowrap border ${
              selectedTag === tag
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tag === 'All' ? '✨ Explore All' : `#${tag}`}
          </button>
        ))}
      </div>

      {/* Instagram 3-Column Square Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2 sm:gap-4">
        {filteredPosts.map((post, idx) => {
          const hasImage = post.mediaUrls && post.mediaUrls.length > 0;
          const bgGradient = GRADIENT_PRESETS[idx % GRADIENT_PRESETS.length];

          return (
            <div
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer shadow-sm hover:shadow-xl transition-all"
            >
              {/* Media Image or Styled Typography Card */}
              {hasImage ? (
                <img
                  src={post.mediaUrls![0]}
                  alt={post.title || post.authorName}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className={`h-full w-full bg-gradient-to-br ${bgGradient} p-4 sm:p-5 flex flex-col justify-between text-white group-hover:scale-105 transition-transform duration-300`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      {post.tags?.[0] || 'Insight'}
                    </span>
                    <span className="text-xs opacity-75">✦</span>
                  </div>

                  <p className="text-xs sm:text-sm font-extrabold line-clamp-3 leading-snug drop-shadow-sm">
                    {post.title || post.content}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-90">
                    <span className="truncate">@{post.authorName}</span>
                  </div>
                </div>
              )}

              {/* Instagram Hover Overlay (Shows Likes & Comments Count) */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-5 h-5 fill-white" />
                  <span>{post.likesCount || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-5 h-5 fill-white" />
                  <span>{post.commentsCount || 0}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredPosts.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-[var(--color-border)] p-12 text-center text-xs text-[var(--color-muted)] space-y-2">
            <Search className="w-8 h-8 text-[var(--color-muted)]/40 mx-auto" />
            <p>No posts matching &ldquo;{searchQuery || selectedTag}&rdquo;.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('All');
              }}
              className="text-[var(--color-primary)] font-bold hover:underline"
            >
              Reset Explore Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
