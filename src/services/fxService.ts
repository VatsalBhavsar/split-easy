import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FxRatesDoc } from '../types/fx';
import { getDateKey } from '../utils/dateKey';

const ratesCache = new Map<string, FxRatesDoc>();
const fxColPath = 'fxRates';

type ConvertInput = {
  amount: number;
  fromCurrency: string;
  groupBaseCurrency: string;
  dateKey: string;
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function round6(n: number) {
  return Math.round((n + Number.EPSILON) * 1_000_000) / 1_000_000;
}

export async function getRate(dateKey: string): Promise<FxRatesDoc> {
  const cached = ratesCache.get(dateKey);
  if (cached) return cached;

  const ref = doc(db, fxColPath, dateKey);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const docData = { ...(snap.data() as any) } as FxRatesDoc;
    ratesCache.set(dateKey, docData);
    return docData;
  }

  const res = await fetch(`https://api.frankfurter.app/${dateKey}?from=EUR`);
  if (!res.ok) {
    throw new Error('Unable to fetch FX rates');
  }
  const data = await res.json();
  const payload: FxRatesDoc = {
    dateKey,
    base: data.base || 'EUR',
    rates: data.rates || {},
    source: 'ECB',
    fetchedAt: serverTimestamp() as any,
  };
  await setDoc(ref, payload, { merge: true });
  ratesCache.set(dateKey, payload);
  return payload;
}

export function getDateKeyForExpense(expenseDate: Date) {
  return getDateKey(expenseDate);
}

export async function convertToBase({ amount, fromCurrency, groupBaseCurrency, dateKey }: ConvertInput) {
  const safeAmount = Number(amount) || 0;
  if (fromCurrency === groupBaseCurrency) {
    return {
      amountInBase: round2(safeAmount),
      rateToBase: 1,
      fx: {
        dateKey,
        source: 'ECB' as const,
        base: 'EUR',
        rateToBase: 1,
      },
    };
  }

  const ratesDoc = await getRate(dateKey);
  const rates = { ...ratesDoc.rates, EUR: 1 };
  const fromRate = rates[fromCurrency];
  const baseRate = rates[groupBaseCurrency];

  if (!fromRate || !baseRate) {
    throw new Error('FX rate not available for selected currency');
  }

  const amountInEUR = safeAmount / fromRate;
  const amountInBase = amountInEUR * baseRate;
  const rateToBase = round6(amountInBase / safeAmount);

  return {
    amountInBase: round2(amountInBase),
    rateToBase,
    fx: {
      dateKey,
      source: 'ECB' as const,
      base: 'EUR',
      rateToBase,
    },
  };
}
