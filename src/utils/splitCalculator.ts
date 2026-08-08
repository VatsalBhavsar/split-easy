import { SplitType, ExpenseSplit } from '../types/expense';

type SplitInput = {
  total: number;
  splitType: SplitType;
  participants: string[];
  values?: Record<string, number>;
};

export function calculateSplits({ total, splitType, participants, values = {} }: SplitInput): Record<string, ExpenseSplit> {
  const safeTotal = Number(total) || 0;
  const count = participants.length || 1;
  const base: Record<string, ExpenseSplit> = {};

  if (splitType === 'EQUAL') {
    const rawShare = safeTotal / count;
    let remainder = round2(safeTotal - rawShare * count);
    participants.forEach((id, index) => {
      let owed = round2(rawShare);
      if (remainder !== 0 && index < Math.abs(Math.round(remainder * 100))) {
        owed = round2(owed + Math.sign(remainder) * 0.01);
      }
      base[id] = { owed };
    });
    return base;
  }

  if (splitType === 'AMOUNT') {
    participants.forEach((id) => {
      const v = Number(values[id]) || 0;
      base[id] = { owed: round2(v) };
    });
    // adjust rounding if totals slightly off
    return balanceToTotal(base, safeTotal);
  }

  if (splitType === 'PERCENT') {
    let sumPercent = 0;
    participants.forEach((id) => {
      sumPercent += Number(values[id]) || 0;
    });
    const factor = sumPercent === 0 ? 0 : safeTotal / sumPercent;
    participants.forEach((id) => {
      const p = Number(values[id]) || 0;
      base[id] = { owed: round2(p * factor), percent: p };
    });
    return balanceToTotal(base, safeTotal);
  }

  // SHARES
  let totalShares = 0;
  participants.forEach((id) => {
    totalShares += Number(values[id]) || 0;
  });
  const divisor = totalShares || participants.length;
  const shareValue = divisor ? safeTotal / divisor : 0;
  participants.forEach((id) => {
    const s = Number(values[id]) || 0;
    base[id] = { owed: round2(shareValue * s), shares: s };
  });
  return balanceToTotal(base, safeTotal);
}

function balanceToTotal(splits: Record<string, ExpenseSplit>, total: number) {
  const entries = Object.entries(splits);
  let sum = round2(entries.reduce((acc, [, v]) => acc + (v.owed || 0), 0));
  let diff = round2(total - sum);
  if (Math.abs(diff) < 0.01 && diff !== 0) diff = round2(diff);
  if (diff !== 0 && entries.length) {
    const step = diff > 0 ? 0.01 : -0.01;
    let remaining = Math.round(Math.abs(diff) * 100);
    let i = 0;
    while (remaining > 0) {
      const key = entries[i % entries.length][0];
      splits[key].owed = round2((splits[key].owed || 0) + step);
      remaining -= 1;
      i += 1;
    }
  }
  return splits;
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

