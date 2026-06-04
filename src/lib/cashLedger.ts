import type { Transaction } from '@/types/transaction';

export type CashLedgerRow = Transaction & {
  moneyIn: number;
  moneyOut: number;
  runningBalance: number;
};

export type CashLedgerSummary = {
  receivedFromClients: number;
  pettyCashSpent: number;
  netRemaining: number;
  entryCount: number;
};

/**
 * Builds cash ledger rows with running balance in date order.
 */
export function buildCashLedgerRows(transactions: Transaction[]): CashLedgerRow[] {
  const sorted = [...transactions]
    .filter((transaction) => transaction.source === 'cash')
    .sort((left, right) => {
      const dateCompare = left.date.localeCompare(right.date);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return left.id - right.id;
    });

  let runningBalance = 0;

  return sorted.map((transaction) => {
    const moneyIn = transaction.type === 'income' ? transaction.amount : 0;
    const moneyOut = transaction.type === 'expense' ? transaction.amount : 0;
    runningBalance += moneyIn - moneyOut;

    return {
      ...transaction,
      moneyIn,
      moneyOut,
      runningBalance,
    };
  });
}

/**
 * Summarizes cash received, spent, and net for a set of ledger rows.
 */
export function summarizeCashLedger(rows: CashLedgerRow[]): CashLedgerSummary {
  const receivedFromClients = rows
    .filter((row) => row.type === 'income')
    .reduce((total, row) => total + row.moneyIn, 0);

  const pettyCashSpent = rows
    .filter((row) => row.type === 'expense')
    .reduce((total, row) => total + row.moneyOut, 0);

  const netRemaining = receivedFromClients - pettyCashSpent;

  return {
    receivedFromClients,
    pettyCashSpent,
    netRemaining,
    entryCount: rows.length,
  };
}
