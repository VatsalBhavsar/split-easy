import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useAppTheme } from '../theme';
import { RADIUS, shadow } from '../theme/tokens';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padded?: boolean;
  bordered?: boolean;
  elevated?: boolean;
};

export default function Card({ children, style, onPress, padded = true, bordered = false, elevated = false }: Props) {
  const theme = useAppTheme();

  const container: ViewStyle[] = [
    styles.card,
    { backgroundColor: theme.card },
    ...(bordered ? [{ borderWidth: 1 as const, borderColor: theme.border }] : []),
    ...(elevated ? [{ ...shadow.card, shadowColor: '#000' }] : []),
    ...(style ? [style as ViewStyle] : []),
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [...container, pressed && styles.pressed]}
        onPress={onPress}
      >
        {padded ? <View style={styles.padded}>{children}</View> : children}
      </Pressable>
    );
  }

  return (
    <View style={container}>
      {padded ? <View style={styles.padded}>{children}</View> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  padded: {
    padding: 16,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
});
