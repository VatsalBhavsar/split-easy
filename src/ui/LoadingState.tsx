import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme';

type Props = {
  text?: string;
};

export default function LoadingState({ text }: Props) {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={theme.primary} />
      {text ? (
        <Text style={[styles.text, { color: theme.textMuted }]}>{text}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
