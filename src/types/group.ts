import { Timestamp } from 'firebase/firestore';

export type Group = {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: string[];
  admins: string[];
  currency?: string;
  baseCurrency?: string;
  supportedCurrencies?: string[];
  multiCurrencyEnabled?: boolean;
  inviteCode?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
