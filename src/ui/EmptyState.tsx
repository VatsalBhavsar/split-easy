import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PrimaryButton from './PrimaryButton';
import { useAppTheme } from '../theme';

type Props = {
  icon?: string | React.ReactNode;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
};

export default function EmptyState({ icon, title, subtitle, action }: Props) {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: theme.cardAlt }]}>
        {typeof icon === 'string' ? (
          <Text style={styles.iconEmoji}>{icon}</Text>
        ) : (
          icon ?? null
        )}
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.textSec }]}>{subtitle}</Text>
      ) : null}
      {action ? (
        <PrimaryButton onPress={action.onPress} size="md" style={styles.actionBtn}>
          {action.label}
        </PrimaryButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 14,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: -6,
  },
  actionBtn: {
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
});
