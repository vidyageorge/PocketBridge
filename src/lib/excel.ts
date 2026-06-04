import * as XLSX from 'xlsx';
import { buildExportFilename, computeSummary, filterTransactions } from '@/lib/filters';
import { sortTransactionsByDate } from '@/lib/statement';
import type { MonthFilter, Transaction, TransactionSource, YearFilter } from '@/types/transaction';

function mapTransactionToExportRow(transaction: Transaction) {
  return {
    'Tran Date': transaction.date,
    'Value Date': transaction.valueDate ?? transaction.date,
    Particulars: transaction.desc,
    Client: transaction.clientName ?? '',
    'Spent by': transaction.spentBy ?? '',
    Location: transaction.location ?? '',
    'Chq.No': transaction.chqNo ?? '',
    Withdrawals:
      transaction.withdrawal ??
      (transaction.type === 'expense' ? transaction.amount : ''),
    Deposits:
      transaction.deposit ?? (transaction.type === 'income' ? transaction.amount : ''),
    'Balance (INR)': transaction.balance ?? '',
    Category: transaction.cat,
    Source: transaction.source,
  };
}

function buildCombinedExportFilename(month: MonthFilter, year: YearFilter): string {
  const yearPart = year === 'all' ? 'all' : String(year);
  const monthPart = month === 'all' ? 'all' : String(month).padStart(2, '0');
  return `PocketBridge_combined_${yearPart}-${monthPart}.xlsx`;
}

export function exportTransactionsToExcel(
  transactions: Transaction[],
  source: TransactionSource,
  month: MonthFilter,
  year: YearFilter,
): void {
  const filtered = filterTransactions(
    transactions.filter((transaction) => transaction.source === source),
    month,
    year,
  );

  const transactionRows = filtered.map(mapTransactionToExportRow);

  const summary = computeSummary(filtered);
  const summaryRows = [
    { Metric: 'Total Income', Value: summary.totalIncome },
    { Metric: 'Total Expenses', Value: summary.totalExpenses },
    { Metric: 'Net Balance', Value: summary.netBalance },
    { Metric: 'Transaction Count', Value: summary.transactionCount },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(transactionRows),
    'Transactions',
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

  XLSX.writeFile(workbook, buildExportFilename(source, month, year));
}

/** Export bank and cash lines together for the Combined Statement tab. */
export function exportCombinedStatementToExcel(
  transactions: Transaction[],
  month: MonthFilter,
  year: YearFilter,
): void {
  const filtered = sortTransactionsByDate(filterTransactions(transactions, month, year));
  const transactionRows = filtered.map(mapTransactionToExportRow);

  const summary = computeSummary(filtered);
  const bankOnly = filtered.filter((transaction) => transaction.source === 'bank');
  const cashOnly = filtered.filter((transaction) => transaction.source === 'cash');
  const bankSummary = computeSummary(bankOnly);
  const cashSummary = computeSummary(cashOnly);

  const summaryRows = [
    { Section: 'Overall', Metric: 'Total Income', Value: summary.totalIncome },
    { Section: 'Overall', Metric: 'Total Expenses', Value: summary.totalExpenses },
    { Section: 'Overall', Metric: 'Net Balance', Value: summary.netBalance },
    { Section: 'Overall', Metric: 'Transaction Count', Value: summary.transactionCount },
    { Section: 'Bank', Metric: 'Total Income', Value: bankSummary.totalIncome },
    { Section: 'Bank', Metric: 'Total Expenses', Value: bankSummary.totalExpenses },
    { Section: 'Bank', Metric: 'Net Balance', Value: bankSummary.netBalance },
    { Section: 'Cash', Metric: 'Total Income', Value: cashSummary.totalIncome },
    { Section: 'Cash', Metric: 'Total Expenses', Value: cashSummary.totalExpenses },
    { Section: 'Cash', Metric: 'Net Balance', Value: cashSummary.netBalance },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(transactionRows),
    'Combined Statement',
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

  XLSX.writeFile(workbook, buildCombinedExportFilename(month, year));
}
