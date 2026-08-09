// expo install @react-native-community/datetimepicker
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, View, Text, TextInput, Pressable, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PrimaryButton from '../../ui/PrimaryButton';
import { Avatar } from '../../ui/Avatar';
import { User } from 'firebase/auth';
import { SplitType } from '../../types/expense';
import { UserProfile } from '../../types/user';
import { Group } from '../../types/group';
import { createExpense, updateExpense } from '../../services/expenseService';
import { updateGroupDetails } from '../../services/groupService';
import { calculateSplits } from '../../utils/splitCalculator';
import ParticipantsPicker from '../../components/ParticipantsPicker';
import SplitEditor from '../../components/SplitEditor';
import MemberPickerModal from '../../components/MemberPickerModal';
import { toDate, formatDateInput } from '../../utils/date';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { convertToBase, getDateKeyForExpense } from '../../services/fxService';
import { useAppTheme } from '../../theme';
import { useSwipeBack } from '../../hooks/useSwipeBack';

type Props = {
  groupId: string;
  groupBaseCurrency: string;
  group: Group;
  members: UserProfile[];
  currentUser: User;
  onBack: () => void;
  expense?: any;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$',
};

export default function AddExpenseScreen({
  groupId,
  groupBaseCurrency,
  group,
  members,
  currentUser,
  onBack,
  expense,
}: Props) {
  const theme = useAppTheme();
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [currency, setCurrency] = useState(
    expense?.originalCurrency || expense?.currency || groupBaseCurrency,
  );
  const [paidBy, setPaidBy] = useState(expense?.paidBy || currentUser.uid);
  const [expenseDate, setExpenseDate] = useState<Date>(
    toDate(expense?.expenseDate || expense?.createdAt) || new Date(),
  );
  const [splitType, setSplitType] = useState<SplitType>(expense?.splitType || 'EQUAL');
  const [participants, setParticipants] = useState<string[]>(
    expense?.participants || members.map((m) => m.id),
  );
  const [values, setValues] = useState<Record<string, number>>(
    expense?.participants?.reduce((acc: Record<string, number>, id: string) => {
      const split = expense?.splits?.[id];
      if (splitType === 'AMOUNT') acc[id] = split?.owed || 0;
      if (splitType === 'PERCENT') acc[id] = split?.percent || 0;
      if (splitType === 'SHARES') acc[id] = split?.shares || 1;
      return acc;
    }, {}) || {},
  );
  const [showPaidBy, setShowPaidBy] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [iosDateTemp, setIosDateTemp] = useState<Date>(expenseDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const next: Record<string, number> = {};
    participants.forEach((id) => {
      next[id] = splitType === 'SHARES' ? 1 : splitType === 'EQUAL' ? 0 : values[id] || 0;
    });
    setValues(next);
  }, [participants, splitType]);

  const splits = useMemo(
    () => calculateSplits({ total: Number(amount) || 0, splitType, participants, values }),
    [amount, splitType, participants, values],
  );

  const splitTotal = useMemo(
    () => participants.reduce((acc, id) => acc + (splits[id]?.owed || 0), 0),
    [participants, splits],
  );

  const percentTotal = useMemo(
    () =>
      splitType === 'PERCENT'
        ? participants.reduce((acc, id) => acc + (Number(values[id]) || 0), 0)
        : 0,
    [participants, values, splitType],
  );

  const multiCurrencyEnabled = group.multiCurrencyEnabled ?? true;

  useEffect(() => {
    if (!multiCurrencyEnabled && currency !== groupBaseCurrency) {
      setCurrency(groupBaseCurrency);
    }
  }, [multiCurrencyEnabled, currency, groupBaseCurrency]);

  const currencyOptions = useMemo(() => {
    const defaults = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'];
    const fromGroup = group.supportedCurrencies?.length
      ? group.supportedCurrencies
      : [groupBaseCurrency];
    return Array.from(new Set([...fromGroup, ...defaults]));
  }, [groupBaseCurrency, group.supportedCurrencies]);

  const valid =
    description.trim() &&
    Number(amount) > 0 &&
    participants.length > 0 &&
    (splitType !== 'PERCENT' || Math.round(percentTotal) === 100) &&
    (splitType !== 'AMOUNT' ||
      Math.round(splitTotal * 100) === Math.round(Number(amount) * 100));

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true); setError('');
    try {
      const numericAmount = Number(amount);
      const expenseCurrency = multiCurrencyEnabled ? currency : groupBaseCurrency;
      const dateKey = getDateKeyForExpense(expenseDate);
      const { amountInBase, rateToBase, fx } = await convertToBase({
        amount: numericAmount,
        fromCurrency: expenseCurrency,
        groupBaseCurrency,
        dateKey,
      });
      const valuesBase =
        splitType === 'AMOUNT'
          ? participants.reduce<Record<string, number>>((acc, id) => {
              acc[id] = (Number(values[id]) || 0) * rateToBase;
              return acc;
            }, {})
          : values;
      const splitsInBase = calculateSplits({
        total: amountInBase,
        splitType,
        participants,
        values: valuesBase,
      });
      const payload = {
        groupId,
        description: description.trim(),
        amount: numericAmount,
        currency: expenseCurrency,
        originalAmount: numericAmount,
        originalCurrency: expenseCurrency,
        baseCurrency: groupBaseCurrency,
        amountInBase,
        splitsInBase,
        fx,
        paidBy,
        splitType,
        participants,
        splits,
        createdBy: currentUser.uid,
        expenseDate,
      };
      if (expense) {
        await updateExpense(groupId, expense.id, payload as any);
      } else {
        await createExpense(groupId, payload as any);
      }
      if (multiCurrencyEnabled && !group.supportedCurrencies?.includes(expenseCurrency)) {
        const nextCurrencies = Array.from(
          new Set([groupBaseCurrency, ...(group.supportedCurrencies || []), expenseCurrency]),
        );
        await updateGroupDetails(groupId, { supportedCurrencies: nextCurrencies });
      }
      onBack();
    } catch (e: any) {
      setError(e?.message || 'Could not save expense');
    } finally {
      setSaving(false);
    }
  };

  const memberProfiles = members.reduce<Record<string, UserProfile>>((acc, m) => {
    acc[m.id] = m;
    return acc;
  }, {});
  const paidByProfile = memberProfiles[paidBy];
  const paidByName = paidByProfile?.displayName || paidByProfile?.email || 'Select';

  const openDatePicker = () => {
    setIosDateTemp(expenseDate);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selected) setExpenseDate(selected);
    } else {
      if (selected) setIosDateTemp(selected);
    }
  };

  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;
  const swipeBack = useSwipeBack(onBack);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]} {...swipeBack}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        <View style={styles.header}>
          <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={onBack} hitSlop={4}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {expense ? 'Edit expense' : 'Add expense'}
          </Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Amount hero card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currencySymbol, { color: theme.textSec }]}>{currencySymbol}</Text>
            <TextInput
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              style={[styles.amountInput, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
              placeholderTextColor={theme.placeholder}
              placeholder="0.00"
            />
          </View>
          <View style={styles.amountMeta}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSec }]}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.descInput, { color: theme.text, borderColor: theme.border }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                placeholderTextColor={theme.placeholder}
                placeholder="What was it for?"
              />
            </View>
          </View>
          {multiCurrencyEnabled && (
            <Pressable
              onPress={() => setShowCurrencyMenu(true)}
              style={[styles.rowBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
            >
              <MaterialCommunityIcons name="currency-usd" size={16} color={theme.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowBtnLabel, { color: theme.textMuted }]}>Currency</Text>
                <Text style={[styles.rowBtnValue, { color: theme.text }]}>{currency}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textMuted} />
            </Pressable>
          )}
          <Pressable
            onPress={() => Platform.OS !== 'web' && openDatePicker()}
            style={[styles.rowBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <MaterialCommunityIcons name="calendar-outline" size={16} color={theme.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowBtnLabel, { color: theme.textMuted }]}>Date</Text>
              <Text style={[styles.rowBtnValue, { color: theme.text }]}>{formatDateInput(expenseDate)}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textMuted} />
          </Pressable>
        </View>

        {/* Paid by card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PAID BY</Text>
          <Pressable
            onPress={() => setShowPaidBy(true)}
            style={[styles.paidByRow, { backgroundColor: theme.cardAlt, borderRadius: 12 }]}
          >
            <Avatar id={paidBy} name={paidByName} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.paidByName, { color: theme.text }]}>{paidByName}</Text>
              <Text style={[styles.paidByHint, { color: theme.textSec }]}>Tap to change</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textMuted} />
          </Pressable>
        </View>

        {/* Participants card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PARTICIPANTS</Text>
          <ParticipantsPicker
            participants={participants}
            members={members}
            onToggle={(id) =>
              setParticipants((prev) =>
                prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
              )
            }
            onSelectAll={() => setParticipants(members.map((m) => m.id))}
          />
        </View>

        {/* Split method card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SplitEditor
            total={Number(amount) || 0}
            splitType={splitType}
            participants={participants}
            members={members}
            values={values}
            onChangeValues={setValues}
            onChangeSplitType={setSplitType}
          />
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: theme.errorText }]}>{error}</Text>
        ) : null}

        <View style={{ height: 88 }} />
      </ScrollView>

      {/* Pinned save button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.bg }]}>
        <PrimaryButton
          onPress={handleSave}
          disabled={!valid || saving}
          loading={saving}
          full
          size="lg"
        >
          Save expense
        </PrimaryButton>
      </View>

      <MemberPickerModal
        visible={showPaidBy}
        onDismiss={() => setShowPaidBy(false)}
        members={members}
        selectedId={paidBy}
        onSelect={setPaidBy}
      />

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker value={expenseDate} mode="date" display="default" onChange={handleDateChange} />
      )}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
          <Pressable style={styles.dateModalBackdrop} onPress={() => setShowDatePicker(false)} />
          <View style={[styles.dateModalSheet, { backgroundColor: theme.card }]}>
            <View style={[styles.dateModalHeader, { borderBottomColor: theme.border }]}>
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.dateModalCancel, { color: theme.textSec }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => { setExpenseDate(iosDateTemp); setShowDatePicker(false); }}>
                <Text style={[styles.dateModalDone, { color: theme.primary }]}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={iosDateTemp}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              style={{ backgroundColor: theme.card }}
              textColor={theme.text}
            />
          </View>
        </Modal>
      )}

      <Modal
        visible={showCurrencyMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyMenu(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowCurrencyMenu(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => {}}
          >
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.borderStrong }]} />
            </View>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Currency</Text>
            {currencyOptions.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => { setCurrency(opt); setShowCurrencyMenu(false); }}
                style={({ pressed }) => [
                  styles.sheetItem,
                  { borderBottomColor: theme.divider },
                  pressed && { backgroundColor: theme.cardAlt },
                ]}
              >
                <Text style={[styles.sheetItemText, { color: opt === currency ? theme.primary : theme.text }]}>
                  {opt}
                </Text>
                {opt === currency && (
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
  scroll: { padding: 16, gap: 12, paddingBottom: 24 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center',
    gap: 6, marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24, fontFamily: 'Inter_500Medium', letterSpacing: -0.5,
  },
  amountInput: {
    fontSize: 44, fontFamily: 'Inter_700Bold', letterSpacing: -1.5,
    textAlign: 'center', minWidth: 120,
  },
  amountMeta: { gap: 12, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  descInput: {
    fontSize: 16, fontFamily: 'Inter_400Regular',
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, minHeight: 44,
  },
  rowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, height: 48, marginTop: 10,
  },
  rowBtnLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', letterSpacing: 0.2 },
  rowBtnValue: { fontSize: 14, fontFamily: 'Inter_500Medium', marginTop: 1 },
  paidByRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 10, marginTop: 8,
  },
  paidByName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  paidByHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  errorText: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    textAlign: 'center',
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetItemText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  dateModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  dateModalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  dateModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateModalCancel: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  dateModalDone: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
