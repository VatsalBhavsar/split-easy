import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, View, Text, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signIn, signUp } from '../../auth/authService';
import { signInWithGoogle } from '../../auth/googleAuth';
import Screen from '../../ui/Screen';
import PrimaryButton from '../../ui/PrimaryButton';
import SecondaryButton from '../../ui/SecondaryButton';
import TextField from '../../ui/TextField';
import SegmentedControl from '../../ui/SegmentedControl';
import Logo from '../../ui/Logo';
import { useAppTheme } from '../../theme';

export default function AuthScreen() {
  const theme = useAppTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) { setError('Email and password are required'); return; }
    if (mode === 'signup' && confirm && confirm !== password) { setError('Passwords do not match'); return; }
    setLoading(true); setError(''); setInfo('');
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password);
        setInfo('Account created. Check your inbox to verify your email.');
      } else {
        await signIn(email.trim(), password);
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: theme.bg }]} keyboardShouldPersistTaps="handled">
          <View style={styles.inner}>

            {/* Logo + wordmark */}
            <View style={styles.logoBlock}>
              <Logo size={56} />
              <View style={{ marginTop: 14, alignItems: 'center' }}>
                <Text style={[styles.appName, { color: theme.text }]}>SplitEasy</Text>
                <Text style={[styles.tagline, { color: theme.textSec }]}>Split expenses. Stay friends.</Text>
              </View>
            </View>

            {/* Verification info banner */}
            {info ? (
              <View style={[styles.banner, { backgroundColor: theme.warningSoft }]}>
                <View style={[styles.bannerIcon, { backgroundColor: theme.warning }]}>
                  <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' }}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bannerTitle, { color: theme.text }]}>Check your inbox</Text>
                  <Text style={[styles.bannerBody, { color: theme.textSec }]}>{info}</Text>
                </View>
              </View>
            ) : null}

            {/* Mode segmented */}
            <SegmentedControl
              value={mode}
              onValueChange={v => { setMode(v as 'signin' | 'signup'); setError(''); setInfo(''); }}
              buttons={[{ value: 'signin', label: 'Sign in' }, { value: 'signup', label: 'Create account' }]}
              style={styles.segmented}
            />

            {/* Fields */}
            <View style={styles.fields}>
              <TextField
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                returnKeyType="next"
              />
              <TextField
                label="Password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                returnKeyType={mode === 'signup' ? 'next' : 'done'}
                onSubmitEditing={mode === 'signup' ? undefined : handleSubmit}
                suffix={
                  <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.textMuted}
                    />
                  </Pressable>
                }
              />
              {mode === 'signup' && (
                <TextField
                  label="Confirm password"
                  secureTextEntry
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="••••••••"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              )}
            </View>

            {mode === 'signin' && (
              <Pressable style={styles.forgotWrap}>
                <Text style={[styles.forgot, { color: theme.primary }]}>Forgot password?</Text>
              </Pressable>
            )}

            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.errorSoft }]}>
                <Text style={[styles.errorText, { color: theme.errorText }]}>{error}</Text>
              </View>
            ) : null}

            <PrimaryButton onPress={handleSubmit} loading={loading} full style={styles.cta}>
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </PrimaryButton>

            {/* Or divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.divLine, { backgroundColor: theme.divider }]} />
              <Text style={[styles.divLabel, { color: theme.textMuted }]}>or</Text>
              <View style={[styles.divLine, { backgroundColor: theme.divider }]} />
            </View>

            {/* Google */}
            <SecondaryButton
              variant="outlined"
              full
              size="lg"
              onPress={async () => {
                setGoogleLoading(true);
                try { await signInWithGoogle(); } catch {}
                setGoogleLoading(false);
              }}
              style={styles.googleBtn}
            >
              Continue with Google
            </SecondaryButton>

            {/* Toggle */}
            <Pressable onPress={switchMode} style={styles.switchWrap}>
              <Text style={[styles.switchText, { color: theme.textSec }]}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have one? '}
                <Text style={{ color: theme.primary, fontFamily: 'Inter_600SemiBold' }}>
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </Text>
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.legal, { color: theme.textMuted }]}>
            By continuing you agree to our Terms & Privacy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 36 },
  inner: { flex: 1, maxWidth: 380, width: '100%', alignSelf: 'center', justifyContent: 'center' },
  logoBlock: { alignItems: 'center', marginBottom: 36 },
  appName: { fontSize: 32, fontFamily: 'Inter_700Bold', letterSpacing: -1.2 },
  tagline: { fontSize: 15, fontFamily: 'Inter_400Regular', marginTop: 6, letterSpacing: -0.1 },
  banner: {
    borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16,
  },
  bannerIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', lineHeight: 20 },
  bannerBody: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: 2 },
  segmented: { marginBottom: 18 },
  fields: { gap: 12 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: 10 },
  forgot: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  errorBanner: { borderRadius: 10, padding: 12, marginTop: 12 },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  cta: { marginTop: 20 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 14 },
  divLine: { flex: 1, height: 1 },
  divLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', letterSpacing: 0.4, textTransform: 'uppercase' },
  googleBtn: {},
  switchWrap: { alignItems: 'center', marginTop: 28, padding: 8 },
  switchText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  legal: { textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 24, letterSpacing: 0.2 },
});
