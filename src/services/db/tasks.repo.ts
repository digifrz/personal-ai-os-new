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
import { TaskItem } from '../../types';
import { validateTaskInput } from '../../lib/validation';
import { AppError } from '../../lib/errors';

export function subscribeTasks(userId: string, callback: (tasks: TaskItem[]) => void) {
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: TaskItem[] = [];
      snapshot.forEach((d) => tasks.push({ id: d.id, ...d.data() } as TaskItem));
      callback(tasks);
    },
    (err) => console.warn('Tasks subscription notice:', err?.message || err)
  );
}

export async function createTask(task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>) {
  validateTaskInput(task.title, task.priority);
  const now = new Date().toISOString();
  try {
    return await addDoc(collection(db, 'tasks'), {
      ...task,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function updateTask(id: string, updates: Partial<TaskItem>) {
  if (updates.title !== undefined) {
    validateTaskInput(updates.title, updates.priority);
  }
  const taskRef = doc(db, 'tasks', id);
  try {
    return await updateDoc(taskRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function batchUpdateTaskOrders(orderedItems: { id: string; order: number }[]) {
  const now = new Date().toISOString();
  const updates = orderedItems.map(({ id, order }) => {
    if (!id) return Promise.resolve();
    const taskRef = doc(db, 'tasks', id);
    return updateDoc(taskRef, {
      order,
      updatedAt: now,
    }).catch((err) => {
      console.warn(`Firestore task order update skipped for task ${id}:`, err?.message || err);
    });
  });
  return Promise.all(updates);
}

export async function deleteTask(id: string) {
  try {
    return await deleteDoc(doc(db, 'tasks', id));
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}
