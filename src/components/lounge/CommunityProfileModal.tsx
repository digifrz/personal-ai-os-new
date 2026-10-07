import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  MessageSquare,
  Edit2,
  Check,
  Sparkles,
  Heart,
  Share2,
  Grid,
  Bookmark,
  Radio,
  Camera,
  Layers,
  Briefcase,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, CommunityPostItem, StoryItem } from '../../types';
import { updateUserProfile, toggleFollowUser, checkIsFollowing } from '../../services/db';
import { ProfileFollowsView, FollowConnectionUser } from './ProfileFollowsView';

interface CommunityProfileModalProps {
  targetUser: {
    userId: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    interests?: string[];
  };
  posts: CommunityPostItem[];
  stories?: StoryItem[];
  allProfiles: UserProfile[];
  onClose: () => void;
  onOpenMessage: (userId: string, displayName: string) => void;
  onShowToast: (msg: string) => void;
  onSelectStory?: (idx: number) => void;
}

const HIGHLIGHTS = [
  { id: '1', title: '🚀 Builds', cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80' },
  { id: '2', title: '🎨 Design', cover: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=150&auto=format&fit=crop&q=80' },
  { id: '3', title: '🤖 AI Work', cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' },
  { id: '4', title: '📚 Study', cover: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=150&auto=format&fit=crop&q=80' },
];

export const CommunityProfileModal: React.FC<CommunityProfileModalProps> = ({
  targetUser,
  posts,
  stories = [],
  allProfiles,
  onClose,
  onOpenMessage,
  onShowToast,
  onSelectStory,
}) => {
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const isMe = user?.uid === targetUser.userId;

  const [activeTab, setActiveTab] = useState<'posts' | 'stories' | 'saved'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(18);
  const [followingCount, setFollowingCount] = useState(24);

  // Selected post preview modal
  const [selectedPost, setSelectedPost] = useState<CommunityPostItem | null>(null);

  // Connections dialog
  const [showConnections, setShowConnections] = useState<'followers' | 'following' | null>(null);

  // Edit profile dialog
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(targetUser.displayName);
  const [editUsername, setEditUsername] = useState(targetUser.username || '');
  const [editBio, setEditBio] = useState(targetUser.bio || '');
  const [editInterests, setEditInterests] = useState((targetUser.interests || []).join(', '));
  const [editAvatarUrl, setEditAvatarUrl] = useState(targetUser.avatarUrl || '');

  // Check following state
  useEffect(() => {
    if (user && !isMe) {
      checkIsFollowing(user.uid, targetUser.userId)
        .then((f) => setIsFollowing(f))
        .catch(() => {});
    }
  }, [user, targetUser.userId, isMe]);

  const handleToggleFollow = async () => {
    if (!user) return;
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowersCount((prev) => Math.max(0, prev + (nextState ? 1 : -1)));
    // Silent update like Instagram - no toast
    try {
      await toggleFollowUser(user.uid, targetUser.userId, !nextState);
    } catch (e) {
      console.warn('Could not sync follow state:', e);
    }
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      onShowToast(`Copied @${targetUser.username || targetUser.displayName}'s profile link!`);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const interestsArray = editInterests
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);

      await updateUserProfile(user.uid, {
        name: editName.trim(),
        username: editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio: editBio.trim(),
        avatarUrl: editAvatarUrl.trim(),
        interests: interestsArray,
      });

      await refreshProfile();
      setShowEdit(false);
      onShowToast('Profile updated successfully.');
    } catch (e) {
      onShowToast('Failed to update profile.');
    }
  };

  // User's posts
  const userPosts = posts.filter(
    (p) => p.userId === targetUser.userId || p.authorId === targetUser.userId || p.authorName === targetUser.displayName
  );
  const savedPosts = posts.filter((p) => (p.savedBy || []).includes(targetUser.userId));

  // Resolved user profile data
  const userProfileData = allProfiles.find(
    (p) => p.userId === targetUser.userId || p.name === targetUser.displayName
  );
  const targetAccountType: 'personal' | 'business' =
    userProfileData?.accountType ||
    (targetUser as any).accountType ||
    (['Elena Rostova', 'Marcus Chen', 'Devon Vance'].includes(targetUser.displayName) ? 'business' : 'personal');
  const businessCategory =
    userProfileData?.businessCategory ||
    (targetUser as any).businessCategory ||
    (targetUser.displayName === 'Elena Rostova' ? 'AI Systems Architect & Creator' : 'Digital Creator');
  const businessWebsite = userProfileData?.businessWebsite || (targetUser as any).businessWebsite || (targetAccountType === 'business' ? 'https://studio.ai-os.network' : undefined);
  const businessCta = userProfileData?.businessCta || 'Contact / Collaborate';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-auto w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-2xl space-y-8 scrollbar-thin">
        {/* Top Header Row with Close */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-[var(--color-muted)] font-mono uppercase tracking-wider">
              Community Profile • @{targetUser.username || targetUser.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '')}
            </span>
          </div>
          <button
            type="button"
            id="close-profile-modal-btn"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =========================================================
            IDENTICAL INSTAGRAM PROFILE HEADER
        ========================================================= */}
        <section className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-12 pb-6 border-b border-[var(--color-border)]/60">
          {/* Large Profile Picture with Story Gradient Ring */}
          <div className="relative shrink-0 group">
            <div className="flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full p-[3px] bg-gradient-to-tr from-[var(--color-primary)] via-indigo-600 to-[var(--color-cyan)] shadow-xl">
              <div className="h-full w-full rounded-full bg-[var(--color-surface)] p-[3px]">
                {targetUser.avatarUrl ? (
                  <img
                    src={targetUser.avatarUrl}
                    alt={targetUser.displayName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-purple-600 text-3xl font-extrabold text-white">
                    {targetUser.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Stats & Bio */}
          <div className="flex-1 text-center sm:text-left space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text)] tracking-tight">
                  @{targetUser.username || targetUser.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '')}
                </h2>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white" title="Verified Member">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              </div>

              {/* Action Buttons: Follow / Message / Share */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {isMe ? (
                  <button
                    type="button"
                    onClick={() => setShowEdit(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      id="modal-toggle-follow-btn"
                      onClick={handleToggleFollow}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-sm ${
                        isFollowing
                          ? 'border border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      id="modal-send-message-btn"
                      onClick={() => {
                        onClose();
                        onOpenMessage(targetUser.userId, targetUser.displayName);
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Instagram Stats: Posts, Followers, Following */}
            <div className="flex items-center justify-center sm:justify-start gap-8 text-sm">
              <div>
                <strong className="font-extrabold text-[var(--color-text)]">{userPosts.length}</strong>{' '}
                <span className="text-[var(--color-muted)] text-xs">posts</span>
              </div>
              <button
                type="button"
                id="other-profile-followers-btn"
                onClick={() => setShowConnections('followers')}
                className="hover:opacity-75 transition-opacity text-center sm:text-left cursor-pointer"
              >
                <strong className="font-extrabold text-[var(--color-text)]">
                  {followersCount}
                </strong>{' '}
                <span className="text-[var(--color-muted)] text-xs underline decoration-dotted">followers</span>
              </button>
              <button
                type="button"
                id="other-profile-following-btn"
                onClick={() => setShowConnections('following')}
                className="hover:opacity-75 transition-opacity text-center sm:text-left cursor-pointer"
              >
                <strong className="font-extrabold text-[var(--color-text)]">
                  {followingCount}
                </strong>{' '}
                <span className="text-[var(--color-muted)] text-xs underline decoration-dotted">following</span>
              </button>
            </div>

            {/* Name, Bio, and Tags */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold text-sm text-[var(--color-text)]">
                <span>{targetUser.displayName}</span>
              </div>
              <p className="text-xs text-[var(--color-muted)] max-w-lg leading-relaxed">
                {targetUser.bio || 'Exploring productive workflows, study routines, and AI tools in Personal AI OS.'}
              </p>

              {targetUser.interests && targetUser.interests.length > 0 && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                  {targetUser.interests.map((int) => (
                    <span
                      key={int}
                      className="rounded-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]"
                    >
                      #{int}
                    </span>
                  ))}
                </div>
              )}

              {/* Account Type, Category, and Website */}
              {targetAccountType === 'business' ? (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    <span>Business / Creator Account</span>
                  </span>
                  <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
                    ✨ {businessCategory}
                  </span>
                  {businessWebsite && (
                    <a
                      href={businessWebsite.startsWith('http') ? businessWebsite : `https://${businessWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-primary)] hover:underline"
                    >
                      <Globe className="w-3 h-3" />
                      <span>{businessWebsite.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="pt-0.5 flex items-center justify-center sm:justify-start">
                  <span className="rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-muted)]">
                    👤 Personal Account
                  </span>
                </div>
              )}

              <div className="pt-0.5 text-xs text-[var(--color-cyan)] font-semibold flex items-center justify-center sm:justify-start gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Personal AI OS • Verified Member</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            STORY HIGHLIGHTS CIRCLES (IDENTICAL TO USER PROFILE)
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
          </div>
        </section>

        {/* =========================================================
            PROFILE GRID TABS (POSTS, STORIES & MEDIA, SAVED)
        ========================================================= */}
        <section className="space-y-6">
          <div className="flex items-center justify-center border-t border-[var(--color-border)]/60 gap-8 text-xs font-extrabold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 py-3.5 border-t-2 transition-all ${
                activeTab === 'posts'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Posts ({userPosts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stories')}
              className={`flex items-center gap-2 py-3.5 border-t-2 transition-all ${
                activeTab === 'stories'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Stories</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 py-3.5 border-t-2 transition-all ${
                activeTab === 'saved'
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
          {activeTab === 'posts' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {userPosts.map((post) => {
                const hasImage = post.mediaUrls && post.mediaUrls.length > 0;
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
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
                          {post.tags?.[0] || 'Update'}
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

              {userPosts.length === 0 && (
                <div className="col-span-full py-16 text-center text-xs text-[var(--color-muted)] space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--color-border)]">
                    <Camera className="w-6 h-6 text-[var(--color-muted)]" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-text)]">No Posts Shared Yet</h3>
                  <p>This member hasn't published any public posts to The Lounge yet.</p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB 2: STORIES
          ========================================================= */}
          {activeTab === 'stories' && (
            <div>
              {(() => {
                const memberStories = stories.filter(
                  (s) => s.userId === targetUser.userId || s.authorName === targetUser.displayName
                );
                if (memberStories.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs text-[var(--color-muted)] space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                        <Radio className="w-5 h-5 text-[var(--color-muted)]" />
                      </div>
                      <p className="font-bold text-[var(--color-text)]">No Active 24h Stories</p>
                      <p className="text-[11px]">24-hour stories published by this user will appear here.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {memberStories.map((story) => {
                      const idx = stories.findIndex((s) => s.id === story.id);
                      return (
                        <div
                          key={story.id}
                          onClick={() => onSelectStory?.(idx >= 0 ? idx : 0)}
                          className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black cursor-pointer shadow-md hover:scale-[1.02] transition-transform"
                        >
                          {story.mediaType === 'video' ? (
                            <video
                              src={story.mediaUrl}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <img
                              src={story.mediaUrl}
                              alt={story.authorName}
                              className="h-full w-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                            <span className="text-[11px] font-bold text-white drop-shadow truncate">
                              {story.caption || 'Active Story'}
                            </span>
                            <span className="text-[9px] text-white/70">
                              Tap to watch
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* =========================================================
              TAB 3: SAVED POSTS
          ========================================================= */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              {savedPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-2 cursor-pointer hover:border-[var(--color-primary)] transition-all"
                >
                  <strong className="block text-xs font-bold text-[var(--color-text)]">
                    {post.authorName}
                  </strong>
                  <p className="text-xs text-[var(--color-muted)] line-clamp-3">
                    {post.content}
                  </p>
                </div>
              ))}

              {savedPosts.length === 0 && (
                <div className="py-12 text-center text-xs text-[var(--color-muted)] space-y-2">
                  <Bookmark className="w-6 h-6 mx-auto text-[var(--color-muted)]" />
                  <p className="font-bold text-[var(--color-text)]">No Saved Posts</p>
                  <p className="text-[11px]">Saved posts are kept private to this member.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Post Detail Preview Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-[190] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                  {selectedPost.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text)]">{selectedPost.authorName}</h4>
                  <span className="text-[10px] text-[var(--color-muted)]">
                    {new Date(selectedPost.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
              <div className="max-h-72 overflow-hidden rounded-2xl bg-black">
                <img
                  src={selectedPost.mediaUrls[0]}
                  alt="Post media"
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            <p className="text-xs text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
              {selectedPost.content}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-xs text-[var(--color-muted)]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  {selectedPost.likesCount || 0} likes
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {selectedPost.commentsCount || 0} comments
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(`"${selectedPost.content}" — @${selectedPost.authorName}`);
                    onShowToast('Post snippet copied to clipboard!');
                  }
                  setSelectedPost(null);
                }}
                className="text-[11px] font-bold text-[var(--color-primary)] hover:underline"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Dialog */}
      {showEdit && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveProfile}
            className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
              <h3 className="text-base font-bold text-[var(--color-text)]">
                Edit Public Profile
              </h3>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                Username
              </label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="username"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                Bio
              </label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell the community what you're creating or studying..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                Interests (comma separated)
              </label>
              <input
                type="text"
                value={editInterests}
                onChange={(e) => setEditInterests(e.target.value)}
                placeholder="coding, learning, startups, design"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all"
              >
                Save profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Connections Modal powered by ProfileFollowsView */}
      {showConnections && (
        <ProfileFollowsView
          targetUser={{
            userId: targetUser.userId,
            name: targetUser.displayName,
            username: targetUser.username,
            avatarUrl: targetUser.avatarUrl,
          }}
          currentUserId={user?.uid || 'current'}
          initialTab={showConnections}
          followers={allProfiles.map((p) => ({
            userId: p.userId,
            name: p.name,
            username: p.username,
            avatarUrl: p.avatarUrl,
            bio: p.bio,
            interests: p.interests,
          }))}
          following={allProfiles
            .filter((p) => p.userId !== targetUser.userId)
            .map((p) => ({
              userId: p.userId,
              name: p.name,
              username: p.username,
              avatarUrl: p.avatarUrl,
              bio: p.bio,
              interests: p.interests,
            }))}
          followingSet={
            new Set(['seed_alex', 'seed_maya', ...(isFollowing ? [targetUser.userId] : [])])
          }
          onToggleFollow={handleToggleFollow}
          onSelectUser={(u) => {
            setShowConnections(null);
            onOpenMessage(u.userId, u.name);
          }}
          onClose={() => setShowConnections(null)}
        />
      )}
    </div>
  );
};
