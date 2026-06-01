import { TransactionProvider } from '@/context/TransactionContext';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountTab } from '@/components/tabs/AccountTab';
import { CombinedStatementTab } from '@/components/tabs/CombinedStatementTab';
import { DashboardTab } from '@/components/tabs/DashboardTab';

function AppContent() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="bank">Bank Account</TabsTrigger>
            <TabsTrigger value="cash">Cash Account</TabsTrigger>
            <TabsTrigger value="statement">Combined Statement</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
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
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <TransactionProvider>
      <AppContent />
    </TransactionProvider>
  );
}
