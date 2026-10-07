import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Users,
  UserPlus,
  UserCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { UserProfile } from '../../types';

export interface FollowConnectionUser {
  userId: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  interests?: string[];
}

export interface ProfileFollowsViewProps {
  targetUser: {
    userId: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  };
  currentUserId?: string;
  initialTab?: 'followers' | 'following';
  followers: FollowConnectionUser[];
  following: FollowConnectionUser[];
  followingSet: Set<string>;
  onToggleFollow?: (userId: string) => void;
  onSelectUser: (user: FollowConnectionUser) => void;
  onClose: () => void;
}

export const ProfileFollowsView: React.FC<ProfileFollowsViewProps> = ({
  targetUser,
  currentUserId,
  initialTab = 'followers',
  followers,
  following,
  followingSet,
  onToggleFollow,
  onSelectUser,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  const isMe = currentUserId === targetUser.userId;

  const currentList = activeTab === 'followers' ? followers : following;

  // Filter connections by name, username, or bio
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.bio || '').toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[160] flex items-center justify-center bg-[var(--color-bg)]/85 p-4 backdrop-blur-md animate-fade-in"
    >
      <div className="relative flex flex-col max-h-[85vh] w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[var(--color-border)]">
          <div className="min-w-0 pr-3">
            <h3 className="text-sm font-extrabold text-[var(--color-text)] truncate">
              {isMe ? 'My Connections' : `${targetUser.name}'s Connections`}
            </h3>
            <p className="text-[11px] text-[var(--color-muted)] truncate">
              @{targetUser.username || targetUser.userId}
            </p>
          </div>
          <button
            type="button"
            id="profile-follows-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Followers vs Following */}
        <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
          <button
            type="button"
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all relative ${
              activeTab === 'followers'
                ? 'text-[var(--color-primary)] font-extrabold'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <span>Followers</span>{' '}
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
              {followers.length}
            </span>
            {activeTab === 'followers' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all relative ${
              activeTab === 'following'
                ? 'text-[var(--color-primary)] font-extrabold'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <span>Following</span>{' '}
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
              {following.length}
            </span>
            {activeTab === 'following' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />
            )}
          </button>
        </div>

        {/* Search input to filter connections */}
        <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs">
            <Search className="w-3.5 h-3.5 text-[var(--color-muted)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab} by name or username…`}
              className="w-full bg-transparent outline-none text-xs text-[var(--color-text)] placeholder-[var(--color-muted)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Connections List or Graceful Empty States */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-[var(--color-border)]/40 scrollbar-thin">
          {filteredList.length > 0 ? (
            filteredList.map((userItem) => {
              const isTargetMe = userItem.userId === currentUserId;
              const isCurrentlyFollowed = followingSet.has(userItem.userId);

              return (
                <div
                  key={userItem.userId}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[var(--color-surface-elevated)] transition-all group"
                >
                  {/* User Profile Info - Clickable to open profile */}
                  <div
                    onClick={() => {
                      onSelectUser(userItem);
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      {userItem.avatarUrl ? (
                        <img
                          src={userItem.avatarUrl}
                          alt={userItem.name}
                          className="h-10 w-10 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold text-xs">
                          {(userItem.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <strong className="block text-xs font-bold text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                          {userItem.name}
                        </strong>
                        {isTargetMe && (
                          <span className="px-1.5 py-0.2 rounded-md bg-[var(--color-primary)]/15 text-[var(--color-primary)] text-[9px] font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--color-muted)] truncate">
                        @{userItem.username || userItem.userId}
                      </p>
                      {userItem.bio && (
                        <p className="text-[10px] text-[var(--color-muted)]/80 truncate mt-0.5">
                          {userItem.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Follow / Unfollow Toggle Action */}
                  <div className="shrink-0 ml-2">
                    {!isTargetMe && onToggleFollow ? (
                      <button
                        type="button"
                        onClick={() => onToggleFollow(userItem.userId)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          isCurrentlyFollowed
                            ? 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-red-400 hover:border-red-500/40'
                            : 'bg-[var(--color-primary)] text-white hover:brightness-110'
                        }`}
                      >
                        {isCurrentlyFollowed ? (
                          <>
                            <UserCheck className="w-3 h-3 text-emerald-400" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectUser(userItem);
                          onClose();
                        }}
                        className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-colors"
                        title="View profile"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : searchQuery ? (
            /* Search yielded no results empty state */
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-bg-secondary)] text-[var(--color-muted)]">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-[var(--color-text)]">
                No connections found
              </p>
              <p className="text-[11px] text-[var(--color-muted)] max-w-xs">
                No users in {activeTab} matched &ldquo;{searchQuery}&rdquo;. Try another name or keyword.
              </p>
            </div>
          ) : (
            /* Graceful empty state when user has 0 followers or following */
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                {activeTab === 'followers' ? (
                  <Users className="w-6 h-6" />
                ) : (
                  <UserPlus className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--color-text)]">
                  {activeTab === 'followers'
                    ? isMe
                      ? 'No followers yet'
                      : `${targetUser.name} has no followers yet`
                    : isMe
                    ? 'Not following anyone yet'
                    : `${targetUser.name} is not following anyone yet`}
                </p>
                <p className="text-[11px] text-[var(--color-muted)] max-w-xs mt-1">
                  {activeTab === 'followers'
                    ? isMe
                      ? 'Share your insights or projects in The Lounge to connect with other workspace members.'
                      : 'Be the first person to follow them and join their network!'
                    : isMe
                    ? 'Explore the Lounge People directory to discover developers, designers, and students.'
                    : 'Check back later as they discover other community members.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
