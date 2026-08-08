import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listenGroupExpenses } from '../../services/expenseService';
import { Expense } from '../../types/expense';
import { UserProfile } from '../../types/user';
import { getUsersByIds } from '../../services/userService';
import AppLayout from '../../ui/AppLayout';
import EmptyState from '../../ui/EmptyState';
import LoadingState from '../../ui/LoadingState';
import { formatCurrency } from '../../utils/money';
import { useAppTheme } from '../../theme';

type Props = {
  groupId: string;
  onBack: () => void;
  onAdd: () => void;
  onSelectExpense: (expense: Expense) => void;
};

export default function GroupExpensesScreen({ groupId, onBack, onAdd, onSelectExpense }: Props) {
  const theme = useAppTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    const unsub = listenGroupExpenses(
      groupId,
      async (items) => {
        setExpenses(items);
        setLoading(false);
        const ids = Array.from(new Set(items.map((e) => e.paidBy)));
        const users = await getUsersByIds(ids);
        const map: Record<string, UserProfile> = {};
        users.forEach((u) => (map[u.id] = u));
        setProfiles(map);
      },
      (err) => {
        setError(err?.message || 'Could not load expenses');
        setLoading(false);
      },
    );
    return unsub;
  }, [groupId]);

  const renderItem = ({ item }: { item: Expense }) => {
    const payer = profiles[item.paidBy];
    const payerName = payer?.displayName || payer?.email || 'Someone';
    const displayAmount = item.originalAmount ?? item.amount;
    const displayCurrency = item.originalCurrency ?? item.currency;
    const baseCurrency = item.baseCurrency ?? displayCurrency;
    const baseAmount = item.amountInBase;
    const splitLabel =
      item.splitType === 'EQUAL'
        ? 'Split equally'
        : item.splitType === 'AMOUNT'
        ? 'Custom amounts'
        : item.splitType === 'PERCENT'
        ? 'Percentage split'
        : 'Share split';
    const baseSuffix =
      baseAmount !== undefined && baseCurrency !== displayCurrency
        ? ` · ≈ ${formatCurrency(baseAmount, baseCurrency)}`
        : '';
    return (
      <Pressable
        onPress={() => onSelectExpense(item)}
        style={({ pressed }) => [
          styles.expenseCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Text style={[styles.expenseTitle, { color: theme.text }]} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={[styles.expenseSub, { color: theme.textMuted }]} numberOfLines={1}>
              {splitLabel} · Paid by {payerName}{baseSuffix}
            </Text>
          </View>
          <Text style={[styles.expenseAmount, { color: theme.textSec }]}>
            {displayCurrency} {displayAmount.toFixed(2)}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <AppLayout title="Expenses" onBack={onBack}>
      {loading ? (
        <LoadingState text="Loading expenses..." />
      ) : error ? (
        <EmptyState title={error} action={{ label: 'Go back', onPress: onBack }} />
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          subtitle="Start adding expenses with the plus button below."
          action={{ label: 'Add expense', onPress: onAdd }}
        />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
        ]}
        accessibilityLabel="Add expense"
      >
        <MaterialCommunityIcons name="plus" size={26} color={theme.onPrimary} />
      </Pressable>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 8,
  },
  expenseCard: {
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  cardLeft: {
    flex: 1,
    marginRight: 10,
  },
  expenseTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 2,
  },
  expenseSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  expenseAmount: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
