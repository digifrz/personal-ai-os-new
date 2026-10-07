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

function getLocalTasksBackup(): TaskItem[] {
  try {
    const raw = localStorage.getItem('my_workspace_tasks_backup');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTasksBackup(tasks: TaskItem[]) {
  try {
    localStorage.setItem('my_workspace_tasks_backup', JSON.stringify(tasks.slice(0, 200)));
  } catch (e) {
    console.warn('Local tasks backup notice:', e);
  }
}

export function subscribeTasks(userId: string, callback: (tasks: TaskItem[]) => void) {
  const localBackup = getLocalTasksBackup().filter(
    (t) => !t.userId || t.userId === userId || userId === 'guest_user'
  );
  if (localBackup.length > 0) {
    callback(localBackup);
  }

  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: TaskItem[] = [];
      snapshot.forEach((d) => tasks.push({ id: d.id, ...d.data() } as TaskItem));

      // Merge with local backup
      const existingIds = new Set(tasks.map((t) => t.id));
      for (const item of localBackup) {
        if (!existingIds.has(item.id)) {
          tasks.push(item);
        }
      }

      tasks.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      saveLocalTasksBackup(tasks);
      callback(tasks);
    },
    (err) => {
      console.warn('Tasks subscription notice (using local storage fallback):', err?.message || err);
      callback(localBackup);
    }
  );
}

export async function createTask(task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>) {
  validateTaskInput(task.title, task.priority);
  const now = new Date().toISOString();
  let id = `local_task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...task,
      createdAt: now,
      updatedAt: now,
    });
    id = docRef.id;
  } catch (err) {
    console.warn('Firestore addDoc fallback to local tasks cache:', err);
  }

  const completeTask: TaskItem = { id, ...task, createdAt: now, updatedAt: now };
  const currentLocal = getLocalTasksBackup();
  saveLocalTasksBackup([completeTask, ...currentLocal.filter((t) => t.id !== id)]);
  return { id, ...completeTask };
}

export async function updateTask(id: string, updates: Partial<TaskItem>) {
  if (updates.title !== undefined) {
    validateTaskInput(updates.title, updates.priority);
  }

  // Update local cache immediately
  const currentLocal = getLocalTasksBackup();
  const updated = currentLocal.map((t) =>
    t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
  );
  saveLocalTasksBackup(updated);

  try {
    const taskRef = doc(db, 'tasks', id);
    return await updateDoc(taskRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore updateTask notice, maintained in local cache:', err);
    return;
  }
}

export async function batchUpdateTaskOrders(orderedItems: { id: string; order: number }[]) {
  const now = new Date().toISOString();
  const orderMap = new Map(orderedItems.map((o) => [o.id, o.order]));
  const currentLocal = getLocalTasksBackup();
  const updated = currentLocal.map((t) =>
    orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)!, updatedAt: now } : t
  );
  saveLocalTasksBackup(updated);

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
  const currentLocal = getLocalTasksBackup();
  saveLocalTasksBackup(currentLocal.filter((t) => t.id !== id));

  try {
    return await deleteDoc(doc(db, 'tasks', id));
  } catch (err) {
    console.warn('Firestore deleteTask notice, removed from local cache:', err);
    return;
  }
}
