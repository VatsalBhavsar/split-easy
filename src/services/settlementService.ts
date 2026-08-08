import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Settlement } from '../types/settlement';

const groupsCol = collection(db, 'groups');

export async function createSettlement(
  groupId: string,
  payload: Omit<Settlement, 'id' | 'createdAt'> & { settledAt?: any },
) {
  const colRef = collection(groupsCol, groupId, 'settlements');
  const settledAt =
    payload.settledAt instanceof Date ? Timestamp.fromDate(payload.settledAt) : payload.settledAt || Timestamp.now();
  const raw = { ...payload, settledAt, createdAt: serverTimestamp() };
  const data = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined));
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}

export async function updateSettlement(
  groupId: string,
  settlementId: string,
  payload: Partial<Omit<Settlement, 'id' | 'createdAt'>>,
) {
  const ref = doc(groupsCol, groupId, 'settlements', settlementId);
  await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
}
