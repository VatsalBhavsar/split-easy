import React, { memo, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Expense } from '../types/expense';
import { formatCurrency } from '../utils/money';
import { formatExpenseDate } from '../utils/date';
import { computeExpenseNetForUser } from '../utils/expenseNet';
import { getExpenseIcon } from '../utils/expenseIcon';
import { useAppTheme, avatarColors } from '../theme';

type Props = {
  expense: Expense;
  currentUserId: string;
  payerName: string;
  onPress?: () => void;
};

function Row({ expense, currentUserId, payerName, onPress }: Props) {
  const theme = useAppTheme();
  const icon = getExpenseIcon(expense.description);
  const dateLabel = formatExpenseDate(expense.expenseDate || expense.createdAt);
  const displayAmount = expense.originalAmount ?? expense.amount;
  const displayCurrency = expense.originalCurrency ?? expense.currency;
  const baseCurrency = expense.baseCurrency ?? displayCurrency;
  const baseAmount = expense.amountInBase;
  const paidLine = `${formatCurrency(displayAmount, displayCurrency)} · Paid by ${payerName}`;
  const net = useMemo(() => computeExpenseNetForUser(expense, currentUserId), [expense, currentUserId]);
  const isPositive = net > 0;
  const netColor = isPositive ? theme.successText : net < 0 ? theme.errorText : theme.textMuted;
  const netBg = isPositive ? theme.successSoft : net < 0 ? theme.errorSoft : 'transparent';
  const netLabel = isPositive ? 'you lent' : net < 0 ? 'you owe' : '';
  const netText = `${net > 0 ? '+' : ''}${formatCurrency(net, baseCurrency)}`;

  // Deterministic icon background
  const [iconBg] = avatarColors(expense.id || expense.description);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.cardAlt : 'transparent' },
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: iconBg + '22' }]}>
        <MaterialCommunityIcons name={icon.icon as any} size={20} color={iconBg} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {expense.description}
        </Text>
        <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1}>
          {dateLabel} · {paidLine}
        </Text>
        {baseAmount !== undefined && baseCurrency !== displayCurrency ? (
          <Text style={[styles.sub, { color: theme.textMuted }]}>
            ≈ {formatCurrency(baseAmount, baseCurrency)}
          </Text>
        ) : null}
      </View>

      {/* Net amount chip */}
      {net !== 0 ? (
        <View style={[styles.chip, { backgroundColor: netBg }]}>
          <Text style={[styles.chipText, { color: netColor }]}>{netText}</Text>
          {netLabel ? (
            <Text style={[styles.chipSub, { color: netColor }]}>{netLabel}</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.chip}>
          <Text style={[styles.chipText, { color: theme.textMuted }]}>
            {formatCurrency(0, baseCurrency)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default memo(Row);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    letterSpacing: -0.15,
    lineHeight: 20,
  },
  sub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
    marginTop: 1,
  },
  chip: {
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 64,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.1,
    fontVariant: ['tabular-nums'],
  },
  chipSub: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    marginTop: 1,
  },
});
