import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme';

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export default function FilterChip({ label, active, onPress }: Props) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: active ? theme.primary : theme.border,
          backgroundColor: active ? theme.primarySoft : theme.card,
        },
      ]}
    >
      <Text style={[styles.text, { color: active ? theme.primary : theme.textSec }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
