import { DashboardPeriodProvider } from '@/context/DashboardPeriodContext';
import type { DashboardView } from '@/lib/dashboardViews';
import { getDashboardViewLabel } from '@/lib/dashboardViews';
import { ClientsDashboardPanel } from '@/components/dashboard/ClientsDashboardPanel';
import { FinancialOverviewPanel } from '@/components/dashboard/FinancialOverviewPanel';
import { OverviewDashboardPanel } from '@/components/dashboard/OverviewDashboardPanel';
import { ProcurementDashboardPanel } from '@/components/dashboard/ProcurementDashboardPanel';
import { SuppliersDashboardPanel } from '@/components/dashboard/SuppliersDashboardPanel';
import { ProjectsDashboardPanel } from '@/components/dashboard/ProjectsDashboardPanel';

type DashboardTabProps = {
  activeView: DashboardView;
  onOpenProjectsPage: () => void;
  onOpenClientsPage: () => void;
  onOpenEmployeesPage: () => void;
  onOpenSuppliersPage: () => void;
};

export function DashboardTab({
  activeView,
  onOpenProjectsPage,
  onOpenClientsPage,
  onOpenEmployeesPage,
  onOpenSuppliersPage,
}: DashboardTabProps) {
  return (
    <DashboardPeriodProvider>
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{getDashboardViewLabel(activeView)}</h2>

      {activeView === 'financial' && (
        <>
          <FinancialOverviewPanel />
          <section className="space-y-6 border-t border-border pt-6">
            <h3 className="text-base font-semibold">Quick summary</h3>
            <OverviewDashboardPanel
              showMoneySections={false}
              onOpenProjectsPage={onOpenProjectsPage}
              onOpenClientsPage={onOpenClientsPage}
              onOpenEmployeesPage={onOpenEmployeesPage}
              onOpenSuppliersPage={onOpenSuppliersPage}
            />
          </section>
        </>
      )}
      {activeView === 'projects' && <ProjectsDashboardPanel />}
      {activeView === 'clients' && <ClientsDashboardPanel />}
      {activeView === 'procurement' && <ProcurementDashboardPanel />}
      {activeView === 'suppliers' && <SuppliersDashboardPanel />}
    </div>
    </DashboardPeriodProvider>
  );
}
