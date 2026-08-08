import { FxLock } from './fx';

export type Settlement = {
  id: string;
  groupId: string;
  createdBy: string;
  paidBy: string;
  paidTo: string;
  amount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  baseCurrency?: string;
  amountInBase?: number;
  fx?: FxLock;
  method: 'CASH' | 'UPI' | 'MANUAL';
  note?: string;
  status: 'COMPLETED';
  settledAt?: any;
  createdAt?: any;
};
