import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { MONTHS } from '@/lib/constants';
import { confirmDeleteEntry } from '@/lib/confirmDelete';
import { formatCurrency } from '@/lib/currency';
import {
  aggregateProjectMonthlySummary,
  computeExpenseSummary,
  filterByPeriod,
} from '@/lib/expense';
import { useExpenses } from '@/context/ExpenseContext';
import { ProjectExpenseForm } from '@/components/expenses/ProjectExpenseForm';
import { ExpenseMetricCards } from '@/components/expenses/ExpenseMetricCards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProjectExpenseRecord } from '@/types/expense';

type ProjectExpensePanelProps = {
  month: number;
  year: number;
};

/**
 * Monthly project spend summary with add and remove entries.
 */
export function ProjectExpensePanel({ month, year }: ProjectExpensePanelProps) {
  const { data, deleteProjectExpense } = useExpenses();
  const [editingRecord, setEditingRecord] = useState<ProjectExpenseRecord | null>(null);

  const filteredByPeriod = useMemo(() => {
    const records = filterByPeriod(data.project, month, year);
    return [...records].sort((left, right) => {
      const leftDate = left.paymentDate || '';
      const rightDate = right.paymentDate || '';
      return rightDate.localeCompare(leftDate);
    });
  }, [data.project, month, year]);

  const projectSummaries = useMemo(
    () => aggregateProjectMonthlySummary(filteredByPeriod),
    [filteredByPeriod],
  );

  const summary = useMemo(() => computeExpenseSummary(filteredByPeriod), [filteredByPeriod]);

  const totals = useMemo(
    () =>
      projectSummaries.reduce(
        (accumulator, row) => ({
          totalSpent: accumulator.totalSpent + row.totalSpent,
          totalIncome: accumulator.totalIncome + row.totalIncome,
        }),
        { totalSpent: 0, totalIncome: 0 },
      ),
    [projectSummaries],
  );

  const monthLabel = MONTHS.find((monthOption) => monthOption.value === month)?.label ?? month;

  return (
    <div className="space-y-6">
      <ProjectExpenseForm
        month={month}
        year={year}
        editingRecord={editingRecord}
        onCancelEdit={() => setEditingRecord(null)}
      />

      <ExpenseMetricCards summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle>
            {monthLabel} {year} — spend by project
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projectSummaries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No project expenses for this month. Add an entry above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted font-semibold text-muted-foreground">
                    <th className="px-2 py-3 font-medium">S.No</th>
                    <th className="px-2 py-3 font-medium">Project</th>
                    <th className="px-2 py-3 font-medium text-right">Spent</th>
                    <th className="px-2 py-3 font-medium text-right">Income</th>
                  </tr>
                </thead>
                <tbody>
                  {projectSummaries.map((row, index) => (
                    <tr key={row.projectCode} className="border-b border-border/60">
                      <td className="px-2 py-3 text-muted-foreground">{index + 1}</td>
                      <td className="px-2 py-3 font-medium">{row.projectCode}</td>
                      <td className="px-2 py-3 text-right text-expense">
                        {formatCurrency(row.totalSpent)}
                      </td>
                      <td className="px-2 py-3 text-right text-income">
                        {row.totalIncome > 0 ? formatCurrency(row.totalIncome) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/40 font-semibold">
                    <td className="px-2 py-3" colSpan={2}>
                      Total
                    </td>
                    <td className="px-2 py-3 text-right text-expense">
                      {formatCurrency(totals.totalSpent)}
                    </td>
                    <td className="px-2 py-3 text-right text-income">
                      {totals.totalIncome > 0 ? formatCurrency(totals.totalIncome) : '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredByPeriod.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entries this month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted font-semibold text-muted-foreground">
                    <th className="px-2 py-3 font-medium">Date</th>
                    <th className="px-2 py-3 font-medium">Project</th>
                    <th className="px-2 py-3 font-medium">Type</th>
                    <th className="px-2 py-3 font-medium text-right">Amount</th>
                    <th className="px-2 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredByPeriod.map((record) => (
                    <tr key={record.id} className="border-b border-border/60">
                      <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                        {record.paymentDate || '—'}
                      </td>
                      <td className="px-2 py-3 font-medium">{record.projectCode}</td>
                      <td className="px-2 py-3">{record.description}</td>
                      <td className="px-2 py-3 text-right text-expense">
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRecord(record)}
                            aria-label={`Edit entry for ${record.projectCode}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const summary = `${record.paymentDate} — ${record.description} (${record.projectCode})`;
                              if (confirmDeleteEntry(summary)) {
                                deleteProjectExpense(record.id);
                                if (editingRecord?.id === record.id) {
                                  setEditingRecord(null);
                                }
                              }
                            }}
                            aria-label={`Remove entry for ${record.projectCode}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
