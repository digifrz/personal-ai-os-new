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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../../firebase';
import { FileItem } from '../../types';
import { validateFileSize } from '../../lib/validation';
import { AppError } from '../../lib/errors';

export function subscribeFiles(userId: string, callback: (files: FileItem[]) => void) {
  const q = query(
    collection(db, 'files'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const files: FileItem[] = [];
      snapshot.forEach((d) => files.push({ id: d.id, ...d.data() } as FileItem));
      callback(files);
    },
    (err) => console.warn('Files subscription notice:', err?.message || err)
  );
}

export async function uploadWorkspaceFile(userId: string, file: File, folderId?: string | null) {
  validateFileSize(file, 30);
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `users/${userId}/files/${timestamp}_${safeName}`;
  const fileRef = ref(storage, storagePath);

  await uploadBytes(fileRef, file);
  const downloadUrl = await getDownloadURL(fileRef);

  const now = new Date().toISOString();
  const fileData: Omit<FileItem, 'id'> = {
    userId,
    name: file.name,
    itemType: 'file',
    storagePath,
    downloadUrl,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    folderId: folderId || null,
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, 'files'), fileData);
  return { id: docRef.id, ...fileData };
}

export async function createFolder(userId: string, name: string, folderId?: string | null) {
  const now = new Date().toISOString();
  return addDoc(collection(db, 'files'), {
    userId,
    name,
    itemType: 'folder',
    folderId: folderId || null,
    sizeBytes: 0,
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateFile(id: string, updates: Partial<FileItem>) {
  return updateDoc(doc(db, 'files', id), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function uploadFile(
  userId: string,
  file: File,
  folder = 'general'
): Promise<FileItem> {
  validateFileSize(file, 30);
  return uploadWorkspaceFile(userId, file, folder === 'general' ? null : folder);
}

export async function deleteFile(id: string, storagePath?: string) {
  try {
    if (storagePath) {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef).catch((err) => {
        console.warn('Storage deletion warning (ignorable if file removed):', err?.message || err);
      });
    }
    return await deleteDoc(doc(db, 'files', id));
  } catch (err) {
    throw AppError.from(err, 'INTERNAL');
  }
}
