import type { Transaction } from '@/types/transaction';

export function sortTransactionsByDate(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((left, right) => {
    const dateCompare = right.date.localeCompare(left.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return right.id - left.id;
  });
}
