import React, { ReactNode } from 'react';
import { Pressable, Text, View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../theme';
import { RADIUS } from '../theme/tokens';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'primary' | 'soft' | 'ghost';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  danger?: boolean;
  size?: Size;
  variant?: Variant;
  full?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
};

const HEIGHTS: Record<Size, number> = { sm: 36, md: 44, lg: 52 };
const FONT_SIZES: Record<Size, number> = { sm: 13, md: 15, lg: 16 };
const PAD_X: Record<Size, number> = { sm: 12, md: 16, lg: 20 };

export default function PrimaryButton({
  children, onPress, disabled, loading, style, danger,
  size = 'lg', variant = 'primary', full, leading, trailing,
}: Props) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;

  let bg: string, fg: string;
  if (variant === 'soft') {
    bg = danger ? theme.errorSoft : theme.primarySoft;
    fg = danger ? theme.errorText : theme.primary;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    fg = danger ? theme.error : theme.text;
  } else {
    bg = danger ? theme.error : theme.primary;
    fg = theme.onPrimary;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        {
          height: HEIGHTS[size],
          paddingHorizontal: PAD_X[size],
          backgroundColor: bg,
          opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
          width: full ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.row}>
          {leading && <View style={styles.leading}>{leading}</View>}
          <Text style={[styles.label, { color: fg, fontSize: FONT_SIZES[size] }]}>
            {children}
          </Text>
          {trailing && <View style={styles.trailing}>{trailing}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
  leading: { flexDirection: 'row', alignItems: 'center' },
  trailing: { flexDirection: 'row', alignItems: 'center' },
});
