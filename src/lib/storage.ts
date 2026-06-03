import type { Transaction } from '@/types/transaction';
import { SEED_TRANSACTIONS, STORAGE_KEY } from '@/lib/constants';

function normalizeTransaction(raw: Transaction): Transaction {
  const withdrawal =
    raw.withdrawal ?? (raw.type === 'expense' ? raw.amount : undefined);
  const deposit = raw.deposit ?? (raw.type === 'income' ? raw.amount : undefined);

  return {
    id: raw.id,
    date: raw.date,
    valueDate: raw.valueDate,
    desc: raw.desc,
    location: raw.location,
    chqNo: raw.chqNo,
    mode: raw.mode,
    withdrawal: withdrawal && withdrawal > 0 ? withdrawal : undefined,
    deposit: deposit && deposit > 0 ? deposit : undefined,
    balance: raw.balance,
    cat: raw.cat,
    type: raw.type,
    amount: raw.amount,
    source: raw.source,
  };
}

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

    return parsed.map(normalizeTransaction);
  } catch {
    return seedTransactions();
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function seedTransactions(): Transaction[] {
  const seeded = SEED_TRANSACTIONS.map((transaction, index) =>
    normalizeTransaction({
      id: index + 1,
      ...transaction,
    }),
  );
  saveTransactions(seeded);
  return seeded;
}

export function getNextTransactionId(transactions: Transaction[]): number {
  if (transactions.length === 0) {
    return 1;
  }
  return Math.max(...transactions.map((transaction) => transaction.id)) + 1;
}
