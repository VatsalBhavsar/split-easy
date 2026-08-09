import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

const INVITE_SEGMENT = 'join';

export function generateInviteCode(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function buildInviteUrl(inviteCode: string): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/${INVITE_SEGMENT}/${inviteCode}`;
  }
  return Linking.createURL(`${INVITE_SEGMENT}/${inviteCode}`);
}

export function parseInviteCode(url: string): string | null {
  try {
    const { hostname, path } = Linking.parse(url);
    const segments = [hostname, path]
      .filter(Boolean)
      .join('/')
      .split('/')
      .filter(Boolean);
    const idx = segments.indexOf(INVITE_SEGMENT);
    if (idx === -1 || idx === segments.length - 1) return null;
    return segments[idx + 1];
  } catch {
    return null;
  }
}
