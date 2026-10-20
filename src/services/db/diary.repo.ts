import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { DiaryEntry } from '../../types';
import { AppError } from '../../lib/errors';

const LOCAL_DIARY_KEY = 'paio_local_diary_entries_v1';

function getStoredLocalEntries(userId?: string): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_DIARY_KEY}_${userId || 'guest'}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredLocalEntries(userId: string | undefined, entries: DiaryEntry[]) {
  try {
    localStorage.setItem(`${LOCAL_DIARY_KEY}_${userId || 'guest'}`, JSON.stringify(entries));
  } catch {}
}

export function subscribeDiaryEntries(userId: string, callback: (entries: DiaryEntry[]) => void) {
  // Initial fallback to local storage
  const localList = getStoredLocalEntries(userId);
  if (localList.length > 0) {
    callback(localList);
  }

  try {
    const q = query(
      collection(db, 'diary_entries'),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const entries: DiaryEntry[] = [];
        snapshot.forEach((d) => entries.push({ id: d.id, ...d.data() } as DiaryEntry));
        entries.sort((a, b) => b.date.localeCompare(a.date));
        saveStoredLocalEntries(userId, entries);
        callback(entries);
      },
      (err) => {
        console.warn('Diary entries subscription notice:', err?.message || err);
        callback(getStoredLocalEntries(userId));
      }
    );
  } catch (err) {
    callback(getStoredLocalEntries(userId));
    return () => {};
  }
}

export async function createDiaryEntry(
  entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  if (!entry.title?.trim() && !entry.content?.trim()) {
    throw new AppError('Diary entry must have a title or content.', 'VALIDATION_FAILED');
  }

  const now = new Date().toISOString();
  const newEntryPayload = {
    ...entry,
    title: (entry.title || 'Daily Reflection').trim(),
    content: (entry.content || '').trim(),
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    attachments: Array.isArray(entry.attachments) ? entry.attachments : [],
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, 'diary_entries'), newEntryPayload);
    // Also update local storage
    const local = getStoredLocalEntries(entry.userId);
    const updated = [{ id: docRef.id, ...newEntryPayload }, ...local];
    saveStoredLocalEntries(entry.userId, updated);
    return docRef.id;
  } catch (err) {
    console.warn('Firestore offline, saving diary entry locally:', err);
    const localId = `diary_loc_${Date.now()}`;
    const local = getStoredLocalEntries(entry.userId);
    const updated = [{ id: localId, ...newEntryPayload }, ...local];
    saveStoredLocalEntries(entry.userId, updated);
    return localId;
  }
}

export async function updateDiaryEntry(
  id: string,
  updates: Partial<DiaryEntry>,
  userId?: string
) {
  const now = new Date().toISOString();
  try {
    if (!id.startsWith('diary_loc_')) {
      await updateDoc(doc(db, 'diary_entries', id), {
        ...updates,
        updatedAt: now,
      });
    }
  } catch (err) {
    console.warn('Firestore offline update notice:', err);
  }

  // Update local storage
  const local = getStoredLocalEntries(userId);
  const updated = local.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: now } : e));
  saveStoredLocalEntries(userId, updated);
}

export async function deleteDiaryEntry(id: string, userId?: string) {
  try {
    if (!id.startsWith('diary_loc_')) {
      await deleteDoc(doc(db, 'diary_entries', id));
    }
  } catch (err) {
    console.warn('Firestore offline delete notice:', err);
  }

  // Update local storage
  const local = getStoredLocalEntries(userId);
  const updated = local.filter((e) => e.id !== id);
  saveStoredLocalEntries(userId, updated);
}
