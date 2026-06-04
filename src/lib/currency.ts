const CRORE = 10_000_000;
const LAKH = 100_000;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Full INR with Indian digit grouping and paise (matches ICICI statements).
 */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatCurrencySigned(amount: number, type: 'income' | 'expense'): string {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}${currencyFormatter.format(amount)}`;
}

/**
 * Lakh / crore shorthand for large dashboard figures (e.g. "1.91 Cr", "1.39 L").
 */
export function formatIndianAmountUnit(amount: number): string | undefined {
  const absoluteAmount = Math.abs(amount);

  if (absoluteAmount >= CRORE) {
    const value = absoluteAmount / CRORE;
    const formatted = numberFormatter.format(value).replace(/\.00$/, '');
    const sign = amount < 0 ? '-' : '';
    return `${sign}${formatted} Cr`;
  }

  if (absoluteAmount >= LAKH) {
    const value = absoluteAmount / LAKH;
    const formatted = numberFormatter.format(value).replace(/\.00$/, '');
    const sign = amount < 0 ? '-' : '';
    return `${sign}${formatted} L`;
  }

  return undefined;
}

/**
 * Chart axis labels in Indian units (Cr / L / K), not Western "k".
 */
export function formatIndianChartAxis(value: number): string {
  const absoluteValue = Math.abs(Number(value));
  const sign = Number(value) < 0 ? '-' : '';

  if (absoluteValue >= CRORE) {
    return `${sign}₹${(absoluteValue / CRORE).toFixed(1)} Cr`;
  }

  if (absoluteValue >= LAKH) {
    return `${sign}₹${(absoluteValue / LAKH).toFixed(1)} L`;
  }

  if (absoluteValue >= 1_000) {
    return `${sign}₹${(absoluteValue / 1_000).toFixed(0)} K`;
  }

  return `${sign}₹${absoluteValue}`;
}
