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
} from 'firebase/firestore';
import { db } from '../../firebase';
import { NoteItem } from '../../types';
import { validateNoteInput } from '../../lib/validation';
import { AppError } from '../../lib/errors';

function getLocalNotesBackup(): NoteItem[] {
  try {
    const raw = localStorage.getItem('my_workspace_notes_backup');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNotesBackup(notes: NoteItem[]) {
  try {
    localStorage.setItem('my_workspace_notes_backup', JSON.stringify(notes.slice(0, 100)));
  } catch (e) {
    console.warn('Local notes backup notice:', e);
  }
}

export function subscribeNotes(userId: string, callback: (notes: NoteItem[]) => void) {
  const localBackup = getLocalNotesBackup().filter(
    (n) => !n.userId || n.userId === userId || userId === 'guest_user'
  );
  if (localBackup.length > 0) {
    callback(localBackup);
  }

  const q = query(
    collection(db, 'notes'),
    where('userId', '==', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const notes: NoteItem[] = [];
      snapshot.forEach((d) => notes.push({ id: d.id, ...d.data() } as NoteItem));

      // Merge with local backup
      const existingIds = new Set(notes.map((n) => n.id));
      for (const item of localBackup) {
        if (!existingIds.has(item.id)) {
          notes.push(item);
        }
      }

      notes.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
      saveLocalNotesBackup(notes);
      callback(notes);
    },
    (err) => {
      console.warn('Notes subscription notice (using local storage fallback):', err?.message || err);
      callback(localBackup);
    }
  );
}

export async function createNote(note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) {
  validateNoteInput(note.title, note.body || '');
  const now = new Date().toISOString();
  let id = `local_note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    const docRef = await addDoc(collection(db, 'notes'), {
      ...note,
      createdAt: now,
      updatedAt: now,
    });
    id = docRef.id;
  } catch (err) {
    console.warn('Firestore addDoc fallback to local notes cache:', err);
  }

  const completeNote: NoteItem = { id, ...note, createdAt: now, updatedAt: now };
  const currentLocal = getLocalNotesBackup();
  saveLocalNotesBackup([completeNote, ...currentLocal.filter((n) => n.id !== id)]);
  return { id, ...completeNote };
}

export async function updateNote(id: string, updates: Partial<NoteItem>) {
  if (updates.title !== undefined || updates.body !== undefined) {
    validateNoteInput(updates.title || 'Note', updates.body || '');
  }

  const currentLocal = getLocalNotesBackup();
  const updated = currentLocal.map((n) =>
    n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
  );
  saveLocalNotesBackup(updated);

  try {
    return await updateDoc(doc(db, 'notes', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore updateNote notice, maintained in local cache:', err);
    return;
  }
}

export async function deleteNote(id: string) {
  const currentLocal = getLocalNotesBackup();
  saveLocalNotesBackup(currentLocal.filter((n) => n.id !== id));

  try {
    return await deleteDoc(doc(db, 'notes', id));
  } catch (err) {
    console.warn('Firestore deleteNote notice, removed from local cache:', err);
    return;
  }
}
