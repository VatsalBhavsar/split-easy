import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Group } from '../../types/group';
import { subscribeToUserGroups } from '../../services/groupService';
import { listenUserBalance } from '../../services/balanceService';
import { getUsersByIds } from '../../services/userService';
import EmptyState from '../../ui/EmptyState';
import LoadingState from '../../ui/LoadingState';
import FAB from '../../ui/FAB';
import FilterChip from '../../ui/FilterChip';
import CurrencyBadge from '../../ui/CurrencyBadge';
import { AvatarStack } from '../../ui/Avatar';
import { useAppTheme } from '../../theme';
import { getInitials } from '../../theme/colors';

type Props = {
  userId: string;
  onCreate: () => void;
  onSelect: (group: Group) => void;
  onBack: () => void;
};

const FILTERS = ['All', 'Active', 'Settled', 'Owed', 'Owe', 'My groups'];

export default function GroupsListScreen({ userId, onCreate, onSelect, onBack }: Props) {
  const theme = useAppTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [balanceMap, setBalanceMap] = useState<Record<string, number>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = subscribeToUserGroups(
      userId,
      (items) => { setGroups(items); setLoading(false); },
      (err) => { setError(err?.message || 'Could not load groups'); setLoading(false); },
    );
    return unsub;
  }, [userId]);

  useEffect(() => {
    if (groups.length === 0) return;
    const unsubs = groups.map(g =>
      listenUserBalance(g.id, userId, balance =>
        setBalanceMap(prev => ({ ...prev, [g.id]: balance }))
      )
    );
    return () => unsubs.forEach(u => u());
  }, [groups, userId]);

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

  const filtered = groups.filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    const bal = balanceMap[g.id] ?? 0;
    switch (activeFilter) {
      case 'Active':    return Math.abs(bal) > 0.001;
      case 'Settled':   return Math.abs(bal) <= 0.001;
      case 'Owed':      return bal > 0.001;
      case 'Owe':       return bal < -0.001;
      case 'My groups': return g.createdBy === userId;
      default:          return true;
    }
  });

  const subtitle = activeFilter === 'All'
    ? `${groups.length} group${groups.length !== 1 ? 's' : ''}`
    : `${filtered.length} of ${groups.length}`;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const ids = new Set<string>();
      groups.forEach(g => g.members.forEach(id => ids.add(id)));
      if (ids.size) {
        const users = await getUsersByIds(Array.from(ids));
        const map: Record<string, string> = {};
        users.forEach(u => { map[u.id] = u.displayName || u.email || ''; });
        setProfilesMap(map);
      }
    } catch { /* ignore */ }
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        {/* Large header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Groups</Text>
            <Text style={[styles.subtitle, { color: theme.textSec }]}>{subtitle}</Text>
          </View>
          <Pressable style={[styles.addIconBtn, { backgroundColor: theme.cardAlt }]} onPress={onCreate}>
            <MaterialCommunityIcons name="plus" size={22} color={theme.text} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <MaterialCommunityIcons name="magnify" size={18} color={theme.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search groups…"
          placeholderTextColor={theme.placeholder}
          style={[styles.searchInput, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
        />
      </View>

      {/* Filter chips */}
      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {FILTERS.map(f => (
            <FilterChip key={f} label={f} active={activeFilter === f} onPress={() => setActiveFilter(f)} />
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <LoadingState text="Loading groups..." />
      ) : error ? (
        <EmptyState icon="⚠" title={error} action={{ label: 'Go back', onPress: onBack }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🏖"
          title={groups.length === 0 ? 'No groups yet' : 'No groups match'}
          subtitle={groups.length === 0 ? 'Create your first group to start splitting expenses with friends.' : 'Try a different filter or search term.'}
          action={groups.length === 0 ? { label: 'Create group', onPress: onCreate } : undefined}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} colors={[theme.primary]} />
          }
        >
          {filtered.map(g => (
            <GroupCard
              key={g.id}
              group={g}
              theme={theme}
              onPress={() => onSelect(g)}
              isOwner={g.createdBy === userId}
              profilesMap={profilesMap}
            />
          ))}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      <FAB onPress={onCreate} label="New group" icon="+" />
    </View>
  );
}

function GroupCard({ group, theme, onPress, isOwner, profilesMap }: { group: Group; theme: any; onPress: () => void; isOwner: boolean; profilesMap: Record<string, string> }) {
  const currency = group.baseCurrency || group.currency || 'USD';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.groupCard,
        { backgroundColor: theme.card, borderColor: theme.border, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={[theme.gradFrom, theme.gradTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.groupIcon}
      >
        <Text style={styles.groupInitials}>{getInitials(group.name)}</Text>
      </LinearGradient>
      <View style={styles.groupInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.groupName, { color: theme.text }]} numberOfLines={1}>{group.name}</Text>
          {isOwner && (
            <View style={[styles.ownerBadge, { backgroundColor: theme.primarySoft }]}>
              <MaterialCommunityIcons name="crown-outline" size={10} color={theme.primary} />
            </View>
          )}
          <CurrencyBadge code={currency} />
        </View>
        <View style={styles.metaRow}>
          <AvatarStack ids={group.members} names={group.members.map(id => profilesMap[id] || '')} size={20} max={3} overlap={6} />
          <Text style={[styles.memberCount, { color: theme.textSec }]}>{group.members.length} members</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  title: { fontSize: 32, fontFamily: 'Inter_700Bold', letterSpacing: -1, lineHeight: 36 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4 },
  addIconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular', paddingVertical: 10 },
  filtersRow: { paddingBottom: 8 },
  filtersContent: { paddingHorizontal: 16, gap: 8 },
  listContent: { paddingHorizontal: 16, gap: 10, paddingTop: 6 },
  groupCard: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  groupIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  groupInitials: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.5 },
  groupInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.2, flex: 1 },
  ownerBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  memberCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
