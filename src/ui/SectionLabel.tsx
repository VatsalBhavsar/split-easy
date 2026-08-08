import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useAppTheme } from '../theme';

export default function SectionLabel({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const theme = useAppTheme();
  return (
    <Text style={[styles.label, { color: theme.textMuted }, style]}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
  },
});
