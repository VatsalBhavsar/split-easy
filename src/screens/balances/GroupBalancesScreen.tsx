import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import EmptyState from '../../ui/EmptyState';
import LoadingState from '../../ui/LoadingState';
import PrimaryButton from '../../ui/PrimaryButton';
import SecondaryButton from '../../ui/SecondaryButton';
import { Avatar } from '../../ui/Avatar';
import { GroupBalance, SimplifiedDebt } from '../../types/balance';
import {
  listenGroupBalances,
  listenSimplifiedDebts,
  listenGroupSettlements,
} from '../../services/balanceService';
import { getUsersByIds } from '../../services/userService';
import { UserProfile } from '../../types/user';
import { Settlement } from '../../types/settlement';
import { useAppTheme } from '../../theme';
import { useSwipeBack } from '../../hooks/useSwipeBack';

type Props = {
  groupId: string;
  currentUserId: string;
  currency: string;
  onBack: () => void;
  onSettle: (edge?: SimplifiedDebt) => void;
  onViewHistory: () => void;
};

export default function GroupBalancesScreen({
  groupId,
  currentUserId,
  currency,
  onBack,
  onSettle,
  onViewHistory,
}: Props) {
  const theme = useAppTheme();
  const swipeBack = useSwipeBack(onBack);
  const [balances, setBalances] = useState<GroupBalance[]>([]);
  const [debts, setDebts] = useState<SimplifiedDebt[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [loadingDebts, setLoadingDebts] = useState(true);

  useEffect(() => {
    const unsubBalances = listenGroupBalances(groupId, (items) => {
      setBalances(items); setLoadingBalances(false);
    });
    const unsubDebts = listenSimplifiedDebts(groupId, (items) => {
      setDebts(items); setLoadingDebts(false);
    });
    const unsubSettle = listenGroupSettlements(groupId, (items) => {
      setSettlements(items);
    });
    return () => { unsubBalances(); unsubDebts(); unsubSettle(); };
  }, [groupId]);

  useEffect(() => {
    const ids = new Set<string>();
    balances.forEach((b) => ids.add(b.userId));
    debts.forEach((d) => { ids.add(d.fromUserId); ids.add(d.toUserId); });
    settlements.forEach((s) => { ids.add(s.paidBy); ids.add(s.paidTo); });
    if (ids.size === 0) return;
    getUsersByIds(Array.from(ids)).then((users) => {
      const map: Record<string, UserProfile> = {};
      users.forEach((u) => (map[u.id] = u));
      setProfiles(map);
    });
  }, [balances, debts, settlements]);

  const myBalance = balances.find((b) => b.userId === currentUserId)?.netBalance || 0;
  const summaryLabel =
    myBalance > 0 ? 'You are owed across this group'
    : myBalance < 0 ? 'You owe across this group'
    : 'Nothing to settle';
  const summaryColor =
    myBalance > 0 ? theme.successText : myBalance < 0 ? theme.errorText : theme.text;

  const debtItems = useMemo(() => debts.filter((d) => d.amount > 0.009), [debts]);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]} {...swipeBack}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        <View style={styles.header}>
          <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={onBack} hitSlop={4}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Balances</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
            SIMPLIFIED DEBTS ({currency})
          </Text>
          <Text style={[styles.summaryAmount, { color: summaryColor }]}>
            {myBalance === 0
              ? 'Settled up'
              : `${myBalance > 0 ? '+' : '−'}${currency} ${Math.abs(myBalance).toFixed(2)}`}
          </Text>
          <Text style={[styles.summaryNote, { color: theme.textSec }]}>{summaryLabel}</Text>
        </View>

        {/* Debt edges */}
        {loadingBalances || loadingDebts ? (
          <LoadingState />
        ) : debtItems.length === 0 ? (
          <EmptyState
            icon={<MaterialCommunityIcons name="check-circle-outline" size={32} color={theme.success} />}
            title="All settled"
            subtitle="No outstanding debts in this group."
          />
        ) : (
          <>
            <Text style={[styles.edgesLabel, { color: theme.textMuted }]}>DEBT EDGES</Text>
            <View style={[styles.cardNoPad, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {debtItems.map((item, idx) => {
                const from = profiles[item.fromUserId];
                const to = profiles[item.toUserId];
                const meFrom = item.fromUserId === currentUserId;
                const meTo = item.toUserId === currentUserId;
                const otherUser = meFrom ? to : from;
                const otherId = meFrom ? item.toUserId : item.fromUserId;
                const otherName = otherUser?.displayName || otherUser?.email || 'Someone';
                const fromName = from?.displayName || from?.email || 'Someone';
                let title = `${fromName} owes ${to?.displayName || to?.email || 'Someone'}`;
                if (meFrom) title = `You owe ${otherName.split(' ')[0]}`;
                if (meTo) title = `${fromName.split(' ')[0]} owes you`;
                const amountColor = meFrom ? theme.errorText : meTo ? theme.successText : theme.text;

                return (
                  <React.Fragment key={`${item.fromUserId}_${item.toUserId}`}>
                    {idx > 0 && <View style={[styles.divider, { backgroundColor: theme.divider, marginLeft: 62 }]} />}
                    <View style={styles.debtRow}>
                      <Avatar id={otherId} name={otherName} size={40} />
                      <View style={styles.debtInfo}>
                        <Text style={[styles.debtTitle, { color: theme.text }]}>{title}</Text>
                        <Text style={[styles.debtEmail, { color: theme.textSec }]}>
                          {otherUser?.email || ''}
                        </Text>
                      </View>
                      <View style={styles.debtRight}>
                        <Text style={[styles.debtAmount, { color: amountColor }]}>
                          {currency} {item.amount.toFixed(0)}
                        </Text>
                        <Pressable onPress={() => onSettle(item)} hitSlop={4}>
                          <Text style={[styles.settleLink, { color: theme.primary }]}>Settle up</Text>
                        </Pressable>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <PrimaryButton onPress={() => onSettle()} full size="lg">
            Settle up
          </PrimaryButton>
          <SecondaryButton onPress={onViewHistory} variant="outlined" full size="lg">
            View settlement history
          </SecondaryButton>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  scroll: { padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 18 },
  cardNoPad: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32, fontFamily: 'Inter_700Bold', letterSpacing: -0.8,
    lineHeight: 36, marginBottom: 4,
  },
  summaryNote: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  edgesLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.7, textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  divider: { height: StyleSheet.hairlineWidth },
  debtRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  debtInfo: { flex: 1, minWidth: 0 },
  debtTitle: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  debtEmail: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  debtRight: { alignItems: 'flex-end' },
  debtAmount: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  settleLink: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  actions: { gap: 10 },
});
