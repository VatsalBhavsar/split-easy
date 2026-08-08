import { SimplifiedDebt } from '../types/balance';

type BalanceMap = Record<string, number>;

export function simplifyDebts(members: string[], balances: BalanceMap, currency: string): SimplifiedDebt[] {
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  members.forEach((id) => {
    const bal = round2(balances[id] || 0);
    if (bal > 0.009) creditors.push({ userId: id, amount: bal });
    else if (bal < -0.009) debtors.push({ userId: id, amount: Math.abs(bal) });
  });

  creditors.sort((a, b) => a.userId.localeCompare(b.userId));
  debtors.sort((a, b) => a.userId.localeCompare(b.userId));

  const result: SimplifiedDebt[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const transfer = round2(Math.min(debtor.amount, creditor.amount));
    if (transfer > 0.009) {
      result.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: transfer,
        currency,
        groupId: '',
      });
    }
    debtor.amount = round2(debtor.amount - transfer);
    creditor.amount = round2(creditor.amount - transfer);
    if (debtor.amount < 0.009) i += 1;
    if (creditor.amount < 0.009) j += 1;
  }

  return result;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
