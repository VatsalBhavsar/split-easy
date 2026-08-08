// Install: expo install expo-auth-session expo-web-browser
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

function generateNonce() {
  return Math.random().toString(36).slice(2, 12);
}

export async function signInWithGoogle(): Promise<void> {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  // When using the Expo proxy (native), Google requires the Web client ID because the redirect is HTTPS.
  const useProxy = Platform.OS !== 'web';
  const clientId = useProxy ? webClientId : webClientId;

  if (!clientId || !webClientId) {
    Alert.alert('Google Sign-In', 'Missing Google client IDs. Check your environment configuration.');
    return;
  }

  try {
    const redirectUri = useProxy
      ? AuthSession.makeRedirectUri({ useProxy: true, projectNameForProxy: '@artinsubject/split-easy' } as any)
      : AuthSession.makeRedirectUri({ path: '--/auth/callback', preferLocalhost: true });

    console.log('Google redirectUri:', redirectUri);

    const request = new AuthSession.AuthRequest({
      clientId,
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      scopes: ['openid', 'profile', 'email'],
      usePKCE: false,
      prompt: AuthSession.Prompt.SelectAccount,
      extraParams: { nonce: generateNonce() },
    });

    await request.makeAuthUrlAsync(discovery);

    const result = await request.promptAsync(
      discovery,
      useProxy
        ? ({ useProxy: true, projectNameForProxy: '@artinsubject/split-easy', preferEphemeralSession: true } as any)
        : undefined,
    );

    if (__DEV__) {
      console.log('Google sign-in result type:', result.type);
      if ('url' in result) {
        console.log('Google sign-in result url:', (result as any).url);
      }
    }

    if (result.type === 'dismiss' || result.type === 'cancel') {
      return;
    }

    if (result.type !== 'success' || !('params' in result)) {
      const message = result.type === 'error' ? result.error?.message : undefined;
      Alert.alert('Google Sign-In', message || 'Could not authenticate with Google. Please try again.');
      return;
    }

    const idToken = result.params?.id_token;
    const accessToken = result.params?.access_token;

    if (__DEV__) {
      console.log('Google tokens -> idToken:', !!idToken, 'accessToken:', !!accessToken);
    }

    if (!idToken && !accessToken) {
      Alert.alert('Google Sign-In', 'No token returned from Google. Please try again.');
      return;
    }

    const credential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null);
    await signInWithCredential(auth, credential);
  } catch (e: any) {
    const message = e?.message || 'Unexpected error signing in with Google.';
    Alert.alert('Google Sign-In', message);
  }
}
