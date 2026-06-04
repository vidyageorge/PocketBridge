import { useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
  aggregateAmountByLabel,
  filterBySheetPeriod,
  getProcurementPaymentStatusBreakdown,
  getTopSpendingArea,
} from '@/lib/dashboardAggregates';
import { computeProcurementSummary, sortProcurementByOrderDateDesc } from '@/lib/procurement';
import { useProcurement } from '@/context/ProcurementContext';
import { useExpenses } from '@/context/ExpenseContext';
import { useTransactions } from '@/context/TransactionContext';
import { useDashboardPeriod } from '@/context/DashboardPeriodContext';
import { DashboardAnswerCard } from '@/components/dashboard/DashboardAnswerCard';
import { DashboardBarChart } from '@/components/dashboard/DashboardBarChart';
import { DashboardRankedList } from '@/components/dashboard/DashboardRankedList';
import { BRAND_COLORS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Where purchase money goes: suppliers, projects, and pending bills.
 */
export function ProcurementDashboardPanel() {
  const { records } = useProcurement();
  const { transactions } = useTransactions();
  const { data: expenses } = useExpenses();
  const { month, year } = useDashboardPeriod();

  const filtered = useMemo(
    () => filterBySheetPeriod(records, month, year),
    [records, month, year],
  );

  const filteredProjectExpenses = useMemo(
    () => filterBySheetPeriod(expenses.project, month, year),
    [expenses.project, month, year],
  );

  const filteredEmployeeExpenses = useMemo(
    () => filterBySheetPeriod(expenses.employee, month, year),
    [expenses.employee, month, year],
  );

  const summary = useMemo(() => computeProcurementSummary(filtered), [filtered]);

  const topSpending = useMemo(
    () =>
      getTopSpendingArea(
        transactions,
        filtered,
        filteredProjectExpenses,
        filteredEmployeeExpenses,
        month,
        year,
      ),
    [transactions, filtered, filteredProjectExpenses, filteredEmployeeExpenses, month, year],
  );

  const bySupplier = useMemo(
    () =>
      aggregateAmountByLabel(
        filtered.map((record) => ({ label: record.supplier, amount: record.amount })),
      ),
    [filtered],
  );

  const byProject = useMemo(
    () =>
      aggregateAmountByLabel(
        filtered.map((record) => ({ label: record.project, amount: record.amount })),
      ),
    [filtered],
  );

  const paymentStatus = useMemo(() => getProcurementPaymentStatusBreakdown(filtered), [filtered]);

  const recentOrders = useMemo(
    () => sortProcurementByOrderDateDesc(filtered).slice(0, 8),
    [filtered],
  );

  const topSupplier = bySupplier[0];

  return (
    <div className="space-y-6">
      <Card className="border-border/80 bg-white/95">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardAnswerCard label="Orders" answer={String(summary.orderCount)} />
            <DashboardAnswerCard
              label="Total spent"
              answer={formatCurrency(summary.totalAmount)}
              tone="text-expense"
            />
            <DashboardAnswerCard
              label="Paid"
              answer={formatCurrency(summary.paidAmount)}
              tone="text-income"
            />
            <DashboardAnswerCard
              label="Pending"
              answer={formatCurrency(summary.pendingAmount)}
              tone="text-expense"
            />
          </div>
          {topSupplier && (
            <p className="mt-4 text-sm text-muted-foreground">
              Biggest supplier this period:{' '}
              <span className="font-medium text-foreground">{topSupplier.label}</span> (
              {formatCurrency(topSupplier.amount)})
            </p>
          )}
          {topSpending && topSpending.source !== 'Purchases' && (
            <p className="mt-2 text-sm text-muted-foreground">
              Overall biggest spend: {topSpending.label} ({formatCurrency(topSpending.amount)}) —{' '}
              {topSpending.source}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardBarChart
          title="Spend by supplier"
          data={bySupplier}
          barColor={BRAND_COLORS.chartTeal}
        />
        <DashboardBarChart
          title="Paid vs still pending"
          data={paymentStatus}
          barColor={BRAND_COLORS.chartGold}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardRankedList title="Top suppliers" rows={bySupplier} />
        <DashboardRankedList title="Spend by project" rows={byProject} />
      </div>

      <Card className="border-border/80 bg-white/95">
        <CardHeader>
          <CardTitle className="text-base">Latest purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No purchases for this period.
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{record.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {record.supplier} · {record.paymentStatus}
                    </p>
                  </div>
                  <p className="font-semibold text-expense">{formatCurrency(record.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
