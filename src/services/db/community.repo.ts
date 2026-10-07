import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import {
  CommunityPostItem,
  CommunityCommentItem,
  CommunityChannelItem,
  CommunityMessageItem,
  DirectThreadItem,
  DirectMessageItem,
  StoryItem,
} from '../../types';
import { validatePostInput, validateCommentInput, validateMessageInput } from '../../lib/validation';
import { AppError } from '../../lib/errors';

export function subscribeCommunityPosts(callback: (posts: CommunityPostItem[]) => void) {
  const q = query(collection(db, 'community_posts'));
  return onSnapshot(
    q,
    (snapshot) => {
      const posts: CommunityPostItem[] = [];
      snapshot.forEach((d) => posts.push({ id: d.id, ...d.data() } as CommunityPostItem));
      posts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(posts);
    },
    (err) => console.warn('Community posts notice:', err?.message || err)
  );
}

export async function createCommunityPost(
  post: Omit<CommunityPostItem, 'id' | 'createdAt' | 'likesCount' | 'commentsCount'>
) {
  validatePostInput(post.title || '', post.content);
  const now = new Date().toISOString();
  try {
    const payload: Record<string, any> = {
      userId: post.userId,
      authorId: post.authorId || post.userId,
      authorName: post.authorName || 'Community Member',
      authorAvatar: post.authorAvatar || '',
      title: (post.title || '').trim(),
      content: (post.content || '').trim(),
      tags: Array.isArray(post.tags) && post.tags.length > 0 ? post.tags : ['General'],
      visibility: post.visibility || 'public',
      likesCount: 0,
      upvotes: 0,
      commentsCount: 0,
      likedBy: [],
      savedBy: [],
      createdAt: now,
    };

    if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
      payload.mediaUrls = post.mediaUrls;
    }
    if (post.mediaType) {
      payload.mediaType = post.mediaType;
    }
    if (post.fileUrl) {
      payload.fileUrl = post.fileUrl;
    }
    if (post.fileName) {
      payload.fileName = post.fileName;
    }

    return await addDoc(collection(db, 'community_posts'), payload);
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function togglePostReaction(postId: string, userId: string, currentlyLiked: boolean) {
  const postRef = doc(db, 'community_posts', postId);
  try {
    const snap = await getDocs(query(collection(db, 'community_posts'), where('__name__', '==', postId)));
    if (!snap.empty) {
      const data = snap.docs[0].data();
      const currentLikedBy: string[] = data.likedBy || [];
      const newLikedBy = currentlyLiked
        ? currentLikedBy.filter((id) => id !== userId)
        : [...currentLikedBy, userId];

      return await updateDoc(postRef, {
        likedBy: newLikedBy,
        likesCount: newLikedBy.length,
      });
    }
  } catch (e) {
    console.warn('Could not toggle reaction:', e);
  }
}

export async function toggleSavePost(postId: string, userId: string, currentlySaved: boolean) {
  const postRef = doc(db, 'community_posts', postId);
  try {
    const snap = await getDocs(query(collection(db, 'community_posts'), where('__name__', '==', postId)));
    if (!snap.empty) {
      const data = snap.docs[0].data();
      const currentSavedBy: string[] = data.savedBy || [];
      const newSavedBy = currentlySaved
        ? currentSavedBy.filter((id) => id !== userId)
        : [...currentSavedBy, userId];

      return await updateDoc(postRef, {
        savedBy: newSavedBy,
      });
    }
  } catch (e) {
    console.warn('Could not toggle save post:', e);
  }
}

export async function upvoteCommunityPost(id: string) {
  const postRef = doc(db, 'community_posts', id);
  try {
    const snap = await getDocs(query(collection(db, 'community_posts'), where('__name__', '==', id)));
    if (!snap.empty) {
      const current = snap.docs[0].data().upvotes || 0;
      return await updateDoc(postRef, { upvotes: current + 1 });
    }
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function deleteCommunityPost(id: string) {
  return deleteDoc(doc(db, 'community_posts', id));
}

export function subscribePostComments(postId: string, callback: (comments: CommunityCommentItem[]) => void) {
  const q = query(
    collection(db, 'community_post_comments'),
    where('postId', '==', postId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const comments: CommunityCommentItem[] = [];
      snapshot.forEach((d) => comments.push({ id: d.id, ...d.data() } as CommunityCommentItem));
      comments.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      callback(comments);
    },
    (err) => console.warn('Post comments notice:', err?.message || err)
  );
}

export async function addPostComment(comment: Omit<CommunityCommentItem, 'id' | 'createdAt'>) {
  validateCommentInput(comment.content);
  const now = new Date().toISOString();
  const payload: Record<string, any> = {
    postId: comment.postId,
    userId: comment.userId,
    authorName: comment.authorName || 'Community Member',
    authorAvatar: comment.authorAvatar || '',
    content: comment.content.trim(),
    createdAt: now,
  };
  const res = await addDoc(collection(db, 'community_post_comments'), payload);

  try {
    const postRef = doc(db, 'community_posts', comment.postId);
    const snap = await getDocs(query(collection(db, 'community_posts'), where('__name__', '==', comment.postId)));
    if (!snap.empty) {
      const data = snap.docs[0].data();
      await updateDoc(postRef, { commentsCount: (data.commentsCount || 0) + 1 });
    }
  } catch (e) {
    console.warn('Could not increment comment count:', e);
  }
  return res;
}

export async function deleteCommunityComment(commentId: string, postId?: string) {
  await deleteDoc(doc(db, 'community_post_comments', commentId));
  if (postId) {
    try {
      const postRef = doc(db, 'community_posts', postId);
      const snap = await getDocs(query(collection(db, 'community_posts'), where('__name__', '==', postId)));
      if (!snap.empty) {
        const data = snap.docs[0].data();
        await updateDoc(postRef, { commentsCount: Math.max(0, (data.commentsCount || 1) - 1) });
      }
    } catch (e) {
      console.warn('Could not decrement comment count:', e);
    }
  }
}

export function subscribeCommunityChannels(callback: (channels: CommunityChannelItem[]) => void) {
  const q = query(collection(db, 'community_channels'));
  return onSnapshot(
    q,
    (snapshot) => {
      const channels: CommunityChannelItem[] = [];
      snapshot.forEach((d) => channels.push({ id: d.id, ...d.data() } as CommunityChannelItem));
      channels.sort((a, b) => (a.order || 0) - (b.order || 0));
      callback(channels);
    },
    (err) => console.warn('Community channels notice:', err?.message || err)
  );
}

export function subscribeChannelMessages(channelId: string, callback: (messages: CommunityMessageItem[]) => void) {
  const q = query(
    collection(db, 'community_messages'),
    where('channelId', '==', channelId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: CommunityMessageItem[] = [];
      snapshot.forEach((d) => messages.push({ id: d.id, ...d.data() } as CommunityMessageItem));
      messages.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      callback(messages);
    },
    (err) => console.warn('Channel messages notice:', err?.message || err)
  );
}

export async function sendChannelMessage(channelId: string, userId: string, authorName: string, content: string) {
  validateMessageInput(content);
  const now = new Date().toISOString();
  return addDoc(collection(db, 'community_messages'), {
    channelId,
    userId,
    authorName,
    content,
    createdAt: now,
  });
}

export function subscribeDirectThreads(userId: string, callback: (threads: DirectThreadItem[]) => void) {
  const q = query(
    collection(db, 'community_threads'),
    where('participants', 'array-contains', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const threads: DirectThreadItem[] = [];
      snapshot.forEach((d) => threads.push({ id: d.id, ...d.data() } as DirectThreadItem));
      threads.sort((a, b) => new Date(b.updatedAt || b.lastMessageAt || 0).getTime() - new Date(a.updatedAt || a.lastMessageAt || 0).getTime());
      callback(threads);
    },
    (err) => console.warn('Direct threads notice:', err?.message || err)
  );
}

export function subscribeDirectMessages(threadId: string, callback: (messages: DirectMessageItem[]) => void) {
  const localKey = `local_thread_msgs_${threadId}`;
  let localBackup: DirectMessageItem[] = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localBackup = JSON.parse(raw);
  } catch {}
  if (localBackup.length > 0) {
    callback(localBackup);
  }

  const q = query(
    collection(db, 'community_thread_messages'),
    where('threadId', '==', threadId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: DirectMessageItem[] = [];
      snapshot.forEach((d) => messages.push({ id: d.id, ...d.data() } as DirectMessageItem));

      // Merge with local backup
      const existingIds = new Set(messages.map((m) => m.id));
      for (const m of localBackup) {
        if (!existingIds.has(m.id)) {
          messages.push(m);
        }
      }

      messages.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      callback(messages);
    },
    (err) => {
      console.warn('Thread messages notice (using local cache):', err?.message || err);
      callback(localBackup);
    }
  );
}

export async function sendDirectMessage(
  threadId: string,
  msg: Omit<DirectMessageItem, 'id' | 'createdAt'>
) {
  validateMessageInput(msg.content);
  const now = new Date().toISOString();

  // Save to local backup first so it is instant
  const localKey = `local_thread_msgs_${threadId}`;
  try {
    const raw = localStorage.getItem(localKey);
    const existing: DirectMessageItem[] = raw ? JSON.parse(raw) : [];
    const localItem: DirectMessageItem = {
      id: `msg_${Date.now()}`,
      threadId,
      ...msg,
      createdAt: now,
    };
    localStorage.setItem(localKey, JSON.stringify([...existing, localItem]));
  } catch {}

  try {
    await addDoc(collection(db, 'community_thread_messages'), {
      ...msg,
      userId: msg.senderId,
      senderId: msg.senderId,
      createdAt: now,
    });
    await updateDoc(doc(db, 'community_threads', threadId), {
      lastMessage: msg.content,
      lastMessageAt: now,
      updatedAt: now,
    }).catch(() => {});
  } catch (err) {
    console.warn('Direct message firestore notice (preserved in local storage):', err);
  }
}

export async function createOrGetDirectThread(
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar: string,
  targetUserId: string,
  targetUserName: string,
  targetUserAvatar: string
): Promise<string> {
  const q = query(
    collection(db, 'community_threads'),
    where('participants', 'array-contains', currentUserId)
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data() as DirectThreadItem;
    if (data.participants?.includes(targetUserId)) {
      return d.id;
    }
  }

  const now = new Date().toISOString();
  const threadRef = await addDoc(collection(db, 'community_threads'), {
    participants: [currentUserId, targetUserId],
    participantNames: {
      [currentUserId]: currentUserName,
      [targetUserId]: targetUserName,
    },
    participantAvatars: {
      [currentUserId]: currentUserAvatar || '',
      [targetUserId]: targetUserAvatar || '',
    },
    lastMessage: 'Started conversation',
    lastMessageAt: now,
    updatedAt: now,
  });

  return threadRef.id;
}

export async function getOrCreateDirectThread(
  currentUserId: string,
  targetUserId: string,
  currentUserName = 'Me',
  targetUserName = 'Member'
): Promise<string> {
  return createOrGetDirectThread(currentUserId, currentUserName, '', targetUserId, targetUserName, '');
}

export const DEFAULT_DEMO_STORIES: StoryItem[] = [
  {
    id: 'story_demo_1',
    userId: 'user_alex',
    authorName: 'Alex Chen',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1080&auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Late night coding session 💻 ship early, ship often!',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 3600 * 1000).toISOString(),
  },
  {
    id: 'story_demo_2',
    userId: 'user_sofia',
    authorName: 'Sofia Ramirez',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1080&auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'UI system revamp in Figma ✨ Dark mode glassmorphism',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
  },
  {
    id: 'story_demo_3',
    userId: 'user_david',
    authorName: 'David Kim',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1080&auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Clean code architecture: TypeScript interfaces & zero bloat 🚀',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
  },
  {
    id: 'story_demo_4',
    userId: 'user_maya',
    authorName: 'Maya Patel',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1080&auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Coffee + debugging = flow state unlocked ☕️⚡️',
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 16 * 3600 * 1000).toISOString(),
  },
  {
    id: 'story_demo_5',
    userId: 'user_marcus',
    authorName: 'Marcus Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Building real-time distributed systems on cloud edge 🔥',
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
  },
];

async function compressImageToDataUrl(file: File): Promise<string> {
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => {
        resolve((e.target?.result as string) || '');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function fileToDataUrl(file: File): Promise<string> {
  if (file.type.startsWith('image/')) {
    return compressImageToDataUrl(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

function getLocalStories(): StoryItem[] {
  try {
    const saved = localStorage.getItem('local_community_stories');
    const now = new Date().toISOString();
    if (!saved) {
      return DEFAULT_DEMO_STORIES;
    }
    const list: StoryItem[] = JSON.parse(saved);
    const valid = list.filter((s) => s.expiresAt && s.expiresAt > now);
    if (valid.length === 0) {
      return DEFAULT_DEMO_STORIES;
    }
    return valid;
  } catch {
    return DEFAULT_DEMO_STORIES;
  }
}

function saveLocalStory(story: StoryItem) {
  try {
    const current = getLocalStories();
    const updated = [story, ...current.filter((s) => s.id !== story.id)];
    localStorage.setItem('local_community_stories', JSON.stringify(updated.slice(0, 30)));
  } catch (e) {
    console.warn('Could not cache story locally:', e);
  }
}

export function subscribeStories(callback: (stories: StoryItem[]) => void) {
  // Querying without compound where + orderBy prevents Firestore composite index errors
  const q = query(collection(db, 'community_stories'));
  return onSnapshot(
    q,
    (snapshot) => {
      const now = new Date().toISOString();
      const storiesMap = new Map<string, StoryItem>();

      // 1. First add demo + locally cached stories
      getLocalStories().forEach((s) => {
        if (!s.expiresAt || s.expiresAt > now) storiesMap.set(s.id, s);
      });

      // 2. Merge Firestore stories
      snapshot.forEach((d) => {
        const item = { id: d.id, ...d.data() } as StoryItem;
        if (!item.expiresAt || item.expiresAt > now) {
          storiesMap.set(item.id, item);
        }
      });

      const list = Array.from(storiesMap.values());
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list.length > 0 ? list : DEFAULT_DEMO_STORIES);
    },
    (err) => {
      console.warn('Stories snapshot notice:', err?.message || err);
      // Fallback to local storage if Firestore has temporary issues
      callback(getLocalStories());
    }
  );
}

export async function uploadStory(
  userId: string,
  authorName: string,
  authorAvatar: string,
  file: File
): Promise<StoryItem> {
  const isVideo = file.type.startsWith('video/');
  let mediaUrl = '';

  // Attempt Firebase Storage upload, fallback to robust base64 Data URL
  try {
    const fileId = `${Date.now()}_story_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `users/${userId}/stories/${fileId}`;
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, file);
    mediaUrl = await getDownloadURL(fileRef);
  } catch (storageErr) {
    console.warn('Firebase Storage upload notice, falling back to data URL:', storageErr);
    try {
      mediaUrl = await fileToDataUrl(file);
    } catch {
      mediaUrl = URL.createObjectURL(file);
    }
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const storyData: Omit<StoryItem, 'id'> = {
    userId,
    authorName,
    authorAvatar: authorAvatar || '',
    mediaUrl,
    mediaType: isVideo ? 'video' : 'image',
    createdAt: now.toISOString(),
    expiresAt,
  };

  let storyId = 'story_' + Date.now();
  try {
    const docRef = await addDoc(collection(db, 'community_stories'), storyData);
    storyId = docRef.id;
  } catch (firestoreErr) {
    console.warn('Firestore story save notice:', firestoreErr);
  }

  const createdStory: StoryItem = {
    id: storyId,
    ...storyData,
  };

  // Cache in local storage for instant offline resilience and immediate visibility
  saveLocalStory(createdStory);

  return createdStory;
}
