import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Group } from '../types/group';
import { generateInviteCode } from '../utils/inviteLink';

const groupsCol = collection(db, 'groups');
const usersCol = collection(db, 'users');
const inviteCodesCol = collection(db, 'inviteCodes');

type CreateGroupInput = {
  name: string;
  description?: string;
  baseCurrency: string;
  multiCurrencyEnabled?: boolean;
  createdBy: string;
};

export function subscribeToUserGroups(
  userId: string,
  cb: (groups: Group[]) => void,
  onError?: (error: any) => void,
) {
  const q = query(groupsCol, where('members', 'array-contains', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const groups: Group[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      cb(groups);
    },
    onError,
  );
}

export function subscribeToGroup(groupId: string, cb: (group: Group | null) => void, onError?: (error: any) => void) {
  const ref = doc(db, 'groups', groupId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        cb(null);
      } else {
        cb({ id: snap.id, ...(snap.data() as any) });
      }
    },
    onError,
  );
}

export async function createGroup(input: CreateGroupInput) {
  const now = serverTimestamp();
  const baseCurrency = input.baseCurrency;
  const inviteCode = generateInviteCode();
  const payload = {
    name: input.name.trim(),
    description: input.description?.trim() || '',
    currency: baseCurrency,
    baseCurrency,
    supportedCurrencies: [baseCurrency],
    multiCurrencyEnabled: input.multiCurrencyEnabled ?? true,
    createdBy: input.createdBy,
    members: [input.createdBy],
    admins: [input.createdBy],
    inviteCode,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(groupsCol, payload);
  await setDoc(doc(inviteCodesCol, inviteCode), { groupId: docRef.id });
  return docRef.id;
}

export async function ensureInviteCode(groupId: string): Promise<string> {
  const ref = doc(db, 'groups', groupId);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data() as any).inviteCode : undefined;
  if (existing) return existing;
  const inviteCode = generateInviteCode();
  await updateDoc(ref, { inviteCode, updatedAt: serverTimestamp() });
  await setDoc(doc(inviteCodesCol, inviteCode), { groupId });
  return inviteCode;
}

export async function getGroupByInviteCode(inviteCode: string): Promise<Group | null> {
  const codeSnap = await getDoc(doc(inviteCodesCol, inviteCode));
  if (!codeSnap.exists()) return null;
  const { groupId } = codeSnap.data() as { groupId: string };
  const groupSnap = await getDoc(doc(db, 'groups', groupId));
  if (!groupSnap.exists()) return null;
  return { id: groupSnap.id, ...(groupSnap.data() as any) };
}

export async function joinGroupByInviteCode(inviteCode: string, userId: string): Promise<Group> {
  const group = await getGroupByInviteCode(inviteCode);
  if (!group) throw new Error('This invite link is invalid or has expired');
  if (group.members.includes(userId)) return group;
  const ref = doc(db, 'groups', group.id);
  await updateDoc(ref, { members: arrayUnion(userId), updatedAt: serverTimestamp() });
  return { ...group, members: [...group.members, userId] };
}

export async function addMemberByEmail(groupId: string, email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    throw new Error('Email is required');
  }
  const userQuery = query(usersCol, where('email', '==', trimmed));
  const userSnap = await getDocs(userQuery);
  if (userSnap.empty) {
    throw new Error('User not found');
  }
  const targetId = userSnap.docs[0].id;
  const ref = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(ref);
  const currentMembers: string[] = groupSnap.exists() ? (groupSnap.data() as any).members || [] : [];
  if (currentMembers.includes(targetId)) {
    throw new Error('This person is already a member of this group');
  }
  await updateDoc(ref, {
    members: arrayUnion(targetId),
    updatedAt: serverTimestamp(),
  });
  return targetId;
}

export async function addMemberById(groupId: string, memberId: string): Promise<void> {
  const ref = doc(db, 'groups', groupId);
  await updateDoc(ref, { members: arrayUnion(memberId), updatedAt: serverTimestamp() });
}

export async function removeMember(groupId: string, userId: string) {
  const ref = doc(db, 'groups', groupId);
  await updateDoc(ref, {
    members: arrayRemove(userId),
    admins: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  });
}

export async function promoteToAdmin(groupId: string, userId: string) {
  const ref = doc(db, 'groups', groupId);
  await updateDoc(ref, {
    admins: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });
}

export async function updateGroupDetails(
  groupId: string,
  data: { name?: string; description?: string; baseCurrency?: string; supportedCurrencies?: string[]; multiCurrencyEnabled?: boolean },
) {
  const ref = doc(db, 'groups', groupId);
  const payload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.description !== undefined) payload.description = data.description.trim();
  if (data.baseCurrency !== undefined) {
    payload.baseCurrency = data.baseCurrency;
    payload.currency = data.baseCurrency;
  }
  if (data.supportedCurrencies !== undefined) payload.supportedCurrencies = data.supportedCurrencies;
  if (data.multiCurrencyEnabled !== undefined) payload.multiCurrencyEnabled = data.multiCurrencyEnabled;
  await updateDoc(ref, payload);
}

export async function deleteGroup(groupId: string) {
  const ref = doc(db, 'groups', groupId);
  await deleteDoc(ref);
}
