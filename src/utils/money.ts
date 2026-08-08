export function formatCurrency(amount: number, currency: string) {
  if (Number.isNaN(amount)) return '0';
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  } catch {
    const value = Math.round(amount * 100) / 100;
    return `${currency} ${value}`;
  }
}
