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
import { ProjectItem } from '../../types';
import { AppError } from '../../lib/errors';

export function subscribeProjects(userId: string, callback: (projects: ProjectItem[]) => void) {
  const q = query(
    collection(db, 'projects'),
    where('userId', '==', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const projects: ProjectItem[] = [];
      snapshot.forEach((d) => projects.push({ id: d.id, ...d.data() } as ProjectItem));
      projects.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(projects);
    },
    (err) => console.warn('Projects subscription notice:', err?.message || err)
  );
}

export async function createProject(project: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt'>) {
  if (!project.title?.trim()) throw new AppError('Project title cannot be empty.', 'VALIDATION_FAILED');
  const now = new Date().toISOString();
  try {
    return await addDoc(collection(db, 'projects'), {
      ...project,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function updateProject(id: string, updates: Partial<ProjectItem>) {
  try {
    return await updateDoc(doc(db, 'projects', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}

export async function deleteProject(id: string) {
  try {
    return await deleteDoc(doc(db, 'projects', id));
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}
