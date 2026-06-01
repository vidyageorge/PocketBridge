import type { MonthFilter, Transaction, YearFilter } from '@/types/transaction';

export function filterTransactions(
  transactions: Transaction[],
  month: MonthFilter,
  year: YearFilter,
): Transaction[] {
  return transactions.filter((transaction) => {
    const [yearPart, monthPart] = transaction.date.split('-').map(Number);
    if (year !== 'all' && yearPart !== year) {
      return false;
    }
    if (month !== 'all' && monthPart !== month) {
      return false;
    }
    return true;
  });
}

export function getAvailableYears(transactions: Transaction[]): number[] {
  const years = new Set(transactions.map((transaction) => Number(transaction.date.split('-')[0])));
  const currentYear = new Date().getFullYear();
  years.add(currentYear);
  return Array.from(years).sort((a, b) => b - a);
}

export function computeSummary(transactions: Transaction[]) {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactionCount: transactions.length,
  };
}

export function getExpensesByCategory(transactions: Transaction[]) {
  const categoryMap = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      categoryMap.set(transaction.cat, (categoryMap.get(transaction.cat) ?? 0) + transaction.amount);
    });

  return Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getBankCashSplit(transactions: Transaction[]) {
  const bankTotal = transactions
    .filter((transaction) => transaction.source === 'bank')
    .reduce((sum, transaction) => {
      return transaction.type === 'income'
        ? sum + transaction.amount
        : sum - transaction.amount;
    }, 0);

  const cashTotal = transactions
    .filter((transaction) => transaction.source === 'cash')
    .reduce((sum, transaction) => {
      return transaction.type === 'income'
        ? sum + transaction.amount
        : sum - transaction.amount;
    }, 0);

  return [
    { source: 'Bank', amount: Math.abs(bankTotal), net: bankTotal },
    { source: 'Cash', amount: Math.abs(cashTotal), net: cashTotal },
  ];
}

export function buildExportFilename(
  source: 'bank' | 'cash',
  month: MonthFilter,
  year: YearFilter,
): string {
  const yearPart = year === 'all' ? 'all' : String(year);
  const monthPart = month === 'all' ? 'all' : String(month).padStart(2, '0');
  return `PocketBridge_${source}_${yearPart}-${monthPart}.xlsx`;
}
