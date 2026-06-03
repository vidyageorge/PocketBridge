import { useMemo } from 'react';
import {
  computeSummary,
  filterTransactions,
  getBankCashSplit,
  getExpensesByCategory,
} from '@/lib/filters';
import { usePeriodFilter } from '@/context/PeriodFilterContext';
import { useTransactions } from '@/context/TransactionContext';
import { BankCashChart } from '@/components/dashboard/BankCashChart';
import { ExpenseByCategoryChart } from '@/components/dashboard/ExpenseByCategoryChart';
import { MetricCards } from '@/components/dashboard/MetricCards';

/**
 * Bank and cash transaction overview for the Dashboard tab.
 */
export function FinancialOverviewPanel() {
  const { transactions } = useTransactions();
  const { month, year } = usePeriodFilter();

  const filtered = useMemo(
    () => filterTransactions(transactions, month, year),
    [transactions, month, year],
  );

  const summary = useMemo(() => computeSummary(filtered), [filtered]);
  const categoryData = useMemo(() => getExpensesByCategory(filtered), [filtered]);
  const bankCashData = useMemo(() => getBankCashSplit(filtered), [filtered]);

  return (
    <div className="space-y-6">
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
    </div>
  );
}
