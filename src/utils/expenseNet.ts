import { Expense } from '../types/expense';

export function computeExpenseNetForUser(expense: Expense, userId: string) {
  const total = expense.amountInBase ?? expense.amount ?? 0;
  const splits = expense.splitsInBase || expense.splits || {};
  const owedByUser = splits?.[userId]?.owed || 0;
  if (expense.paidBy === userId) {
    return total - owedByUser;
  }
  return -owedByUser;
}
