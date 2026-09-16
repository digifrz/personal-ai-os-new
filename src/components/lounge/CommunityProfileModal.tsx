import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  MessageSquare,
  Edit2,
  Search,
  Check,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, CommunityPostItem } from '../../types';
import { updateUserProfile, toggleFollowUser, checkIsFollowing } from '../../services/db';

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
  allProfiles: UserProfile[];
  onClose: () => void;
  onOpenMessage: (userId: string, displayName: string) => void;
  onShowToast: (msg: string) => void;
}

export const CommunityProfileModal: React.FC<CommunityProfileModalProps> = ({
  targetUser,
  posts,
  allProfiles,
  onClose,
  onOpenMessage,
  onShowToast,
}) => {
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const isMe = user?.uid === targetUser.userId;

  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'saved'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(14);
  const [followingCount, setFollowingCount] = useState(19);

  // Connections dialog
  const [showConnections, setShowConnections] = useState<'followers' | 'following' | null>(null);
  const [connectionSearch, setConnectionSearch] = useState('');

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
    onShowToast(nextState ? `Following ${targetUser.displayName}` : `Unfollowed ${targetUser.displayName}`);
    try {
      await toggleFollowUser(user.uid, targetUser.userId, !nextState);
    } catch (e) {
      console.warn('Could not sync follow state:', e);
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

  const userPosts = posts.filter((p) => p.userId === targetUser.userId || p.authorId === targetUser.userId);
  const savedPosts = posts.filter((p) => (p.savedBy || []).includes(targetUser.userId));

  // Connections list filtering
  const visibleConnections = allProfiles.filter((p) => {
    if (p.userId === targetUser.userId) return false;
    if (!connectionSearch) return true;
    const q = connectionSearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.username || '').toLowerCase().includes(q) ||
      (p.bio || '').toLowerCase().includes(q)
    );
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[150] flex items-center justify-center bg-[var(--color-bg)]/85 p-4 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative my-8 w-full max-w-3xl overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header close */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
            Community Member Profile
          </p>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Hero */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6">
          {targetUser.avatarUrl ? (
            <img
              src={targetUser.avatarUrl}
              alt={targetUser.displayName}
              className="h-20 w-20 rounded-full object-cover border-2 border-[var(--color-primary)] shrink-0"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-2xl font-extrabold text-[var(--color-primary)] border-2 border-[var(--color-primary)]/40">
              {targetUser.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-text)]">
              {targetUser.displayName}
            </h2>
            <p className="text-xs font-semibold text-[var(--color-cyan)]">
              @{targetUser.username || targetUser.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '')}
            </p>
            <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
              {targetUser.bio || 'Productive mind exploring the Personal AI OS ecosystem.'}
            </p>
            {targetUser.interests && targetUser.interests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {targetUser.interests.map((int) => (
                  <span
                    key={int}
                    className="rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]"
                  >
                    #{int}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            {isMe ? (
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit profile</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm ${
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
                  onClick={() => {
                    onClose();
                    onOpenMessage(targetUser.userId, targetUser.displayName);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3.5 text-xs text-[var(--color-muted)]">
          <button
            type="button"
            onClick={() => setShowConnections('followers')}
            className="hover:text-[var(--color-text)] transition-colors text-left"
          >
            <strong className="text-sm font-bold text-[var(--color-text)] mr-1.5">
              {followersCount}
            </strong>
            <span>Followers</span>
          </button>
          <button
            type="button"
            onClick={() => setShowConnections('following')}
            className="hover:text-[var(--color-text)] transition-colors text-left"
          >
            <strong className="text-sm font-bold text-[var(--color-text)] mr-1.5">
              {followingCount}
            </strong>
            <span>Following</span>
          </button>
          <div>
            <strong className="text-sm font-bold text-[var(--color-text)] mr-1.5">
              {userPosts.length}
            </strong>
            <span>Posts</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-4 border-b border-[var(--color-border)] pb-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`border-b-2 pb-2 transition-all ${
              activeTab === 'posts'
                ? 'border-[var(--color-primary)] text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Posts ({userPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('replies')}
            className={`border-b-2 pb-2 transition-all ${
              activeTab === 'replies'
                ? 'border-[var(--color-primary)] text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Replies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`border-b-2 pb-2 transition-all ${
              activeTab === 'saved'
                ? 'border-[var(--color-primary)] text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Saved ({savedPosts.length})
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'posts' && (
            <div className="space-y-3">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-2"
                >
                  <span className="text-[10px] text-[var(--color-muted)]">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                  <p className="text-xs text-[var(--color-text)] font-medium leading-relaxed">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-[var(--color-muted)] pt-1">
                    <span>❤️ {post.likesCount || 0} likes</span>
                    <span>💬 {post.commentsCount || 0} comments</span>
                  </div>
                </div>
              ))}

              {userPosts.length === 0 && (
                <p className="py-8 text-center text-xs text-[var(--color-muted)]">
                  No public posts shared yet.
                </p>
              )}
            </div>
          )}

          {activeTab === 'replies' && (
            <p className="py-8 text-center text-xs text-[var(--color-muted)]">
              No recent public replies.
            </p>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-3">
              {savedPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-2"
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
                <p className="py-8 text-center text-xs text-[var(--color-muted)]">
                  No saved posts in this collection.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

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
                placeholder="farzan"
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

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                Avatar Image URL (Optional)
              </label>
              <input
                type="url"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-text)]"
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

      {/* Connections Modal */}
      {showConnections && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-cyan)]">
                  Community Connections
                </p>
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  {showConnections === 'followers' ? 'Followers' : 'Following'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConnections(null)}
                className="p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs">
              <Search className="w-3.5 h-3.5 text-[var(--color-muted)]" />
              <input
                type="search"
                value={connectionSearch}
                onChange={(e) => setConnectionSearch(e.target.value)}
                placeholder="Search people..."
                className="w-full bg-transparent outline-none text-xs text-[var(--color-text)]"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {visibleConnections.map((person) => (
                <div
                  key={person.userId}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary)]">
                      {person.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                    <div className="min-w-0">
                      <strong className="block text-xs font-bold text-[var(--color-text)] truncate">
                        {person.name}
                      </strong>
                      <small className="text-[10px] text-[var(--color-muted)] truncate block">
                        @{person.username || 'member'}
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowConnections(null);
                      onClose();
                      onOpenMessage(person.userId, person.name);
                    }}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-primary)] hover:border-[var(--color-primary)]"
                  >
                    Message
                  </button>
                </div>
              ))}

              {visibleConnections.length === 0 && (
                <p className="py-6 text-center text-xs text-[var(--color-muted)]">
                  No connections found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
