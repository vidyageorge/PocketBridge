import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { exportCombinedStatementToExcel } from '@/lib/excel';
import { formatCurrency } from '@/lib/currency';
import { computeSummary, filterTransactions } from '@/lib/filters';
import { sortTransactionsByDate } from '@/lib/statement';
import { usePeriodFilter } from '@/context/PeriodFilterContext';
import { useTransactions } from '@/context/TransactionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthYearFilter } from '@/components/filters/MonthYearFilter';
import { AccountBalanceCards } from '@/components/dashboard/AccountBalanceCards';
import { TransactionTable } from '@/components/transactions/TransactionTable';

export function CombinedStatementTab() {
  const { transactions } = useTransactions();
  const { month, year, setMonth, setYear } = usePeriodFilter();

  const filtered = useMemo(
    () => filterTransactions(transactions, month, year),
    [transactions, month, year],
  );

  const sorted = useMemo(() => sortTransactionsByDate(filtered), [filtered]);

  const summary = useMemo(() => computeSummary(filtered), [filtered]);

  const bankTotals = useMemo(() => {
    const bankOnly = filtered.filter((transaction) => transaction.source === 'bank');
    return computeSummary(bankOnly);
  }, [filtered]);

  const cashTotals = useMemo(() => {
    const cashOnly = filtered.filter((transaction) => transaction.source === 'cash');
    return computeSummary(cashOnly);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Combined Statement</h2>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <MonthYearFilter
          month={month}
          year={year}
          transactions={transactions}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
        <Button
          variant="outline"
          onClick={() => exportCombinedStatementToExcel(transactions, month, year)}
        >
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <AccountBalanceCards />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-income">Income {formatCurrency(summary.totalIncome)}</p>
            <p className="text-expense">Expense {formatCurrency(summary.totalExpenses)}</p>
            <p className={summary.netBalance >= 0 ? 'text-income' : 'text-expense'}>
              Net {formatCurrency(summary.netBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Bank</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-income">Income {formatCurrency(bankTotals.totalIncome)}</p>
            <p className="text-expense">Expense {formatCurrency(bankTotals.totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-accent">Cash</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-income">Income {formatCurrency(cashTotals.totalIncome)}</p>
            <p className="text-expense">Expense {formatCurrency(cashTotals.totalExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      <TransactionTable
        transactions={sorted}
        title="Combined Statement"
        showSource
        variant="statement"
      />
    </div>
  );
}
