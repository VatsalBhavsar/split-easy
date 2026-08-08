export type GroupBalance = {
  userId: string;
  groupId: string;
  netBalance: number;
  updatedAt?: any;
};

export type SimplifiedDebt = {
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  groupId: string;
  updatedAt?: any;
};
