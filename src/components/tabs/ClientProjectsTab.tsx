import { useMemo, useState } from 'react';
import {
  applyClientPaymentColumnFilters,
  computeClientPaymentSummary,
  filterClientPaymentsByProject,
  getClientProjectMeta,
  getDefaultClientProject,
  sortClientPaymentsByDateDesc,
} from '@/lib/clientPayment';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { ClientPaymentImport } from '@/components/clientPayments/ClientPaymentImport';
import { ClientPaymentMetricCards } from '@/components/clientPayments/ClientPaymentMetricCards';
import { ClientPaymentProjectFilter } from '@/components/clientPayments/ClientPaymentProjectFilter';
import { ClientPaymentProjectInfo } from '@/components/clientPayments/ClientPaymentProjectInfo';
import { ClientPaymentTable } from '@/components/clientPayments/ClientPaymentTable';
import {
  EMPTY_CLIENT_PAYMENT_FILTERS,
  type ClientPaymentColumnFilters,
} from '@/types/clientPayment';

export function ClientProjectsTab() {
  const { records } = useClientPayments();
  const defaultProject = useMemo(() => getDefaultClientProject(records), [records]);

  const [sheetProject, setSheetProject] = useState(defaultProject);
  const [columnFilters, setColumnFilters] =
    useState<ClientPaymentColumnFilters>(EMPTY_CLIENT_PAYMENT_FILTERS);

  const filteredByProject = useMemo(
    () => filterClientPaymentsByProject(records, sheetProject),
    [records, sheetProject],
  );

  const filteredByColumns = useMemo(
    () => applyClientPaymentColumnFilters(filteredByProject, columnFilters),
    [filteredByProject, columnFilters],
  );

  const displayedRecords = useMemo(
    () => sortClientPaymentsByDateDesc(filteredByColumns),
    [filteredByColumns],
  );

  const summary = useMemo(() => computeClientPaymentSummary(displayedRecords), [displayedRecords]);
  const projectMeta = useMemo(
    () => getClientProjectMeta(records, sheetProject),
    [records, sheetProject],
  );

  const handleFilterChange = (field: keyof ClientPaymentColumnFilters, value: string) => {
    setColumnFilters((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Clients &amp; Projects</h2>

      <ClientPaymentImport />

      <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
        <ClientPaymentProjectFilter
          sheetProject={sheetProject}
          records={records}
          onProjectChange={(project) => {
            setSheetProject(project);
            setColumnFilters(EMPTY_CLIENT_PAYMENT_FILTERS);
          }}
        />
        <ClientPaymentProjectInfo project={projectMeta} />
      </div>

      <ClientPaymentMetricCards summary={summary} />

      <ClientPaymentTable
        records={displayedRecords}
        optionRecords={filteredByProject}
        filters={columnFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setColumnFilters(EMPTY_CLIENT_PAYMENT_FILTERS)}
        title={`${sheetProject} — ${displayedRecords.length} payments`}
      />
    </div>
  );
}
