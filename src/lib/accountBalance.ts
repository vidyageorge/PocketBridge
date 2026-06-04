import { filterTransactions } from '@/lib/filters';
import { MONTHS } from '@/lib/constants';
import type { AccountBalanceInfo, AccountBalanceSnapshot } from '@/types/accountBalance';
import type { MonthFilter, Transaction, YearFilter } from '@/types/transaction';

function matchesPeriodDate(
  isoDate: string,
  month: MonthFilter,
  year: YearFilter,
): boolean {
  const [yearPart, monthPart] = isoDate.split('-').map(Number);
  if (!yearPart || !monthPart) {
    return false;
  }
  if (year !== 'all' && yearPart !== year) {
    return false;
  }
  if (month !== 'all' && monthPart !== month) {
    return false;
  }
  return true;
}

function findSnapshotForPeriod(
  snapshots: AccountBalanceSnapshot[],
  month: MonthFilter,
  year: YearFilter,
): AccountBalanceSnapshot | null {
  const matches = snapshots.filter((snapshot) => matchesPeriodDate(snapshot.asOnDate, month, year));
  if (matches.length === 0) {
    return null;
  }
  return matches.sort((left, right) => right.asOnDate.localeCompare(left.asOnDate))[0];
}

/**
 * Bank closing balance from statement summary or last running balance in the period.
 */
function isOnOrBefore(isoDate: string, asOnDate: string): boolean {
  return isoDate.localeCompare(asOnDate) <= 0;
}

export function getBankBalanceAsOn(
  transactions: Transaction[],
  snapshots: AccountBalanceSnapshot[],
  month: MonthFilter,
  year: YearFilter,
  asOnDate?: string | null,
): AccountBalanceInfo | null {
  let bankTransactions = transactions.filter((transaction) => transaction.source === 'bank');

  if (asOnDate) {
    bankTransactions = bankTransactions.filter((transaction) =>
      isOnOrBefore(transaction.date, asOnDate),
    );
  } else {
    bankTransactions = filterTransactions(bankTransactions, month, year);
  }

  if (bankTransactions.length === 0) {
    return null;
  }

  const snapshot = asOnDate
    ? [...snapshots]
        .filter((entry) => isOnOrBefore(entry.asOnDate, asOnDate))
        .sort((left, right) => right.asOnDate.localeCompare(left.asOnDate))[0] ?? null
    : findSnapshotForPeriod(snapshots, month, year);

  if (snapshot) {
    return {
      balance: snapshot.balance,
      asOnDate: snapshot.asOnDate,
      origin: 'statement',
    };
  }

  const withBalance = bankTransactions
    .filter((transaction) => transaction.balance !== undefined && transaction.balance > 0)
    .sort((left, right) => {
      const dateCompare = (right.date || '').localeCompare(left.date || '');
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return right.id - left.id;
    });

  const latest = withBalance[0];
  if (!latest || latest.balance === undefined) {
    return null;
  }

  return {
    balance: latest.balance,
    asOnDate: latest.date,
    origin: 'running',
  };
}

/**
 * Cash ledger balance: net of all cash entries through the end of the selected period.
 */
export function getCashBalanceAsOn(
  transactions: Transaction[],
  month: MonthFilter,
  year: YearFilter,
  asOnDate?: string | null,
): AccountBalanceInfo | null {
  let cashTransactions = transactions.filter((transaction) => transaction.source === 'cash');

  if (asOnDate) {
    cashTransactions = cashTransactions.filter((transaction) =>
      isOnOrBefore(transaction.date, asOnDate),
    );
  } else {
    cashTransactions = cashTransactions.filter((transaction) => {
      const [yearPart, monthPart] = transaction.date.split('-').map(Number);
      if (!yearPart || !monthPart) {
        return false;
      }
      if (year !== 'all' && yearPart > year) {
        return false;
      }
      if (year !== 'all' && yearPart === year && month !== 'all' && monthPart > month) {
        return false;
      }
      return true;
    });
  }

  cashTransactions = cashTransactions.sort((left, right) => right.date.localeCompare(left.date));

  if (cashTransactions.length === 0) {
    return null;
  }

  const balance = cashTransactions.reduce(
    (total, transaction) =>
      total + (transaction.type === 'income' ? transaction.amount : -transaction.amount),
    0,
  );

  const latestDate = cashTransactions[0]?.date ?? '';

  return {
    balance,
    asOnDate: latestDate,
    origin: 'running',
  };
}

export function formatAsOnLabel(isoDate: string): string {
  const [yearPart, monthPart, dayPart] = isoDate.split('-').map(Number);
  if (!yearPart || !monthPart || !dayPart) {
    return isoDate;
  }

  const monthName = MONTHS.find((entry) => entry.value === monthPart)?.label ?? String(monthPart);
  return `${dayPart} ${monthName} ${yearPart}`;
}
