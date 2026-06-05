import { useState } from 'react';
import { ActivityLogProvider } from '@/context/ActivityLogContext';
import { CustomOptionsProvider } from '@/context/CustomOptionsContext';
import { DataBackendProvider } from '@/context/DataBackendProvider';
import { ClientPaymentProvider } from '@/context/ClientPaymentContext';
import { ExpenseProvider } from '@/context/ExpenseContext';
import { PeriodFilterProvider } from '@/context/PeriodFilterContext';
import { PeriodFilterBootstrap } from '@/components/filters/PeriodFilterBootstrap';
import { ProcurementProvider } from '@/context/ProcurementContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { DashboardMenuTrigger } from '@/components/dashboard/DashboardMenuTrigger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountTab } from '@/components/tabs/AccountTab';
import { CombinedStatementTab } from '@/components/tabs/CombinedStatementTab';
import { DashboardTab } from '@/components/tabs/DashboardTab';
import { ProjectClientTab, type ProjectClientSection } from '@/components/tabs/ProjectClientTab';
import { ExpenseTab, type ExpenseSection } from '@/components/tabs/ExpenseTab';
import { ProcurementTab } from '@/components/tabs/ProcurementTab';
import { ActivityLogTab } from '@/components/tabs/ActivityLogTab';
import { SuppliersTab } from '@/components/tabs/SuppliersTab';
import type { DashboardView } from '@/lib/dashboardViews';

function AppContent() {
  const [mainTab, setMainTab] = useState('dashboard');
  const [dashboardView, setDashboardView] = useState<DashboardView>('financial');
  const [expenseSection, setExpenseSection] = useState<ExpenseSection>('project');
  const [projectClientSection, setProjectClientSection] =
    useState<ProjectClientSection>('projects');

  const openProjectsPage = () => {
    setProjectClientSection('projects');
    setMainTab('projects-client');
  };

  const openClientsPage = () => {
    setProjectClientSection('clients');
    setMainTab('projects-client');
  };

  const openEmployeesPage = () => {
    setExpenseSection('employee');
    setMainTab('expense');
  };

  const openSuppliersPage = () => {
    setMainTab('suppliers');
  };

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="pb-page-surface mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Tabs
          value={mainTab}
          onValueChange={(value) => {
            setMainTab(value);
          }}
        >
          <TabsList>
            <DashboardMenuTrigger
              isActive={mainTab === 'dashboard'}
              activeView={dashboardView}
              onOpenDashboard={() => setMainTab('dashboard')}
              onViewSelect={(view) => {
                setDashboardView(view);
                setMainTab('dashboard');
              }}
            />
            <TabsTrigger value="bank">Bank Account</TabsTrigger>
            <TabsTrigger value="cash">Cash Account</TabsTrigger>
            <TabsTrigger value="statement">Combined Statement</TabsTrigger>
            <TabsTrigger value="procurement">Procurement</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="projects-client">Projects &amp; Client</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab
              activeView={dashboardView}
              onOpenProjectsPage={openProjectsPage}
              onOpenClientsPage={openClientsPage}
              onOpenEmployeesPage={openEmployeesPage}
              onOpenSuppliersPage={openSuppliersPage}
            />
          </TabsContent>
          <TabsContent value="bank">
            <AccountTab source="bank" />
          </TabsContent>
          <TabsContent value="cash">
            <AccountTab source="cash" />
          </TabsContent>
          <TabsContent value="statement">
            <CombinedStatementTab />
          </TabsContent>
          <TabsContent value="procurement">
            <ProcurementTab />
          </TabsContent>
          <TabsContent value="suppliers">
            <SuppliersTab />
          </TabsContent>
          <TabsContent value="projects-client">
            <ProjectClientTab
              activeSection={projectClientSection}
              onSectionChange={setProjectClientSection}
            />
          </TabsContent>
          <TabsContent value="expense">
            <ExpenseTab activeSection={expenseSection} onSectionChange={setExpenseSection} />
          </TabsContent>
          <TabsContent value="activity-log">
            <ActivityLogTab />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <DataBackendProvider>
      <CustomOptionsProvider>
        <TransactionProvider>
          <ProcurementProvider>
            <ClientPaymentProvider>
              <ExpenseProvider>
                <ActivityLogProvider>
                  <PeriodFilterProvider>
                    <PeriodFilterBootstrap>
                      <AppContent />
                    </PeriodFilterBootstrap>
                  </PeriodFilterProvider>
                </ActivityLogProvider>
              </ExpenseProvider>
            </ClientPaymentProvider>
          </ProcurementProvider>
        </TransactionProvider>
      </CustomOptionsProvider>
    </DataBackendProvider>
  );
}
