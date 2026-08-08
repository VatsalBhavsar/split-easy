import React, { useMemo, useState } from 'react';
import { View, Text, Switch, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createGroup } from '../../services/groupService';
import PrimaryButton from '../../ui/PrimaryButton';
import TextField from '../../ui/TextField';
import CurrencyBadge from '../../ui/CurrencyBadge';
import { getInitials } from '../../theme/colors';
import { useAppTheme } from '../../theme';
import { useSwipeBack } from '../../hooks/useSwipeBack';

const CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
];

type Props = {
  userId: string;
  onCreated: () => void;
  onBack: () => void;
};

export default function CreateGroupScreen({ userId, onCreated, onBack }: Props) {
  const theme = useAppTheme();
  const swipeBack = useSwipeBack(onBack);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('INR');
  const [multiCurrencyEnabled, setMultiCurrencyEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const selectedCurrency = useMemo(
    () => CURRENCIES.find(c => c.code === baseCurrency) || CURRENCIES[0],
    [baseCurrency],
  );

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Group name is required'); return; }
    setError('');
    setLoading(true);
    try {
      await createGroup({ name: name.trim(), description, baseCurrency, multiCurrencyEnabled, createdBy: userId });
      onCreated();
    } catch (e: any) {
      setError(e?.message || 'Could not create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]} {...swipeBack}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        <View style={styles.header}>
          <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={onBack} hitSlop={4}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>New group</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Preview + name/desc card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.previewRow}>
            <LinearGradient
              colors={[theme.gradFrom, theme.gradTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewIcon}
            >
              <Text style={styles.previewInitials}>{name ? getInitials(name) : '?'}</Text>
            </LinearGradient>
            <View style={styles.previewInfo}>
              <Text style={[styles.previewLabel, { color: theme.textSec }]}>Preview</Text>
              <Text style={[styles.previewName, { color: theme.text }]} numberOfLines={1}>
                {name || 'Group name'}
              </Text>
            </View>
          </View>
          <View style={styles.fields}>
            <TextField
              label="Group name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Goa Trip · Nov"
              autoFocus
            />
            <TextField
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Anything to remember it by"
              multiline
            />
          </View>
        </View>

        {/* Currency + toggle card */}
        <View style={[styles.card, styles.cardNoPad, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Pressable
            style={styles.currencyRow}
            onPress={() => setMenuVisible(true)}
          >
            <View style={styles.currencyInfo}>
              <Text style={[styles.currencyLabel, { color: theme.textSec }]}>Base currency</Text>
              <Text style={[styles.currencyValue, { color: theme.text }]}>{selectedCurrency.label}</Text>
            </View>
            <CurrencyBadge code={baseCurrency} />
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: theme.text }]}>Allow multiple currencies</Text>
              <Text style={[styles.toggleHint, { color: theme.textSec }]}>
                Members can add expenses in any currency. Conversions use live ECB rates.
              </Text>
            </View>
            <Switch
              value={multiCurrencyEnabled}
              onValueChange={setMultiCurrencyEnabled}
              trackColor={{ false: theme.borderStrong, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: theme.errorText }]}>{error}</Text>
        ) : null}
      </ScrollView>

      {/* Pinned bottom button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.bg }]}>
        <PrimaryButton
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !name.trim()}
          full
          size="lg"
        >
          Create group
        </PrimaryButton>
      </View>

      {/* Currency picker modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => {}}
          >
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.borderStrong }]} />
            </View>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Base currency</Text>
            {CURRENCIES.map((c) => (
              <Pressable
                key={c.code}
                onPress={() => { setBaseCurrency(c.code); setMenuVisible(false); }}
                style={({ pressed }) => [
                  styles.sheetItem,
                  { borderBottomColor: theme.divider },
                  pressed && { backgroundColor: theme.cardAlt },
                ]}
              >
                <View style={[styles.symbolBox, { backgroundColor: theme.cardAlt }]}>
                  <Text style={[styles.symbolText, { color: theme.text }]}>{c.symbol}</Text>
                </View>
                <View style={styles.sheetItemInfo}>
                  <Text style={[styles.sheetItemLabel, { color: theme.text }]}>{c.label}</Text>
                  <Text style={[styles.sheetItemCode, { color: theme.textSec }]}>{c.code}</Text>
                </View>
                {c.code === baseCurrency && (
                  <MaterialCommunityIcons name="check" size={18} color={theme.primary} />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
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
  scroll: { padding: 16, paddingBottom: 100, gap: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardNoPad: { padding: 0, overflow: 'hidden' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  previewIcon: {
    width: 56, height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  previewInitials: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.5 },
  previewInfo: { flex: 1 },
  previewLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  previewName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginTop: 2, letterSpacing: -0.2 },
  fields: { gap: 12 },
  currencyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  currencyInfo: { flex: 1 },
  currencyLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  currencyValue: { fontSize: 15, fontFamily: 'Inter_500Medium', marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  toggleHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 16 },
  errorText: {
    fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingVertical: 24,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, paddingBottom: 32,
  },
  sheetHandleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  sheetHandle: { width: 36, height: 5, borderRadius: 3 },
  sheetTitle: {
    fontSize: 17, fontFamily: 'Inter_600SemiBold', paddingHorizontal: 20, paddingBottom: 8,
  },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  symbolBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  symbolText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  sheetItemInfo: { flex: 1 },
  sheetItemLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  sheetItemCode: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
});
