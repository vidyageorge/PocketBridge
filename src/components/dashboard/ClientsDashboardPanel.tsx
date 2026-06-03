import { useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
  aggregateAmountByLabel,
  countUniqueClients,
  filterClientPaymentsByPeriod,
} from '@/lib/dashboardAggregates';
import { computeClientPaymentSummary } from '@/lib/clientPayment';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { usePeriodFilter } from '@/context/PeriodFilterContext';
import { DashboardBarChart } from '@/components/dashboard/DashboardBarChart';
import { DashboardMetricGrid } from '@/components/dashboard/DashboardMetricGrid';
import { DashboardRankedList } from '@/components/dashboard/DashboardRankedList';
import { BRAND_COLORS } from '@/lib/constants';

/**
 * Client payment receipts and project-level collections for the selected period.
 */
export function ClientsDashboardPanel() {
  const { records } = useClientPayments();
  const { month, year } = usePeriodFilter();

  const filtered = useMemo(
    () => filterClientPaymentsByPeriod(records, month, year),
    [records, month, year],
  );

  const summary = useMemo(() => computeClientPaymentSummary(filtered), [filtered]);
  const uniqueClients = useMemo(() => countUniqueClients(filtered), [filtered]);

  const byProject = useMemo(
    () =>
      aggregateAmountByLabel(
        filtered.map((record) => ({
          label: `${record.sheetProject}${record.projectName ? ` — ${record.projectName}` : ''}`,
          amount: record.amount,
        })),
      ),
    [filtered],
  );

  const byClient = useMemo(
    () =>
      aggregateAmountByLabel(
        filtered.map((record) => ({
          label: record.clientName.trim() || record.sheetProject,
          amount: record.amount,
        })),
      ),
    [filtered],
  );

  const metrics = [
    { label: 'Payments', value: String(summary.paymentCount), tone: 'text-foreground' },
    { label: 'Total received', value: formatCurrency(summary.totalAmount), tone: 'text-income' },
    { label: 'Active clients', value: String(uniqueClients), tone: 'text-foreground' },
    { label: 'Via banking', value: formatCurrency(summary.totalBanking), tone: 'text-foreground' },
    { label: 'Via cash', value: formatCurrency(summary.totalCash), tone: 'text-foreground' },
    { label: 'Via GPay', value: formatCurrency(summary.totalGpay), tone: 'text-foreground' },
  ];

  return (
    <div className="space-y-6">
      <DashboardMetricGrid metrics={metrics} columns={3} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardBarChart
          title="Receipts by project"
          data={byProject}
          barColor={BRAND_COLORS.chartGold}
        />
        <DashboardBarChart
          title="Receipts by client"
          data={byClient}
          barColor={BRAND_COLORS.chartTeal}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardRankedList title="Projects ranked by receipts" rows={byProject} />
        <DashboardRankedList title="Clients ranked by receipts" rows={byClient} />
      </div>
    </div>
  );
}
