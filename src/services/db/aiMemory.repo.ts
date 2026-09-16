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
    where('userId', '==', userId),
    orderBy('importance', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const memories: AIMemoryItem[] = [];
      snapshot.forEach((d) => memories.push({ id: d.id, ...d.data() } as AIMemoryItem));
      callback(memories);
    },
    (err) => console.warn('AI memories notice:', err?.message || err)
  );
}

export async function createAIMemory(memory: Omit<AIMemoryItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  return addDoc(collection(db, 'ai_memories'), {
    ...memory,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateAIMemory(id: string, updates: Partial<AIMemoryItem>) {
  return updateDoc(doc(db, 'ai_memories', id), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
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
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const convs: AIConversationItem[] = [];
      snapshot.forEach((d) => convs.push({ id: d.id, ...d.data() } as AIConversationItem));
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
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: AIChatMessage[] = [];
      snapshot.forEach((d) => messages.push({ id: d.id, ...d.data() } as AIChatMessage));
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

