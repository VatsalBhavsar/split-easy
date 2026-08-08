import React, { ReactNode } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../theme';
import { RADIUS } from '../theme/tokens';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'outlined' | 'soft' | 'tonal';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  size?: Size;
  variant?: Variant;
  full?: boolean;
  danger?: boolean;
};

const HEIGHTS: Record<Size, number> = { sm: 36, md: 44, lg: 52 };
const FONT_SIZES: Record<Size, number> = { sm: 13, md: 15, lg: 16 };
const PAD_X: Record<Size, number> = { sm: 12, md: 16, lg: 20 };

export default function SecondaryButton({
  children, onPress, disabled, style, size = 'md', variant = 'outlined', full, danger,
}: Props) {
  const theme = useAppTheme();

  let bg: string, fg: string, borderColor: string | undefined, borderWidth = 0;
  if (variant === 'soft') {
    bg = danger ? theme.errorSoft : theme.primarySoft;
    fg = danger ? theme.errorText : theme.primary;
  } else if (variant === 'tonal') {
    bg = theme.cardAlt;
    fg = theme.text;
  } else {
    bg = 'transparent';
    fg = danger ? theme.error : theme.text;
    borderColor = theme.borderStrong;
    borderWidth = 1;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          height: HEIGHTS[size],
          paddingHorizontal: PAD_X[size],
          backgroundColor: bg,
          borderColor: borderColor,
          borderWidth,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          width: full ? '100%' : undefined,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: fg, fontSize: FONT_SIZES[size] }]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
});
