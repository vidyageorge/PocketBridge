import { useState } from 'react';
import { ClientPaymentProvider } from '@/context/ClientPaymentContext';
import { ExpenseProvider } from '@/context/ExpenseContext';
import { PeriodFilterProvider } from '@/context/PeriodFilterContext';
import { ProcurementProvider } from '@/context/ProcurementContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { DashboardMenuTrigger } from '@/components/dashboard/DashboardMenuTrigger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountTab } from '@/components/tabs/AccountTab';
import { CombinedStatementTab } from '@/components/tabs/CombinedStatementTab';
import { DashboardTab } from '@/components/tabs/DashboardTab';
import { ClientProjectsTab } from '@/components/tabs/ClientProjectsTab';
import { ExpenseTab } from '@/components/tabs/ExpenseTab';
import { ProcurementTab } from '@/components/tabs/ProcurementTab';
import type { DashboardView } from '@/lib/dashboardViews';

function AppContent() {
  const [mainTab, setMainTab] = useState('dashboard');
  const [dashboardView, setDashboardView] = useState<DashboardView>('financial');

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
            <TabsTrigger value="clients">Clients &amp; Projects</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab activeView={dashboardView} />
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
          <TabsContent value="clients">
            <ClientProjectsTab />
          </TabsContent>
          <TabsContent value="expense">
            <ExpenseTab />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <TransactionProvider>
      <ProcurementProvider>
        <ClientPaymentProvider>
          <ExpenseProvider>
            <PeriodFilterProvider>
              <AppContent />
            </PeriodFilterProvider>
          </ExpenseProvider>
        </ClientPaymentProvider>
      </ProcurementProvider>
    </TransactionProvider>
  );
}
