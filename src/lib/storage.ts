import type { Transaction } from '@/types/transaction';
import { SEED_TRANSACTIONS, STORAGE_KEY } from '@/lib/constants';

export function loadTransactions(): Transaction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return seedTransactions();
    }

    const parsed = JSON.parse(stored) as Transaction[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return seedTransactions();
    }

    return parsed;
  } catch {
    return seedTransactions();
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function seedTransactions(): Transaction[] {
  const seeded = SEED_TRANSACTIONS.map((transaction, index) => ({
    id: index + 1,
    ...transaction,
  }));
  saveTransactions(seeded);
  return seeded;
}

export function getNextTransactionId(transactions: Transaction[]): number {
  if (transactions.length === 0) {
    return 1;
  }
  return Math.max(...transactions.map((transaction) => transaction.id)) + 1;
}
