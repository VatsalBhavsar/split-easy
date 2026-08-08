import {
  collection,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Expense } from '../types/expense';
import { Settlement } from '../types/settlement';
import { GroupBalance, SimplifiedDebt } from '../types/balance';
import { simplifyDebts } from '../utils/debtSimplifier';

const groupsCol = collection(db, 'groups');

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function recomputeGroupBalances(groupId: string, baseCurrency: string, memberIds: string[]) {
  const expensesSnap = await getDocs(collection(groupsCol, groupId, 'expenses'));
  const settlementsSnap = await getDocs(collection(groupsCol, groupId, 'settlements'));

  const balances: Record<string, number> = {};
  memberIds.forEach((id) => {
    balances[id] = 0;
  });

  expensesSnap.forEach((docSnap) => {
    const e = { id: docSnap.id, ...(docSnap.data() as any) } as Expense;
    const total = e.amountInBase ?? e.amount ?? 0;
    balances[e.paidBy] = round2((balances[e.paidBy] || 0) + total);
    const splits = e.splitsInBase || e.splits || {};
    Object.entries(splits).forEach(([uid, split]) => {
      balances[uid] = round2((balances[uid] || 0) - (split as any).owed);
    });
  });

  settlementsSnap.forEach((docSnap) => {
    const s = { id: docSnap.id, ...(docSnap.data() as any) } as Settlement;
    const amt = s.amountInBase ?? s.amount ?? 0;
    balances[s.paidBy] = round2((balances[s.paidBy] || 0) + amt);
    balances[s.paidTo] = round2((balances[s.paidTo] || 0) - amt);
  });

  const batch = writeBatch(db);
  const balancesCol = collection(groupsCol, groupId, 'balances');
  memberIds.forEach((uid) => {
    const ref = doc(balancesCol, uid);
    const data: GroupBalance = {
      userId: uid,
      groupId,
      netBalance: round2(balances[uid] || 0),
      updatedAt: serverTimestamp(),
    };
    batch.set(ref, data);
  });

  const simplified = simplifyDebts(memberIds, balances, baseCurrency).filter((d) => d.amount > 0.009);
  const edgesCol = collection(groupsCol, groupId, 'simplifiedDebts');

  // clear old edges
  const oldEdges = await getDocs(edgesCol);
  oldEdges.forEach((edge) => batch.delete(edge.ref));

  simplified.forEach((edge) => {
    const edgeId = `${edge.fromUserId}_${edge.toUserId}`;
    const ref = doc(edgesCol, edgeId);
    batch.set(ref, { ...edge, groupId, updatedAt: serverTimestamp() });
  });

  await batch.commit();
}

export function listenAndRecomputeBalances(
  groupId: string,
  baseCurrency: string,
  memberIds: string[],
  onError?: (e: any) => void,
) {
  const expensesCol = collection(groupsCol, groupId, 'expenses');
  const settlementsCol = collection(groupsCol, groupId, 'settlements');

  let timer: any;
  const trigger = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      recomputeGroupBalances(groupId, baseCurrency, memberIds).catch(onError);
    }, 400);
  };

  const un1 = onSnapshot(query(expensesCol), trigger, onError);
  const un2 = onSnapshot(query(settlementsCol), trigger, onError);

  return () => {
    if (timer) clearTimeout(timer);
    un1();
    un2();
  };
}

export function listenGroupBalances(groupId: string, cb: (balances: GroupBalance[]) => void) {
  const colRef = collection(groupsCol, groupId, 'balances');
  return onSnapshot(colRef, (snap) => {
    const items: GroupBalance[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as any));
    cb(items);
  });
}

export function listenSimplifiedDebts(groupId: string, cb: (edges: SimplifiedDebt[]) => void) {
  const colRef = collection(groupsCol, groupId, 'simplifiedDebts');
  return onSnapshot(colRef, (snap) => {
    const items: SimplifiedDebt[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as any));
    cb(items);
  });
}

export function listenGroupSettlements(groupId: string, cb: (settlements: Settlement[]) => void) {
  const colRef = collection(groupsCol, groupId, 'settlements');
  return onSnapshot(colRef, (snap) => {
    const items: Settlement[] = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) } as any))
      .sort((a, b) => {
        const aT = a.settledAt?.toMillis ? a.settledAt.toMillis() : new Date(a.settledAt || a.createdAt || 0).getTime();
        const bT = b.settledAt?.toMillis ? b.settledAt.toMillis() : new Date(b.settledAt || b.createdAt || 0).getTime();
        return (bT || 0) - (aT || 0);
      });
    cb(items);
  });
}


export function listenUserBalance(groupId: string, userId: string, cb: (netBalance: number) => void): () => void {
  const ref = doc(groupsCol, groupId, 'balances', userId);
  return onSnapshot(ref, snap => {
    cb(snap.exists() ? (snap.data() as GroupBalance).netBalance ?? 0 : 0);
  });
}
