import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Expense } from '../../types/expense';
import { UserProfile } from '../../types/user';
import SecondaryButton from '../../ui/SecondaryButton';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { Avatar } from '../../ui/Avatar';
import CurrencyBadge from '../../ui/CurrencyBadge';
import { formatExpenseDate } from '../../utils/date';
import { getExpenseIcon } from '../../utils/expenseIcon';
import { avatarColors } from '../../theme';
import { useAppTheme } from '../../theme';
import { useSwipeBack } from '../../hooks/useSwipeBack';

type Props = {
  expense: Expense;
  members: Record<string, UserProfile>;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

export default function ExpenseDetailsScreen({ expense, members, onBack, onEdit, onDelete }: Props) {
  const theme = useAppTheme();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const swipeBack = useSwipeBack(onBack);

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); setDeleteConfirm(false); }
  };
  const displayAmount = expense.originalAmount ?? expense.amount;
  const displayCurrency = expense.originalCurrency ?? expense.currency;
  const baseCurrency = expense.baseCurrency ?? displayCurrency;
  const baseAmount = expense.amountInBase;

  const icon = getExpenseIcon(expense.description);
  const [iconBg] = avatarColors(expense.id || expense.description);

  const payer = members[expense.paidBy];
  const payerName = payer?.displayName || payer?.email || 'Someone';

  const splitLabel =
    expense.splitType === 'EQUAL'
      ? 'Split equally'
      : expense.splitType === 'AMOUNT'
      ? 'Custom amounts'
      : expense.splitType === 'PERCENT'
      ? 'Percentage split'
      : 'Share split';

  const dateLabel = formatExpenseDate(expense.expenseDate || expense.createdAt);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]} {...swipeBack}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        <View style={styles.header}>
          <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={onBack} hitSlop={4}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Expense</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={() => setDeleteConfirm(true)} hitSlop={4}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.error} />
            </Pressable>
            <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={onEdit} hitSlop={4}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.text} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Detail card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.detailTop}>
            <View style={[styles.catIcon, { backgroundColor: iconBg + '22' }]}>
              <MaterialCommunityIcons name={icon.icon as any} size={22} color={iconBg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.expenseDesc, { color: theme.text }]} numberOfLines={2}>
                {expense.description}
              </Text>
              <Text style={[styles.expenseMeta, { color: theme.textSec }]}>
                {dateLabel}
              </Text>
            </View>
          </View>
          <View style={styles.amountRow}>
            <Text style={[styles.expenseAmount, { color: theme.text }]}>
              {displayCurrency} {displayAmount.toFixed(2)}
            </Text>
            <CurrencyBadge code={displayCurrency} />
          </View>
          {baseAmount !== undefined && baseCurrency !== displayCurrency ? (
            <Text style={[styles.baseAmount, { color: theme.textMuted }]}>
              ≈ {baseCurrency} {baseAmount.toFixed(2)}
            </Text>
          ) : null}
          <Text style={[styles.splitInfo, { color: theme.textSec }]}>
            Paid by <Text style={[styles.payerName, { color: theme.text }]}>{payerName}</Text>
            {' · '}{splitLabel}
          </Text>
        </View>

        {/* Splits card */}
        <View style={[styles.card, styles.cardNoPad, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardPadded}>
            <View style={styles.splitsHeader}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>SPLITS</Text>
              <Text style={[styles.splitsCount, { color: theme.textSec }]}>
                {expense.participants.length} people
              </Text>
            </View>
          </View>
          {expense.participants.map((id, idx) => {
            const split = expense.splits[id];
            const profile = members[id];
            const label = profile?.displayName || profile?.email || id;
            const isPayer = id === expense.paidBy;
            return (
              <React.Fragment key={id}>
                {idx > 0 && <View style={[styles.divider, { backgroundColor: theme.divider, marginLeft: 62 }]} />}
                <View style={styles.splitRow}>
                  <Avatar id={id} name={label} size={32} />
                  <View style={styles.splitInfo2}>
                    <View style={styles.splitNameRow}>
                      <Text style={[styles.splitName, { color: theme.text }]} numberOfLines={1}>
                        {label}
                      </Text>
                      {isPayer && (
                        <View style={[styles.paidBadge, { backgroundColor: theme.primarySoft }]}>
                          <Text style={[styles.paidBadgeText, { color: theme.primary }]}>PAID</Text>
                        </View>
                      )}
                    </View>
                    {split?.percent ? (
                      <Text style={[styles.splitSub, { color: theme.textMuted }]}>{split.percent}%</Text>
                    ) : split?.shares ? (
                      <Text style={[styles.splitSub, { color: theme.textMuted }]}>{split.shares} shares</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.splitAmount, { color: theme.text }]}>
                    {displayCurrency} {split?.owed?.toFixed(2) ?? '—'}
                  </Text>
                </View>
              </React.Fragment>
            );
          })}
        </View>

        {/* Activity card */}
        {(expense.createdAt || expense.updatedAt) && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>ACTIVITY</Text>
            <View style={{ marginTop: 10, gap: 4 }}>
              {expense.createdAt ? (
                <Text style={[styles.activityText, { color: theme.textSec }]}>
                  Added · {formatExpenseDate(expense.createdAt)}
                </Text>
              ) : null}
              {expense.updatedAt && expense.updatedAt !== expense.createdAt ? (
                <Text style={[styles.activityText, { color: theme.textSec }]}>
                  Last edited · {formatExpenseDate(expense.updatedAt)}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Pinned edit button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.bg }]}>
        <LinearGradient
          colors={['transparent', theme.bg]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
        <SecondaryButton onPress={onEdit} variant="outlined" full size="lg">
          Edit expense
        </SecondaryButton>
      </View>

      <ConfirmDialog
        visible={deleteConfirm}
        title="Delete expense"
        message="This will permanently remove the expense and recompute balances."
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
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
  scroll: { padding: 16, gap: 12, paddingBottom: 24 },
  card: { borderRadius: 16, borderWidth: 1, padding: 20 },
  cardNoPad: { padding: 0, overflow: 'hidden' },
  cardPadded: { padding: 16 },
  detailTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  catIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  expenseDesc: { fontSize: 18, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3, lineHeight: 24 },
  expenseMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  expenseAmount: {
    fontSize: 36, fontFamily: 'Inter_700Bold', letterSpacing: -0.8,
  },
  baseAmount: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 8 },
  splitInfo: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  payerName: { fontFamily: 'Inter_600SemiBold' },
  splitsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.7, textTransform: 'uppercase' },
  splitsCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  divider: { height: StyleSheet.hairlineWidth },
  splitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 11,
  },
  splitInfo2: { flex: 1, minWidth: 0 },
  splitNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  splitName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  paidBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  paidBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.4 },
  splitSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  splitAmount: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  activityText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingBottom: 32, paddingTop: 48,
  },
  bottomFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 48 },
});
