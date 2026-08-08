import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeMode, useThemeMode, useAppTheme } from '../../theme';
import { useSwipeBack } from '../../hooks/useSwipeBack';
import SegmentedControl from '../../ui/SegmentedControl';

type Props = {
  onClose: () => void;
};

export default function SettingsScreen({ onClose }: Props) {
  const theme = useAppTheme();
  const swipeBack = useSwipeBack(onClose);
  const { themeMode, setThemeMode } = useThemeMode();

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]} {...swipeBack}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        <View style={styles.header}>
          <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={onClose} hitSlop={4}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Appearance card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>APPEARANCE</Text>
          <Text style={[styles.helperText, { color: theme.textSec }]}>
            Choose how SplitEasy follows your device theme.
          </Text>
          <SegmentedControl
            value={themeMode}
            onValueChange={(v) => setThemeMode(v as ThemeMode)}
            buttons={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
            style={{ marginTop: 4 }}
          />
          {/* Theme swatches — label below each box */}
          <View style={[styles.swatchRow, { backgroundColor: theme.cardAlt }]}>
            {[
              { color: theme.surface, label: 'Surface', bordered: true },
              { color: theme.primary, label: 'Primary', bordered: false },
              { color: theme.successText, label: 'Owed', bordered: false },
              { color: theme.errorText, label: 'Owe', bordered: false },
            ].map((s) => (
              <View key={s.label} style={styles.swatchItem}>
                <View style={[
                  styles.swatchBox,
                  { backgroundColor: s.color },
                  s.bordered && { borderWidth: 1, borderColor: theme.border },
                ]} />
                <Text style={[styles.swatchLabel, { color: theme.textMuted }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.version, { color: theme.textMuted }]}>
          SplitEasy · build 2026.05
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  scroll: { padding: 16, gap: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 8,
  },
  helperText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 12 },
  swatchRow: {
    flexDirection: 'row', gap: 8, borderRadius: 12, padding: 10, marginTop: 14,
  },
  swatchItem: { flex: 1, alignItems: 'center', gap: 5 },
  swatchBox: { width: '100%', height: 48, borderRadius: 10 },
  swatchLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  version: {
    textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', letterSpacing: 0.2,
  },
});
