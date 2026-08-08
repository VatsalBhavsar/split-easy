import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
  throw new Error('Firebase config env vars are missing. Check your .env file.');
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

const app = initializeApp(firebaseConfig);

let authInstance;
if (Platform.OS === 'web') {
  authInstance = getAuth(app);
} else {
  try {
    // Pull React Native-specific persistence helpers from Firebase's RN entrypoint.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initializeAuth, getReactNativePersistence } = require('@firebase/auth/dist/rn/index');
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    console.warn('Falling back to default auth (no native persistence):', e);
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export const db = getFirestore(app);
