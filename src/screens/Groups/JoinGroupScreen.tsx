import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { User } from 'firebase/auth';
import { Group } from '../../types/group';
import { getGroupByInviteCode, joinGroupByInviteCode } from '../../services/groupService';
import { useAppTheme } from '../../theme';
import PrimaryButton from '../../ui/PrimaryButton';
import LoadingState from '../../ui/LoadingState';
import EmptyState from '../../ui/EmptyState';
import { AvatarStack } from '../../ui/Avatar';

type Props = {
  inviteCode: string;
  user: User;
  onJoined: (group: Group) => void;
  onDismiss: () => void;
};

export default function JoinGroupScreen({ inviteCode, user, onJoined, onDismiss }: Props) {
  const theme = useAppTheme();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getGroupByInviteCode(inviteCode)
      .then((g) => {
        if (cancelled) return;
        if (!g) { setError('This invite link is invalid or has expired'); return; }
        if (g.members.includes(user.uid)) { onJoined(g); return; }
        setGroup(g);
      })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Could not load this invite'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode, user.uid]);

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      const joined = await joinGroupByInviteCode(inviteCode, user.uid);
      onJoined(joined);
    } catch (e: any) {
      setError(e?.message || 'Could not join this group');
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.bg, zIndex: 200 }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg, flex: 1 }}>
        <View style={styles.header}>
          <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={onDismiss} hitSlop={4}>
            <MaterialCommunityIcons name="close" size={20} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          {loading ? (
            <LoadingState text="Loading invite..." />
          ) : error ? (
            <EmptyState icon="⚠" title={error} action={{ label: 'Dismiss', onPress: onDismiss }} />
          ) : group ? (
            <View style={styles.card}>
              <Text style={styles.emoji}>🎉</Text>
              <Text style={[styles.title, { color: theme.textSec }]}>You're invited to join</Text>
              <Text style={[styles.groupName, { color: theme.text }]}>{group.name}</Text>
              <View style={styles.avatarWrap}>
                <AvatarStack
                  ids={group.members}
                  names={group.members.map(() => '')}
                  size={32}
                  max={5}
                  overlap={10}
                />
              </View>
              <Text style={[styles.memberCount, { color: theme.textSec }]}>
                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
              </Text>
              {error ? (
                <Text style={[styles.errorText, { color: theme.errorText }]}>{error}</Text>
              ) : null}
              <PrimaryButton onPress={handleJoin} loading={joining} disabled={joining} full size="lg" style={{ marginTop: 24 }}>
                Join group
              </PrimaryButton>
              <Pressable onPress={onDismiss} style={styles.notNow} hitSlop={8}>
                <Text style={[styles.notNowText, { color: theme.textSec }]}>Not now</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  card: { alignItems: 'center' },
  emoji: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  groupName: {
    fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.6,
    marginTop: 4, textAlign: 'center',
  },
  avatarWrap: { marginTop: 18 },
  memberCount: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 8 },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 14, textAlign: 'center' },
  notNow: { marginTop: 14, paddingVertical: 6 },
  notNowText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
