export type FxRatesDoc = {
  dateKey: string;
  base: string;
  rates: Record<string, number>;
  source: 'ECB';
  fetchedAt?: any;
};

export type FxLock = {
  dateKey: string;
  source: 'ECB';
  base: string;
  rateToBase: number;
};
