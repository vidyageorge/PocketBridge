import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
  computeClientPaymentSummary,
  filterClientPaymentsByProject,
  getCompletedProjectSummaries,
  sheetUsesSplitAmounts,
  sortClientPaymentsByDateDesc,
} from '@/lib/clientPayment';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { ClientPaymentMetricCards } from '@/components/clientPayments/ClientPaymentMetricCards';
import { ClientPaymentProjectInfo } from '@/components/clientPayments/ClientPaymentProjectInfo';
import { ClientPaymentTable } from '@/components/clientPayments/ClientPaymentTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) {
    return '—';
  }
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${day}/${month}/${year}`;
}

export function ProjectHistoryTab() {
  const { records, registry, reactivateProject } = useClientPayments();
  const [selectedProject, setSelectedProject] = useState('');
  const [reactivateError, setReactivateError] = useState('');

  const completedProjects = useMemo(
    () => getCompletedProjectSummaries(records, registry),
    [records, registry],
  );

  const selectedSummary = useMemo(
    () => completedProjects.find((project) => project.sheetProject === selectedProject) ?? null,
    [completedProjects, selectedProject],
  );

  const projectRecords = useMemo(
    () =>
      selectedProject
        ? sortClientPaymentsByDateDesc(filterClientPaymentsByProject(records, selectedProject))
        : [],
    [records, selectedProject],
  );

  const projectSummary = useMemo(
    () => computeClientPaymentSummary(projectRecords),
    [projectRecords],
  );

  const showSplitAmounts = useMemo(() => sheetUsesSplitAmounts(projectRecords), [projectRecords]);

  const handleReactivate = () => {
    if (!selectedProject) {
      return;
    }

    const confirmed = window.confirm(
      `Reactivate ${selectedProject}? It will return to the active project list.`,
    );
    if (!confirmed) {
      return;
    }

    const message = reactivateProject(selectedProject);
    if (message) {
      setReactivateError(message);
      return;
    }

    setReactivateError('');
    setSelectedProject('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Project History</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Completed projects with client details and full transaction history.
        </p>
      </div>

      {completedProjects.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
          No completed projects yet. Mark a project as completed from the Project tab when work is
          finished.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed projects ({completedProjects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Project</th>
                    <th className="py-2 pr-4 font-medium">Client</th>
                    <th className="py-2 pr-4 font-medium">Completed</th>
                    <th className="py-2 pr-4 font-medium">Payments</th>
                    <th className="py-2 pr-4 font-medium text-right">Total received</th>
                  </tr>
                </thead>
                <tbody>
                  {completedProjects.map((project) => {
                    const isSelected = selectedProject === project.sheetProject;
                    return (
                      <tr
                        key={project.sheetProject}
                        className={cn(
                          'cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40',
                          isSelected && 'bg-muted/50',
                        )}
                        onClick={() => {
                          setSelectedProject(project.sheetProject);
                          setReactivateError('');
                        }}
                      >
                        <td className="py-3 pr-4 font-medium">{project.sheetProject}</td>
                        <td className="py-3 pr-4">{project.clientName || '—'}</td>
                        <td className="py-3 pr-4">{formatDisplayDate(project.completedAt ?? '')}</td>
                        <td className="py-3 pr-4">{project.paymentCount}</td>
                        <td className="py-3 pr-4 text-right text-income">
                          {formatCurrency(project.totalReceived)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSummary && (
        <div className="space-y-6 border-t border-border pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">{selectedSummary.sheetProject}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Completed on {formatDisplayDate(selectedSummary.completedAt ?? '')}
                {selectedSummary.firstPaymentDate && (
                  <>
                    {' '}
                    · First payment {formatDisplayDate(selectedSummary.firstPaymentDate)}
                    {selectedSummary.lastPaymentDate &&
                      selectedSummary.lastPaymentDate !== selectedSummary.firstPaymentDate && (
                        <> · Last payment {formatDisplayDate(selectedSummary.lastPaymentDate)}</>
                      )}
                  </>
                )}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleReactivate}>
              Reactivate project
            </Button>
          </div>

          {reactivateError && <p className="text-sm text-expense">{reactivateError}</p>}

          <ClientPaymentProjectInfo project={selectedSummary} />

          <ClientPaymentMetricCards summary={projectSummary} />

          <ClientPaymentTable
            records={projectRecords}
            optionRecords={projectRecords}
            filters={{
              sno: '',
              paymentDate: '',
              description: '',
              banking: '',
              cash: '',
              gpay: '',
              amount: '',
              invoiceNumber: '',
              comment: '',
            }}
            onFilterChange={() => undefined}
            onClearFilters={() => undefined}
            title={`${selectedSummary.sheetProject} — transaction history`}
            showSplitAmounts={showSplitAmounts}
          />
        </div>
      )}
    </div>
  );
}
