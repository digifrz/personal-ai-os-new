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
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { AIMemoryItem, AIConversationItem, AIChatMessage } from '../../types';
import { AppError } from '../../lib/errors';

export function subscribeAIMemories(userId: string, callback: (memories: AIMemoryItem[]) => void) {
  const q = query(
    collection(db, 'ai_memories'),
    where('userId', '==', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const memories: AIMemoryItem[] = [];
      snapshot.forEach((d) => {
        const raw = d.data();
        const isVisible = raw.isVisible !== undefined ? Boolean(raw.isVisible) : raw.is_visible !== undefined ? Boolean(raw.is_visible) : true;
        memories.push({
          id: d.id,
          ...raw,
          isVisible,
          is_visible: isVisible,
        } as AIMemoryItem);
      });
      memories.sort((a, b) => (b.importance || 0) - (a.importance || 0));
      callback(memories);
    },
    (err) => console.warn('AI memories notice:', err?.message || err)
  );
}

export async function createAIMemory(memory: Omit<AIMemoryItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const isVisible = memory.isVisible !== undefined ? memory.isVisible : memory.is_visible !== undefined ? memory.is_visible : true;
  return addDoc(collection(db, 'ai_memories'), {
    ...memory,
    isVisible,
    is_visible: isVisible,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateAIMemory(id: string, updates: Partial<AIMemoryItem>) {
  const payload: any = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  if (updates.isVisible !== undefined) {
    payload.is_visible = updates.isVisible;
  } else if (updates.is_visible !== undefined) {
    payload.isVisible = updates.is_visible;
  }
  return updateDoc(doc(db, 'ai_memories', id), payload);
}

export async function deleteAIMemory(id: string) {
  return deleteDoc(doc(db, 'ai_memories', id));
}

export async function clearAllAIMemories(userId: string) {
  const q = query(collection(db, 'ai_memories'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const promises = snap.docs.map((d) => deleteDoc(d.ref));
  return Promise.all(promises);
}

export function subscribeAIConversations(userId: string, callback: (convs: AIConversationItem[]) => void) {
  const q = query(
    collection(db, 'ai_conversations'),
    where('userId', '==', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const convs: AIConversationItem[] = [];
      snapshot.forEach((d) => convs.push({ id: d.id, ...d.data() } as AIConversationItem));
      convs.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
      callback(convs);
    },
    (err) => console.warn('AI conversations notice:', err?.message || err)
  );
}

export async function saveAIConversation(conv: Omit<AIConversationItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  return addDoc(collection(db, 'ai_conversations'), {
    ...conv,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateAIConversation(id: string, updates: Partial<AIConversationItem>) {
  return updateDoc(doc(db, 'ai_conversations', id), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteAIConversation(id: string) {
  return deleteDoc(doc(db, 'ai_conversations', id));
}

export function listenToAIChats(userId: string, callback: (messages: AIChatMessage[]) => void) {
  const q = query(
    collection(db, 'ai_chats'),
    where('userId', '==', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: AIChatMessage[] = [];
      snapshot.forEach((d) => messages.push({ id: d.id, ...d.data() } as AIChatMessage));
      messages.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      callback(messages);
    },
    (err) => console.warn('AI chats notice:', err?.message || err)
  );
}

export async function addAIChatMessage(userId: string, role: 'user' | 'model', text: string) {
  return addDoc(collection(db, 'ai_chats'), {
    userId,
    role,
    text,
    createdAt: new Date().toISOString(),
  });
}

export async function clearAIChats(userId: string) {
  const q = query(collection(db, 'ai_chats'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const promises = snap.docs.map((d) => deleteDoc(d.ref));
  return Promise.all(promises);
}

