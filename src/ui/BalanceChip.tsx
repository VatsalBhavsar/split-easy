import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme';

type Props = {
  amount: number;
  currency?: string;
  size?: 'sm' | 'md';
};

const SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$',
};

function fmt(amount: number, currency: string) {
  const sym = SYMBOLS[currency] || currency + ' ';
  const abs = Math.abs(amount);
  const num = abs.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
  return `${sign}${sym}${num}`;
}

export default function BalanceChip({ amount, currency = 'INR', size = 'md' }: Props) {
  const theme = useAppTheme();
  const isPos = amount > 0;
  const isNeg = amount < 0;
  const bg = isPos ? theme.successSoft : isNeg ? theme.errorSoft : theme.cardAlt;
  const color = isPos ? theme.successText : isNeg ? theme.errorText : theme.textSec;
  const h = size === 'sm' ? 22 : 26;
  const fs = size === 'sm' ? 12 : 13;
  return (
    <View style={[styles.chip, { backgroundColor: bg, height: h, paddingHorizontal: 9 }]}>
      <Text style={{ color, fontSize: fs, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.2 }}>
        {fmt(amount, currency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
