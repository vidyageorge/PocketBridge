import { useTransactions } from '@/context/TransactionContext';
import { usePeriodFilter } from '@/context/PeriodFilterContext';
import type { DashboardView } from '@/lib/dashboardViews';
import { getDashboardViewLabel } from '@/lib/dashboardViews';
import { MonthYearFilter } from '@/components/filters/MonthYearFilter';
import { ClientsDashboardPanel } from '@/components/dashboard/ClientsDashboardPanel';
import { FinancialOverviewPanel } from '@/components/dashboard/FinancialOverviewPanel';
import { ProcurementDashboardPanel } from '@/components/dashboard/ProcurementDashboardPanel';
import { ProjectsDashboardPanel } from '@/components/dashboard/ProjectsDashboardPanel';

type DashboardTabProps = {
  activeView: DashboardView;
};

export function DashboardTab({ activeView }: DashboardTabProps) {
  const { transactions } = useTransactions();
  const { month, year, setMonth, setYear } = usePeriodFilter();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{getDashboardViewLabel(activeView)}</h2>

      <MonthYearFilter
        month={month}
        year={year}
        transactions={transactions}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />

      {activeView === 'financial' && <FinancialOverviewPanel />}
      {activeView === 'projects' && <ProjectsDashboardPanel />}
      {activeView === 'clients' && <ClientsDashboardPanel />}
      {activeView === 'procurement' && <ProcurementDashboardPanel />}
    </div>
  );
}
