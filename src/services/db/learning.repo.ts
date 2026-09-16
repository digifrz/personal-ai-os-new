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
import {
  LearningSubjectItem,
  FlashcardItem,
  StudySessionItem,
} from '../../types';
import { AppError } from '../../lib/errors';

export function subscribeSubjects(userId: string, callback: (subjects: LearningSubjectItem[]) => void) {
  const q = query(
    collection(db, 'learning_subjects'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const subjects: LearningSubjectItem[] = [];
      snapshot.forEach((d) => subjects.push({ id: d.id, ...d.data() } as LearningSubjectItem));
      callback(subjects);
    },
    (err) => console.warn('Subjects notice:', err?.message || err)
  );
}

export async function createSubject(subject: Omit<LearningSubjectItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  return addDoc(collection(db, 'learning_subjects'), {
    ...subject,
    createdAt: now,
    updatedAt: now,
  });
}

export function subscribeFlashcards(userId: string, callback: (cards: FlashcardItem[]) => void) {
  const q = query(
    collection(db, 'learning_flashcards'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const cards: FlashcardItem[] = [];
      snapshot.forEach((d) => cards.push({ id: d.id, ...d.data() } as FlashcardItem));
      callback(cards);
    },
    (err) => console.warn('Flashcards notice:', err?.message || err)
  );
}

export async function createFlashcard(card: Omit<FlashcardItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  return addDoc(collection(db, 'learning_flashcards'), {
    ...card,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateFlashcard(id: string, updates: Partial<FlashcardItem>) {
  return updateDoc(doc(db, 'learning_flashcards', id), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteFlashcard(id: string) {
  return deleteDoc(doc(db, 'learning_flashcards', id));
}

export function subscribeStudySessions(userId: string, callback: (sessions: StudySessionItem[]) => void) {
  const q = query(
    collection(db, 'study_sessions'),
    where('userId', '==', userId),
    orderBy('startedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const sessions: StudySessionItem[] = [];
      snapshot.forEach((d) => sessions.push({ id: d.id, ...d.data() } as StudySessionItem));
      callback(sessions);
    },
    (err) => console.warn('Study sessions notice:', err?.message || err)
  );
}

export async function createStudySession(session: Omit<StudySessionItem, 'id' | 'createdAt'>) {
  const now = new Date().toISOString();
  return addDoc(collection(db, 'study_sessions'), {
    ...session,
    createdAt: now,
  });
}
