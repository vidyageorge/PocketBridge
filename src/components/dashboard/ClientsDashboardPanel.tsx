import { useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
  aggregateAmountByLabel,
  countUniqueClients,
  filterClientPaymentsByPeriod,
  getPortfolioCounts,
} from '@/lib/dashboardAggregates';
import { computeClientPaymentSummary } from '@/lib/clientPayment';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { useExpenses } from '@/context/ExpenseContext';
import { useDashboardPeriod } from '@/context/DashboardPeriodContext';
import { DashboardAnswerCard } from '@/components/dashboard/DashboardAnswerCard';
import { DashboardBarChart } from '@/components/dashboard/DashboardBarChart';
import { DashboardRankedList } from '@/components/dashboard/DashboardRankedList';
import { BRAND_COLORS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Client list and who paid how much for the selected period.
 */
export function ClientsDashboardPanel() {
  const { records } = useClientPayments();
  const { data: expenses } = useExpenses();
  const { month, year } = useDashboardPeriod();

  const portfolio = useMemo(
    () => getPortfolioCounts(records, expenses.project, expenses.employee),
    [records, expenses.project, expenses.employee],
  );

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
          label: record.projectName.trim() || record.sheetProject,
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

  return (
    <div className="space-y-6">
      <Card className="border-border/80 bg-white/95">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <DashboardAnswerCard label="Total clients" answer={String(portfolio.clientCount)} />
            <DashboardAnswerCard label="Active clients" answer={String(uniqueClients)} />
            <DashboardAnswerCard
              label="Total received"
              answer={formatCurrency(summary.totalAmount)}
              tone="text-income"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardBarChart
          title="Payment per project"
          data={byProject}
          barColor={BRAND_COLORS.chartGold}
        />
        <DashboardBarChart
          title="Payment per client"
          data={byClient}
          barColor={BRAND_COLORS.chartTeal}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardRankedList title="Top clients" rows={byClient} />
        <DashboardRankedList title="Top projects" rows={byProject} />
      </div>
    </div>
  );
}
