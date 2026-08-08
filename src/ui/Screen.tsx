import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme';

type ScreenProps = {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  edges?: Edge[];
};

export default function Screen({ children, style, padded = false, edges }: ScreenProps) {
  const theme = useAppTheme();
  return (
    <SafeAreaView
      edges={edges ?? ['left', 'right', 'bottom']}
      style={[styles.root, { backgroundColor: theme.bg }]}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: theme.bg,
            paddingHorizontal: padded ? 16 : 0,
            paddingVertical: padded ? 16 : 0,
          },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
});
