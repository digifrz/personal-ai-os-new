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
import { GoalItem, MilestoneItem } from '../../types';
import { AppError } from '../../lib/errors';

export function subscribeGoals(userId: string, callback: (goals: GoalItem[]) => void) {
  const q = query(
    collection(db, 'goals'),
    where('userId', '==', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const goals: GoalItem[] = [];
      snapshot.forEach((d) => goals.push({ id: d.id, ...d.data() } as GoalItem));
      goals.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(goals);
    },
    (err) => console.warn('Goals subscription notice:', err?.message || err)
  );
}

export async function createGoal(goal: Omit<GoalItem, 'id' | 'createdAt' | 'updatedAt'>) {
  if (!goal.title?.trim()) throw new AppError('Goal title cannot be empty.', 'VALIDATION_FAILED');
  const now = new Date().toISOString();
  try {
    return await addDoc(collection(db, 'goals'), {
      ...goal,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function updateGoal(id: string, updates: Partial<GoalItem>) {
  try {
    return await updateDoc(doc(db, 'goals', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function deleteGoal(id: string) {
  try {
    return await deleteDoc(doc(db, 'goals', id));
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export function subscribeMilestones(goalId: string, callback: (milestones: MilestoneItem[]) => void) {
  const q = query(
    collection(db, 'milestones'),
    where('goalId', '==', goalId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const milestones: MilestoneItem[] = [];
      snapshot.forEach((d) => milestones.push({ id: d.id, ...d.data() } as MilestoneItem));
      milestones.sort((a, b) => (a.position || 0) - (b.position || 0));
      callback(milestones);
    },
    (err) => console.warn('Milestones subscription notice:', err?.message || err)
  );
}

export async function createMilestone(milestone: Omit<MilestoneItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  return addDoc(collection(db, 'milestones'), {
    ...milestone,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateMilestone(id: string, updates: Partial<MilestoneItem>) {
  return updateDoc(doc(db, 'milestones', id), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteMilestone(id: string) {
  return deleteDoc(doc(db, 'milestones', id));
}
