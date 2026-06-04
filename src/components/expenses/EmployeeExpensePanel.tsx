import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { MONTHS } from '@/lib/constants';
import { formatCurrency } from '@/lib/currency';
import {
  aggregateEmployeeMonthlySummary,
  computeExpenseSummary,
  filterByPeriod,
} from '@/lib/expense';
import { useExpenses } from '@/context/ExpenseContext';
import { EmployeeExpenseForm } from '@/components/expenses/EmployeeExpenseForm';
import { ExpenseMetricCards } from '@/components/expenses/ExpenseMetricCards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type EmployeeExpensePanelProps = {
  month: number;
  year: number;
};

/**
 * Monthly payroll summary per employee with add and remove entries.
 */
export function EmployeeExpensePanel({ month, year }: EmployeeExpensePanelProps) {
  const { data, deleteEmployeeExpense } = useExpenses();

  const filteredByPeriod = useMemo(() => {
    const records = filterByPeriod(data.employee, month, year);
    return [...records].sort((left, right) => {
      const leftDate = left.paymentDate || '';
      const rightDate = right.paymentDate || '';
      return rightDate.localeCompare(leftDate);
    });
  }, [data.employee, month, year]);

  const employeeSummaries = useMemo(
    () => aggregateEmployeeMonthlySummary(filteredByPeriod),
    [filteredByPeriod],
  );

  const summary = useMemo(() => computeExpenseSummary(filteredByPeriod), [filteredByPeriod]);

  const totals = useMemo(
    () =>
      employeeSummaries.reduce(
        (accumulator, row) => ({
          salary: accumulator.salary + row.salary,
          advance: accumulator.advance + row.advance,
          totalSpent: accumulator.totalSpent + row.totalSpent,
        }),
        { salary: 0, advance: 0, totalSpent: 0 },
      ),
    [employeeSummaries],
  );

  const monthLabel = MONTHS.find((monthOption) => monthOption.value === month)?.label ?? month;

  return (
    <div className="space-y-6">
      <EmployeeExpenseForm month={month} year={year} />

      <ExpenseMetricCards summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle>
            {monthLabel} {year} — employee payroll
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employeeSummaries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No employee expenses for this month. Add a payment above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted font-semibold text-muted-foreground">
                    <th className="px-2 py-3 font-medium">S.No</th>
                    <th className="px-2 py-3 font-medium">Employee</th>
                    <th className="px-2 py-3 font-medium text-right">Salary</th>
                    <th className="px-2 py-3 font-medium text-right">Advance</th>
                    <th className="px-2 py-3 font-medium text-right">Total spent</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeSummaries.map((row, index) => (
                    <tr key={row.employeeName} className="border-b border-border/60">
                      <td className="px-2 py-3 text-muted-foreground">{index + 1}</td>
                      <td className="px-2 py-3 font-medium">{row.employeeName}</td>
                      <td className="px-2 py-3 text-right">
                        {row.salary > 0 ? formatCurrency(row.salary) : '—'}
                      </td>
                      <td className="px-2 py-3 text-right">
                        {row.advance > 0 ? formatCurrency(row.advance) : '—'}
                      </td>
                      <td className="px-2 py-3 text-right font-semibold text-expense">
                        {formatCurrency(row.totalSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/40 font-semibold">
                    <td className="px-2 py-3" colSpan={2}>
                      Total
                    </td>
                    <td className="px-2 py-3 text-right">{formatCurrency(totals.salary)}</td>
                    <td className="px-2 py-3 text-right">{formatCurrency(totals.advance)}</td>
                    <td className="px-2 py-3 text-right text-expense">
                      {formatCurrency(totals.totalSpent)}
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
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted font-semibold text-muted-foreground">
                    <th className="px-2 py-3 font-medium">Date</th>
                    <th className="px-2 py-3 font-medium">Employee</th>
                    <th className="px-2 py-3 font-medium">Type</th>
                    <th className="px-2 py-3 font-medium text-right">Amount</th>
                    <th className="px-2 py-3 font-medium text-right">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredByPeriod.map((record) => (
                    <tr key={record.id} className="border-b border-border/60">
                      <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                        {record.paymentDate || '—'}
                      </td>
                      <td className="px-2 py-3 font-medium">{record.employeeName}</td>
                      <td className="px-2 py-3">{record.description}</td>
                      <td className="px-2 py-3 text-right text-expense">
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove ${record.description} for ${record.employeeName}?`,
                              )
                            ) {
                              deleteEmployeeExpense(record.id);
                            }
                          }}
                          aria-label={`Remove entry for ${record.employeeName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
