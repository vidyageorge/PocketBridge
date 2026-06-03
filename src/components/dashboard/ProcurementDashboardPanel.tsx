import { useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
  aggregateAmountByLabel,
  filterBySheetPeriod,
  getProcurementPaymentStatusBreakdown,
} from '@/lib/dashboardAggregates';
import { computeProcurementSummary, sortProcurementByOrderDateDesc } from '@/lib/procurement';
import { useProcurement } from '@/context/ProcurementContext';
import { usePeriodFilter } from '@/context/PeriodFilterContext';
import { DashboardBarChart } from '@/components/dashboard/DashboardBarChart';
import { DashboardMetricGrid } from '@/components/dashboard/DashboardMetricGrid';
import { DashboardRankedList } from '@/components/dashboard/DashboardRankedList';
import { BRAND_COLORS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Procurement spend, suppliers, and payment status for the selected period.
 */
export function ProcurementDashboardPanel() {
  const { records } = useProcurement();
  const { month, year } = usePeriodFilter();

  const filtered = useMemo(
    () => filterBySheetPeriod(records, month, year),
    [records, month, year],
  );

  const summary = useMemo(() => computeProcurementSummary(filtered), [filtered]);

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

  const metrics = [
    { label: 'Orders', value: String(summary.orderCount), tone: 'text-foreground' },
    { label: 'Total spend', value: formatCurrency(summary.totalAmount), tone: 'text-foreground' },
    { label: 'Paid (completed)', value: formatCurrency(summary.paidAmount), tone: 'text-income' },
    { label: 'Pending', value: formatCurrency(summary.pendingAmount), tone: 'text-expense' },
  ];

  return (
    <div className="space-y-6">
      <DashboardMetricGrid metrics={metrics} columns={4} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardBarChart
          title="Spend by supplier"
          data={bySupplier}
          barColor={BRAND_COLORS.chartTeal}
        />
        <DashboardBarChart
          title="Payment status"
          data={paymentStatus}
          barColor={BRAND_COLORS.chartGold}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardRankedList title="Top suppliers" rows={bySupplier} />
        <DashboardRankedList title="Spend by project" rows={byProject} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No procurement orders for the selected period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Description</th>
                    <th className="px-2 py-2 font-medium">Supplier / status</th>
                    <th className="px-2 py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((record) => (
                    <tr key={record.id} className="border-b border-border/60">
                      <td className="px-2 py-2 font-medium">{record.description}</td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {record.supplier} · {record.paymentStatus}
                      </td>
                      <td className="px-2 py-2 text-right">{formatCurrency(record.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
