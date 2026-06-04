import type { MonthFilter, Transaction, YearFilter } from '@/types/transaction';

export type DashboardPeriod = {
  /** ISO date of the most recently inserted bank/cash transaction. */
  asOnDate: string | null;
  month: MonthFilter;
  year: YearFilter;
};

/**
 * Picks the latest inserted transaction (highest id) to anchor dashboard dates.
 */
export function getLatestInsertedTransaction(
  transactions: Transaction[],
): Transaction | null {
  if (transactions.length === 0) {
    return null;
  }

  return transactions.reduce((latest, transaction) =>
    transaction.id > latest.id ? transaction : latest,
  );
}

/**
 * Derives dashboard month/year and as-on date from the last inserted record.
 */
export function getDashboardPeriodFromTransactions(
  transactions: Transaction[],
): DashboardPeriod {
  const latest = getLatestInsertedTransaction(transactions);

  if (!latest) {
    return { asOnDate: null, month: 'all', year: 'all' };
  }

  const [yearPart, monthPart] = latest.date.split('-').map(Number);

  return {
    asOnDate: latest.date,
    month: monthPart ?? 'all',
    year: yearPart ?? 'all',
  };
}

/**
 * Keeps only transactions on or before the dashboard as-on date.
 */
export function filterTransactionsThroughAsOn(
  transactions: Transaction[],
  asOnDate: string | null,
): Transaction[] {
  if (!asOnDate) {
    return transactions;
  }

  return transactions.filter((transaction) => transaction.date.localeCompare(asOnDate) <= 0);
}
