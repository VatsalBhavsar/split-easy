import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types/user';
import { User } from 'firebase/auth';

const usersCol = collection(db, 'users');

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) };
}

export async function getUsersByIds(ids: string[]): Promise<UserProfile[]> {
  if (ids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) {
    chunks.push(ids.slice(i, i + 10));
  }

  const results: UserProfile[] = [];
  for (const chunk of chunks) {
    const q = query(usersCol, where('__name__', 'in', chunk));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => results.push({ id: docSnap.id, ...(docSnap.data() as any) }));
  }
  return results;
}

export async function createGuestUser(name: string): Promise<UserProfile> {
  const id = 'guest_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36);
  const ref = doc(usersCol, id);
  await setDoc(ref, { displayName: name, isGuest: true });
  return { id, displayName: name, isGuest: true };
}

export async function ensureUserProfile(user: User | null) {
  if (!user?.uid) return;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const payload = {
    email: user.email?.toLowerCase() || '',
    displayName: user.displayName || user.email || '',
    photoURL: user.photoURL || '',
  };
  if (!snap.exists()) {
    await setDoc(ref, { ...payload, createdAt: new Date().toISOString() });
  } else {
    await updateDoc(ref, { ...payload, updatedAt: new Date().toISOString() });
  }
}
