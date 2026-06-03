import * as XLSX from 'xlsx';
import { buildExportFilename, computeSummary, filterTransactions } from '@/lib/filters';
import type { MonthFilter, Transaction, TransactionSource, YearFilter } from '@/types/transaction';

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

  const transactionRows = filtered.map((transaction) => ({
    'Tran Date': transaction.date,
    'Value Date': transaction.valueDate ?? transaction.date,
    Particulars: transaction.desc,
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
  }));

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
