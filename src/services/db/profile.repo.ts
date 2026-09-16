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
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const notes: NotificationItem[] = [];
      snapshot.forEach((d) => notes.push({ id: d.id, ...d.data() } as NotificationItem));
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
  const q = query(collection(db, 'users'), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((d) => users.push(d.data() as UserProfile));
      callback(users);
    },
    (err) => console.warn('Community profiles notice:', err?.message || err)
  );
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  validateProfileInput(updates);
  const userRef = doc(db, 'users', userId);
  try {
    return await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function toggleFollowUser(followerId: string, followingId: string, currentlyFollowing: boolean) {
  const followDocId = `${followerId}_${followingId}`;
  const followRef = doc(db, 'community_follows', followDocId);
  if (currentlyFollowing) {
    return deleteDoc(followRef);
  } else {
    return setDoc(followRef, {
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    });
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
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: ActivityLogItem[] = [];
      snapshot.forEach((d) => logs.push({ id: d.id, ...d.data() } as ActivityLogItem));
      callback(logs);
    },
    (err) => {
      console.warn('Activity logs notice:', err?.message || err);
    }
  );
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
