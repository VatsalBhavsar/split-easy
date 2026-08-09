import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, Platform } from 'react-native';
import { SplitType } from '../types/expense';
import { UserProfile } from '../types/user';
import { calculateSplits } from '../utils/splitCalculator';
import SegmentedControl from '../ui/SegmentedControl';
import { useAppTheme } from '../theme';
import { spacing } from '../theme/tokens';

type Props = {
  total: number;
  splitType: SplitType;
  participants: string[];
  members: UserProfile[];
  values: Record<string, number>;
  onChangeValues: (next: Record<string, number>) => void;
  onChangeSplitType: (type: SplitType) => void;
};

export default function SplitEditor({
  total,
  splitType,
  participants,
  members,
  values,
  onChangeValues,
  onChangeSplitType,
}: Props) {
  const theme = useAppTheme();

  const splits = useMemo(
    () => calculateSplits({ total, splitType, participants, values }),
    [total, splitType, participants, values],
  );

  const handleValueChange = (id: string, val: string) => {
    onChangeValues({ ...values, [id]: Number(val) || 0 });
  };

  const percentTotal = useMemo(
    () => participants.reduce((acc, id) => acc + (Number(values[id]) || 0), 0),
    [participants, values],
  );

  const splitTotal = participants.reduce((acc, id) => acc + (splits[id]?.owed || 0), 0);
  const diff = (total || 0) - splitTotal;

  const inputStyle = [
    styles.input,
    {
      borderColor: theme.border,
      backgroundColor: theme.surface,
      color: theme.text,
    },
    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
  ];

  const renderRow = (id: string) => {
    const profile = members.find((m) => m.id === id);
    const label = profile?.displayName || profile?.email || id;
    const owed = splits[id]?.owed || 0;
    return (
      <View key={id} style={styles.row}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        {splitType === 'EQUAL' ? (
          <Text style={[styles.rowAmount, { color: theme.textSec }]}>{owed.toFixed(2)}</Text>
        ) : splitType === 'AMOUNT' ? (
          <TextInput
            keyboardType="numeric"
            value={String(values[id] ?? '')}
            onChangeText={(t) => handleValueChange(id, t)}
            style={inputStyle}
            placeholderTextColor={theme.placeholder}
            placeholder="0.00"
          />
        ) : splitType === 'PERCENT' ? (
          <View style={styles.rowInline}>
            <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <TextInput
                keyboardType="numeric"
                value={String(values[id] ?? '')}
                onChangeText={(t) => handleValueChange(id, t)}
                style={[styles.inputInner, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                placeholderTextColor={theme.placeholder}
                placeholder="0"
              />
              <Text style={[styles.suffix, { color: theme.textMuted }]}>%</Text>
            </View>
            <Text style={[styles.rowAmount, { color: theme.textSec }]}>{owed.toFixed(2)}</Text>
          </View>
        ) : (
          // SHARES
          <View style={styles.rowInline}>
            <Pressable
              style={[styles.stepBtn, { borderColor: theme.border }]}
              onPress={() => handleValueChange(id, String(Math.max(0, (values[id] || 0) - 1)))}
            >
              <Text style={[styles.stepLabel, { color: theme.text }]}>−</Text>
            </Pressable>
            <TextInput
              keyboardType="numeric"
              value={String(values[id] ?? 0)}
              onChangeText={(t) => handleValueChange(id, t)}
              style={[inputStyle, styles.shareInput]}
              placeholderTextColor={theme.placeholder}
            />
            <Pressable
              style={[styles.stepBtn, { borderColor: theme.border }]}
              onPress={() => handleValueChange(id, String((values[id] || 0) + 1))}
            >
              <Text style={[styles.stepLabel, { color: theme.text }]}>+</Text>
            </Pressable>
            <Text style={[styles.rowAmount, { color: theme.textSec }]}>{owed.toFixed(2)}</Text>
          </View>
        )}
      </View>
    );
  };

  const splitSummary =
    splitType === 'EQUAL'
      ? 'Split equally'
      : splitType === 'AMOUNT'
      ? 'Custom amounts'
      : splitType === 'PERCENT'
      ? 'Percentages'
      : 'Shares';

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Split with</Text>
      <SegmentedControl
        value={splitType}
        onValueChange={(v) => onChangeSplitType(v as SplitType)}
        buttons={[
          { value: 'EQUAL', label: 'Equal' },
          { value: 'AMOUNT', label: 'Amounts' },
          { value: 'PERCENT', label: 'Percent' },
          { value: 'SHARES', label: 'Shares' },
        ]}
        style={styles.segmented}
      />

      <View style={styles.rows}>{participants.map(renderRow)}</View>

      <View style={[styles.summary, { borderTopColor: theme.divider }]}>
        <Text style={[styles.summaryText, { color: theme.textMuted }]}>{splitSummary}</Text>
        <Text style={[styles.summaryText, { color: theme.textMuted }]}>
          Total: {(total || 0).toFixed(2)} · Split: {splitTotal.toFixed(2)}
          {splitType === 'PERCENT' ? ` · %: ${percentTotal}` : ''}
          {splitType === 'AMOUNT' || splitType === 'SHARES' ? ` · Remaining: ${diff.toFixed(2)}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  segmented: {
    marginTop: 4,
  },
  rows: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    letterSpacing: -0.1,
  },
  rowAmount: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontVariant: ['tabular-nums'],
    minWidth: 60,
    textAlign: 'right',
  },
  rowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  input: {
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    minWidth: 80,
    textAlign: 'right',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    minWidth: 80,
  },
  inputInner: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
  },
  suffix: {
    fontSize: 13,
    marginLeft: 2,
  },
  shareInput: {
    minWidth: 52,
    textAlign: 'center',
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 22,
  },
  summary: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    gap: 2,
  },
  summaryText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
