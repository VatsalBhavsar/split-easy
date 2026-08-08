import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  size?: number;
  danger?: boolean;
  active?: boolean;
  style?: ViewStyle;
};

export default function IconBtn({ children, onPress, size = 36, danger, active, style }: Props) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          width: size,
          height: size,
          backgroundColor: active ? theme.primarySoft : theme.cardAlt,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              color: danger ? theme.error : active ? theme.primary : theme.text,
            })
          : child
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
