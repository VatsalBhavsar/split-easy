import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme';

export default function CurrencyBadge({ code }: { code: string }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.cardAlt }]}>
      <Text style={[styles.text, { color: theme.textSec }]}>{code}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
});
