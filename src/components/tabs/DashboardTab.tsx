import { useMemo, useState } from 'react';
import {
  computeSummary,
  filterTransactions,
  getBankCashSplit,
  getExpensesByCategory,
} from '@/lib/filters';
import { useTransactions } from '@/context/TransactionContext';
import { BankCashChart } from '@/components/dashboard/BankCashChart';
import { ExpenseByCategoryChart } from '@/components/dashboard/ExpenseByCategoryChart';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { MonthYearFilter } from '@/components/filters/MonthYearFilter';
import type { MonthFilter, YearFilter } from '@/types/transaction';

export function DashboardTab() {
  const { transactions } = useTransactions();
  const now = new Date();
  const [month, setMonth] = useState<MonthFilter>(now.getMonth() + 1);
  const [year, setYear] = useState<YearFilter>(now.getFullYear());

  const filtered = useMemo(
    () => filterTransactions(transactions, month, year),
    [transactions, month, year],
  );

  const summary = useMemo(() => computeSummary(filtered), [filtered]);
  const categoryData = useMemo(() => getExpensesByCategory(filtered), [filtered]);
  const bankCashData = useMemo(() => getBankCashSplit(filtered), [filtered]);

  return (
    <div className="space-y-6">
      <MonthYearFilter
        month={month}
        year={year}
        transactions={transactions}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />

      <MetricCards
        totalIncome={summary.totalIncome}
        totalExpenses={summary.totalExpenses}
        netBalance={summary.netBalance}
        transactionCount={summary.transactionCount}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ExpenseByCategoryChart data={categoryData} />
        <BankCashChart data={bankCashData} />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        View all bank and cash transactions in the{' '}
        <span className="font-medium text-foreground">Combined Statement</span> tab.
      </p>
    </div>
  );
}
