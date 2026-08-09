import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import EmptyState from '../../ui/EmptyState';
import LoadingState from '../../ui/LoadingState';
import { Avatar } from '../../ui/Avatar';
import { listenGroupSettlements } from '../../services/balanceService';
import { Settlement } from '../../types/settlement';
import { UserProfile } from '../../types/user';
import { getUsersByIds } from '../../services/userService';
import { formatExpenseDate } from '../../utils/date';
import { useAppTheme } from '../../theme';
import { useSwipeBack } from '../../hooks/useSwipeBack';

type Props = {
  groupId: string;
  currency: string;
  onBack: () => void;
};

export default function SettlementHistoryScreen({ groupId, currency, onBack }: Props) {
  const theme = useAppTheme();
  const swipeBack = useSwipeBack(onBack);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = listenGroupSettlements(groupId, (items) => {
      setSettlements(items);
      setLoading(false);
    });
    return unsub;
  }, [groupId]);

  useEffect(() => {
    const ids = new Set<string>();
    settlements.forEach((s) => { ids.add(s.paidBy); ids.add(s.paidTo); });
    if (!ids.size) return;
    getUsersByIds(Array.from(ids)).then((users) => {
      const map: Record<string, UserProfile> = {};
      users.forEach((u) => (map[u.id] = u));
      setProfiles(map);
    });
  }, [settlements]);

  const totalAmount = settlements.reduce((sum, s) => sum + (s.amountInBase ?? s.amount), 0);

  const handleRefresh = async () => {
    const ids = new Set<string>();
    settlements.forEach((s) => { ids.add(s.paidBy); ids.add(s.paidTo); });
    if (!ids.size) return;
    setRefreshing(true);
    try {
      const users = await getUsersByIds(Array.from(ids));
      const map: Record<string, UserProfile> = {};
      users.forEach((u) => (map[u.id] = u));
      setProfiles(map);
    } catch { /* ignore */ }
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]} {...swipeBack}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        <View style={styles.header}>
          <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={onBack} hitSlop={4}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settlements</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <LoadingState />
      ) : settlements.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No settlements yet"
          subtitle="Start settling up to see history here."
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} colors={[theme.primary]} />
          }
        >
          {/* Summary card */}
          {settlements.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>TOTAL SETTLED</Text>
              <Text style={[styles.summaryAmount, { color: theme.successText }]}>
                {currency} {totalAmount.toFixed(0)}
              </Text>
              <Text style={[styles.summaryNote, { color: theme.textSec }]}>
                {settlements.length} settlement{settlements.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Settlement rows */}
          <View style={[styles.cardNoPad, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {settlements.map((item, idx) => {
              const payer = profiles[item.paidBy];
              const payee = profiles[item.paidTo];
              const displayAmount = item.originalAmount ?? item.amount;
              const displayCurrency = item.originalCurrency ?? currency;
              const payerName = payer?.displayName || payer?.email || 'Someone';
              const payeeName = payee?.displayName || payee?.email || 'someone';

              return (
                <React.Fragment key={item.id}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: theme.divider, marginLeft: 62 }]} />}
                  <View style={styles.settlementRow}>
                    <Avatar id={item.paidBy} name={payerName} size={40} />
                    <View style={styles.settlementInfo}>
                      <Text style={[styles.settlementTitle, { color: theme.text }]} numberOfLines={1}>
                        {payerName} paid {payeeName}
                      </Text>
                      <Text style={[styles.settlementSub, { color: theme.textSec }]}>
                        {item.method} · {formatExpenseDate(item.settledAt || item.createdAt)}
                      </Text>
                    </View>
                    <Text style={[styles.settlementAmount, { color: theme.successText }]}>
                      {displayCurrency} {displayAmount.toFixed(0)}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
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
    letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.6, marginBottom: 2,
  },
  summaryNote: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  divider: { height: StyleSheet.hairlineWidth },
  settlementRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  settlementInfo: { flex: 1, minWidth: 0 },
  settlementTitle: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  settlementSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  settlementAmount: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
