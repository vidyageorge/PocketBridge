import { useEffect, useMemo, useState } from 'react';
import {
  applyClientPaymentColumnFilters,
  computeClientPaymentSummary,
  filterClientPaymentsByProject,
  getActiveClientProjectList,
  getClientProjectMeta,
  getDefaultClientProject,
  sheetUsesSplitAmounts,
  sortClientPaymentsByDateDesc,
} from '@/lib/clientPayment';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { CompleteProjectButton } from '@/components/projects/CompleteProjectButton';
import { AddProjectForm } from '@/components/clientPayments/AddProjectForm';
import { ClientPaymentEntryForm } from '@/components/clientPayments/ClientPaymentEntryForm';
import { ClientPaymentMetricCards } from '@/components/clientPayments/ClientPaymentMetricCards';
import { ClientPaymentProjectInfo } from '@/components/clientPayments/ClientPaymentProjectInfo';
import { ClientPaymentTable } from '@/components/clientPayments/ClientPaymentTable';
import { MasterWorkbookImport } from '@/components/import/MasterWorkbookImport';
import {
  EMPTY_CLIENT_PAYMENT_FILTERS,
  type ClientPaymentColumnFilters,
  type ClientPaymentRecord,
} from '@/types/clientPayment';

type ProjectTabProps = {
  selectedProject: string;
  onProjectChange: (sheetProject: string) => void;
  onOpenHistory: () => void;
};

export function ProjectTab({ selectedProject, onProjectChange, onOpenHistory }: ProjectTabProps) {
  const { records, registry, deletePayment } = useClientPayments();
  const [editingPayment, setEditingPayment] = useState<ClientPaymentRecord | null>(null);
  const [columnFilters, setColumnFilters] =
    useState<ClientPaymentColumnFilters>(EMPTY_CLIENT_PAYMENT_FILTERS);

  const defaultProject = useMemo(
    () => getDefaultClientProject(records, registry),
    [records, registry],
  );

  const sheetProject = selectedProject || defaultProject;

  const activeProjects = useMemo(
    () => getActiveClientProjectList(records, registry),
    [records, registry],
  );

  useEffect(() => {
    if (selectedProject && !activeProjects.some((project) => project.sheetProject === selectedProject)) {
      onProjectChange(defaultProject);
      return;
    }
    if (!selectedProject && defaultProject) {
      onProjectChange(defaultProject);
    }
  }, [selectedProject, defaultProject, activeProjects, onProjectChange]);

  const projectRecords = useMemo(
    () => filterClientPaymentsByProject(records, sheetProject),
    [records, sheetProject],
  );

  const displayedRecords = useMemo(
    () => sortClientPaymentsByDateDesc(applyClientPaymentColumnFilters(projectRecords, columnFilters)),
    [projectRecords, columnFilters],
  );

  const projectSummary = useMemo(
    () => computeClientPaymentSummary(displayedRecords),
    [displayedRecords],
  );

  const projectMeta = useMemo(
    () => getClientProjectMeta(records, registry, sheetProject),
    [records, registry, sheetProject],
  );

  const showSplitAmounts = useMemo(() => sheetUsesSplitAmounts(projectRecords), [projectRecords]);

  const handleFilterChange = (field: keyof ClientPaymentColumnFilters, value: string) => {
    setColumnFilters((current) => ({ ...current, [field]: value }));
  };

  const resetFilters = () => setColumnFilters(EMPTY_CLIENT_PAYMENT_FILTERS);

  const handleDeletePayment = (id: number) => {
    deletePayment(id);
    if (editingPayment?.id === id) {
      setEditingPayment(null);
    }
  };

  if (!sheetProject) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Project</h2>
        <MasterWorkbookImport />
        <AddProjectForm onProjectAdded={onProjectChange} />
        <p className="text-sm text-muted-foreground">
          Add a project or import the master workbook to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{sheetProject}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Client details and all transactions for this project. Cash amounts sync to the Cash
            Account tab automatically.
          </p>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          onClick={onOpenHistory}
        >
          View project history
        </button>
      </div>

      <MasterWorkbookImport />

      <AddProjectForm
        onProjectAdded={(project) => {
          onProjectChange(project);
          resetFilters();
        }}
      />

      <ClientPaymentProjectInfo project={projectMeta} />

      <CompleteProjectButton
        sheetProject={sheetProject}
        onCompleted={() => onProjectChange('')}
      />

      <ClientPaymentEntryForm
        sheetProject={sheetProject}
        showSplitAmounts={showSplitAmounts}
        editingRecord={editingPayment}
        onCancelEdit={() => setEditingPayment(null)}
      />

      <ClientPaymentMetricCards summary={projectSummary} />

      <ClientPaymentTable
        records={displayedRecords}
        optionRecords={projectRecords}
        filters={columnFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={resetFilters}
        title={`${sheetProject} — all transactions`}
        showSplitAmounts={showSplitAmounts}
        onEdit={setEditingPayment}
        onDelete={handleDeletePayment}
      />
    </div>
  );
}
