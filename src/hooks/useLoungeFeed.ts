import { useState, useMemo, useCallback } from 'react';
import { CommunityPostItem } from '../types';
import {
  createCommunityPost,
  deleteCommunityPost,
  togglePostReaction,
  toggleSavePost,
} from '../services/db';
import { formatErrorMessage } from '../lib/errors';

export type LoungeTab =
  | 'for_you'
  | 'following'
  | 'latest'
  | 'trending'
  | 'my_posts'
  | 'saved'
  | 'channels'
  | 'directory'
  | 'inbox';

export function useLoungeFeed(
  posts: CommunityPostItem[],
  currentUserId?: string,
  followingIds: string[] = []
) {
  const [activeTab, setActiveTab] = useState<LoungeTab>('for_you');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorName?.toLowerCase().includes(searchQuery.toLowerCase());

      // Tag filter
      const matchesTag = !selectedTag || (post.tags && post.tags.includes(selectedTag));

      // Tab filter
      let matchesTab = true;
      if (activeTab === 'following') {
        matchesTab = post.authorId ? followingIds.includes(post.authorId) : false;
      } else if (activeTab === 'my_posts') {
        matchesTab = (post.userId === currentUserId) || (post.authorId === currentUserId);
      } else if (activeTab === 'saved') {
        matchesTab = Boolean(currentUserId && post.savedBy?.includes(currentUserId));
      } else if (activeTab === 'trending') {
        matchesTab = (post.likesCount || 0) > 0 || (post.commentsCount || 0) > 0;
      }

      return matchesSearch && matchesTag && matchesTab;
    });
  }, [posts, searchQuery, selectedTag, activeTab, followingIds, currentUserId]);

  const handleToggleLike = useCallback(
    async (postId: string, currentlyLiked: boolean) => {
      if (!currentUserId) return;
      try {
        await togglePostReaction(postId, currentUserId, currentlyLiked);
      } catch (err) {
        setError(formatErrorMessage(err));
      }
    },
    [currentUserId]
  );

  const handleToggleSave = useCallback(
    async (postId: string, currentlySaved: boolean) => {
      if (!currentUserId) return;
      try {
        await toggleSavePost(postId, currentUserId, currentlySaved);
      } catch (err) {
        setError(formatErrorMessage(err));
      }
    },
    [currentUserId]
  );

  const handleCreatePost = useCallback(
    async (postData: Omit<CommunityPostItem, 'id' | 'createdAt' | 'likesCount' | 'commentsCount'>) => {
      try {
        return await createCommunityPost(postData);
      } catch (err) {
        setError(formatErrorMessage(err));
        throw err;
      }
    },
    []
  );

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      await deleteCommunityPost(postId);
    } catch (err) {
      setError(formatErrorMessage(err));
      throw err;
    }
  }, []);

  return {
    posts: filteredPosts,
    allPosts: posts,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    handleToggleLike,
    handleToggleSave,
    handleCreatePost,
    handleDeletePost,
    error,
    clearError: () => setError(null),
  };
}
