import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TextField from '../../ui/TextField';
import ConfirmDialog from '../../ui/ConfirmDialog';
import LoadingState from '../../ui/LoadingState';
import PrimaryButton from '../../ui/PrimaryButton';
import SecondaryButton from '../../ui/SecondaryButton';
import { Avatar } from '../../ui/Avatar';
import { subscribeToGroup, addMemberByEmail, addMemberById, removeMember } from '../../services/groupService';
import { Group } from '../../types/group';
import { UserProfile } from '../../types/user';
import { getUsersByIds, createGuestUser } from '../../services/userService';
import { isAdmin, canRemoveAdmin } from '../../utils/permissions';
import { useAppTheme } from '../../theme';
import { useSwipeBack } from '../../hooks/useSwipeBack';

type Props = {
  groupId: string;
  userId: string;
  onBack: () => void;
};

export default function MembersScreen({ groupId, userId, onBack }: Props) {
  const theme = useAppTheme();
  const swipeBack = useSwipeBack(onBack);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestBusy, setGuestBusy] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = subscribeToGroup(
      groupId,
      (g) => { setGroup(g); setLoading(false); },
      () => setLoading(false),
    );
    return unsub;
  }, [groupId]);

  useEffect(() => {
    const loadProfiles = async () => {
      if (!group?.members?.length) { setProfiles({}); setProfilesLoading(false); return; }
      setProfilesLoading(true);
      try {
        const users = await getUsersByIds(group.members);
        const map: Record<string, UserProfile> = {};
        users.forEach((u) => (map[u.id] = u));
        setProfiles(map);
      } finally {
        setProfilesLoading(false);
      }
    };
    loadProfiles();
  }, [group?.members]);

  const adminUser = group ? isAdmin(group, userId) : false;

  const handleAdd = async () => {
    if (!email.trim()) { setError('Enter an email to add'); return; }
    setBusy(true); setError('');
    try {
      await addMemberByEmail(groupId, email.trim());
      setEmail('');
    } catch (e: any) {
      setError(e?.message || 'Could not add member');
    } finally {
      setBusy(false);
    }
  };

  const handleAddGuest = async () => {
    if (!guestName.trim()) return;
    setGuestBusy(true); setError('');
    try {
      const guest = await createGuestUser(guestName.trim());
      await addMemberById(groupId, guest.id);
      setGuestName('');
    } catch (e: any) {
      setError(e?.message || 'Could not add guest');
    } finally {
      setGuestBusy(false);
    }
  };

  const requestRemove = (id: string) => {
    if (!group) return;
    if (!canRemoveAdmin(group, id)) { setError('Cannot remove the last admin'); return; }
    setConfirmTarget(id);
    setConfirmVisible(true);
  };

  const confirmRemove = async () => {
    if (!confirmTarget) return;
    setBusy(true); setError('');
    try {
      await removeMember(groupId, confirmTarget);
    } catch (e: any) {
      setError(e?.message || 'Could not remove member');
    } finally {
      setBusy(false);
      setConfirmTarget(null);
      setConfirmVisible(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]} {...swipeBack}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        <View style={styles.header}>
          <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={onBack} hitSlop={4}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Members</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Members list card */}
        <View style={[styles.card, styles.cardNoPad, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {loading || profilesLoading ? (
            <View style={{ padding: 20 }}>
              <LoadingState text="Loading members..." />
            </View>
          ) : (
            (group?.members || []).map((memberId, idx) => {
              const profile = profiles[memberId];
              const displayName = profile?.displayName || profile?.email || '…';
              const memberEmail = profile?.email || '';
              const memberIsAdmin = group ? isAdmin(group, memberId) : false;
              const isYou = memberId === userId;
              const canRemove = adminUser && !isYou;
              return (
                <React.Fragment key={memberId}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: theme.divider, marginLeft: 68 }]} />}
                  <View style={styles.memberRow}>
                    <Avatar id={memberId} name={profile?.displayName || profile?.email || '?'} size={40} />
                    <View style={styles.memberInfo}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
                          {displayName}{isYou ? ' (you)' : ''}
                        </Text>
                        {memberIsAdmin && (
                          <View style={[styles.adminBadge, { backgroundColor: theme.primarySoft }]}>
                            <Text style={[styles.adminText, { color: theme.primary }]}>ADMIN</Text>
                          </View>
                        )}
                        {profile?.isGuest && (
                          <View style={[styles.guestBadge, { backgroundColor: theme.cardAlt }]}>
                            <Text style={[styles.guestText, { color: theme.textMuted }]}>GUEST</Text>
                          </View>
                        )}
                      </View>
                      {memberEmail ? (
                        <Text style={[styles.memberEmail, { color: theme.textSec }]} numberOfLines={1}>
                          {memberEmail}
                        </Text>
                      ) : null}
                    </View>
                    {canRemove && (
                      <Pressable
                        onPress={() => requestRemove(memberId)}
                        style={[styles.removeBtn, { backgroundColor: theme.cardAlt }]}
                        hitSlop={4}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.error} />
                      </Pressable>
                    )}
                  </View>
                </React.Fragment>
              );
            })
          )}
        </View>

        {/* Add member card */}
        {adminUser && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>ADD MEMBER</Text>
            <View style={styles.addFields}>
              <TextField
                label="Email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="member@email.com"
              />
              <PrimaryButton onPress={handleAdd} loading={busy} disabled={busy || !email.trim()} full size="md">
                Add by email
              </PrimaryButton>
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: theme.divider }]} />

            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>ADD BY NAME</Text>
            <View style={styles.addFields}>
              <TextField
                label="Display name"
                value={guestName}
                onChangeText={setGuestName}
                placeholder="e.g. Rohan"
              />
              <PrimaryButton onPress={handleAddGuest} loading={guestBusy} disabled={guestBusy || !guestName.trim()} full size="md">
                Add by name
              </PrimaryButton>
            </View>
            <View style={[styles.guestNote, { backgroundColor: theme.cardAlt }]}>
              <MaterialCommunityIcons name="information-outline" size={14} color={theme.textMuted} />
              <Text style={[styles.guestNoteText, { color: theme.textSec }]}>
                Guest members can't log in. Only you can record expenses on their behalf.
              </Text>
            </View>

            {/* Invite link row */}
            <View style={[styles.inviteRow, { backgroundColor: theme.cardAlt, borderRadius: 10 }]}>
              <Text style={styles.inviteIcon}>🔗</Text>
              <View style={styles.inviteInfo}>
                <Text style={[styles.inviteTitle, { color: theme.text }]}>Invite link</Text>
                <Text style={[styles.inviteLink, { color: theme.textSec }]} numberOfLines={1}>
                  spliteasy.app/invite/{groupId.slice(0, 8)}
                </Text>
              </View>
              <SecondaryButton variant="soft" size="sm">Copy</SecondaryButton>
            </View>
          </View>
        )}

        {error ? (
          <Text style={[styles.errorText, { color: theme.errorText }]}>{error}</Text>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title="Remove member"
        message="Are you sure you want to remove this member?"
        confirmLabel="Remove"
        danger
        onCancel={() => { setConfirmVisible(false); setConfirmTarget(null); }}
        onConfirm={confirmRemove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  scroll: { padding: 16, gap: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardNoPad: { padding: 0, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  memberInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  memberName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.1 },
  adminBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999,
  },
  adminText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.4 },
  memberEmail: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  removeBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 12, fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.6, marginBottom: 12,
  },
  addFields: { gap: 10, marginBottom: 14 },
  inviteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12,
  },
  inviteIcon: { fontSize: 18 },
  inviteInfo: { flex: 1, minWidth: 0 },
  inviteTitle: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  inviteLink: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  errorText: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  sectionDivider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  guestBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  guestText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.4 },
  guestNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 10, padding: 10, marginTop: 4, marginBottom: 4,
  },
  guestNoteText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
});
