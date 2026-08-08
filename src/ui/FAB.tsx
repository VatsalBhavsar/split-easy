import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme';
import { shadow } from '../theme/tokens';

type Props = {
  onPress: () => void;
  label?: string;
  icon?: string;
  style?: ViewStyle;
  bottom?: number;
};

export default function FAB({ onPress, label, icon = '+', style, bottom = 18 }: Props) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        {
          bottom,
          paddingHorizontal: label ? 20 : 0,
          opacity: pressed ? 0.88 : 1,
          ...shadow.fab,
          shadowColor: theme.gradFrom,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[theme.gradFrom, theme.gradTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.icon, { color: '#fff' }]}>{icon}</Text>
      {label && (
        <Text style={[styles.label, { color: '#fff' }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    height: 56,
    minWidth: 56,
    borderRadius: 28,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 30,
  },
  icon: {
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 30,
    marginTop: -2,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
