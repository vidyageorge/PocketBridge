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
import { ProjectMenuTrigger } from '@/components/projects/ProjectMenuTrigger';
import { CashSyncBridge } from '@/components/sync/CashSyncBridge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountTab } from '@/components/tabs/AccountTab';
import { DashboardTab } from '@/components/tabs/DashboardTab';
import { ProjectTab } from '@/components/tabs/ProjectTab';
import { ProjectHistoryTab } from '@/components/tabs/ProjectHistoryTab';
import { ActivityLogTab } from '@/components/tabs/ActivityLogTab';
import type { DashboardView } from '@/lib/dashboardViews';

function AppContent() {
  const [mainTab, setMainTab] = useState('dashboard');
  const [dashboardView, setDashboardView] = useState<DashboardView>('financial');
  const [selectedProject, setSelectedProject] = useState('');

  const openProjectsPage = (project?: string) => {
    if (project) {
      setSelectedProject(project);
    }
    setMainTab('project');
  };

  const openDashboardView = (view: DashboardView) => {
    setDashboardView(view);
    setMainTab('dashboard');
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
            <ProjectMenuTrigger
              isActive={mainTab === 'project'}
              selectedProject={selectedProject}
              onOpenProjects={() => setMainTab('project')}
              onProjectSelect={(project) => {
                setSelectedProject(project);
                setMainTab('project');
              }}
            />
            <TabsTrigger value="project-history">Project History</TabsTrigger>
            <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab
              activeView={dashboardView}
              onOpenProjectsPage={() => openProjectsPage()}
              onOpenClientsPage={() => openDashboardView('clients')}
              onOpenEmployeesPage={() => openDashboardView('financial')}
              onOpenSuppliersPage={() => openDashboardView('suppliers')}
            />
          </TabsContent>
          <TabsContent value="bank">
            <AccountTab source="bank" />
          </TabsContent>
          <TabsContent value="cash">
            <AccountTab source="cash" />
          </TabsContent>
          <TabsContent value="project">
            <ProjectTab
              selectedProject={selectedProject}
              onProjectChange={setSelectedProject}
              onOpenHistory={() => setMainTab('project-history')}
            />
          </TabsContent>
          <TabsContent value="project-history">
            <ProjectHistoryTab />
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
                      <CashSyncBridge />
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
