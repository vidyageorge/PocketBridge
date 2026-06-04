import { getCachedStoreValue, setCachedStoreValue } from '@/lib/dataBackend';
import { STORE_KEYS } from '@/lib/storeKeys';
import type { Transaction } from '@/types/transaction';

export { STORE_KEYS } from '@/lib/storeKeys';
export const STORAGE_KEY = STORE_KEYS.TRANSACTIONS;

function normalizeTransaction(raw: Transaction): Transaction {
  const withdrawal =
    raw.withdrawal ?? (raw.type === 'expense' ? raw.amount : undefined);
  const deposit = raw.deposit ?? (raw.type === 'income' ? raw.amount : undefined);

  return {
    id: raw.id,
    date: raw.date,
    valueDate: raw.valueDate,
    desc: raw.desc,
    clientName: raw.clientName,
    spentBy: raw.spentBy,
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
  const stored = getCachedStoreValue<Transaction[] | null>(STORE_KEYS.TRANSACTIONS, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return seedTransactions();
  }

  return stored.map(normalizeTransaction);
}

export function saveTransactions(transactions: Transaction[]): void {
  setCachedStoreValue(STORE_KEYS.TRANSACTIONS, transactions);
}

export function seedTransactions(): Transaction[] {
  const seeded: Transaction[] = [];
  saveTransactions(seeded);
  return seeded;
}

export function getNextTransactionId(transactions: Transaction[]): number {
  if (transactions.length === 0) {
    return 1;
  }
  return Math.max(...transactions.map((transaction) => transaction.id)) + 1;
}
