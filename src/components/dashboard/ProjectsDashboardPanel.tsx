import { useMemo } from 'react';
import { BRAND_COLORS } from '@/lib/constants';
import { formatCurrency } from '@/lib/currency';
import {
  aggregateAmountByLabel,
  filterBySheetPeriod,
  filterClientPaymentsByPeriod,
} from '@/lib/dashboardAggregates';
import { computeExpenseSummary } from '@/lib/expense';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { useExpenses } from '@/context/ExpenseContext';
import { usePeriodFilter } from '@/context/PeriodFilterContext';
import { DashboardBarChart } from '@/components/dashboard/DashboardBarChart';
import { DashboardMetricGrid } from '@/components/dashboard/DashboardMetricGrid';
import { DashboardRankedList } from '@/components/dashboard/DashboardRankedList';

/**
 * Project costs, payroll, and client receipts for the selected period.
 */
export function ProjectsDashboardPanel() {
  const { data } = useExpenses();
  const { records: clientPayments } = useClientPayments();
  const { month, year } = usePeriodFilter();

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

  const totalProjectIncome = useMemo(
    () => projectRecords.reduce((sum, record) => sum + record.income, 0),
    [projectRecords],
  );

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

  const metrics = [
    {
      label: 'Project spend',
      value: formatCurrency(projectSummary.totalAmount),
      tone: 'text-expense',
    },
    {
      label: 'Employee payroll',
      value: formatCurrency(employeeSummary.totalAmount),
      tone: 'text-expense',
    },
    {
      label: 'Project income (workbook)',
      value: formatCurrency(totalProjectIncome),
      tone: 'text-income',
    },
    {
      label: 'Client receipts',
      value: formatCurrency(clientReceiptsTotal),
      tone: 'text-income',
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardMetricGrid metrics={metrics} columns={4} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardBarChart
          title="Project costs by code"
          data={spendByProject}
          barColor={BRAND_COLORS.chartTeal}
        />
        <DashboardBarChart
          title="Client receipts by project"
          data={receiptsByProject}
          barColor={BRAND_COLORS.chartGold}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardRankedList title="Top project costs" rows={spendByProject} />
        <DashboardRankedList title="Payroll by employee" rows={payrollByEmployee} />
      </div>
    </div>
  );
}
