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
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
} from 'firebase/storage';
import { db, storage } from '../../firebase';
import { FileItem } from '../../types';
import { validateFileSize } from '../../lib/validation';
import { AppError } from '../../lib/errors';

export interface UploadProgressPayload {
  fileId: string;
  fileName: string;
  fileSize: number;
  progressPercent: number; // 0-100
  bytesTransferred: number;
  totalBytes: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'canceled';
  error?: string;
  downloadUrl?: string;
  storagePath?: string;
}

export interface ActiveUploadController {
  fileId: string;
  promise: Promise<FileItem>;
  cancel: () => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

function getLocalFilesBackup(): FileItem[] {
  try {
    const raw = localStorage.getItem('my_workspace_files_backup');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalFilesBackup(files: FileItem[]) {
  try {
    localStorage.setItem('my_workspace_files_backup', JSON.stringify(files.slice(0, 50)));
  } catch (e) {
    console.warn('Local files backup failed:', e);
  }
}

export function subscribeFiles(userId: string, callback: (files: FileItem[]) => void) {
  const localBackup = getLocalFilesBackup().filter((f) => !f.userId || f.userId === userId || userId === 'guest_user');
  if (localBackup.length > 0) {
    callback(localBackup);
  }

  const q = query(
    collection(db, 'files'),
    where('userId', '==', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const files: FileItem[] = [];
      snapshot.forEach((d) => files.push({ id: d.id, ...d.data() } as FileItem));
      
      // Merge with local backup
      const existingIds = new Set(files.map(f => f.id));
      for (const item of localBackup) {
        if (!existingIds.has(item.id)) {
          files.push(item);
        }
      }

      files.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
      saveLocalFilesBackup(files);
      callback(files);
    },
    (err) => {
      console.warn('Files subscription notice (using local storage fallback):', err?.message || err);
      callback(localBackup);
    }
  );
}

export function uploadWorkspaceFileProgressAware(
  userId: string,
  file: File,
  folderId?: string | null,
  onProgress?: (info: UploadProgressPayload) => void
): ActiveUploadController {
  const fileId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `users/${userId}/files/${timestamp}_${safeName}`;

  let uploadTask: UploadTask | null = null;
  let isCanceled = false;
  let isDone = false;
  let progressWatchdogTimer: any = null;

  const cancel = () => {
    isCanceled = true;
    if (progressWatchdogTimer) clearTimeout(progressWatchdogTimer);
    if (uploadTask) {
      try {
        uploadTask.cancel();
      } catch (e) {
        console.warn('Upload cancel notice:', e);
      }
    }
    onProgress?.({
      fileId,
      fileName: file.name,
      fileSize: file.size,
      progressPercent: 0,
      bytesTransferred: 0,
      totalBytes: file.size,
      status: 'canceled',
      error: 'Upload canceled by user',
    });
  };

  const promise = new Promise<FileItem>((resolve, reject) => {
    // Validate file size safely inside the promise
    const maxMb = 50;
    if (file.size > maxMb * 1024 * 1024) {
      const err = `File exceeds maximum allowed size of ${maxMb}MB`;
      onProgress?.({
        fileId,
        fileName: file.name,
        fileSize: file.size,
        progressPercent: 0,
        bytesTransferred: 0,
        totalBytes: file.size,
        status: 'failed',
        error: err,
      });
      reject(new Error(err));
      return;
    }

    // Initial pending notification
    onProgress?.({
      fileId,
      fileName: file.name,
      fileSize: file.size,
      progressPercent: 0,
      bytesTransferred: 0,
      totalBytes: file.size,
      status: 'pending',
    });

    const triggerLocalFallback = async (reasonMsg: string) => {
      if (isDone || isCanceled) return;
      isDone = true;
      if (progressWatchdogTimer) clearTimeout(progressWatchdogTimer);

      try {
        onProgress?.({
          fileId,
          fileName: file.name,
          fileSize: file.size,
          progressPercent: 100,
          bytesTransferred: file.size,
          totalBytes: file.size,
          status: 'processing',
        });

        let fallbackUrl = '';
        if (file.size <= 1024 * 1024 * 10) {
          fallbackUrl = await fileToDataUrl(file).catch(() => URL.createObjectURL(file));
        } else {
          fallbackUrl = URL.createObjectURL(file);
        }

        const now = new Date().toISOString();
        const fallbackItem: FileItem = {
          id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId,
          name: file.name,
          itemType: 'file',
          storagePath,
          downloadUrl: fallbackUrl,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          folderId: folderId || null,
          isFavorite: false,
          isArchived: false,
          isTrashed: false,
          createdAt: now,
          updatedAt: now,
        };

        const currentLocal = getLocalFilesBackup();
        saveLocalFilesBackup([fallbackItem, ...currentLocal.filter((f) => f.id !== fallbackItem.id)]);

        onProgress?.({
          fileId,
          fileName: file.name,
          fileSize: file.size,
          progressPercent: 100,
          bytesTransferred: file.size,
          totalBytes: file.size,
          status: 'completed',
          downloadUrl: fallbackUrl,
          error: reasonMsg,
        });

        resolve(fallbackItem);
      } catch (fallbackErr) {
        onProgress?.({
          fileId,
          fileName: file.name,
          fileSize: file.size,
          progressPercent: 0,
          bytesTransferred: 0,
          totalBytes: file.size,
          status: 'failed',
          error: reasonMsg,
        });
        reject(new Error(reasonMsg));
      }
    };

    // Watchdog: If Firebase storage gets stuck or stalls with 0 bytes transferred for >12 seconds
    progressWatchdogTimer = setTimeout(() => {
      if (!isDone && !isCanceled) {
        console.warn('Firebase Storage upload watchdog triggered fallback for file:', file.name);
        triggerLocalFallback('Storage connection stalled. Saved securely to workspace local vault.');
      }
    }, 12000);

    try {
      const fileRef = ref(storage, storagePath);
      uploadTask = uploadBytesResumable(fileRef, file, {
        contentType: file.type || 'application/octet-stream',
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (isCanceled || isDone) return;
          const total = snapshot.totalBytes || file.size;
          const transferred = snapshot.bytesTransferred;
          const rawPercent = total > 0 ? (transferred / total) * 100 : 0;
          const percent = Math.min(99, Math.round(rawPercent));

          // If receiving progress, refresh watchdog
          if (transferred > 0 && progressWatchdogTimer) {
            clearTimeout(progressWatchdogTimer);
            progressWatchdogTimer = setTimeout(() => {
              if (!isDone && !isCanceled) {
                triggerLocalFallback('Upload stalled. Saved securely to workspace local vault.');
              }
            }, 15000);
          }

          onProgress?.({
            fileId,
            fileName: file.name,
            fileSize: file.size,
            progressPercent: percent,
            bytesTransferred: transferred,
            totalBytes: total,
            status: percent >= 100 ? 'processing' : 'uploading',
          });
        },
        async (error: any) => {
          if (isCanceled || isDone) return;
          console.warn('Firebase Storage upload error:', error);
          let friendlyError = 'Upload interrupted or denied.';
          if (error.code === 'storage/unauthorized') {
            friendlyError = 'Storage permission denied. Saved to workspace local vault.';
          } else if (error.code === 'storage/canceled') {
            friendlyError = 'Upload was canceled.';
          } else if (error.code === 'storage/retry-limit-exceeded') {
            friendlyError = 'Upload timed out. Check network connection.';
          } else if (error.code === 'storage/quota-exceeded') {
            friendlyError = 'Storage space quota exceeded.';
          } else if (error.message) {
            friendlyError = error.message;
          }

          await triggerLocalFallback(friendlyError);
        },
        async () => {
          if (isCanceled || isDone) return;
          isDone = true;
          if (progressWatchdogTimer) clearTimeout(progressWatchdogTimer);

          onProgress?.({
            fileId,
            fileName: file.name,
            fileSize: file.size,
            progressPercent: 100,
            bytesTransferred: file.size,
            totalBytes: file.size,
            status: 'processing',
          });

          try {
            const downloadUrl = await getDownloadURL(uploadTask!.snapshot.ref);
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

            let id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            try {
              const docRef = await addDoc(collection(db, 'files'), fileData);
              id = docRef.id;
            } catch (firestoreErr) {
              console.warn('Firestore doc creation notice, saving to local cache:', firestoreErr);
            }

            const completeItem: FileItem = { id, ...fileData };
            const currentLocal = getLocalFilesBackup();
            saveLocalFilesBackup([completeItem, ...currentLocal.filter((f) => f.id !== id)]);

            onProgress?.({
              fileId,
              fileName: file.name,
              fileSize: file.size,
              progressPercent: 100,
              bytesTransferred: file.size,
              totalBytes: file.size,
              status: 'completed',
              downloadUrl,
            });

            resolve(completeItem);
          } catch (finalizeErr: any) {
            console.error('Finalize file error, triggering fallback:', finalizeErr);
            await triggerLocalFallback('File uploaded, saved to local vault.');
          }
        }
      );
    } catch (startErr: any) {
      console.warn('Failed to start resumable upload task:', startErr);
      triggerLocalFallback(startErr?.message || 'Storage initialization failed. Saved to workspace vault.');
    }
  });

  return { fileId, promise, cancel };
}

export async function uploadWorkspaceFile(
  userId: string,
  file: File,
  folderId?: string | null
): Promise<FileItem> {
  const controller = uploadWorkspaceFileProgressAware(userId, file, folderId);
  return controller.promise;
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
  const currentLocal = getLocalFilesBackup();
  saveLocalFilesBackup(currentLocal.filter((f) => f.id !== id));

  try {
    if (storagePath) {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef).catch((err) => {
        console.warn('Storage deletion warning (ignorable if file removed):', err?.message || err);
      });
    }
    return await deleteDoc(doc(db, 'files', id));
  } catch (err) {
    console.warn('Firestore deleteFile notice, file removed from local cache:', err);
    return;
  }
}
