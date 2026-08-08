import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme';

type Props = {
  amounts: Record<string, number>;
  variant?: 'title' | 'body';
  positiveColor?: string;
  negativeColor?: string;
};

export default function MoneyBreakdownText({ amounts, variant = 'title' }: Props) {
  const theme = useAppTheme();
  const entries = Object.entries(amounts).filter(([, v]) => Math.abs(v) > 0.009);

  const text =
    entries.length === 0
      ? '0'
      : entries
          .map(([cur, val]) => {
            const sign = val > 0 ? '+' : val < 0 ? '-' : '';
            return `${sign}${cur} ${Math.round(Math.abs(val) * 100) / 100}`;
          })
          .join(' · ');

  return (
    <Text
      style={[
        variant === 'title' ? styles.title : styles.body,
        { color: theme.text },
      ]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.15,
    fontVariant: ['tabular-nums'],
  },
  body: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    letterSpacing: -0.1,
    fontVariant: ['tabular-nums'],
  },
});
