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
import { CalendarEventItem } from '../../types';
import { AppError } from '../../lib/errors';

export function subscribeCalendarEvents(userId: string, callback: (events: CalendarEventItem[]) => void) {
  const q = query(
    collection(db, 'calendar_events'),
    where('userId', '==', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const events: CalendarEventItem[] = [];
      snapshot.forEach((d) => events.push({ id: d.id, ...d.data() } as CalendarEventItem));
      events.sort((a, b) => new Date(a.startsAt || 0).getTime() - new Date(b.startsAt || 0).getTime());
      callback(events);
    },
    (err) => console.warn('Calendar events subscription notice:', err?.message || err)
  );
}

export async function createCalendarEvent(event: Omit<CalendarEventItem, 'id' | 'createdAt' | 'updatedAt'>) {
  if (!event.title?.trim()) throw new AppError('Event title cannot be empty.', 'VALIDATION_FAILED');
  const now = new Date().toISOString();
  try {
    return await addDoc(collection(db, 'calendar_events'), {
      ...event,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function updateCalendarEvent(id: string, updates: Partial<CalendarEventItem>) {
  try {
    return await updateDoc(doc(db, 'calendar_events', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function deleteCalendarEvent(id: string) {
  try {
    return await deleteDoc(doc(db, 'calendar_events', id));
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}
