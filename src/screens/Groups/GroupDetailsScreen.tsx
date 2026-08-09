import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Switch, Modal, Pressable, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Group } from '../../types/group';
import { UserProfile } from '../../types/user';
import { deleteGroup, subscribeToGroup, updateGroupDetails } from '../../services/groupService';
import { getUsersByIds } from '../../services/userService';
import { listenGroupExpenses } from '../../services/expenseService';
import { listenGroupBalances } from '../../services/balanceService';
import { Expense } from '../../types/expense';
import ExpenseListItem from '../../components/ExpenseListItem';
import { computeExpenseNetForUser } from '../../utils/expenseNet';
import { formatCurrency } from '../../utils/money';
import { toDate } from '../../utils/date';
import TextField from '../../ui/TextField';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { isAdmin } from '../../utils/permissions';
import PrimaryButton from '../../ui/PrimaryButton';
import SecondaryButton from '../../ui/SecondaryButton';
import EmptyState from '../../ui/EmptyState';
import LoadingState from '../../ui/LoadingState';
import SegmentedControl from '../../ui/SegmentedControl';
import FAB from '../../ui/FAB';
import { AvatarStack } from '../../ui/Avatar';
import CurrencyBadge from '../../ui/CurrencyBadge';
import { useAppTheme } from '../../theme';
import { useSwipeBack } from '../../hooks/useSwipeBack';

const CURRENCY_OPTIONS = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'];

type Props = {
  groupId: string;
  userId: string;
  onBack: () => void;
  onAddExpense?: (groupBaseCurrency: string, memberIds: string[], group: Group) => void;
  onViewExpense?: (expense: Expense, groupBaseCurrency: string, memberIds: string[], group: Group) => void;
  onOpenMembers?: (groupId: string) => void;
  onOpenBalances?: (groupId: string, currency: string, members: string[], group: Group) => void;
};

function getDateKey(value: any): string {
  const date = toDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(value: any): string {
  const date = toDate(value);
  if (!date) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function GroupDetailsScreen({
  groupId,
  userId,
  onBack,
  onAddExpense,
  onViewExpense,
  onOpenMembers,
  onOpenBalances,
}: Props) {
  const theme = useAppTheme();
  const swipeBack = useSwipeBack(onBack);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editBaseCurrency, setEditBaseCurrency] = useState(CURRENCY_OPTIONS[0]);
  const [editMultiCurrency, setEditMultiCurrency] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [currencyExpanded, setCurrencyExpanded] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState('');
  const [filter, setFilter] = useState<'all' | 'lent' | 'borrowed'>('all');
  const [myBalance, setMyBalance] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const adminUser = group ? isAdmin(group, userId) : false;
  const hasEnoughMembers = (group?.members?.length || 0) >= 2;
  const baseCurrency = group?.baseCurrency || group?.currency || 'USD';

  useEffect(() => {
    const unsub = subscribeToGroup(
      groupId,
      (g) => {
        setGroup(g);
        setLoading(false);
        if (g) {
          setEditName(g.name);
          setEditDesc(g.description || '');
          setEditBaseCurrency(g.baseCurrency || g.currency || CURRENCY_OPTIONS[0]);
          setEditMultiCurrency(g.multiCurrencyEnabled ?? true);
        }
      },
      (err) => { setError(err?.message || 'Could not load group'); setLoading(false); },
    );
    return unsub;
  }, [groupId]);

  useEffect(() => {
    if (!group) return;
    if (!group.baseCurrency && group.currency) {
      updateGroupDetails(group.id, {
        baseCurrency: group.currency,
        supportedCurrencies: [group.currency],
        multiCurrencyEnabled: group.multiCurrencyEnabled ?? true,
      }).catch(() => {});
    }
  }, [group]);

  useEffect(() => {
    const loadProfiles = async () => {
      if (!group?.members?.length) { setProfiles({}); return; }
      try {
        const users = await getUsersByIds(group.members);
        const map: Record<string, UserProfile> = {};
        users.forEach((u) => { map[u.id] = u; });
        setProfiles(map);
      } catch { /* ignore */ }
    };
    loadProfiles();
  }, [group?.members]);

  useEffect(() => {
    if (!group) return;
    const unsub = listenGroupExpenses(
      group.id,
      (items) => { setExpenses(items); setExpensesLoading(false); setExpensesError(''); },
      (err) => { setExpensesError(err?.message || 'Could not load expenses'); setExpensesLoading(false); },
    );
    return unsub;
  }, [group?.id]);

  useEffect(() => {
    if (!group) return;
    const unsub = listenGroupBalances(group.id, (items) => {
      const mine = items.find((b) => b.userId === userId);
      if (mine) setMyBalance(mine.netBalance);
    });
    return unsub;
  }, [group?.id, userId]);

  const handleRefresh = async () => {
    if (!group?.members?.length) return;
    setRefreshing(true);
    try {
      const users = await getUsersByIds(group.members);
      const map: Record<string, UserProfile> = {};
      users.forEach((u) => { map[u.id] = u; });
      setProfiles(map);
    } catch { /* ignore */ }
    setRefreshing(false);
  };

  const handleSaveDetails = async () => {
    if (!group) return;
    if (!editName.trim()) { setError('Group name is required'); return; }
    if (expenses.length > 0 && editBaseCurrency !== baseCurrency) {
      setError("Base currency can't be changed after expenses exist.");
      return;
    }
    setBusy(true); setError('');
    try {
      const existing = group.supportedCurrencies || [];
      const supportedCurrencies = editMultiCurrency
        ? Array.from(new Set([editBaseCurrency, ...existing]))
        : [editBaseCurrency];
      await updateGroupDetails(group.id, {
        name: editName, description: editDesc,
        baseCurrency: editBaseCurrency, supportedCurrencies,
        multiCurrencyEnabled: editMultiCurrency,
      });
      setEditMode(false);
      setCurrencyExpanded(false);
    } catch (e: any) {
      setError(e?.message || 'Could not update group');
    } finally {
      setBusy(false);
    }
  };

  const handleAddExpense = () => {
    if (!group || !onAddExpense || !hasEnoughMembers) return;
    onAddExpense(baseCurrency, group.members || [], group);
  };

  const expensesWithNet = useMemo(
    () => expenses.map((e) => ({ expense: e, net: computeExpenseNetForUser(e, userId) })),
    [expenses, userId],
  );

  const filteredExpenses = useMemo(() => {
    if (filter === 'lent') return expensesWithNet.filter((x) => x.net > 0);
    if (filter === 'borrowed') return expensesWithNet.filter((x) => x.net < 0);
    return expensesWithNet;
  }, [expensesWithNet, filter]);

  const groupedExpenses = useMemo(() => {
    const byDate: Record<string, typeof filteredExpenses> = {};
    filteredExpenses.forEach(item => {
      const key = getDateKey(item.expense.expenseDate || item.expense.createdAt);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(item);
    });
    return Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredExpenses]);

  const summaryNet = myBalance !== null
    ? myBalance
    : expensesWithNet.reduce((acc, item) => acc + item.net, 0);

  const summaryLabel = summaryNet > 0 ? 'You are owed' : summaryNet < 0 ? 'You owe' : 'All settled';
  const summaryAmountText = summaryNet === 0
    ? formatCurrency(0, baseCurrency)
    : `${summaryNet > 0 ? '+' : '−'}${formatCurrency(Math.abs(summaryNet), baseCurrency)}`;

  const handleConfirm = async () => {
    setConfirmVisible(false);
    if (!group) return;
    setBusy(true);
    try { await deleteGroup(group.id); onBack(); }
    catch (e: any) { setError(e?.message || 'Could not delete group'); }
    finally { setBusy(false); }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]} {...swipeBack}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        <View style={styles.header}>
          <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={onBack} hitSlop={4}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {group?.name || 'Group'}
          </Text>
          <View style={styles.headerRight}>
            {group && (
              <>
                <Pressable
                  style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]}
                  onPress={() => onOpenMembers?.(groupId)}
                  hitSlop={4}
                >
                  <MaterialCommunityIcons name="account-group-outline" size={20} color={theme.text} />
                </Pressable>
                <Pressable
                  style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]}
                  onPress={() => group && onOpenBalances?.(group.id, baseCurrency, group.members || [], group)}
                  hitSlop={4}
                >
                  <MaterialCommunityIcons name="scale-balance" size={20} color={theme.text} />
                </Pressable>
                {adminUser && (
                  <Pressable
                    style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]}
                    onPress={() => setEditMode(true)}
                    hitSlop={4}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.text} />
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>
      </SafeAreaView>

      {loading || !group ? (
        <LoadingState text="Loading group..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} colors={[theme.primary]} />
          }
        >
          {/* Balance card */}
          <View style={styles.cardWrap}>
            <LinearGradient
              colors={[theme.gradFrom, theme.gradTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.decoCircle} />
              <View style={styles.balanceRow}>
                <View style={styles.balanceLeft}>
                  <Text style={styles.balanceLabel}>Your balance</Text>
                  <Text style={styles.balanceAmount}>{summaryAmountText}</Text>
                  <Text style={styles.balanceHint}>{summaryLabel}</Text>
                </View>
                <Pressable
                  style={styles.settleBtn}
                  onPress={() => group && onOpenBalances?.(group.id, baseCurrency, group.members || [], group)}
                >
                  <Text style={styles.settleBtnText}>Settle up</Text>
                </Pressable>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.memberRow}>
                <View style={styles.memberLeft}>
                  <AvatarStack
                  ids={group.members}
                  names={group.members.map(id => profiles[id]?.displayName || profiles[id]?.email || '')}
                  size={26} max={4} overlap={8}
                />
                  <Text style={styles.memberCount}>{group.members.length} members</Text>
                </View>
                <CurrencyBadge code={baseCurrency} />
              </View>
            </LinearGradient>
          </View>

          {hasEnoughMembers ? (
            <>
              {/* Segmented filter */}
              <View style={styles.segmentedWrap}>
                <SegmentedControl
                  value={filter}
                  onValueChange={(v) => setFilter(v as 'all' | 'lent' | 'borrowed')}
                  buttons={[
                    { value: 'all', label: 'All' },
                    { value: 'lent', label: 'You lent' },
                    { value: 'borrowed', label: 'You borrowed' },
                  ]}
                />
              </View>

              {/* Expenses */}
              {expensesLoading ? (
                <LoadingState text="Loading expenses..." />
              ) : expensesError ? (
                <EmptyState title={expensesError} />
              ) : groupedExpenses.length === 0 ? (
                <EmptyState
                  icon="🧾"
                  title="No expenses yet"
                  subtitle="Add your first expense to start splitting."
                  action={{ label: 'Add expense', onPress: handleAddExpense }}
                />
              ) : (
                groupedExpenses.map(([dateKey, items]) => (
                  <View key={dateKey} style={styles.dateGroup}>
                    <Text style={[styles.dateLabel, { color: theme.textMuted }]}>
                      {formatDateLabel(dateKey)}
                    </Text>
                    <View style={[styles.expenseCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      {items.map((item, idx) => {
                        const payer = profiles[item.expense.paidBy];
                        const payerName = payer?.displayName || payer?.email || 'Someone';
                        return (
                          <React.Fragment key={item.expense.id}>
                            {idx > 0 && <View style={[styles.separator, { backgroundColor: theme.divider }]} />}
                            <ExpenseListItem
                              expense={item.expense}
                              currentUserId={userId}
                              payerName={payerName}
                              onPress={() => onViewExpense?.(item.expense, baseCurrency, group.members || [], group)}
                            />
                          </React.Fragment>
                        );
                      })}
                    </View>
                  </View>
                ))
              )}
            </>
          ) : (
            <View style={[styles.noMembersCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.noMembersText, { color: theme.textSec }]}>
                Add members to start tracking expenses.
              </Text>
              <PrimaryButton onPress={() => onOpenMembers?.(group.id)} size="md" style={{ alignSelf: 'center' }}>
                Add member
              </PrimaryButton>
            </View>
          )}

          {error ? (
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          ) : null}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {hasEnoughMembers && group && (
        <FAB onPress={handleAddExpense} label="Add expense" icon="+" />
      )}

      {/* Edit modal */}
      {editMode && (
      <Modal
        visible
        transparent
        animationType="slide"
        onRequestClose={() => { setEditMode(false); setCurrencyExpanded(false); }}
      >
        <Pressable style={styles.overlay} onPress={() => { setEditMode(false); setCurrencyExpanded(false); }}>
          <Pressable
            style={[styles.editSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle}>
              <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />
            </View>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Edit group</Text>
            <View style={styles.editFields}>
              <TextField label="Group name" value={editName} onChangeText={setEditName} />
              <TextField label="Description" value={editDesc} onChangeText={setEditDesc} multiline />
              <Pressable
                onPress={() => setCurrencyExpanded(e => !e)}
                style={[styles.currencyTrigger, { borderColor: theme.border, backgroundColor: theme.surface }]}
              >
                <Text style={[styles.currencyTriggerLabel, { color: theme.textMuted }]}>Base currency</Text>
                <View style={styles.currencyTriggerRow}>
                  <Text style={[styles.currencyTriggerValue, { color: theme.text }]}>{editBaseCurrency}</Text>
                  <MaterialCommunityIcons name={currencyExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
                </View>
              </Pressable>
              {currencyExpanded && (
                <View style={[styles.currencyDropdown, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  {CURRENCY_OPTIONS.map(opt => (
                    <Pressable
                      key={opt}
                      onPress={() => { setEditBaseCurrency(opt); setCurrencyExpanded(false); }}
                      style={({ pressed }) => [styles.currencyOption, { borderBottomColor: theme.divider }, pressed && { backgroundColor: theme.cardAlt }]}
                    >
                      <Text style={[styles.currencyOptionText, { color: theme.text }]}>{opt}</Text>
                      {opt === editBaseCurrency && <MaterialCommunityIcons name="check" size={16} color={theme.primary} />}
                    </Pressable>
                  ))}
                </View>
              )}
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>Allow multiple currencies</Text>
                <Switch
                  value={editMultiCurrency}
                  onValueChange={setEditMultiCurrency}
                  trackColor={{ true: theme.primary, false: theme.borderStrong }}
                  thumbColor="#FFFFFF"
                />
              </View>
              {expenses.length > 0 ? (
                <Text style={[styles.helperText, { color: theme.textMuted }]}>
                  Base currency can't be changed after expenses exist.
                </Text>
              ) : null}
            </View>
            {error ? (
              <Text style={[styles.errorText, { color: theme.error, marginHorizontal: 20, marginBottom: 8 }]}>{error}</Text>
            ) : null}
            <View style={styles.editActions}>
              <SecondaryButton onPress={() => { setEditMode(false); setCurrencyExpanded(false); }} disabled={busy} style={styles.flex1} size="lg">
                Cancel
              </SecondaryButton>
              <PrimaryButton onPress={handleSaveDetails} loading={busy} disabled={busy} style={styles.flex1} size="lg">
                Save
              </PrimaryButton>
            </View>
            {adminUser && (
              <Pressable
                onPress={() => { setEditMode(false); setCurrencyExpanded(false); setConfirmVisible(true); }}
                style={styles.deleteRow}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.error} />
                <Text style={[styles.deleteText, { color: theme.error }]}>Delete group</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
      )}

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete group"
        message="Are you sure you want to delete this group?"
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleConfirm}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3,
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  scroll: { paddingBottom: 24 },
  cardWrap: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 },
  balanceCard: {
    borderRadius: 18, padding: 18, overflow: 'hidden', position: 'relative',
  },
  decoCircle: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  balanceRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  balanceLeft: { flex: 1 },
  balanceLabel: {
    fontSize: 12, fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.85)', letterSpacing: 0.6, textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 32, fontFamily: 'Inter_700Bold', color: '#fff',
    letterSpacing: -0.8, marginTop: 4, lineHeight: 36,
  },
  balanceHint: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.85)', marginTop: 2,
  },
  settleBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    height: 36, paddingHorizontal: 14, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  settleBtnText: {
    color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold',
  },
  cardDivider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.16)', marginTop: 16, marginBottom: 14,
  },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberCount: {
    fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.85)',
  },
  segmentedWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  dateGroup: { paddingHorizontal: 16, marginBottom: 12 },
  dateLabel: {
    fontSize: 12, fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.6, textTransform: 'uppercase',
    paddingVertical: 8, paddingHorizontal: 2,
  },
  expenseCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  noMembersCard: {
    margin: 16, borderRadius: 16, borderWidth: 1, padding: 20, gap: 12, alignItems: 'center',
  },
  noMembersText: {
    textAlign: 'center', fontSize: 14, fontFamily: 'Inter_400Regular',
  },
  errorText: {
    textAlign: 'center', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 8,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  editSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, paddingBottom: 32,
  },
  pickerSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, paddingBottom: 32,
  },
  sheetHandle: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 5, borderRadius: 3 },
  sheetTitle: {
    fontSize: 17, fontFamily: 'Inter_600SemiBold', paddingHorizontal: 20, paddingBottom: 12,
  },
  editFields: { paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  currencyTrigger: { borderWidth: 1, borderRadius: 10, padding: 12 },
  currencyTriggerLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  currencyTriggerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  currencyTriggerValue: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  currencyDropdown: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  currencyOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  currencyOptionText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  toggleLabel: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  helperText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  editActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 12 },
  flex1: { flex: 1 },
  deleteRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8,
  },
  deleteText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerOption: { fontSize: 16, fontFamily: 'Inter_400Regular' },
});
