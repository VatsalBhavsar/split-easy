import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { User } from 'firebase/auth';
import { signOut } from '../../auth/authService';
import SettingsScreen from '../Settings/SettingsScreen';
import SecondaryButton from '../../ui/SecondaryButton';
import { Avatar } from '../../ui/Avatar';
import { useAppTheme } from '../../theme';

type Props = {
  user: User;
};

export default function ProfileScreen({ user }: Props) {
  const theme = useAppTheme();
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) {
    return <SettingsScreen onClose={() => setShowSettings(false)} />;
  }

  const displayName = user.displayName || 'Profile';

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.profileRow}>
            <Avatar id={user.uid} name={displayName} size={64} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.textSec }]} numberOfLines={1}>
                {user.email || ''}
              </Text>
              {!user.emailVerified && (
                <View style={[styles.unverifiedBadge, { backgroundColor: theme.warningSoft }]}>
                  <Text style={[styles.unverifiedText, { color: theme.warningText }]}>
                    ● Email unverified
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.profileActions}>
            <SecondaryButton variant="outlined" size="sm" style={styles.flex1}>
              Edit profile
            </SecondaryButton>
            <SecondaryButton variant="outlined" size="sm" style={styles.flex1}>
              Share invite
            </SecondaryButton>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.textSec }]}>Groups</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>—</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.textSec }]}>Settled</Text>
            <Text style={[styles.statValue, { color: theme.successText }]}>—</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.textSec }]}>Open</Text>
            <Text style={[styles.statValue, { color: theme.primary }]}>—</Text>
          </View>
        </View>

        {/* Menu card */}
        <View style={[styles.cardNoPad, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MenuRow
            icon="⚙"
            title="Settings"
            subtitle="Appearance · Notifications · Privacy"
            theme={theme}
            onPress={() => setShowSettings(true)}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider, marginLeft: 62 }]} />
          <MenuRow
            icon="🌐"
            title="Currency preferences"
            subtitle="Default INR · Live ECB rates"
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider, marginLeft: 62 }]} />
          <MenuRow
            icon="🔐"
            title="Security"
            subtitle="Password · Two-factor"
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider, marginLeft: 62 }]} />
          <MenuRow
            icon="❔"
            title="Help & feedback"
            theme={theme}
          />
        </View>

        {/* Sign out */}
        <SecondaryButton onPress={() => signOut()} variant="outlined" full size="lg" danger>
          Sign out
        </SecondaryButton>

        <Text style={[styles.version, { color: theme.textMuted }]}>
          SplitEasy · build 2026.05
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MenuRow({
  icon, title, subtitle, theme, onPress,
}: { icon: string; title: string; subtitle?: string; theme: any; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: theme.cardAlt }]}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>
      <View style={styles.menuInfo}>
        <Text style={[styles.menuTitle, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.menuSub, { color: theme.textSec }]}>{subtitle}</Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  headerTitle: { fontSize: 32, fontFamily: 'Inter_700Bold', letterSpacing: -1, lineHeight: 36 },
  scroll: { padding: 16, gap: 14, paddingBottom: 24 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardNoPad: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  profileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 14 },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: { fontSize: 19, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  profileEmail: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  unverifiedBadge: {
    marginTop: 8, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  unverifiedText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  profileActions: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, borderRadius: 14, borderWidth: 1, padding: 14,
  },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', letterSpacing: -0.1 },
  statValue: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, marginTop: 4 },
  divider: { height: StyleSheet.hairlineWidth },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  menuIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuIconText: { fontSize: 16 },
  menuInfo: { flex: 1, minWidth: 0 },
  menuTitle: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  menuSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  version: {
    textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular',
    letterSpacing: 0.2, marginTop: -4,
  },
});
