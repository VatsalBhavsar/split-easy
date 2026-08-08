import { auth } from '../firebase';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  reload,
} from 'firebase/auth';

export async function signUp(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  return credential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export function signOut() {
  return firebaseSignOut(auth);
}

export async function sendVerification() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user available for verification');
  }
  return sendEmailVerification(user);
}

export async function refreshUser(): Promise<User | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  await reload(user);
  return auth.currentUser;
}

export function getCurrentUser() {
  return auth.currentUser;
}
