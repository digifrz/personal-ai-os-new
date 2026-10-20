import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { FinanceTransactionItem } from '../../types';

function getLocalFinanceBackup(): FinanceTransactionItem[] {
  try {
    const raw = localStorage.getItem('personal_ai_os_finance_backup');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalFinanceBackup(transactions: FinanceTransactionItem[]) {
  try {
    localStorage.setItem('personal_ai_os_finance_backup', JSON.stringify(transactions.slice(0, 300)));
  } catch (e) {
    console.warn('Local finance backup notice:', e);
  }
}

export function subscribeTransactions(userId: string, callback: (transactions: FinanceTransactionItem[]) => void) {
  const localBackup = getLocalFinanceBackup().filter(
    (t) => !t.userId || t.userId === userId || userId === 'guest_user'
  );
  if (localBackup.length > 0) {
    callback(localBackup);
  }

  const q = query(collection(db, 'finance_transactions'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: FinanceTransactionItem[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as FinanceTransactionItem));

      const existingIds = new Set(items.map((i) => i.id));
      for (const item of localBackup) {
        if (!existingIds.has(item.id)) {
          items.push(item);
        }
      }

      items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      saveLocalFinanceBackup(items);
      callback(items);
    },
    (err) => {
      console.warn('Finance subscription fallback to offline cache:', err);
      callback(localBackup);
    }
  );
}

export async function createTransaction(
  transaction: Omit<FinanceTransactionItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date().toISOString();
  const newTx: Omit<FinanceTransactionItem, 'id'> = {
    ...transaction,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, 'finance_transactions'), newTx);
    const saved: FinanceTransactionItem = { id: docRef.id, ...newTx };
    const current = getLocalFinanceBackup();
    saveLocalFinanceBackup([saved, ...current]);
    return docRef.id;
  } catch (err) {
    const tempId = 'local_tx_' + Date.now();
    const saved: FinanceTransactionItem = { id: tempId, ...newTx };
    const current = getLocalFinanceBackup();
    saveLocalFinanceBackup([saved, ...current]);
    return tempId;
  }
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const current = getLocalFinanceBackup();
  saveLocalFinanceBackup(current.filter((t) => t.id !== transactionId));

  if (!transactionId.startsWith('local_')) {
    try {
      await deleteDoc(doc(db, 'finance_transactions', transactionId));
    } catch (e) {
      console.warn('Delete finance transaction cloud notice:', e);
    }
  }
}
