import { useMemo } from 'react';
import {
  computeSummary,
  filterTransactions,
  getBankCashSplit,
  getExpensesByCategory,
} from '@/lib/filters';
import { useDashboardPeriod } from '@/context/DashboardPeriodContext';
import { useTransactions } from '@/context/TransactionContext';
import { filterTransactionsThroughAsOn } from '@/lib/dashboardPeriod';
import { AccountBalanceCards } from '@/components/dashboard/AccountBalanceCards';
import { BankCashChart } from '@/components/dashboard/BankCashChart';
import { DashboardAnswerCard } from '@/components/dashboard/DashboardAnswerCard';
import { ExpenseByCategoryChart } from '@/components/dashboard/ExpenseByCategoryChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';

/**
 * Bank and cash shown as one money picture for the selected period.
 */
export function FinancialOverviewPanel() {
  const { transactions } = useTransactions();
  const { month, year, asOnDate } = useDashboardPeriod();

  const filtered = useMemo(() => {
    const throughAsOn = filterTransactionsThroughAsOn(transactions, asOnDate);
    return filterTransactions(throughAsOn, month, year);
  }, [transactions, month, year, asOnDate]);

  const summary = useMemo(() => computeSummary(filtered), [filtered]);
  const categoryData = useMemo(() => getExpensesByCategory(filtered), [filtered]);
  const bankCashData = useMemo(() => getBankCashSplit(filtered), [filtered]);

  const topCategory = categoryData[0];

  return (
    <div className="space-y-6">
      <AccountBalanceCards />

      <Card className="border-border/80 bg-white/95">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activity (latest record month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardAnswerCard
              label="Money in"
              answer={formatCurrency(summary.totalIncome)}
              tone="text-income"
            />
            <DashboardAnswerCard
              label="Money out"
              answer={formatCurrency(summary.totalExpenses)}
              tone="text-expense"
            />
            <DashboardAnswerCard
              label="Net flow"
              answer={formatCurrency(summary.netBalance)}
              tone={summary.netBalance >= 0 ? 'text-income' : 'text-expense'}
            />
            <DashboardAnswerCard
              label="Transactions"
              answer={String(summary.transactionCount)}
            />
          </div>
          {topCategory && (
            <p className="mt-4 text-sm text-muted-foreground">
              Most spent on:{' '}
              <span className="font-medium text-foreground">{topCategory.category}</span> (
              {formatCurrency(topCategory.amount)})
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ExpenseByCategoryChart data={categoryData} />
        <BankCashChart data={bankCashData} />
      </div>
    </div>
  );
}
