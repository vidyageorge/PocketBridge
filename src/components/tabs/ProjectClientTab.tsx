import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
  applyClientPaymentColumnFilters,
  computeClientPaymentSummary,
  filterClientPaymentsByClient,
  filterClientPaymentsByProject,
  getClientList,
  getClientProjectList,
  getClientProjectMeta,
  getDefaultClientName,
  getDefaultClientProject,
  sheetUsesSplitAmounts,
  sortClientPaymentsByDateDesc,
} from '@/lib/clientPayment';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { AddClientForm } from '@/components/clientPayments/AddClientForm';
import { AddProjectForm } from '@/components/clientPayments/AddProjectForm';
import { ClientListButtons } from '@/components/clientPayments/ClientListButtons';
import { ClientPaymentEntryForm } from '@/components/clientPayments/ClientPaymentEntryForm';
import { ClientPaymentImport } from '@/components/clientPayments/ClientPaymentImport';
import { ClientPaymentMetricCards } from '@/components/clientPayments/ClientPaymentMetricCards';
import { ClientPaymentProjectButtons } from '@/components/clientPayments/ClientPaymentProjectButtons';
import { ClientPaymentProjectInfo } from '@/components/clientPayments/ClientPaymentProjectInfo';
import { ClientPaymentTable } from '@/components/clientPayments/ClientPaymentTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  EMPTY_CLIENT_PAYMENT_FILTERS,
  type ClientPaymentColumnFilters,
} from '@/types/clientPayment';

export type ProjectClientSection = 'projects' | 'clients';

type ProjectClientTabProps = {
  activeSection: ProjectClientSection;
  onSectionChange: (section: ProjectClientSection) => void;
};

export function ProjectClientTab({ activeSection, onSectionChange }: ProjectClientTabProps) {
  const { records, registry, deletePayment } = useClientPayments();
  const defaultProject = useMemo(
    () => getDefaultClientProject(records, registry),
    [records, registry],
  );
  const defaultClient = useMemo(
    () => getDefaultClientName(records, registry),
    [records, registry],
  );

  const [sheetProject, setSheetProject] = useState(defaultProject);
  const [selectedClient, setSelectedClient] = useState(defaultClient);
  const [columnFilters, setColumnFilters] =
    useState<ClientPaymentColumnFilters>(EMPTY_CLIENT_PAYMENT_FILTERS);

  useEffect(() => {
    const projects = getClientProjectList(records, registry);
    if (!projects.some((project) => project.sheetProject === sheetProject)) {
      const nextDefault = getDefaultClientProject(records, registry);
      if (nextDefault) {
        setSheetProject(nextDefault);
      }
    }
  }, [records, registry, sheetProject]);

  useEffect(() => {
    const clients = getClientList(records, registry);
    if (!clients.some((client) => client.clientName === selectedClient)) {
      const nextDefault = getDefaultClientName(records, registry);
      if (nextDefault) {
        setSelectedClient(nextDefault);
      }
    }
  }, [records, registry, selectedClient]);

  const projectRecords = useMemo(
    () => filterClientPaymentsByProject(records, sheetProject),
    [records, sheetProject],
  );

  const clientRecords = useMemo(
    () => filterClientPaymentsByClient(records, selectedClient),
    [records, selectedClient],
  );

  const displayedProjectRecords = useMemo(
    () => sortClientPaymentsByDateDesc(applyClientPaymentColumnFilters(projectRecords, columnFilters)),
    [projectRecords, columnFilters],
  );

  const displayedClientRecords = useMemo(
    () => sortClientPaymentsByDateDesc(applyClientPaymentColumnFilters(clientRecords, columnFilters)),
    [clientRecords, columnFilters],
  );

  const projectSummary = useMemo(
    () => computeClientPaymentSummary(displayedProjectRecords),
    [displayedProjectRecords],
  );

  const clientSummary = useMemo(
    () => computeClientPaymentSummary(displayedClientRecords),
    [displayedClientRecords],
  );

  const projectMeta = useMemo(
    () => getClientProjectMeta(records, registry, sheetProject),
    [records, registry, sheetProject],
  );

  const selectedClientMeta = useMemo(
    () => getClientList(records, registry).find((client) => client.clientName === selectedClient),
    [records, registry, selectedClient],
  );

  const showSplitAmounts = useMemo(() => sheetUsesSplitAmounts(projectRecords), [projectRecords]);

  const handleFilterChange = (field: keyof ClientPaymentColumnFilters, value: string) => {
    setColumnFilters((current) => ({ ...current, [field]: value }));
  };

  const resetFilters = () => setColumnFilters(EMPTY_CLIENT_PAYMENT_FILTERS);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Projects &amp; Client</h2>

      <ClientPaymentImport />

      <Tabs
        value={activeSection}
        onValueChange={(value) => onSectionChange(value as ProjectClientSection)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <AddProjectForm
            onProjectAdded={(project) => {
              setSheetProject(project);
              resetFilters();
            }}
          />

          <ClientPaymentProjectButtons
            sheetProject={sheetProject}
            onProjectChange={(project) => {
              setSheetProject(project);
              resetFilters();
            }}
          />

          {projectMeta && <ClientPaymentProjectInfo project={projectMeta} />}

          <ClientPaymentEntryForm sheetProject={sheetProject} showSplitAmounts={showSplitAmounts} />

          <ClientPaymentMetricCards summary={projectSummary} />

          <ClientPaymentTable
            records={displayedProjectRecords}
            optionRecords={projectRecords}
            filters={columnFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={resetFilters}
            title={`${sheetProject} — payments received`}
            showSplitAmounts={showSplitAmounts}
            onDelete={deletePayment}
          />
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <AddClientForm
            onClientAdded={(client) => {
              setSelectedClient(client);
              resetFilters();
            }}
          />

          <ClientListButtons
            selectedClient={selectedClient}
            onClientChange={(client) => {
              setSelectedClient(client);
              resetFilters();
            }}
          />

          {selectedClientMeta && (
            <Card className="border-border/80 bg-white/95">
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Projects
                  </p>
                  <p className="text-sm font-medium">{selectedClientMeta.projects.join(', ')}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Payments
                  </p>
                  <p className="text-sm font-medium">{selectedClientMeta.paymentCount}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total received
                  </p>
                  <p className="text-sm font-medium text-income">
                    {formatCurrency(selectedClientMeta.totalReceived)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <ClientPaymentEntryForm
            clientName={selectedClient}
            showSplitAmounts={sheetUsesSplitAmounts(clientRecords)}
          />

          <ClientPaymentMetricCards summary={clientSummary} />

          <ClientPaymentTable
            records={displayedClientRecords}
            optionRecords={clientRecords}
            filters={columnFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={resetFilters}
            title={`${selectedClient} — all project payments`}
            showSplitAmounts={sheetUsesSplitAmounts(clientRecords)}
            showProjectColumn
            onDelete={deletePayment}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
