import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Plus,
  MessageSquare,
  Bookmark,
  Share2,
  Trash2,
  MoreVertical,
  Flag,
  UserX,
  Send,
  Image as ImageIcon,
  Video as VideoIcon,
  Paperclip,
  RefreshCw,
  X,
  User,
  Users,
  Shield,
  HelpCircle,
  Clock,
  Heart,
  UserPlus,
  UserCheck,
  Check,
  Globe,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  CommunityPostItem,
  CommunityCommentItem,
  CommunityChannelItem,
  DirectThreadItem,
  StoryItem,
  UserProfile,
} from '../types';
import {
  createCommunityPost,
  togglePostReaction,
  toggleSavePost,
  subscribePostComments,
  addPostComment,
  deleteCommunityComment,
  deleteCommunityPost,
  subscribeCommunityChannels,
  subscribeDirectThreads,
  getOrCreateDirectThread,
  subscribeStories,
  uploadStory,
  subscribeCommunityProfiles,
  toggleFollowUser,
} from '../services/db';
import { askAI } from '../services/ai';

// Modals
import { StoryViewerModal } from '../components/lounge/StoryViewerModal';
import { RulesPrivacyModal } from '../components/lounge/RulesPrivacyModal';
import { ContactSupportModal } from '../components/lounge/ContactSupportModal';
import { SharePostModal } from '../components/lounge/SharePostModal';
import { CommunityProfileModal } from '../components/lounge/CommunityProfileModal';
import { RoomChatModal } from '../components/lounge/RoomChatModal';
import { DirectChatModal } from '../components/lounge/DirectChatModal';
import { ReportPostModal } from '../components/lounge/ReportPostModal';

interface CommunityViewProps {
  posts: CommunityPostItem[];
  onNavigate?: (tab: string) => void;
}

// Built-in Seeded Community Channels
const DEFAULT_CHANNELS: CommunityChannelItem[] = [
  { id: 'tech', name: 'AI & Tech', description: 'Tools, ideas, and intelligent technology.', icon: '🌐', order: 1 },
  { id: 'coding', name: 'Coding', description: 'Build logs, debugging help, and programming.', icon: '🌐', order: 2 },
  { id: 'design', name: 'Design', description: 'Interfaces, visual ideas, and feedback.', icon: '🌐', order: 3 },
  { id: 'general', name: 'General', description: 'A friendly place to meet the community.', icon: '🌐', order: 4 },
  { id: 'startups', name: 'Startups', description: 'Products, experiments, and lessons learned.', icon: '🌐', order: 5 },
  { id: 'students', name: 'Students', description: 'Study together and share learning wins.', icon: '🌐', order: 6 },
  { id: 'study', name: 'Study', description: 'Focus sessions, revision, and accountability.', icon: '🌐', order: 7 },
];

// Seeded directory profiles for a vibrant, living ecosystem
const SEED_PROFILES: UserProfile[] = [
  {
    userId: 'seed_alex',
    name: 'Alex Chen',
    username: 'alexchen',
    email: 'alex@os.community',
    bio: 'Building neural workflows, offline LLMs, and modular UI systems.',
    interests: ['AI', 'Systems', 'Productivity', 'TypeScript'],
  },
  {
    userId: 'seed_maya',
    name: 'Maya Lin',
    username: 'mayadesign',
    email: 'maya@os.community',
    bio: 'Product designer obsessed with calm interfaces, typography, and human ergonomics.',
    interests: ['Design', 'UX', 'Typography', 'Minimalism'],
  },
  {
    userId: 'seed_sarah',
    name: 'Sarah Connor',
    username: 'sarahc',
    email: 'sarah@os.community',
    bio: 'Fullstack engineer & open-source contributor. Currently exploring AI Agents.',
    interests: ['Coding', 'React', 'Cloud', 'Automation'],
  },
  {
    userId: 'seed_david',
    name: 'David Kim',
    username: 'davidk',
    email: 'david@os.community',
    bio: 'Medical researcher using Personal AI OS for literature synthesis and spaced repetition.',
    interests: ['Study', 'Flashcards', 'Biotech', 'Research'],
  },
];

export const CommunityView: React.FC<CommunityViewProps> = ({ posts: initialPosts, onNavigate }) => {
  const { user, profile } = useAuth();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'for_you' | 'following' | 'latest' | 'trending' | 'my_posts' | 'saved' | 'communities' | 'people' | 'inbox'
  >('for_you');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('all');

  // Stories
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const storyInputRef = useRef<HTMLInputElement>(null);

  // Composer State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postVisibility, setPostVisibility] = useState<'public' | 'followers'>('public');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedVideo, setAttachedVideo] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [isAiPolishing, setIsAiPolishing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Post Reactions & Comment Expanded States
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [postCommentsMap, setPostCommentsMap] = useState<Record<string, CommunityCommentItem[]>>({});
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({});
  const [openOptionsMenuPostId, setOpenOptionsMenuPostId] = useState<string | null>(null);

  // Following & Blocked lists (synced with local storage & Firestore)
  const [followingSet, setFollowingSet] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lounge_following_users');
      return saved ? new Set(JSON.parse(saved)) : new Set(['seed_alex', 'seed_maya']);
    } catch {
      return new Set(['seed_alex', 'seed_maya']);
    }
  });
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lounge_blocked_users');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Channels, Direct Threads & Profiles
  const [channels, setChannels] = useState<CommunityChannelItem[]>(DEFAULT_CHANNELS);
  const [activeRoom, setActiveRoom] = useState<CommunityChannelItem | null>(null);
  const [threads, setThreads] = useState<DirectThreadItem[]>([]);
  const [activeThread, setActiveThread] = useState<DirectThreadItem | null>(null);
  const [inboxSearch, setInboxSearch] = useState('');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [peopleSearch, setPeopleSearch] = useState('');

  // Modals
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<{
    userId: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    interests?: string[];
  } | null>(null);
  const [shareModalPost, setShareModalPost] = useState<CommunityPostItem | null>(null);
  const [reportModalPost, setReportModalPost] = useState<CommunityPostItem | null>(null);

  // Toast Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Subscribe to stories
  useEffect(() => {
    const unsub = subscribeStories((s) => setStories(s));
    return () => unsub();
  }, []);

  // Subscribe to channels
  useEffect(() => {
    const unsub = subscribeCommunityChannels((ch) => {
      if (ch && ch.length > 0) {
        setChannels(ch);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to direct threads if user is authenticated
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeDirectThreads(user.uid, (th) => setThreads(th));
    return () => unsub();
  }, [user]);

  // Subscribe to community profiles
  useEffect(() => {
    const unsub = subscribeCommunityProfiles((all) => {
      // Merge with seed profiles
      const merged = [...SEED_PROFILES];
      all.forEach((p) => {
        if (!merged.find((m) => m.userId === p.userId)) {
          merged.push(p);
        }
      });
      setProfiles(merged);
    });
    return () => unsub();
  }, []);

  // Subscribe to comments for the open post
  useEffect(() => {
    if (!openCommentsPostId) return;
    const unsub = subscribePostComments(openCommentsPostId, (cmts) => {
      setPostCommentsMap((prev) => ({ ...prev, [openCommentsPostId]: cmts }));
    });
    return () => unsub();
  }, [openCommentsPostId]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenOptionsMenuPostId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Toggle Following a User
  const handleToggleFollow = async (targetUserId: string, targetName: string) => {
    if (!user) return;
    const next = new Set(followingSet);
    const isNowFollowing = !next.has(targetUserId);

    if (isNowFollowing) {
      next.add(targetUserId);
      showToast(`Now following ${targetName}`);
    } else {
      next.delete(targetUserId);
      showToast(`Unfollowed ${targetName}`);
    }

    setFollowingSet(next);
    localStorage.setItem('lounge_following_users', JSON.stringify(Array.from(next)));

    try {
      await toggleFollowUser(user.uid, targetUserId, !isNowFollowing);
    } catch (e) {
      console.warn('Sync follow error:', e);
    }
  };

  // Block User
  const handleBlockUser = (userId: string, userName: string) => {
    const next = new Set(blockedUsers);
    next.add(userId);
    setBlockedUsers(next);
    localStorage.setItem('lounge_blocked_users', JSON.stringify(Array.from(next)));
    showToast(`Blocked ${userName}. Their posts will be hidden.`);
  };

  // Upload Story
  const handleStoryFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingStory(true);
    showToast('Uploading 24-hour story…');

    try {
      await uploadStory(
        user.uid,
        profile?.name || user.email?.split('@')[0] || 'Me',
        profile?.avatarUrl || '',
        file
      );
      showToast('Story published to The Lounge!');
    } catch (err) {
      console.warn('Story upload error:', err);
      // Local fallback story object
      const url = URL.createObjectURL(file);
      const newStory: StoryItem = {
        id: 'local_' + Date.now(),
        userId: user.uid,
        authorName: profile?.name || 'Me',
        authorAvatar: profile?.avatarUrl || '',
        mediaUrl: url,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      };
      setStories((prev) => [newStory, ...prev]);
      showToast('Story added for this session!');
    } finally {
      setIsUploadingStory(false);
      if (storyInputRef.current) storyInputRef.current.value = '';
    }
  };

  // AI Improve Composer Draft
  const handleAiImprove = async () => {
    if (!postContent.trim()) {
      showToast('Please type some draft thoughts first.');
      return;
    }
    setIsAiPolishing(true);
    showToast('AI polishing your post draft…');

    try {
      const response = await askAI({
        prompt: `Please polish and improve this community post draft for a collaborative platform named "The Lounge". Keep the author's authentic voice, make the structure engaging and readable, and fix any grammar issues:\n\n"${postContent}"`,
        mode: 'chat',
      });
      if (response && response.trim()) {
        setPostContent(response.trim());
        showToast('✨ Post draft improved!');
      }
    } catch (e) {
      // Local enhancement fallback
      const enhanced = postContent
        .trim()
        .replace(/\bi\b/g, 'I')
        .concat('\n\n💡 What do you think? Sharing insights with the Lounge!');
      setPostContent(enhanced);
      showToast('Draft updated with polish.');
    } finally {
      setIsAiPolishing(false);
    }
  };

  // AI Tag Recommender
  const handleAiTags = async () => {
    if (!postContent.trim()) {
      showToast('Write your post first to generate relevant tags.');
      return;
    }
    try {
      const res = await askAI({
        prompt: `Suggest 3 concise hashtag topics for this post content. Output ONLY the tags separated by spaces, like #Productivity #AI #Dev:\n"${postContent}"`,
        mode: 'chat',
      });
      const tags = res.match(/#[A-Za-z0-9_]+/g) || ['#Productivity', '#Insights', '#Tech'];
      setPostContent((prev) => prev.trim() + '\n\n' + tags.join(' '));
      showToast('Tags attached!');
    } catch {
      setPostContent((prev) => prev.trim() + '\n\n#Productivity #AI #Community');
      showToast('Suggested tags appended.');
    }
  };

  // Handle Post Creation
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!postTitle.trim() && !postContent.trim()) || isPosting) return;

    setIsPosting(true);

    const attachments: Array<{ name: string; url: string; type: string }> = [];
    if (attachedImage) attachments.push({ name: 'Image attachment', url: attachedImage, type: 'image/jpeg' });
    if (attachedVideo) attachments.push({ name: 'Video attachment', url: attachedVideo, type: 'video/mp4' });
    if (attachedFileName) attachments.push({ name: attachedFileName, url: '#', type: 'application/octet-stream' });

    // Extract hashtags from content
    const detectedTags = (postContent.match(/#[a-zA-Z0-9_]+/g) || []).map((t) => t.replace('#', ''));
    if (detectedTags.length === 0) detectedTags.push('General');

    try {
      await createCommunityPost({
        userId: user.uid,
        authorId: user.uid,
        authorName: profile?.name || user.email?.split('@')[0] || 'Community Member',
        authorAvatar: profile?.avatarUrl || '',
        title: postTitle.trim() || postContent.slice(0, 60),
        content: postContent.trim(),
        tags: detectedTags,
        visibility: postVisibility,
        mediaUrls: attachments.map((a) => a.url),
        mediaType: attachedVideo ? 'video' : attachedImage ? 'image' : undefined,
        fileUrl: attachedFileName ? '#' : undefined,
        fileName: attachedFileName || undefined,
      });

      setPostTitle('');
      setPostContent('');
      setAttachedImage(null);
      setAttachedVideo(null);
      setAttachedFileName(null);
      showToast('Post published to The Lounge!');
    } catch (err) {
      console.warn('Create post error:', err);
      showToast('Could not publish post. Please check your connection.');
    } finally {
      setIsPosting(false);
    }
  };

  // Post Reactions
  const handleToggleLike = async (post: CommunityPostItem) => {
    if (!user) return;
    const currentlyLiked = (post.likedBy || []).includes(user.uid);
    try {
      await togglePostReaction(post.id, user.uid, currentlyLiked);
      showToast(currentlyLiked ? 'Unliked post' : 'Liked post ❤️');
    } catch (e) {
      console.warn('Like error:', e);
    }
  };

  const handleToggleSave = async (post: CommunityPostItem) => {
    if (!user) return;
    const currentlySaved = (post.savedBy || []).includes(user.uid);
    try {
      await toggleSavePost(post.id, user.uid, currentlySaved);
      showToast(currentlySaved ? 'Removed from saved' : 'Saved to your bookmarks 🔖');
    } catch (e) {
      console.warn('Save error:', e);
    }
  };

  // Comments
  const handleAddComment = async (postId: string) => {
    const text = (commentInputMap[postId] || '').trim();
    if (!user || !text) return;

    setCommentInputMap((prev) => ({ ...prev, [postId]: '' }));

    try {
      await addPostComment({
        postId,
        userId: user.uid,
        authorName: profile?.name || user.email?.split('@')[0] || 'Community Member',
        authorAvatar: profile?.avatarUrl || '',
        content: text,
      });
      showToast('Comment submitted.');
    } catch (err) {
      console.warn('Comment add error:', err);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    try {
      await deleteCommunityComment(commentId, postId);
      showToast('Comment deleted.');
    } catch (err) {
      console.warn('Delete comment error:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to permanently delete this post?')) return;
    try {
      await deleteCommunityPost(postId);
      showToast('Post deleted.');
    } catch (err) {
      console.warn('Delete post error:', err);
    }
  };

  // Open Direct Message with a User
  const handleStartMessageWithUser = async (targetUserId: string, targetName: string) => {
    if (!user) return;
    try {
      const threadId = await getOrCreateDirectThread(
        user.uid,
        targetUserId,
        profile?.name || 'Me',
        targetName
      );
      const existing = threads.find((t) => t.id === threadId);
      if (existing) {
        setActiveThread(existing);
      } else {
        const dummy: DirectThreadItem = {
          id: threadId,
          participants: [user.uid, targetUserId],
          participantNames: { [user.uid]: profile?.name || 'Me', [targetUserId]: targetName },
          participantAvatars: {},
          updatedAt: new Date().toISOString(),
        };
        setActiveThread(dummy);
      }
    } catch (e) {
      console.warn('Direct message init error:', e);
    }
  };

  // Filter and Sort Posts
  const visiblePosts = initialPosts.filter((post) => {
    // Hide blocked users
    if (blockedUsers.has(post.userId) || blockedUsers.has(post.authorId)) return false;

    // Filter by tag
    if (selectedTag !== 'all' && !(post.tags || []).includes(selectedTag)) return false;

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q) ||
        (post.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Filter by active Tab
    if (activeTab === 'following') {
      return followingSet.has(post.userId) || followingSet.has(post.authorId);
    }
    if (activeTab === 'my_posts') {
      return post.userId === user?.uid || post.authorId === user?.uid;
    }
    if (activeTab === 'saved') {
      return (post.savedBy || []).includes(user?.uid || '');
    }

    return true;
  });

  // Sort based on Tab
  if (activeTab === 'trending') {
    visiblePosts.sort((a, b) => {
      const scoreA = (a.likesCount || 0) * 2 + (a.commentsCount || 0) * 3 + (a.savedBy?.length || 0);
      const scoreB = (b.likesCount || 0) * 2 + (b.commentsCount || 0) * 3 + (b.savedBy?.length || 0);
      return scoreB - scoreA;
    });
  } else {
    // Latest first
    visiblePosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Filtered direct threads in inbox
  const filteredThreads = threads.filter((t) => {
    if (!inboxSearch) return true;
    const q = inboxSearch.toLowerCase();
    const otherId = t.participants.find((p) => p !== user?.uid) || '';
    const otherName = t.participantNames[otherId] || '';
    return otherName.toLowerCase().includes(q) || (t.lastMessage || '').toLowerCase().includes(q);
  });

  // Filtered people directory
  const filteredPeople = profiles.filter((p) => {
    if (p.userId === user?.uid) return false;
    if (!peopleSearch) return true;
    const q = peopleSearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.username || '').toLowerCase().includes(q) ||
      (p.bio || '').toLowerCase().includes(q) ||
      (p.interests || []).some((i) => i.toLowerCase().includes(q))
    );
  });

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-surface-elevated)] px-4 py-3 text-xs font-bold text-[var(--color-text)] shadow-2xl animate-fade-in">
          <Sparkles className="w-4 h-4 text-[var(--color-cyan)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary Lounge Header */}
      <header className="flex flex-col gap-4 border-b border-[var(--color-border)]/70 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--color-cyan)] flex items-center gap-1.5">
            <span>🌐 AI OS Community</span>
            <span>◇</span>
            <span>The Lounge</span>
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
            Explore, Share &amp; Connect.
          </h1>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Collaborative knowledge, public discussions, 24-hour stories, and real-time private messaging.
          </p>
        </div>

        {/* Secondary Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rules &amp; privacy</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 font-semibold transition-all shadow-sm ${
              isSearchOpen
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-[var(--color-muted)]" />
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (user) {
                setProfileModalUser({
                  userId: user.uid,
                  displayName: profile?.name || user.email?.split('@')[0] || 'Me',
                  username: profile?.username,
                  avatarUrl: profile?.avatarUrl,
                  bio: profile?.bio,
                  interests: profile?.interests,
                });
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all shadow-sm"
          >
            <User className="w-3.5 h-3.5 text-[var(--color-cyan)]" />
            <span>My profile</span>
          </button>

          <button
            type="button"
            onClick={() => storyInputRef.current?.click()}
            disabled={isUploadingStory}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-pink-400" />
            <span>Story</span>
          </button>

          <button
            type="button"
            onClick={() => composerRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Post</span>
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('assistant')}
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 font-semibold text-purple-300 hover:bg-purple-500/20 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Ask AI</span>
            </button>
          )}
        </div>
      </header>

      {/* Hidden File Input for Story Upload */}
      <input
        type="file"
        ref={storyInputRef}
        accept="image/*,video/*"
        className="hidden"
        onChange={handleStoryFileSelected}
      />

      {/* Quick Search Bar (Toggled) */}
      {isSearchOpen && (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm animate-fade-in">
          <Search className="w-4 h-4 text-[var(--color-muted)] shrink-0 ml-2" />
          <input
            type="search"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, creators, hashtags, or topics in The Lounge…"
            className="w-full bg-transparent text-xs text-[var(--color-text)] outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] mr-2"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Lounge Navigation Tabs Bar */}
      <nav className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--color-border)] pb-2 scrollbar-none text-xs font-bold">
        {[
          { id: 'for_you', label: 'For You' },
          { id: 'following', label: 'Following' },
          { id: 'latest', label: 'Latest' },
          { id: 'trending', label: 'Trending' },
          { id: 'my_posts', label: 'My Posts' },
          { id: 'saved', label: 'Saved' },
          { id: 'communities', label: 'Communities (Rooms)' },
          { id: 'people', label: 'People' },
          { id: 'inbox', label: `Inbox ${threads.length > 0 ? `(${threads.length})` : ''}` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Tab Content Routing */}
      {activeTab === 'communities' ? (
        /* ========================================================
           COMMUNITIES (PUBLIC ROOMS) VIEW
        ======================================================== */
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">
                Public Discussion Rooms
              </h2>
              <p className="text-xs text-[var(--color-muted)]">
                Join live, dedicated chat rooms with community members interested in specific subjects.
              </p>
            </div>
            <span className="text-xs font-bold text-[var(--color-cyan)]">
              {channels.length} Rooms Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {channels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => setActiveRoom(channel)}
                className="group flex flex-col justify-between rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 cursor-pointer shadow-sm hover:border-[var(--color-primary)] hover:shadow-md transition-all space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-primary)]/15 text-lg group-hover:scale-105 transition-transform">
                      {channel.icon || '🌐'}
                    </span>
                    <span className="rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-cyan)]">
                      Open Room
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                    {channel.name}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                    {channel.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/60 text-[11px] text-[var(--color-muted)]">
                  <span>💬 Real-time discussion</span>
                  <span className="font-bold text-[var(--color-primary)] group-hover:underline">
                    Enter room →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : activeTab === 'people' ? (
        /* ========================================================
           PEOPLE DIRECTORY VIEW
        ======================================================== */
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">
                Community People Directory
              </h2>
              <p className="text-xs text-[var(--color-muted)]">
                Discover creators, developers, designers, and students sharing insights in The Lounge.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[var(--color-muted)] shrink-0" />
              <input
                type="search"
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
                placeholder="Search username, skills, interests (⌘K)…"
                className="w-full bg-transparent outline-none text-xs text-[var(--color-text)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPeople.map((person) => {
              const isFollowed = followingSet.has(person.userId);
              return (
                <div
                  key={person.userId}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm space-y-3 hover:border-[var(--color-primary)] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      {person.avatarUrl ? (
                        <img
                          src={person.avatarUrl}
                          alt={person.name}
                          className="h-11 w-11 rounded-full object-cover border border-[var(--color-border)] cursor-pointer"
                          onClick={() =>
                            setProfileModalUser({
                              userId: person.userId,
                              displayName: person.name,
                              username: person.username,
                              avatarUrl: person.avatarUrl,
                              bio: person.bio,
                              interests: person.interests,
                            })
                          }
                        />
                      ) : (
                        <span
                          onClick={() =>
                            setProfileModalUser({
                              userId: person.userId,
                              displayName: person.name,
                              username: person.username,
                              avatarUrl: person.avatarUrl,
                              bio: person.bio,
                              interests: person.interests,
                            })
                          }
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-sm font-bold text-[var(--color-primary)] cursor-pointer"
                        >
                          {person.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <strong
                          onClick={() =>
                            setProfileModalUser({
                              userId: person.userId,
                              displayName: person.name,
                              username: person.username,
                              avatarUrl: person.avatarUrl,
                              bio: person.bio,
                              interests: person.interests,
                            })
                          }
                          className="block text-xs font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] cursor-pointer truncate"
                        >
                          {person.name}
                        </strong>
                        <span className="text-[11px] text-[var(--color-cyan)] block truncate">
                          @{person.username || 'member'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                      {person.bio || 'AI OS explorer creating workflows and ideas.'}
                    </p>

                    {person.interests && person.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {person.interests.slice(0, 3).map((item) => (
                          <span
                            key={item}
                            className="rounded-md bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--color-muted)] font-medium"
                          >
                            #{item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]/60">
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(person.userId, person.name)}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition-all ${
                        isFollowed
                          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      {isFollowed ? (
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
                      onClick={() => handleStartMessageWithUser(person.userId, person.name)}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredPeople.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-[var(--color-border)] p-10 text-center text-xs text-[var(--color-muted)]">
                No people matching &ldquo;{peopleSearch}&rdquo;. Try another term.
              </div>
            )}
          </div>
        </section>
      ) : activeTab === 'inbox' ? (
        /* ========================================================
           INBOX (DIRECT MESSAGES) VIEW
        ======================================================== */
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">
                Direct Conversations
              </h2>
              <p className="text-xs text-[var(--color-muted)]">
                Encrypted, private 1-on-1 chats with members across The Lounge.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[var(--color-muted)] shrink-0" />
              <input
                type="search"
                value={inboxSearch}
                onChange={(e) => setInboxSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full bg-transparent outline-none text-xs text-[var(--color-text)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredThreads.map((thread) => {
              const otherId = thread.participants.find((p) => p !== user?.uid) || '';
              const otherName = thread.participantNames[otherId] || 'Member';
              const otherAvatar = thread.participantAvatars[otherId];

              return (
                <div
                  key={thread.id}
                  onClick={() => setActiveThread(thread)}
                  className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 cursor-pointer hover:border-[var(--color-primary)] transition-all space-x-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {otherAvatar ? (
                      <img
                        src={otherAvatar}
                        alt={otherName}
                        className="h-10 w-10 rounded-full object-cover border border-[var(--color-border)]"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary)]">
                        {otherName[0]?.toUpperCase() || 'U'}
                      </span>
                    )}

                    <div className="min-w-0">
                      <strong className="block text-xs font-bold text-[var(--color-text)] truncate">
                        {otherName}
                      </strong>
                      <p className="text-xs text-[var(--color-muted)] truncate max-w-md">
                        {thread.lastMessage || 'Say hello…'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-[var(--color-muted)]">
                      {thread.updatedAt ? new Date(thread.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredThreads.length === 0 && (
              <div className="rounded-3xl border border-dashed border-[var(--color-border)] p-12 text-center text-xs text-[var(--color-muted)] space-y-2">
                <MessageSquare className="w-8 h-8 text-[var(--color-muted)]/50 mx-auto" />
                <p>No active conversations found.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('people')}
                  className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)]"
                >
                  Browse People to Message
                </button>
              </div>
            )}
          </div>
        </section>
      ) : (
        /* ========================================================
           FEED SPACE (FOR YOU, FOLLOWING, LATEST, TRENDING, MY POSTS, SAVED)
        ======================================================== */
        <div className="space-y-6">
          {/* 24-Hour Stories Rail */}
          <section
            id="storiesRail"
            className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-pink-400" />
                <span>24-hour updates · Stories</span>
              </span>
              <span className="text-[10px] font-semibold text-[var(--color-muted)]">
                Expires after 24 hrs
              </span>
            </div>

            <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none">
              {/* Your Story button */}
              <button
                type="button"
                onClick={() => storyInputRef.current?.click()}
                className="group flex flex-col items-center gap-1.5 shrink-0 focus:outline-none"
              >
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-bg-secondary)] group-hover:border-[var(--color-primary-hover)] transition-all">
                  <Plus className="w-5 h-5 text-[var(--color-primary)] group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-bold text-[var(--color-text)]">
                  Add Story
                </span>
              </button>

              {/* Stories list */}
              {stories.map((story, idx) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => setActiveStoryIndex(idx)}
                  className="group flex flex-col items-center gap-1.5 shrink-0 focus:outline-none"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-pink-400 to-purple-500 group-hover:scale-105 transition-transform">
                    <div className="h-full w-full rounded-full bg-[var(--color-surface)] p-[2px]">
                      {story.authorAvatar ? (
                        <img
                          src={story.authorAvatar}
                          alt={story.authorName}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                          {story.authorName?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-[var(--color-muted)] max-w-[58px] truncate">
                    {story.authorName}
                  </span>
                </button>
              ))}

              {stories.length === 0 && (
                <p className="text-xs text-[var(--color-muted)] pl-2">
                  No active stories. Share what you’re working on today!
                </p>
              )}
            </div>
          </section>

          {/* Rich Post Composer Card */}
          <section
            ref={composerRef}
            className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-10 w-10 rounded-full object-cover border border-[var(--color-border)]"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary)]">
                  {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
              <div className="flex-1">
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Post title or topic summary (optional)…"
                  className="w-full bg-transparent text-sm font-bold text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                />
              </div>

              {/* Visibility Selector */}
              <div className="flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPostVisibility('public')}
                  className={`rounded-lg px-2.5 py-1 transition-all ${
                    postVisibility === 'public'
                      ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                      : 'text-[var(--color-muted)]'
                  }`}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setPostVisibility('followers')}
                  className={`rounded-lg px-2.5 py-1 transition-all ${
                    postVisibility === 'followers'
                      ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                      : 'text-[var(--color-muted)]'
                  }`}
                >
                  Followers
                </button>
              </div>
            </div>

            {/* Composer Textarea */}
            <div className="relative">
              <textarea
                rows={3}
                maxLength={2000}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Write something... share a prompt, learning milestone, architecture idea, or question."
                className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] leading-relaxed transition-all"
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-[var(--color-muted)] font-mono">
                {postContent.length}/2000
              </div>
            </div>

            {/* Attached media previews */}
            {(attachedImage || attachedVideo || attachedFileName) && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                {attachedImage && (
                  <div className="relative">
                    <img
                      src={attachedImage}
                      alt="Attachment preview"
                      className="h-16 w-16 rounded-xl object-cover border border-[var(--color-border)]"
                    />
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 text-white p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {attachedVideo && (
                  <div className="relative flex items-center gap-2 rounded-xl bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text)]">
                    <VideoIcon className="w-4 h-4 text-pink-400" />
                    <span>Video attached</span>
                    <button
                      type="button"
                      onClick={() => setAttachedVideo(null)}
                      className="text-red-400 text-xs ml-1"
                    >
                      ×
                    </button>
                  </div>
                )}

                {attachedFileName && (
                  <div className="relative flex items-center gap-2 rounded-xl bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text)]">
                    <Paperclip className="w-4 h-4 text-[var(--color-cyan)]" />
                    <span>{attachedFileName}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedFileName(null)}
                      className="text-red-400 text-xs ml-1"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Hidden file inputs for attachments */}
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const reader = new FileReader();
                  reader.onload = (event) => setAttachedImage(event.target?.result as string);
                  reader.readAsDataURL(f);
                }
              }}
            />
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setAttachedVideo(URL.createObjectURL(f));
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setAttachedFileName(f.name);
              }}
            />

            {/* Composer Bottom Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all"
                >
                  <VideoIcon className="w-3.5 h-3.5 text-pink-400" />
                  <span>Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all"
                >
                  <Paperclip className="w-3.5 h-3.5 text-[var(--color-cyan)]" />
                  <span>File</span>
                </button>

                {/* AI Polish Buttons */}
                <button
                  type="button"
                  onClick={handleAiImprove}
                  disabled={isAiPolishing}
                  className="flex items-center gap-1 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 font-bold text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{isAiPolishing ? 'Polishing…' : '✨ Improve'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAiTags}
                  className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 font-bold text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all"
                >
                  <span>🏷 Tags</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreatePost}
                disabled={isPosting || (!postTitle.trim() && !postContent.trim())}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-6 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-40 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isPosting ? 'Posting…' : 'Post'}</span>
              </button>
            </div>
          </section>

          {/* Topic Filters */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {['all', 'Productivity', 'AI Prompts', 'Coding', 'Design', 'Study Systems', 'Personal OS'].map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTag(t)}
                    className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all border ${
                      selectedTag === t
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-text)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {t === 'all' ? 'All Topics' : `#${t}`}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => showToast('Feed refreshed')}
              title="Refresh feed"
              className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Posts Feed Stream */}
          <div className="space-y-4">
            {visiblePosts.map((post) => {
              const isLiked = (post.likedBy || []).includes(user?.uid || '');
              const isSaved = (post.savedBy || []).includes(user?.uid || '');
              const isAuthor = post.userId === user?.uid || post.authorId === user?.uid;
              const isCommentsOpen = openCommentsPostId === post.id;
              const comments = postCommentsMap[post.id] || [];

              return (
                <article
                  key={post.id}
                  id={`post-${post.id}`}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm hover:border-[var(--color-primary)]/60 transition-all space-y-4"
                >
                  {/* Post Author Bar */}
                  <div className="flex items-start justify-between relative">
                    <div className="flex items-center gap-3">
                      {post.authorAvatar ? (
                        <img
                          src={post.authorAvatar}
                          alt={post.authorName}
                          onClick={() =>
                            setProfileModalUser({
                              userId: post.userId || post.authorId,
                              displayName: post.authorName,
                              avatarUrl: post.authorAvatar,
                            })
                          }
                          className="h-10 w-10 rounded-full object-cover border border-[var(--color-border)] cursor-pointer"
                        />
                      ) : (
                        <span
                          onClick={() =>
                            setProfileModalUser({
                              userId: post.userId || post.authorId,
                              displayName: post.authorName,
                            })
                          }
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary)] cursor-pointer"
                        >
                          {post.authorName?.[0]?.toUpperCase() || 'U'}
                        </span>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <strong
                            onClick={() =>
                              setProfileModalUser({
                                userId: post.userId || post.authorId,
                                displayName: post.authorName,
                              })
                            }
                            className="text-xs font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] cursor-pointer"
                          >
                            {post.authorName}
                          </strong>
                          <span className="text-[11px] text-[var(--color-muted)]">·</span>
                          <span className="text-[11px] text-[var(--color-muted)]">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--color-cyan)]">
                          @{post.authorName.toLowerCase().replace(/[^a-z0-9_]/g, '')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {post.visibility === 'followers' && (
                        <span className="rounded-full bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[9px] font-bold text-purple-300">
                          Followers Only
                        </span>
                      )}

                      {/* Dropdown 3-dots Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenOptionsMenuPostId(
                              openOptionsMenuPostId === post.id ? null : post.id
                            );
                          }}
                          className="rounded-lg p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openOptionsMenuPostId === post.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-8 z-30 w-44 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1.5 shadow-xl text-xs space-y-1 animate-fade-in"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenOptionsMenuPostId(null);
                                setReportModalPost(post);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-amber-400 hover:bg-[var(--color-bg-secondary)]"
                            >
                              <Flag className="w-3.5 h-3.5" />
                              <span>Report post</span>
                            </button>

                            {!isAuthor && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenOptionsMenuPostId(null);
                                  handleBlockUser(post.userId || post.authorId, post.authorName);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-red-400 hover:bg-[var(--color-bg-secondary)]"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Block author</span>
                              </button>
                            )}

                            {isAuthor && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenOptionsMenuPostId(null);
                                  handleDeletePost(post.id);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-red-400 hover:bg-[var(--color-bg-secondary)]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete post</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Title & Content */}
                  <div className="space-y-2">
                    {post.title && (
                      <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)]">
                        {post.title}
                      </h3>
                    )}
                    <p className="text-xs text-[var(--color-text)]/90 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>

                  {/* Media Previews (Image or Video) */}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] max-h-96 bg-black/20">
                      {post.mediaType === 'video' ? (
                        <video
                          src={post.mediaUrls[0]}
                          controls
                          className="w-full max-h-96 object-contain"
                        />
                      ) : (
                        <img
                          src={post.mediaUrls[0]}
                          alt="Post media"
                          className="w-full max-h-96 object-cover"
                        />
                      )}
                    </div>
                  )}

                  {/* File Download Attachment */}
                  {post.fileName && (
                    <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-xs">
                      <div className="flex items-center gap-2 text-[var(--color-text)]">
                        <Paperclip className="w-4 h-4 text-[var(--color-cyan)]" />
                        <span className="font-semibold">{post.fileName}</span>
                      </div>
                      <span className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1 text-[11px] font-bold text-[var(--color-primary)]">
                        ↓ Download in app
                      </span>
                    </div>
                  )}

                  {/* Hashtags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          onClick={() => setSelectedTag(tag)}
                          className="rounded-md bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-muted)] hover:text-[var(--color-primary)] cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Bar (Like, Comment, Save, Share) */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]/60 text-xs">
                    <div className="flex items-center gap-3">
                      {/* Like button */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-all ${
                          isLiked
                            ? 'border-red-500/30 bg-red-500/10 text-red-400 font-bold'
                            : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-400 text-red-400' : ''}`}
                        />
                        <span>{post.likesCount || 0}</span>
                      </button>

                      {/* Comment toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          setOpenCommentsPostId(isCommentsOpen ? null : post.id)
                        }
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-all ${
                          isCommentsOpen
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold'
                            : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.commentsCount || 0}</span>
                      </button>

                      {/* Save button */}
                      <button
                        type="button"
                        onClick={() => handleToggleSave(post)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-all ${
                          isSaved
                            ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-bold'
                            : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]'
                        }`}
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${isSaved ? 'fill-cyan-400 text-cyan-400' : ''}`}
                        />
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Share button */}
                      <button
                        type="button"
                        onClick={() => setShareModalPost(post)}
                        className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>

                      {/* Delete button (author only) */}
                      {isAuthor && (
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-[var(--color-muted)] hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Comments Section */}
                  {isCommentsOpen && (
                    <div className="pt-3 border-t border-[var(--color-border)]/60 space-y-3 animate-fade-in">
                      {/* Comment Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={300}
                          value={commentInputMap[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputMap((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                          placeholder="Write a reply..."
                          className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentInputMap[post.id]?.trim()}
                          className="rounded-xl bg-[var(--color-primary)] px-3.5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
                        >
                          Reply
                        </button>
                      </div>

                      {/* Comment Items List */}
                      <div className="space-y-2 pt-1">
                        {comments.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-start justify-between rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-bg-secondary)] p-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <strong className="font-bold text-[var(--color-text)]">
                                  {c.authorName}
                                </strong>
                                <span className="text-[10px] text-[var(--color-muted)]">
                                  {new Date(c.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-[var(--color-text)]/90 leading-relaxed">
                                {c.content}
                              </p>
                            </div>

                            {c.userId === user?.uid && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c.id, post.id)}
                                className="text-[var(--color-muted)] hover:text-red-400 p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}

                        {comments.length === 0 && (
                          <p className="text-center py-3 text-xs text-[var(--color-muted)]">
                            No comments yet. Be the first to share your thoughts!
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {visiblePosts.length === 0 && (
              <div className="rounded-3xl border border-dashed border-[var(--color-border)] p-12 text-center text-xs text-[var(--color-muted)] space-y-3">
                <Globe className="w-10 h-10 text-[var(--color-muted)]/50 mx-auto" />
                <p className="text-sm font-bold text-[var(--color-text)]">
                  No community posts found
                </p>
                <p className="max-w-md mx-auto">
                  {searchQuery
                    ? `No posts matched "${searchQuery}". Try clearing search or choosing another topic.`
                    : 'Be the first pioneer to post in this section and connect with fellow learners!'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DIALOGS
      ======================================================== */}

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && stories.length > 0 && (
        <StoryViewerModal
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}

      {/* Rules & Privacy Standards Modal */}
      {showRulesModal && (
        <RulesPrivacyModal
          onClose={() => setShowRulesModal(false)}
          onOpenContact={() => setShowContactModal(true)}
        />
      )}

      {/* Contact & Support Modal */}
      {showContactModal && (
        <ContactSupportModal onClose={() => setShowContactModal(false)} />
      )}

      {/* Share Post Modal */}
      {shareModalPost && (
        <SharePostModal
          post={shareModalPost}
          onClose={() => setShareModalPost(null)}
          onShareToFeed={(shared) => {
            setPostContent(
              `Shared from ${shared.authorName}:\n\n"${shared.content.slice(0, 180)}..."`
            );
            composerRef.current?.scrollIntoView({ behavior: 'smooth' });
            showToast('Post copied to composer draft!');
          }}
          onShowToast={showToast}
        />
      )}

      {/* Community Profile Modal */}
      {profileModalUser && (
        <CommunityProfileModal
          targetUser={profileModalUser}
          posts={initialPosts}
          allProfiles={profiles}
          onClose={() => setProfileModalUser(null)}
          onOpenMessage={(uId, uName) => {
            setProfileModalUser(null);
            handleStartMessageWithUser(uId, uName);
          }}
          onShowToast={showToast}
        />
      )}

      {/* Public Room Chat Modal */}
      {activeRoom && (
        <RoomChatModal room={activeRoom} onClose={() => setActiveRoom(null)} />
      )}

      {/* Direct 1-on-1 Chat Modal */}
      {activeThread && (
        <DirectChatModal
          thread={activeThread}
          onClose={() => setActiveThread(null)}
          onDeleteThread={(threadId) => {
            setThreads((prev) => prev.filter((t) => t.id !== threadId));
            showToast('Conversation removed.');
          }}
          onShowToast={showToast}
        />
      )}

      {/* Report Post Modal */}
      {reportModalPost && (
        <ReportPostModal
          post={reportModalPost}
          onClose={() => setReportModalPost(null)}
          onSubmitReport={(postId, reason) => {
            console.log('Report submitted for', postId, reason);
            showToast('Report submitted for review. Thank you.');
          }}
        />
      )}
    </div>
  );
};
