import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

type AppLayoutProps = {
  title?: string;
  children: ReactNode;
  onBack?: () => void;
  rightAction?: ReactNode;
  edges?: Edge[];
  padded?: boolean;
  contentStyle?: ViewStyle;
  /** Render a large title below the navigation row instead of inline */
  largeTitle?: boolean;
  subtitle?: string;
  /** Hide the header entirely */
  noHeader?: boolean;
};

export default function AppLayout({
  title,
  children,
  onBack,
  rightAction,
  edges,
  padded = false,
  contentStyle,
  largeTitle = false,
  subtitle,
  noHeader = false,
}: AppLayoutProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        {!noHeader && (
          <View style={styles.headerWrap}>
            {/* Navigation row */}
            <View style={styles.navRow}>
              <View style={styles.navLeft}>
                {onBack ? (
                  <Pressable
                    onPress={onBack}
                    style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={24} color={theme.text} />
                  </Pressable>
                ) : (
                  <View style={styles.backPlaceholder} />
                )}
                {!largeTitle && title ? (
                  <Text style={[styles.inlineTitle, { color: theme.text }]} numberOfLines={1}>
                    {title}
                  </Text>
                ) : null}
              </View>
              <View style={styles.navRight}>{rightAction ?? null}</View>
            </View>
            {/* Large title row */}
            {largeTitle && title ? (
              <View style={styles.largeTitleWrap}>
                <Text style={[styles.largeTitle, { color: theme.text }]}>{title}</Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: theme.textSec }]}>{subtitle}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        )}
      </SafeAreaView>

      <SafeAreaView
        edges={edges ?? ['left', 'right', 'bottom']}
        style={[styles.body, { backgroundColor: theme.bg }]}
      >
        <View
          style={[
            styles.inner,
            padded && { paddingHorizontal: 16, paddingTop: 8 },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  backPlaceholder: { width: 36 },
  inlineTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
  largeTitleWrap: { marginTop: 8 },
  largeTitle: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  body: { flex: 1 },
  inner: { flex: 1 },
});
