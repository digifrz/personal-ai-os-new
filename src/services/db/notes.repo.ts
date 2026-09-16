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

export function subscribeNotes(userId: string, callback: (notes: NoteItem[]) => void) {
  const q = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const notes: NoteItem[] = [];
      snapshot.forEach((d) => notes.push({ id: d.id, ...d.data() } as NoteItem));
      callback(notes);
    },
    (err) => console.warn('Notes subscription notice:', err?.message || err)
  );
}

export async function createNote(note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) {
  validateNoteInput(note.title, note.body || '');
  const now = new Date().toISOString();
  try {
    return await addDoc(collection(db, 'notes'), {
      ...note,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function updateNote(id: string, updates: Partial<NoteItem>) {
  if (updates.title !== undefined || updates.body !== undefined) {
    validateNoteInput(updates.title || 'Note', updates.body || '');
  }
  try {
    return await updateDoc(doc(db, 'notes', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function deleteNote(id: string) {
  try {
    return await deleteDoc(doc(db, 'notes', id));
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}
