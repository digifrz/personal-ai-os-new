import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  UserProfile,
  NotificationItem,
  ActivityLogItem,
} from '../../types';
import { validateProfileInput } from '../../lib/validation';
import { AppError } from '../../lib/errors';

export function subscribeNotifications(userId: string, callback: (notifications: NotificationItem[]) => void) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const notes: NotificationItem[] = [];
      snapshot.forEach((d) => notes.push({ id: d.id, ...d.data() } as NotificationItem));
      notes.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(notes);
    },
    (err) => console.warn('Notifications notice:', err?.message || err)
  );
}

export async function createNotification(notification: Omit<NotificationItem, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'notifications'), {
    ...notification,
    createdAt: new Date().toISOString(),
  });
}

export async function markNotificationRead(id: string) {
  return updateDoc(doc(db, 'notifications', id), {
    isRead: true,
    readAt: new Date().toISOString(),
  });
}

export async function markAllNotificationsRead(userId: string) {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
  const snap = await getDocs(q);
  const now = new Date().toISOString();
  const promises = snap.docs.map((d) => updateDoc(d.ref, { isRead: true, readAt: now }));
  return Promise.all(promises);
}

export function subscribeCommunityProfiles(callback: (profiles: UserProfile[]) => void) {
  const q = query(collection(db, 'public_profiles'));
  return onSnapshot(
    q,
    (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((d) => users.push(d.data() as UserProfile));
      users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      callback(users);
    },
    (err) => console.warn('Community profiles notice:', err?.message || err)
  );
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  validateProfileInput(updates);
  const userRef = doc(db, 'users', userId);
  const publicRef = doc(db, 'public_profiles', userId);
  try {
    const res = await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    // Mirror safe public discovery fields to public_profiles collection
    const publicData: Record<string, any> = {
      userId,
      updatedAt: new Date().toISOString(),
    };
    if (updates.name !== undefined) publicData.name = updates.name;
    if (updates.username !== undefined) publicData.username = updates.username;
    if (updates.avatarUrl !== undefined) publicData.avatarUrl = updates.avatarUrl;
    if (updates.bio !== undefined) publicData.bio = updates.bio;
    if (updates.themeSkin !== undefined) publicData.themeSkin = updates.themeSkin;
    if (updates.accentColor !== undefined) publicData.accentColor = updates.accentColor;

    await setDoc(publicRef, publicData, { merge: true }).catch((e) => {
      console.warn('Public profile mirror notice:', e);
    });

    return res;
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function toggleFollowUser(
  followerId: string,
  followingId: string,
  currentlyFollowing: boolean,
  followerName?: string
) {
  const followDocId = `${followerId}_${followingId}`;
  const followRef = doc(db, 'community_follows', followDocId);
  if (currentlyFollowing) {
    return deleteDoc(followRef);
  } else {
    const res = await setDoc(followRef, {
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    });

    // Send lounge follower notification to the target user
    addDoc(collection(db, 'notifications'), {
      userId: followingId,
      type: 'community',
      title: 'New Follower in Lounge',
      message: `${followerName || 'A workspace member'} started following you!`,
      actorName: followerName || 'Workspace Member',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkTab: 'community',
    }).catch((e) => {
      console.warn('Follower notification notice:', e);
    });

    return res;
  }
}

export async function checkIsFollowing(followerId: string, followingId: string): Promise<boolean> {
  const followDocId = `${followerId}_${followingId}`;
  const snap = await getDocs(query(collection(db, 'community_follows'), where('__name__', '==', followDocId)));
  return !snap.empty;
}

export function listenToActivityLogs(userId: string, callback: (logs: ActivityLogItem[]) => void) {
  const q = query(
    collection(db, 'activity_logs'),
    where('userId', '==', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: ActivityLogItem[] = [];
      snapshot.forEach((d) => logs.push({ id: d.id, ...d.data() } as ActivityLogItem));
      logs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      callback(logs);
    },
    (err) => {
      console.warn('Activity logs notice:', err?.message || err);
    }
  );
}

export async function createActivityLog(log: Omit<ActivityLogItem, 'id' | 'timestamp'> & { timestamp?: string }) {
  const now = log.timestamp || new Date().toISOString();
  try {
    return await addDoc(collection(db, 'activity_logs'), {
      ...log,
      timestamp: now,
    });
  } catch (err) {
    console.warn('Error recording activity log to Firestore:', err);
    return null;
  }
}

export async function clearActivityLogs(userId: string) {
  const q = query(collection(db, 'activity_logs'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const promises = snap.docs.map((d) => deleteDoc(d.ref));
  return Promise.all(promises);
}

export async function clearAllUserData(userId: string) {
  const collectionsToClear = [
    'tasks',
    'notes',
    'calendar_events',
    'goals',
    'milestones',
    'projects',
    'learning_flashcards',
    'study_sessions',
    'notifications',
  ];
  for (const colName of collectionsToClear) {
    try {
      const q = query(collection(db, colName), where('userId', '==', userId));
      const snap = await getDocs(q);
      const promises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(promises);
    } catch (e) {
      console.warn(`Error clearing ${colName}:`, e);
    }
  }
}

export async function exportAllUserData(userId: string) {
  const collectionsToExport = [
    'tasks',
    'notes',
    'files',
    'calendar_events',
    'goals',
    'milestones',
    'projects',
    'learning_subjects',
    'learning_flashcards',
    'study_sessions',
    'ai_memories',
    'ai_conversations',
    'notifications',
  ];

  const exportData: Record<string, any[]> = {};

  for (const colName of collectionsToExport) {
    try {
      const q = query(collection(db, colName), where('userId', '==', userId));
      const snap = await getDocs(q);
      exportData[colName] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      exportData[colName] = [];
    }
  }

  return exportData;
}
