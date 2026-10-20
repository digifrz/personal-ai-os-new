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
import { HabitItem } from '../../types';

function getLocalHabitsBackup(): HabitItem[] {
  try {
    const raw = localStorage.getItem('personal_ai_os_habits_backup');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHabitsBackup(habits: HabitItem[]) {
  try {
    localStorage.setItem('personal_ai_os_habits_backup', JSON.stringify(habits.slice(0, 100)));
  } catch (e) {
    console.warn('Local habits backup notice:', e);
  }
}

export function subscribeHabits(userId: string, callback: (habits: HabitItem[]) => void) {
  const localBackup = getLocalHabitsBackup().filter(
    (h) => !h.userId || h.userId === userId || userId === 'guest_user'
  );
  if (localBackup.length > 0) {
    callback(localBackup);
  }

  const q = query(collection(db, 'habits'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const habits: HabitItem[] = [];
      snapshot.forEach((d) => habits.push({ id: d.id, ...d.data() } as HabitItem));

      const existingIds = new Set(habits.map((h) => h.id));
      for (const item of localBackup) {
        if (!existingIds.has(item.id)) {
          habits.push(item);
        }
      }

      habits.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      saveLocalHabitsBackup(habits);
      callback(habits);
    },
    (err) => {
      console.warn('Habits subscription fallback to offline cache:', err);
      callback(localBackup);
    }
  );
}

export async function createHabit(
  habit: Omit<HabitItem, 'id' | 'createdAt' | 'updatedAt' | 'streakCount' | 'bestStreak' | 'completedDates'>
): Promise<string> {
  const now = new Date().toISOString();
  const newHabit: Omit<HabitItem, 'id'> = {
    ...habit,
    streakCount: 0,
    bestStreak: 0,
    completedDates: [],
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, 'habits'), newHabit);
    const saved: HabitItem = { id: docRef.id, ...newHabit };
    const current = getLocalHabitsBackup();
    saveLocalHabitsBackup([saved, ...current]);
    return docRef.id;
  } catch (err) {
    const tempId = 'local_h_' + Date.now();
    const saved: HabitItem = { id: tempId, ...newHabit };
    const current = getLocalHabitsBackup();
    saveLocalHabitsBackup([saved, ...current]);
    return tempId;
  }
}

export async function toggleHabitDate(
  habitId: string,
  dateStr: string,
  currentCompletedDates: string[]
): Promise<string[]> {
  const set = new Set(currentCompletedDates || []);
  if (set.has(dateStr)) {
    set.delete(dateStr);
  } else {
    set.add(dateStr);
  }
  const nextDates = Array.from(set).sort();
  
  // Calculate current streak
  let currentStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  let checkDate = set.has(today) ? new Date() : set.has(yesterday) ? new Date(Date.now() - 86400000) : null;
  if (checkDate) {
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (set.has(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Update local backup
  const allHabits = getLocalHabitsBackup();
  const updated = allHabits.map((h) => {
    if (h.id === habitId) {
      return {
        ...h,
        completedDates: nextDates,
        streakCount: currentStreak,
        bestStreak: Math.max(h.bestStreak || 0, currentStreak),
        updatedAt: new Date().toISOString(),
      };
    }
    return h;
  });
  saveLocalHabitsBackup(updated);

  if (!habitId.startsWith('local_')) {
    try {
      await updateDoc(doc(db, 'habits', habitId), {
        completedDates: nextDates,
        streakCount: currentStreak,
        bestStreak: Math.max(allHabits.find((h) => h.id === habitId)?.bestStreak || 0, currentStreak),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Update habit date cloud sync notice:', e);
    }
  }

  return nextDates;
}

export async function deleteHabit(habitId: string): Promise<void> {
  const current = getLocalHabitsBackup();
  saveLocalHabitsBackup(current.filter((h) => h.id !== habitId));

  if (!habitId.startsWith('local_')) {
    try {
      await deleteDoc(doc(db, 'habits', habitId));
    } catch (e) {
      console.warn('Delete habit cloud notice:', e);
    }
  }
}
