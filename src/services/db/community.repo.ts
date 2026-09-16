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
  const q = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const posts: CommunityPostItem[] = [];
      snapshot.forEach((d) => posts.push({ id: d.id, ...d.data() } as CommunityPostItem));
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
    return await addDoc(collection(db, 'community_posts'), {
      ...post,
      likesCount: 0,
      commentsCount: 0,
      likedBy: [],
      savedBy: [],
      createdAt: now,
    });
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
    where('postId', '==', postId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const comments: CommunityCommentItem[] = [];
      snapshot.forEach((d) => comments.push({ id: d.id, ...d.data() } as CommunityCommentItem));
      callback(comments);
    },
    (err) => console.warn('Post comments notice:', err?.message || err)
  );
}

export async function addPostComment(comment: Omit<CommunityCommentItem, 'id' | 'createdAt'>) {
  validateCommentInput(comment.content);
  const now = new Date().toISOString();
  const res = await addDoc(collection(db, 'community_post_comments'), {
    ...comment,
    createdAt: now,
  });

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
  const q = query(collection(db, 'community_channels'), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const channels: CommunityChannelItem[] = [];
      snapshot.forEach((d) => channels.push({ id: d.id, ...d.data() } as CommunityChannelItem));
      callback(channels);
    },
    (err) => console.warn('Community channels notice:', err?.message || err)
  );
}

export function subscribeChannelMessages(channelId: string, callback: (messages: CommunityMessageItem[]) => void) {
  const q = query(
    collection(db, 'community_messages'),
    where('channelId', '==', channelId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: CommunityMessageItem[] = [];
      snapshot.forEach((d) => messages.push({ id: d.id, ...d.data() } as CommunityMessageItem));
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
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const threads: DirectThreadItem[] = [];
      snapshot.forEach((d) => threads.push({ id: d.id, ...d.data() } as DirectThreadItem));
      callback(threads);
    },
    (err) => console.warn('Direct threads notice:', err?.message || err)
  );
}

export function subscribeDirectMessages(threadId: string, callback: (messages: DirectMessageItem[]) => void) {
  const q = query(
    collection(db, 'community_thread_messages'),
    where('threadId', '==', threadId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: DirectMessageItem[] = [];
      snapshot.forEach((d) => messages.push({ id: d.id, ...d.data() } as DirectMessageItem));
      callback(messages);
    },
    (err) => console.warn('Thread messages notice:', err?.message || err)
  );
}

export async function sendDirectMessage(
  threadId: string,
  msg: Omit<DirectMessageItem, 'id' | 'createdAt'>
) {
  validateMessageInput(msg.content);
  const now = new Date().toISOString();
  await addDoc(collection(db, 'community_thread_messages'), {
    ...msg,
    createdAt: now,
  });
  return updateDoc(doc(db, 'community_threads', threadId), {
    lastMessage: msg.content,
    lastMessageAt: now,
    updatedAt: now,
  });
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

export function subscribeStories(callback: (stories: StoryItem[]) => void) {
  const now = new Date().toISOString();
  const q = query(
    collection(db, 'community_stories'),
    where('expiresAt', '>', now),
    orderBy('expiresAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const stories: StoryItem[] = [];
      snapshot.forEach((d) => stories.push({ id: d.id, ...d.data() } as StoryItem));
      callback(stories);
    },
    (err) => console.warn('Stories notice:', err?.message || err)
  );
}

export async function uploadStory(
  userId: string,
  authorName: string,
  authorAvatar: string,
  file: File
): Promise<StoryItem> {
  const fileId = `${Date.now()}_story_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storagePath = `users/${userId}/stories/${fileId}`;
  const fileRef = ref(storage, storagePath);

  await uploadBytes(fileRef, file);
  const mediaUrl = await getDownloadURL(fileRef);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const isVideo = file.type.startsWith('video/');

  const storyData: Omit<StoryItem, 'id'> = {
    userId,
    authorName,
    authorAvatar,
    mediaUrl,
    mediaType: isVideo ? 'video' : 'image',
    createdAt: now.toISOString(),
    expiresAt,
  };

  const docRef = await addDoc(collection(db, 'community_stories'), storyData);
  return {
    id: docRef.id,
    ...storyData,
  };
}
