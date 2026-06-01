const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatCurrencySigned(amount: number, type: 'income' | 'expense'): string {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}${currencyFormatter.format(amount)}`;
}
