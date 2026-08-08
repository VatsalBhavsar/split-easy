import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Expense } from '../types/expense';
import { recomputeGroupBalances } from './balanceService';

const groupsCol = collection(db, 'groups');

export function listenGroupExpenses(groupId: string, cb: (expenses: Expense[]) => void, onError?: (e: any) => void) {
  const expensesCol = collection(groupsCol, groupId, 'expenses');
  return onSnapshot(
    expensesCol,
    (snap) => {
      const items: Expense[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const sorted = items.sort((a, b) => {
        const aDate = (a.expenseDate as any) || (a.createdAt as any);
        const bDate = (b.expenseDate as any) || (b.createdAt as any);
        const aTime = aDate?.toMillis ? aDate.toMillis() : aDate?.seconds ? aDate.seconds * 1000 : new Date(aDate).getTime();
        const bTime = bDate?.toMillis ? bDate.toMillis() : bDate?.seconds ? bDate.seconds * 1000 : new Date(bDate).getTime();
        return (bTime || 0) - (aTime || 0);
      });
      cb(sorted);
    },
    onError,
  );
}

export async function createExpense(groupId: string, payload: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
  const expensesCol = collection(groupsCol, groupId, 'expenses');
  const now = serverTimestamp();
  const expenseDate =
    payload.expenseDate instanceof Date
      ? Timestamp.fromDate(payload.expenseDate)
      : payload.expenseDate || Timestamp.now();
  const docRef = await addDoc(expensesCol, { ...payload, expenseDate, createdAt: now, updatedAt: now });
  // recompute balances async (fire and forget)
  recomputeGroupBalances(groupId, payload.baseCurrency || payload.currency, payload.participants).catch(() => {});
  return docRef.id;
}

export async function deleteExpense(groupId: string, expenseId: string, currency: string, participants: string[]) {
  const ref = doc(groupsCol, groupId, 'expenses', expenseId);
  await deleteDoc(ref);
  recomputeGroupBalances(groupId, currency, participants).catch(() => {});
}

export async function updateExpense(
  groupId: string,
  expenseId: string,
  payload: Partial<Omit<Expense, 'id' | 'createdAt'>>,
) {
  const ref = doc(groupsCol, groupId, 'expenses', expenseId);
  const expenseDate =
    payload.expenseDate instanceof Date
      ? Timestamp.fromDate(payload.expenseDate)
      : payload.expenseDate || undefined;
  const data: any = { ...payload, updatedAt: serverTimestamp() };
  if (expenseDate) data.expenseDate = expenseDate;
  await updateDoc(ref, data);
  if ((payload.baseCurrency || payload.currency) && payload.participants) {
    recomputeGroupBalances(
      groupId,
      (payload.baseCurrency || payload.currency) as string,
      payload.participants as string[],
    ).catch(() => {});
  }
}
