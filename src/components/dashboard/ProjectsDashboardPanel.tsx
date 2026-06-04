import { useMemo } from 'react';
import { BRAND_COLORS } from '@/lib/constants';
import { formatCurrency } from '@/lib/currency';
import {
  aggregateAmountByLabel,
  filterBySheetPeriod,
  filterClientPaymentsByPeriod,
  getPortfolioCounts,
} from '@/lib/dashboardAggregates';
import { computeExpenseSummary } from '@/lib/expense';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { useExpenses } from '@/context/ExpenseContext';
import { useDashboardPeriod } from '@/context/DashboardPeriodContext';
import { DashboardAnswerCard } from '@/components/dashboard/DashboardAnswerCard';
import { DashboardBarChart } from '@/components/dashboard/DashboardBarChart';
import { DashboardRankedList } from '@/components/dashboard/DashboardRankedList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Projects, team salaries, and money per project for the selected period.
 */
export function ProjectsDashboardPanel() {
  const { data } = useExpenses();
  const { records: clientPayments } = useClientPayments();
  const { month, year } = useDashboardPeriod();

  const portfolio = useMemo(
    () => getPortfolioCounts(clientPayments, data.project, data.employee),
    [clientPayments, data.project, data.employee],
  );

  const projectRecords = useMemo(
    () => filterBySheetPeriod(data.project, month, year),
    [data.project, month, year],
  );

  const employeeRecords = useMemo(
    () => filterBySheetPeriod(data.employee, month, year),
    [data.employee, month, year],
  );

  const clientRecords = useMemo(
    () => filterClientPaymentsByPeriod(clientPayments, month, year),
    [clientPayments, month, year],
  );

  const projectSummary = useMemo(() => computeExpenseSummary(projectRecords), [projectRecords]);
  const employeeSummary = useMemo(() => computeExpenseSummary(employeeRecords), [employeeRecords]);

  const clientReceiptsTotal = useMemo(
    () => clientRecords.reduce((sum, record) => sum + record.amount, 0),
    [clientRecords],
  );

  const spendByProject = useMemo(
    () =>
      aggregateAmountByLabel(
        projectRecords.map((record) => ({
          label: record.projectCode || 'Unassigned',
          amount: record.amount,
        })),
      ),
    [projectRecords],
  );

  const payrollByEmployee = useMemo(
    () =>
      aggregateAmountByLabel(
        employeeRecords.map((record) => ({
          label: record.employeeName || 'Unassigned',
          amount: record.amount,
        })),
      ),
    [employeeRecords],
  );

  const receiptsByProject = useMemo(
    () =>
      aggregateAmountByLabel(
        clientRecords.map((record) => ({
          label: record.projectCode || record.sheetProject,
          amount: record.amount,
        })),
      ),
    [clientRecords],
  );

  return (
    <div className="space-y-6">
      <Card className="border-border/80 bg-white/95">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Projects &amp; team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardAnswerCard label="Projects" answer={String(portfolio.projectCount)} />
            <DashboardAnswerCard label="Team members" answer={String(portfolio.employeeCount)} />
            <DashboardAnswerCard
              label="Project costs"
              answer={formatCurrency(projectSummary.totalAmount)}
              tone="text-expense"
            />
            <DashboardAnswerCard
              label="Salaries paid"
              answer={formatCurrency(employeeSummary.totalAmount)}
              tone="text-expense"
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Money received from clients this period:{' '}
            <span className="font-medium text-income">{formatCurrency(clientReceiptsTotal)}</span>
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardBarChart
          title="Cost per project"
          data={spendByProject}
          barColor={BRAND_COLORS.chartTeal}
        />
        <DashboardBarChart
          title="Money received per project"
          data={receiptsByProject}
          barColor={BRAND_COLORS.chartGold}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardRankedList title="Top project costs" rows={spendByProject} />
        <DashboardRankedList title="Team salaries" rows={payrollByEmployee} />
      </div>
    </div>
  );
}
