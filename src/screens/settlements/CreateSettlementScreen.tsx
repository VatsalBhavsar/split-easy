import React, { useMemo, useState, useEffect } from 'react';
import { Platform, View, Text, TextInput, Pressable, ScrollView, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserProfile } from '../../types/user';
import UserPickerModal from '../../components/UserPickerModal';
import { createSettlement } from '../../services/settlementService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDateInput, toDate } from '../../utils/date';
import { recomputeGroupBalances } from '../../services/balanceService';
import PrimaryButton from '../../ui/PrimaryButton';
import SegmentedControl from '../../ui/SegmentedControl';
import { Avatar } from '../../ui/Avatar';
import { convertToBase, getDateKeyForExpense } from '../../services/fxService';
import { useAppTheme } from '../../theme';
import { useSwipeBack } from '../../hooks/useSwipeBack';

type Props = {
  groupId: string;
  currency: string;
  members: UserProfile[];
  currentUserId: string;
  onBack: () => void;
  edgeHint?: { fromUserId: string; toUserId: string; amount: number };
};

export default function CreateSettlementScreen({
  groupId,
  currency,
  members,
  currentUserId,
  onBack,
  edgeHint,
}: Props) {
  const theme = useAppTheme();
  const swipeBack = useSwipeBack(onBack);
  const [paidBy, setPaidBy] = useState(edgeHint?.fromUserId || currentUserId);
  const [paidTo, setPaidTo] = useState(edgeHint?.toUserId || '');
  const [amount, setAmount] = useState(edgeHint?.amount?.toString() || '');
  const [method, setMethod] = useState<'CASH' | 'UPI' | 'MANUAL'>('CASH');
  const [note, setNote] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState(false);
  const [iosDateTemp, setIosDateTemp] = useState<Date>(new Date());
  const [picker, setPicker] = useState<'paidBy' | 'paidTo' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const membersMap = useMemo(
    () => members.reduce<Record<string, UserProfile>>((acc, m) => { acc[m.id] = m; return acc; }, {}),
    [members],
  );
  const paidToOptions = useMemo(() => members.filter((m) => m.id !== paidBy), [members, paidBy]);

  useEffect(() => {
    if (paidTo === paidBy) setPaidTo('');
  }, [paidBy, paidTo]);

  const maxOwed = edgeHint?.amount;
  const numericAmount = Number(amount);
  const overLimit = maxOwed !== undefined && numericAmount > maxOwed;
  const valid = paidBy && paidTo && paidBy !== paidTo && numericAmount > 0 && !overLimit && membersMap[paidBy] && membersMap[paidTo];

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true); setError('');
    try {
      const noteValue = note.trim();
      const dateKey = getDateKeyForExpense(date);
      const { amountInBase, fx } = await convertToBase({
        amount: Number(amount),
        fromCurrency: currency,
        groupBaseCurrency: currency,
        dateKey,
      });
      await createSettlement(groupId, {
        groupId,
        createdBy: currentUserId,
        paidBy,
        paidTo,
        amount: Number(amount),
        currency,
        originalAmount: Number(amount),
        originalCurrency: currency,
        baseCurrency: currency,
        amountInBase,
        fx,
        method,
        note: noteValue || undefined,
        status: 'COMPLETED',
        settledAt: date,
      });
      await recomputeGroupBalances(groupId, currency, members.map((m) => m.id));
      onBack();
    } catch (e: any) {
      setError(e?.message || 'Could not save settlement');
    } finally {
      setSaving(false);
    }
  };

  const paidByProfile = membersMap[paidBy];
  const paidToProfile = membersMap[paidTo];
  const paidByName = paidByProfile?.displayName || paidByProfile?.email || 'Select';
  const paidToName = paidToProfile?.displayName || paidToProfile?.email || 'Select payer';

  const openDatePicker = () => { setIosDateTemp(date); setShowDate(true); };

  const onDateChange = (evt: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDate(false);
      if (evt.type === 'set' && selected) setDate(selected);
    } else {
      if (selected) setIosDateTemp(selected);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]} {...swipeBack}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        <View style={styles.header}>
          <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={onBack} hitSlop={4}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settle up</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Person picker card */}
        <View style={[styles.card, styles.cardNoPad, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Paid by row */}
          <Pressable style={styles.personRow} onPress={() => setPicker('paidBy')}>
            {paidByProfile ? (
              <Avatar id={paidBy} name={paidByName} size={36} />
            ) : (
              <View style={[styles.personPlaceholder, { backgroundColor: theme.cardAlt }]}>
                <MaterialCommunityIcons name="account-outline" size={18} color={theme.textMuted} />
              </View>
            )}
            <View style={styles.personInfo}>
              <Text style={[styles.personLabel, { color: theme.textMuted }]}>Who paid?</Text>
              <Text style={[styles.personName, { color: theme.text }]}>{paidByName}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textMuted} />
          </Pressable>
          <View style={styles.arrowRow}>
            <View style={[styles.arrowLine, { backgroundColor: theme.border }]} />
            <View style={[styles.arrowCircle, { backgroundColor: theme.cardAlt }]}>
              <MaterialCommunityIcons name="arrow-down" size={16} color={theme.textMuted} />
            </View>
            <View style={[styles.arrowLine, { backgroundColor: theme.border }]} />
          </View>
          {/* Paid to row */}
          <Pressable style={styles.personRow} onPress={() => setPicker('paidTo')}>
            {paidToProfile ? (
              <Avatar id={paidTo} name={paidToName} size={36} />
            ) : (
              <View style={[styles.personPlaceholder, { backgroundColor: theme.cardAlt }]}>
                <MaterialCommunityIcons name="account-outline" size={18} color={theme.textMuted} />
              </View>
            )}
            <View style={styles.personInfo}>
              <Text style={[styles.personLabel, { color: theme.textMuted }]}>Paid to</Text>
              <Text style={[styles.personName, { color: paidTo ? theme.text : theme.textMuted }]}>
                {paidTo ? paidToName : 'Select recipient'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textMuted} />
          </Pressable>
        </View>

        {/* Amount card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>AMOUNT ({currency})</Text>
          <TextInput
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={[styles.amountInput, { color: theme.text, borderColor: theme.border }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            placeholderTextColor={theme.placeholder}
            placeholder="0.00"
          />
          {overLimit && maxOwed !== undefined ? (
            <Text style={[styles.amountError, { color: theme.errorText }]}>
              Cannot exceed owed ({currency} {maxOwed.toFixed(2)})
            </Text>
          ) : null}

          <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 16 }]}>METHOD</Text>
          <SegmentedControl
            value={method}
            onValueChange={(v) => setMethod(v as 'CASH' | 'UPI' | 'MANUAL')}
            buttons={[
              { value: 'CASH', label: 'Cash' },
              { value: 'UPI', label: 'UPI' },
              { value: 'MANUAL', label: 'Manual' },
            ]}
            style={{ marginTop: 6 }}
          />

          <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 16 }]}>NOTE (OPTIONAL)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            style={[styles.noteInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            placeholderTextColor={theme.placeholder}
            placeholder="e.g. Dinner settlement"
          />

          <Pressable
            onPress={() => Platform.OS !== 'web' && openDatePicker()}
            style={[styles.dateBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <MaterialCommunityIcons name="calendar-outline" size={16} color={theme.textMuted} />
            <Text style={[styles.dateBtnText, { color: theme.text }]}>{formatDateInput(date)}</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textMuted} />
          </Pressable>
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: theme.errorText }]}>{error}</Text>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Pinned save button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.bg }]}>
        <LinearGradient
          colors={['transparent', theme.bg]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
        <PrimaryButton
          onPress={handleSave}
          disabled={!valid || saving}
          loading={saving}
          full
          size="lg"
        >
          Mark as settled
        </PrimaryButton>
      </View>

      <UserPickerModal
        visible={picker === 'paidBy'}
        onDismiss={() => setPicker(null)}
        users={members}
        selectedId={paidBy}
        onSelect={(id) => setPaidBy(id)}
        title="Who paid?"
      />
      <UserPickerModal
        visible={picker === 'paidTo'}
        onDismiss={() => setPicker(null)}
        users={paidToOptions}
        selectedId={paidTo}
        onSelect={(id) => setPaidTo(id)}
        title="Paid to"
      />
      {showDate && Platform.OS === 'android' ? (
        <DateTimePicker value={toDate(date) || new Date()} mode="date" display="default" onChange={onDateChange} />
      ) : null}
      {showDate && Platform.OS === 'ios' ? (
        <Modal transparent animationType="slide" onRequestClose={() => setShowDate(false)}>
          <Pressable style={styles.dateModalBackdrop} onPress={() => setShowDate(false)} />
          <View style={[styles.dateModalSheet, { backgroundColor: theme.card }]}>
            <View style={[styles.dateModalHeader, { borderBottomColor: theme.border }]}>
              <Pressable onPress={() => setShowDate(false)}>
                <Text style={[styles.dateModalCancel, { color: theme.textSec }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => { setDate(iosDateTemp); setShowDate(false); }}>
                <Text style={[styles.dateModalDone, { color: theme.primary }]}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker value={iosDateTemp} mode="date" display="spinner" onChange={onDateChange} style={{ backgroundColor: theme.card }} textColor={theme.text} />
          </View>
        </Modal>
      ) : null}
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
  scroll: { padding: 16, gap: 12, paddingBottom: 24 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardNoPad: { padding: 0, overflow: 'hidden' },
  personRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  personPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  personInfo: { flex: 1 },
  personLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', letterSpacing: 0.2 },
  personName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginTop: 1 },
  arrowRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8,
  },
  arrowLine: { flex: 1, height: 1 },
  arrowCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 8,
  },
  amountInput: {
    fontSize: 32, fontFamily: 'Inter_700Bold', letterSpacing: -0.8,
    borderBottomWidth: 2, paddingVertical: 8, marginBottom: 4,
    textAlign: 'center',
  },
  amountError: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 4 },
  noteInput: {
    height: 44, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, fontSize: 16, fontFamily: 'Inter_400Regular', marginTop: 4,
  },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44, marginTop: 12,
  },
  dateBtnText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingBottom: 32, paddingTop: 48,
  },
  bottomFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 48 },
  dateModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  dateModalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  dateModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateModalCancel: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  dateModalDone: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
