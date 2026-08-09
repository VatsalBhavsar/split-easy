import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, RefreshControl, ActivityIndicator } from 'react-native';
import { User } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { refreshUser } from '../../auth/authService';
import { subscribeHomeStats, HomeStats } from '../../services/homeStatsService';
import { subscribeToUserGroups } from '../../services/groupService';
import { Group } from '../../types/group';
import { useAppTheme } from '../../theme';
import { getInitials, avatarColors } from '../../theme/colors';
import { getUsersByIds } from '../../services/userService';
import Logo from '../../ui/Logo';
import { Avatar } from '../../ui/Avatar';
import BalanceChip from '../../ui/BalanceChip';
import CurrencyBadge from '../../ui/CurrencyBadge';
import { AvatarStack } from '../../ui/Avatar';

type Props = {
  user: User;
  onNewGroup: () => void;
  onOpenGroup: (group: Group) => void;
  onAddExpense: (group: Group) => void;
  onSettleUp: (group: Group) => void;
  onSeeAll: () => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
};

function getGreeting(name?: string | null) {
  const h = new Date().getHours();
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${time}, ${name.split(' ')[0]} 👋` : `${time} 👋`;
}

function formatAmountSingle(amounts: Record<string, number>): { amount: number; currency: string } {
  const entries = Object.entries(amounts).filter(([, v]) => Math.abs(v) > 0.009);
  if (!entries.length) return { amount: 0, currency: 'INR' };
  const sorted = entries.sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));
  return { amount: sorted[0][1], currency: sorted[0][0] };
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$',
};

function fmtMoney(amount: number, currency: string) {
  const sym = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return `${sym}${Math.round(Math.abs(amount)).toLocaleString('en-IN')}`;
}

export default function HomeScreen({ user, onNewGroup, onOpenGroup, onAddExpense, onSettleUp, onSeeAll, onOpenProfile, onOpenNotifications }: Props) {
  const theme = useAppTheme();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [groupPicker, setGroupPicker] = useState<'addExpense' | 'settle' | null>(null);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [statsRefreshing, setStatsRefreshing] = useState(false);

  useEffect(() => { setCurrentUser(user); }, [user]);

  useEffect(() => {
    const unsub = subscribeHomeStats(user.uid, s => setStats(s));
    return unsub;
  }, [user.uid]);

  useEffect(() => {
    const unsub = subscribeToUserGroups(user.uid, g => setGroups(g));
    return unsub;
  }, [user.uid]);

  useEffect(() => {
    if (groups.length === 0) return;
    const ids = new Set<string>();
    groups.forEach(g => g.members.forEach(id => ids.add(id)));
    getUsersByIds(Array.from(ids)).then(users => {
      const map: Record<string, string> = {};
      users.forEach(u => { map[u.id] = u.displayName || u.email || ''; });
      setProfilesMap(map);
    }).catch(() => {});
  }, [groups]);

  const owed = formatAmountSingle(stats?.owedByCurrency || {});
  const owe = formatAmountSingle(stats?.oweByCurrency || {});
  const netAmount = owed.amount - owe.amount;
  const netCurrency = owed.currency;

  const handleRefreshVerification = async () => {
    setRefreshing(true);
    try { const u = await refreshUser(); if (u) setCurrentUser(u); } catch {}
    setRefreshing(false);
  };

  const refreshProfiles = async () => {
    if (groups.length === 0) return;
    try {
      const ids = new Set<string>();
      groups.forEach(g => g.members.forEach(id => ids.add(id)));
      const users = await getUsersByIds(Array.from(ids));
      const map: Record<string, string> = {};
      users.forEach(u => { map[u.id] = u.displayName || u.email || ''; });
      setProfilesMap(map);
    } catch { /* ignore */ }
  };

  const handlePullRefresh = async () => {
    setPullRefreshing(true);
    await refreshProfiles();
    setPullRefreshing(false);
  };

  const handleStatsRefresh = async () => {
    if (statsRefreshing) return;
    setStatsRefreshing(true);
    await refreshProfiles();
    setStatsRefreshing(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Logo size={28} />
            <Text style={[styles.appName, { color: theme.text }]}>SplitEasy</Text>
          </View>
          <View style={styles.topRight}>
            <Pressable style={[styles.notifBtn, { backgroundColor: theme.cardAlt }]} onPress={onOpenNotifications}>
              <MaterialCommunityIcons name="bell-outline" size={20} color={theme.text} />
            </Pressable>
            <Pressable onPress={onOpenProfile}>
              <Avatar id={currentUser.uid} name={currentUser.displayName || currentUser.email || 'U'} size={36} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={pullRefreshing} onRefresh={handlePullRefresh} tintColor={theme.primary} colors={[theme.primary]} />
        }
      >
        {/* Greeting */}
        <View style={styles.greetingBlock}>
          <Text style={[styles.greetingSub, { color: theme.textSec }]}>
            {new Date().getHours() < 12 ? 'Good morning,' : new Date().getHours() < 17 ? 'Good afternoon,' : 'Good evening,'}
          </Text>
          <Text style={[styles.greetingName, { color: theme.text }]}>
            {currentUser.displayName?.split(' ')[0] || 'there'} 👋
          </Text>
        </View>

        {/* Hero balance card */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={[theme.gradFrom, theme.gradTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Decorative circles */}
            <View style={styles.heroDeco1} />
            <View style={styles.heroDeco2} />

            <Pressable
              onPress={handleStatsRefresh}
              disabled={statsRefreshing}
              hitSlop={8}
              style={styles.heroRefreshBtn}
            >
              {statsRefreshing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
              )}
            </Pressable>

            <Text style={styles.heroLabel}>Total balance</Text>
            <Text style={styles.heroAmount}>
              {netAmount >= 0 ? '+' : '−'}{fmtMoney(Math.abs(netAmount), netCurrency)}
            </Text>
            <Text style={styles.heroSub}>net across all groups</Text>

            <View style={styles.heroStats}>
              <View style={styles.heroStatBlock}>
                <View style={styles.heroStatHeader}>
                  <View style={[styles.heroDot, { backgroundColor: '#6EE7B7' }]} />
                  <Text style={styles.heroStatLabel}>You are owed</Text>
                </View>
                <Text style={styles.heroStatAmount}>{fmtMoney(owed.amount, owed.currency)}</Text>
                <Text style={styles.heroStatHint}>from {stats?.peopleWhoOweYou || 0} people</Text>
              </View>
              <View style={styles.heroStatBlock}>
                <View style={styles.heroStatHeader}>
                  <View style={[styles.heroDot, { backgroundColor: '#FDA4AF' }]} />
                  <Text style={styles.heroStatLabel}>You owe</Text>
                </View>
                <Text style={styles.heroStatAmount}>{fmtMoney(owe.amount, owe.currency)}</Text>
                <Text style={styles.heroStatHint}>to {stats?.peopleYouOwe || 0} people</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Email verify banner */}
        {!currentUser.emailVerified && (
          <View style={[styles.verifyBanner, { backgroundColor: theme.warningSoft }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.verifyTitle, { color: theme.text }]}>Verify your email</Text>
              <Text style={[styles.verifyBody, { color: theme.textSec }]}>
                Confirm your address to invite friends and unlock all groups.
              </Text>
            </View>
            <Pressable
              onPress={handleRefreshVerification}
              style={[styles.verifyBtn, { backgroundColor: theme.warningSoft, borderColor: theme.warning + '50', borderWidth: 1 }]}
            >
              <Text style={[styles.verifyBtnText, { color: theme.warningText }]}>
                {refreshing ? 'Checking…' : 'Refresh'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <QuickAction icon="plus" label="Add expense" theme={theme}
            onPress={() => groups.length > 0 ? setGroupPicker('addExpense') : onNewGroup()} />
          <QuickAction icon="scale-balance" label="Settle up" theme={theme}
            onPress={() => groups.length > 0 ? setGroupPicker('settle') : onNewGroup()} />
          <QuickAction icon="account-multiple-plus-outline" label="New group" theme={theme}
            onPress={onNewGroup} />
        </View>

        {/* Groups section */}
        {groups.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent groups</Text>
              <Pressable onPress={onSeeAll}>
                <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.groupList}>
              {[...groups]
                .sort((a, b) => {
                  const at = (a.updatedAt as any)?.seconds ?? (a.createdAt as any)?.seconds ?? 0;
                  const bt = (b.updatedAt as any)?.seconds ?? (b.createdAt as any)?.seconds ?? 0;
                  return bt - at;
                })
                .slice(0, 3)
                .map(g => (
                  <HomeGroupCard key={g.id} group={g} theme={theme} onPress={() => onOpenGroup(g)} isOwner={g.createdBy === user.uid} profilesMap={profilesMap} />
                ))}
            </View>
          </>
        )}

        {/* Empty groups prompt */}
        {groups.length === 0 && stats !== null && (
          <View style={[styles.emptyGroups, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ fontSize: 28 }}>🏖</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No groups yet</Text>
            <Text style={[styles.emptyBody, { color: theme.textSec }]}>Create a group to start splitting expenses with friends.</Text>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Group picker bottom sheet */}
      <Modal
        visible={groupPicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setGroupPicker(null)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setGroupPicker(null)}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: theme.card }]} onPress={() => {}}>
            <View style={[styles.pickerHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.pickerTitle, { color: theme.text }]}>
              {groupPicker === 'addExpense' ? 'Add expense to…' : 'Settle up in…'}
            </Text>
            {groups.map(g => (
              <Pressable
                key={g.id}
                style={[styles.pickerRow, { borderBottomColor: theme.divider }]}
                onPress={() => {
                  const action = groupPicker;
                  setGroupPicker(null);
                  if (action === 'addExpense') onAddExpense(g);
                  else if (action === 'settle') onSettleUp(g);
                }}
              >
                <LinearGradient
                  colors={[theme.gradFrom, theme.gradTo]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.pickerIcon}
                >
                  <Text style={styles.pickerInitials}>{getInitials(g.name)}</Text>
                </LinearGradient>
                <Text style={[styles.pickerGroupName, { color: theme.text }]} numberOfLines={1}>{g.name}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textMuted} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function QuickAction({ icon, label, theme, onPress }: { icon: string; label: string; theme: any; onPress?: () => void }) {
  return (
    <Pressable style={[styles.quickBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress}>
      <View style={[styles.quickIcon, { backgroundColor: theme.primarySoft }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={theme.primary} />
      </View>
      <Text style={[styles.quickLabel, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

function HomeGroupCard({ group, theme, onPress, isOwner, profilesMap }: { group: Group; theme: any; onPress?: () => void; isOwner: boolean; profilesMap: Record<string, string> }) {
  const currency = group.baseCurrency || group.currency || 'USD';
  const initials = getInitials(group.name);
  return (
    <Pressable style={[styles.groupCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress}>
      <LinearGradient
        colors={[theme.gradFrom, theme.gradTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.groupIcon}
      >
        <Text style={styles.groupInitials}>{initials}</Text>
      </LinearGradient>
      <View style={styles.groupInfo}>
        <View style={styles.groupNameRow}>
          <Text style={[styles.groupName, { color: theme.text }]} numberOfLines={1}>{group.name}</Text>
          {isOwner && (
            <View style={[styles.ownerBadge, { backgroundColor: theme.primarySoft }]}>
              <MaterialCommunityIcons name="crown-outline" size={10} color={theme.primary} />
            </View>
          )}
          <CurrencyBadge code={currency} />
        </View>
        <View style={styles.groupMeta}>
          <AvatarStack ids={group.members} names={group.members.map(id => profilesMap[id] || '')} size={20} max={3} overlap={6} />
          <Text style={[styles.groupMembers, { color: theme.textSec }]}>{group.members.length} members</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appName: { fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 24 },
  greetingBlock: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },
  greetingSub: { fontSize: 13, fontFamily: 'Inter_500Medium', letterSpacing: -0.1 },
  greetingName: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, marginTop: 2 },
  heroWrap: { paddingHorizontal: 16 },
  heroCard: {
    borderRadius: 22, padding: 22, overflow: 'hidden', position: 'relative',
  },
  heroDeco1: {
    position: 'absolute', top: -30, right: -30, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroDeco2: {
    position: 'absolute', bottom: -50, right: 30, width: 110, height: 110,
    borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroRefreshBtn: {
    position: 'absolute', top: 16, right: 16, zIndex: 1,
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroLabel: {
    fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  heroAmount: {
    fontSize: 40, fontFamily: 'Inter_700Bold', color: '#fff',
    letterSpacing: -1.5, marginTop: 6, lineHeight: 44,
  },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter_400Regular', marginTop: 2 },
  heroStats: { flexDirection: 'row', gap: 12, marginTop: 22 },
  heroStatBlock: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14,
    padding: 12,
  },
  heroStatHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroDot: { width: 8, height: 8, borderRadius: 4 },
  heroStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter_400Regular' },
  heroStatAmount: {
    fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff',
    letterSpacing: -0.6, marginTop: 4,
  },
  heroStatHint: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular', marginTop: 2 },
  verifyBanner: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  verifyTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  verifyBody: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 16 },
  verifyBtn: {
    height: 32, paddingHorizontal: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  verifyBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 18, marginBottom: 8 },
  quickBtn: {
    flex: 1, height: 72, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  quickIcon: {
    width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  seeAll: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  groupList: { paddingHorizontal: 16, gap: 10 },
  groupCard: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  groupIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  groupInitials: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.5 },
  groupInfo: { flex: 1, minWidth: 0 },
  groupNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.2, flex: 1 },
  ownerBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  groupMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  groupMembers: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  emptyGroups: {
    margin: 16, borderRadius: 16, borderWidth: 1, padding: 24,
    alignItems: 'center', gap: 8,
  },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  emptyBody: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  bottomPad: { height: 24 },
  pickerBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  pickerSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
  },
  pickerHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3, marginBottom: 12,
  },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  pickerInitials: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.4 },
  pickerGroupName: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
});
