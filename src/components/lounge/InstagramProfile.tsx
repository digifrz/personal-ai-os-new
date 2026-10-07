import React, { useState } from 'react';
import {
  User,
  Settings,
  Share2,
  Grid,
  Bookmark,
  Radio,
  Plus,
  Heart,
  MessageSquare,
  Check,
  Sparkles,
  ExternalLink,
  Camera,
  Trash2,
  Briefcase,
  BarChart3,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CommunityPostItem, StoryItem, UserProfile } from '../../types';
import { ProfileFollowsView, FollowConnectionUser } from './ProfileFollowsView';

interface InstagramProfileProps {
  posts: CommunityPostItem[];
  stories: StoryItem[];
  followingCount: number;
  followersList?: FollowConnectionUser[];
  followingList?: FollowConnectionUser[];
  followingSet?: Set<string>;
  allProfiles?: UserProfile[];
  onToggleFollow?: (userId: string) => void;
  onSelectUser?: (user: any) => void;
  onNavigateSettings?: () => void;
  onSelectPost: (post: CommunityPostItem) => void;
  onSelectStory: (index: number) => void;
  onUploadStoryClick: () => void;
  onShowToast: (msg: string) => void;
  accountType?: 'personal' | 'business';
  onToggleAccountType?: (type: 'personal' | 'business') => void;
  onNavigateStudio?: () => void;
}

const HIGHLIGHTS = [
  { id: '1', title: '🚀 Builds', cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80' },
  { id: '2', title: '🎨 Design', cover: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=150&auto=format&fit=crop&q=80' },
  { id: '3', title: '🤖 AI Work', cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' },
  { id: '4', title: '📚 Study', cover: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=150&auto=format&fit=crop&q=80' },
];

export const InstagramProfile: React.FC<InstagramProfileProps> = ({
  posts,
  stories,
  followingCount,
  followersList,
  followingList,
  followingSet = new Set(),
  allProfiles = [],
  onToggleFollow,
  onSelectUser,
  onNavigateSettings,
  onSelectPost,
  onSelectStory,
  onUploadStoryClick,
  onShowToast,
  accountType = 'personal',
  onToggleAccountType,
  onNavigateStudio,
}) => {
  const { user, profile } = useAuth();
  const [profileTab, setProfileTab] = useState<'posts' | 'stories' | 'saved'>('posts');
  const [followsModalTab, setFollowsModalTab] = useState<'followers' | 'following' | null>(null);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  // Fallback demo connections if list not provided
  const effectiveFollowers: FollowConnectionUser[] = followersList || allProfiles.map((p) => ({
    userId: p.userId,
    name: p.name,
    username: p.username,
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    interests: p.interests,
  }));

  const effectiveFollowing: FollowConnectionUser[] = followingList || allProfiles.filter((p) => followingSet.has(p.userId)).map((p) => ({
    userId: p.userId,
    name: p.name,
    username: p.username,
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    interests: p.interests,
  }));

  const myPosts = posts.filter((p) => p.userId === (user?.uid || 'current'));
  const savedPosts = posts.filter((p) => (p.savedBy || []).includes(user?.uid || 'current'));
  const myStories = stories.filter((s) => s.userId === (user?.uid || 'current'));

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      onShowToast('Profile link copied to clipboard!');
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 animate-fade-in">
      {/* =========================================================
          INSTAGRAM PROFILE HEADER
      ========================================================= */}
      <section className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-12 pb-6 border-b border-[var(--color-border)]/60">
        {/* Large Profile Picture with Instagram Gradient Story Ring */}
        <div className="relative shrink-0 group">
          <div className="flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full p-[3px] bg-gradient-to-tr from-[var(--color-primary)] via-indigo-600 to-[var(--color-cyan)] shadow-xl">
            <div className="h-full w-full rounded-full bg-[var(--color-surface)] p-[3px]">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-purple-600 text-3xl font-extrabold text-white">
                  {(profile?.name || user?.email || 'Me').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onUploadStoryClick}
            className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg border-2 border-[var(--color-surface)] hover:scale-110 transition-transform"
            title="Add to story"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* User Stats & Bio */}
        <div className="flex-1 text-center sm:text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text)] tracking-tight">
              @{profile?.username || user?.email?.split('@')[0] || 'explorer'}
            </h2>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {onNavigateSettings && (
                <button
                  type="button"
                  onClick={onNavigateSettings}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all shadow-sm"
                >
                  Edit profile
                </button>
              )}

              <button
                type="button"
                onClick={handleShareProfile}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={onUploadStoryClick}
                className="flex items-center gap-1 rounded-xl bg-pink-500/15 border border-pink-500/30 px-3 py-1.5 text-xs font-bold text-pink-400 hover:bg-pink-500/25 transition-all shadow-sm"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Add Story</span>
              </button>

              {/* Instagram 3-Dots Options & Settings Button */}
              <button
                type="button"
                id="profile-more-options-btn"
                onClick={() => setIsSettingsMenuOpen(true)}
                aria-label="Options and settings"
                title="Settings and Options"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] transition-all shadow-sm cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Instagram Stats: Posts, Followers, Following */}
          <div className="flex items-center justify-center sm:justify-start gap-8 text-sm">
            <div>
              <strong className="font-extrabold text-[var(--color-text)]">{myPosts.length}</strong>{' '}
              <span className="text-[var(--color-muted)] text-xs">posts</span>
            </div>
            <button
              type="button"
              id="my-profile-followers-btn"
              onClick={() => setFollowsModalTab('followers')}
              className="hover:opacity-75 transition-opacity text-center sm:text-left cursor-pointer"
            >
              <strong className="font-extrabold text-[var(--color-text)]">
                {effectiveFollowers.length}
              </strong>{' '}
              <span className="text-[var(--color-muted)] text-xs underline decoration-dotted">followers</span>
            </button>
            <button
              type="button"
              id="my-profile-following-btn"
              onClick={() => setFollowsModalTab('following')}
              className="hover:opacity-75 transition-opacity text-center sm:text-left cursor-pointer"
            >
              <strong className="font-extrabold text-[var(--color-text)]">
                {followingCount}
              </strong>{' '}
              <span className="text-[var(--color-muted)] text-xs underline decoration-dotted">following</span>
            </button>
          </div>

          {/* Name & Bio */}
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold text-sm text-[var(--color-text)]">
              <span>{profile?.name || user?.email?.split('@')[0] || 'Workspace User'}</span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white text-[9px]">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted)] max-w-lg leading-relaxed">
              {profile?.bio || 'Building future-ready autonomous workflows with Personal AI OS.'}
            </p>
            <div className="pt-0.5 text-xs text-[var(--color-cyan)] font-semibold flex items-center justify-center sm:justify-start gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal AI OS • Verified Member</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          STORY HIGHLIGHTS CIRCLES
      ========================================================= */}
      <section className="space-y-2">
        <div className="flex items-center gap-5 overflow-x-auto pb-2 scrollbar-none">
          {HIGHLIGHTS.map((hl) => (
            <div key={hl.id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
              <div className="flex h-16 w-16 items-center justify-center rounded-full p-[2px] border-2 border-[var(--color-border)] group-hover:border-[var(--color-primary)] transition-all">
                <img src={hl.cover} alt={hl.title} className="h-full w-full rounded-full object-cover" />
              </div>
              <span className="text-[11px] font-bold text-[var(--color-muted)] group-hover:text-[var(--color-text)] transition-colors">
                {hl.title}
              </span>
            </div>
          ))}

          {/* New highlight button */}
          <div
            onClick={onUploadStoryClick}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-[var(--color-border)] group-hover:border-[var(--color-primary)] transition-all bg-[var(--color-surface)]">
              <Plus className="w-5 h-5 text-[var(--color-muted)] group-hover:text-[var(--color-primary)]" />
            </div>
            <span className="text-[11px] font-bold text-[var(--color-muted)]">New Story</span>
          </div>
        </div>
      </section>

      {/* =========================================================
          PROFILE GRID TABS (POSTS, STORIES & MEDIA, SAVED)
      ========================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-center border-t border-[var(--color-border)]/60 gap-8 text-xs font-extrabold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setProfileTab('posts')}
            className={`flex items-center gap-2 py-3.5 border-t-2 transition-all ${
              profileTab === 'posts'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Posts ({myPosts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileTab('stories')}
            className={`flex items-center gap-2 py-3.5 border-t-2 transition-all ${
              profileTab === 'stories'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>24h Stories ({myStories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileTab('saved')}
            className={`flex items-center gap-2 py-3.5 border-t-2 transition-all ${
              profileTab === 'saved'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved ({savedPosts.length})</span>
          </button>
        </div>

        {/* =========================================================
            TAB 1: POSTS GRID (3-column Instagram square grid)
        ========================================================= */}
        {profileTab === 'posts' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {myPosts.map((post) => {
              const hasImage = post.mediaUrls && post.mediaUrls.length > 0;
              return (
                <div
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer shadow-sm hover:shadow-lg transition-all"
                >
                  {hasImage ? (
                    <img
                      src={post.mediaUrls![0]}
                      alt={post.title || post.content}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-indigo-900/60 to-[var(--color-surface)] p-4 flex flex-col justify-between text-white group-hover:scale-105 transition-transform duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-md self-start">
                        {post.tags?.[0] || 'Post'}
                      </span>
                      <p className="text-xs font-bold line-clamp-3 leading-snug">
                        {post.title || post.content}
                      </p>
                      <span className="text-[10px] text-[var(--color-muted)]">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay */}
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

            {myPosts.length === 0 && (
              <div className="col-span-full py-16 text-center text-xs text-[var(--color-muted)] space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--color-border)]">
                  <Camera className="w-6 h-6 text-[var(--color-muted)]" />
                </div>
                <h3 className="text-sm font-bold text-[var(--color-text)]">No Posts Yet</h3>
                <p>Share your first breakthrough, idea, or project update in The Lounge.</p>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: 24h STORIES (User's active stories)
        ========================================================= */}
        {profileTab === 'stories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-muted)]">
                Active 24-hour stories published by you ({myStories.length})
              </span>
              <button
                type="button"
                onClick={onUploadStoryClick}
                className="flex items-center gap-1 rounded-xl bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload New Story</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {myStories.map((story) => {
                const storyIdx = stories.findIndex((s) => s.id === story.id);
                return (
                  <div
                    key={story.id}
                    onClick={() => onSelectStory(storyIdx >= 0 ? storyIdx : 0)}
                    className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black cursor-pointer shadow-md hover:scale-[1.02] transition-transform"
                  >
                    {story.mediaType === 'video' ? (
                      <video src={story.mediaUrl} className="h-full w-full object-cover" />
                    ) : (
                      <img src={story.mediaUrl} alt="Story" className="h-full w-full object-cover" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-3 flex flex-col justify-between text-white">
                      <span className="text-[10px] font-bold text-pink-400 bg-black/40 px-2 py-0.5 rounded self-start">
                        Active 24h
                      </span>
                      <div className="text-[10px] space-y-0.5">
                        <span className="block font-bold">Expires:</span>
                        <span className="text-white/70">
                          {new Date(story.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {myStories.length === 0 && (
                <div className="col-span-full py-16 text-center text-xs text-[var(--color-muted)] space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[var(--color-border)]">
                    <Radio className="w-6 h-6 text-pink-400" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-text)]">No Active Stories</h3>
                  <p>Upload a 24-hour photo or short video update to show your daily progress!</p>
                  <button
                    type="button"
                    onClick={onUploadStoryClick}
                    className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white shadow-md"
                  >
                    Post 24h Story
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: SAVED POSTS
        ========================================================= */}
        {profileTab === 'saved' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {savedPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer shadow-sm hover:shadow-lg transition-all"
              >
                {post.mediaUrls && post.mediaUrls.length > 0 ? (
                  <img src={post.mediaUrls[0]} alt={post.title || post.authorName} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-purple-950/60 to-[var(--color-surface)] p-4 flex flex-col justify-between text-white">
                    <span className="text-[10px] font-bold text-amber-400">Saved Bookmark 🔖</span>
                    <p className="text-xs font-bold line-clamp-3">{post.title || post.content}</p>
                    <span className="text-[10px] text-[var(--color-muted)]">@{post.authorName}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs">
                  <span>View Bookmark →</span>
                </div>
              </div>
            ))}

            {savedPosts.length === 0 && (
              <div className="col-span-full py-16 text-center text-xs text-[var(--color-muted)] space-y-2">
                <Bookmark className="w-8 h-8 text-[var(--color-muted)]/40 mx-auto" />
                <h3 className="text-sm font-bold text-[var(--color-text)]">No Saved Posts</h3>
                <p>Bookmark insightful posts in The Lounge to review anytime.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Followers & Following Modal */}
      {followsModalTab && (
        <ProfileFollowsView
          targetUser={{
            userId: user?.uid || 'current',
            name: profile?.name || 'Me',
            username: profile?.username || 'explorer',
            avatarUrl: profile?.avatarUrl,
          }}
          currentUserId={user?.uid || 'current'}
          initialTab={followsModalTab}
          followers={effectiveFollowers}
          following={effectiveFollowing}
          followingSet={followingSet}
          onToggleFollow={onToggleFollow}
          onSelectUser={(u) => {
            setFollowsModalTab(null);
            onSelectUser?.(u);
          }}
          onClose={() => setFollowsModalTab(null)}
        />
      )}

      {/* Instagram 3-Dots Settings & Account Modal */}
      {isSettingsMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsSettingsMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-sm font-bold text-[var(--color-text)]">
                Settings and activity
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsMenuOpen(false)}
                className="rounded-full p-1 text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account Type & Professional Tools (Instagram style: accessible only in settings!) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--color-muted)] px-1">
                <span>Account Type</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  accountType === 'business'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-muted)]'
                }`}>
                  {accountType === 'business' ? '💼 Professional / Business' : '👤 Personal'}
                </span>
              </div>

              {accountType === 'personal' ? (
                <button
                  type="button"
                  id="settings-switch-to-business-btn"
                  onClick={() => {
                    onToggleAccountType?.('business');
                    setIsSettingsMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-3.5 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-all shadow-sm text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[var(--color-text)]">Switch to Professional Account</div>
                      <div className="text-[10px] text-[var(--color-muted)]">Get insights, creator studio &amp; business tools</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                </button>
              ) : (
                <div className="space-y-2">
                  {onNavigateStudio && (
                    <button
                      type="button"
                      id="settings-open-studio-btn"
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        onNavigateStudio();
                      }}
                      className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-indigo-600 p-3.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white shadow">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold">Professional Dashboard</div>
                          <div className="text-[10px] text-white/80">Track reach, audience &amp; Pulses insights</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/80" />
                    </button>
                  )}

                  <button
                    type="button"
                    id="settings-switch-to-personal-btn"
                    onClick={() => {
                      onToggleAccountType?.('personal');
                      setIsSettingsMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4" />
                      <span>Switch to Personal Account</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </button>
                </div>
              )}
            </div>

            {/* Other Instagram Settings Options */}
            <div className="pt-2 border-t border-[var(--color-border)] space-y-1">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsMenuOpen(false);
                  onNavigateSettings?.();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-[var(--color-muted)]" />
                  <span>Settings and privacy</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--color-muted)]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSettingsMenuOpen(false);
                  setProfileTab('saved');
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-[var(--color-muted)]" />
                  <span>Saved</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--color-muted)]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSettingsMenuOpen(false);
                  handleShareProfile();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Share2 className="w-4 h-4 text-[var(--color-muted)]" />
                  <span>Share profile</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--color-muted)]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
