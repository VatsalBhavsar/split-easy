import { FxLock } from './fx';

export type SplitType = 'EQUAL' | 'AMOUNT' | 'PERCENT' | 'SHARES';

export type ExpenseSplit = {
  owed: number;
  percent?: number;
  shares?: number;
};

export type Expense = {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  baseCurrency?: string;
  amountInBase?: number;
  splitsInBase?: Record<string, ExpenseSplit>;
  fx?: FxLock;
  categoryId?: string | null;
  paidBy: string;
  splitType: SplitType;
  participants: string[];
  splits: Record<string, ExpenseSplit>;
  createdBy: string;
  expenseDate?: any;
  createdAt?: any;
  updatedAt?: any;
};

export type ExpenseActivity = {
  id: string;
  type: 'EXPENSE_CREATED' | 'EXPENSE_UPDATED';
  groupId: string;
  expenseId: string;
  actorId: string;
  message: string;
  createdAt?: any;
};
