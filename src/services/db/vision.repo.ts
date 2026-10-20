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
import { VisionBoardItem } from '../../types';

function getLocalVisionBackup(): VisionBoardItem[] {
  try {
    const raw = localStorage.getItem('personal_ai_os_vision_backup');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalVisionBackup(items: VisionBoardItem[]) {
  try {
    localStorage.setItem('personal_ai_os_vision_backup', JSON.stringify(items.slice(0, 100)));
  } catch (e) {
    console.warn('Local vision backup notice:', e);
  }
}

export function subscribeVisionItems(userId: string, callback: (items: VisionBoardItem[]) => void) {
  const localBackup = getLocalVisionBackup().filter(
    (v) => !v.userId || v.userId === userId || userId === 'guest_user'
  );
  if (localBackup.length > 0) {
    callback(localBackup);
  }

  const q = query(collection(db, 'vision_board'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: VisionBoardItem[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as VisionBoardItem));

      const existingIds = new Set(items.map((i) => i.id));
      for (const item of localBackup) {
        if (!existingIds.has(item.id)) {
          items.push(item);
        }
      }

      items.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      saveLocalVisionBackup(items);
      callback(items);
    },
    (err) => {
      console.warn('Vision subscription fallback to offline cache:', err);
      callback(localBackup);
    }
  );
}

export async function createVisionItem(
  item: Omit<VisionBoardItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date().toISOString();
  const newItem: Omit<VisionBoardItem, 'id'> = {
    ...item,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, 'vision_board'), newItem);
    const saved: VisionBoardItem = { id: docRef.id, ...newItem };
    const current = getLocalVisionBackup();
    saveLocalVisionBackup([saved, ...current]);
    return docRef.id;
  } catch (err) {
    const tempId = 'local_vis_' + Date.now();
    const saved: VisionBoardItem = { id: tempId, ...newItem };
    const current = getLocalVisionBackup();
    saveLocalVisionBackup([saved, ...current]);
    return tempId;
  }
}

export async function togglePinVisionItem(id: string, currentPinned: boolean): Promise<boolean> {
  const next = !currentPinned;
  const current = getLocalVisionBackup();
  const updated = current.map((v) => (v.id === id ? { ...v, isPinned: next, updatedAt: new Date().toISOString() } : v));
  saveLocalVisionBackup(updated);

  if (!id.startsWith('local_')) {
    try {
      await updateDoc(doc(db, 'vision_board', id), {
        isPinned: next,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Toggle pin cloud notice:', e);
    }
  }

  return next;
}

export async function deleteVisionItem(id: string): Promise<void> {
  const current = getLocalVisionBackup();
  saveLocalVisionBackup(current.filter((v) => v.id !== id));

  if (!id.startsWith('local_')) {
    try {
      await deleteDoc(doc(db, 'vision_board', id));
    } catch (e) {
      console.warn('Delete vision item cloud notice:', e);
    }
  }
}
